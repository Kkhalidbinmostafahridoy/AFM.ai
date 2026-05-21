import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { executeAgentAction } from "@/lib/agents/executor";
import { getAgent, type AgentId } from "@/lib/agents/definitions";
import { isAnyProviderConfigured } from "@/lib/ai/registry";
import { checkRateLimit } from "@/lib/rate-limit";

const runSchema = z.object({
  agentId: z.enum(["alarm", "social", "auto-comment", "content", "research"]),
  action: z.string().min(1).max(80),
  input: z.record(z.unknown()).default({}),
});

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`agent:${userId}`);
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
        message: "Add GEMINI_API_KEY or other provider keys in .env.local",
      },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const agent = getAgent(parsed.data.agentId);
  if (!agent) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 404 });
  }

  const task = await executeAgentAction({
    userId,
    agentId: parsed.data.agentId as AgentId,
    action: parsed.data.action,
    input: parsed.data.input,
  });

  return NextResponse.json({ task, agent });
}
