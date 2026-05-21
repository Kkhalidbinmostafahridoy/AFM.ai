import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { workflowRunSchema } from "@/lib/validations";
import { getWorkflow } from "@/lib/afm/workflows";
import { analyzeIntent } from "@/lib/afm/intent-analyzer";
import { runSwarmChat } from "@/lib/afm/swarm-orchestrator";
import { isAnyProviderConfigured } from "@/lib/ai/registry";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAnyProviderConfigured()) {
    return NextResponse.json(
      { error: "No AI providers configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = workflowRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workflow = getWorkflow(parsed.data.workflowId);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const intent = analyzeIntent(parsed.data.topic);
  const platform = parsed.data.platform ?? "tiktok";

  let swarmSummary = "";
  if (parsed.data.workflowId === "marketing-campaign") {
    const swarm = await runSwarmChat({
      mode: "swarm",
      messages: [
        {
          role: "user",
          content: `Create a complete marketing campaign for: ${parsed.data.topic}. Include strategy, hooks, copy, SEO keywords, and a short video script outline.`,
        },
      ],
    });
    swarmSummary = swarm.reply;
  }

  return NextResponse.json({
    workflowId: workflow.id,
    workflowName: workflow.name,
    steps: workflow.steps,
    intent,
    platform,
    topic: parsed.data.topic,
    swarmSummary: swarmSummary || undefined,
    nextActions: [
      { label: "Open Video plan", href: "/dashboard/forge/video" },
      { label: "Generate script", href: "/dashboard/generate" },
      { label: "AI images", href: "/dashboard/forge/images" },
    ],
  });
}
