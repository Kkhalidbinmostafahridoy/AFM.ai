import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { swarmChatSchema } from "@/lib/validations";
import { runSwarmChat } from "@/lib/afm/swarm-orchestrator";
import { isAnyProviderConfigured } from "@/lib/ai/registry";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`swarm:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests", message: `Wait ${rate.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    if (!isAnyProviderConfigured()) {
      return NextResponse.json(
        {
          error: "No AI providers configured",
          message: "Add API keys in .env.local (GEMINI, OPENAI, DEEPSEEK, etc.).",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = swarmChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await runSwarmChat({
      messages: parsed.data.messages,
      mode: parsed.data.mode,
    });

    return NextResponse.json(result);
  } catch (error) {
    return geminiErrorResponse(error, "Swarm chat failed");
  }
}
