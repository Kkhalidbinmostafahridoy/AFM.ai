import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { chatMessageSchema } from "@/lib/validations";
import { orchestrateChat } from "@/lib/ai/orchestrator";
import {
  isAnyProviderConfigured,
  getProviderStatuses,
  listSelectableModels,
} from "@/lib/ai/registry";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAfmServerUrl } from "@/lib/gateway/afm-server";
import { getConfiguredProviders } from "@afm/ai-core";
import {
  mergeProviderStatuses,
  normalizeProvidersFromConfigured,
  normalizeProvidersFromHealth,
  getCoreHealthAsProviders,
  getLocalProviderStatuses,
  countConfigured,
} from "@/lib/afm/provider-status";

export const maxDuration = 90;

export async function GET() {
  const localProviders = getLocalProviderStatuses();
  const coreProviders = getCoreHealthAsProviders();
  let providers = mergeProviderStatuses(localProviders, coreProviders);
  let backend = "local";
  let fusionAvailable =
    process.env.CHAT_ENABLE_FUSION !== "0" && countConfigured(providers) >= 2;

  const healthRes = await fetch(`${getAfmServerUrl()}/v1/providers`, {
    cache: "no-store",
  }).catch(() => null);

  if (healthRes?.ok) {
    const data = await healthRes.json();
    const fromHealth = Array.isArray(data.health)
      ? normalizeProvidersFromHealth(data.health)
      : [];
    const fromConfigured = Array.isArray(data.configured)
      ? normalizeProvidersFromConfigured(data.configured)
      : [];
    providers = mergeProviderStatuses(
      providers,
      fromHealth,
      fromConfigured
    );
    fusionAvailable =
      process.env.CHAT_ENABLE_FUSION !== "0" &&
      (data.configured?.length ?? countConfigured(providers)) >= 2;
    backend = "afm-server";
  }

  return NextResponse.json({
    models: listSelectableModels(),
    providers,
    configuredCount: countConfigured(providers),
    fusionAvailable,
    backend,
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`chat:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Wait ${rate.retryAfterSec}s before sending another message.`,
        },
        { status: 429 }
      );
    }

    const hasLocal = isAnyProviderConfigured();
    const hasCore = getConfiguredProviders().length > 0;
    if (!hasLocal && !hasCore) {
      return NextResponse.json(
        {
          error: "No AI providers configured",
          message: "Add API keys to .env.local and start: npm run dev:server",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const last = parsed.data.messages[parsed.data.messages.length - 1];
    if (last.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user" },
        { status: 400 }
      );
    }

    const serverRes = await fetch(`${getAfmServerUrl()}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: parsed.data.messages,
        fusion: parsed.data.fusion,
        userId,
      }),
    }).catch(() => null);

    if (serverRes?.ok) {
      const data = await serverRes.json();
      return NextResponse.json({
        reply: data.reply,
        modelStrategy: data.modelStrategy,
        providersUsed: data.providersUsed,
        taskCategory: data.taskCategory,
        fusionUsed: data.fusionUsed,
        backend: "afm-server",
      });
    }

    const result = await orchestrateChat({
      messages: parsed.data.messages,
      modelSelection: parsed.data.model ?? "auto",
      fusion: parsed.data.fusion,
    });

    return NextResponse.json({
      reply: result.reply,
      modelStrategy: result.modelStrategy,
      providersUsed: result.providersUsed,
      taskCategory: result.taskCategory,
      fusionUsed: result.fusionUsed,
      backend: "local-fallback",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (/high demand|503|UNAVAILABLE|rate limit/i.test(msg)) {
      return NextResponse.json(
        {
          error: "AI provider busy",
          message: msg.slice(0, 400),
          retryable: true,
        },
        { status: 503 }
      );
    }
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json(
        { error: "Provider error", message: error.message },
        { status: 503 }
      );
    }
    return geminiErrorResponse(error, "Chat failed");
  }
}
