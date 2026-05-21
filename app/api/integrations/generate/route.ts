import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { orchestrateChat } from "@/lib/ai/orchestrator";
import { isAnyProviderConfigured } from "@/lib/ai/registry";
import { saveDraft } from "@/lib/integrations/store";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  channelId: z.string().min(1).max(40),
  topic: z.string().min(3).max(500),
  tone: z.enum(["professional", "casual", "viral"]).optional(),
});

export const maxDuration = 90;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`integration-gen:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isAnyProviderConfigured()) {
    return NextResponse.json(
      { error: "No AI providers configured" },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await orchestrateChat({
    messages: [
      {
        role: "user",
        content: `Write a ${parsed.data.channelId} post about "${parsed.data.topic}" in a ${parsed.data.tone ?? "professional"} tone. Include hashtags where appropriate.`,
      },
    ],
    modelSelection: "auto",
  });

  saveDraft({
    userId,
    channelId: parsed.data.channelId,
    content: result.reply,
  });

  return NextResponse.json({
    channelId: parsed.data.channelId,
    content: result.reply,
    providersUsed: result.providersUsed,
  });
}
