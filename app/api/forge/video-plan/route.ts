import { NextResponse } from "next/server";
import { forgeVideoPlanSchema } from "@/lib/validations";
import { requireForgeGeneration } from "@/lib/forge-auth";
import { requireForgeTables } from "@/lib/forge-tables";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { generateVideoPlan } from "@/lib/gemini/generate-video-plan";
import { runVideoPlanPipeline } from "@/lib/pipeline/orchestrator";
import { finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";

export async function POST(req: Request) {
  try {
    const gate = await requireForgeGeneration();
    if (!gate.ok) return gate.response;

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "Gemini not configured",
          message: "Add GEMINI_API_KEY to .env.local and restart.",
        },
        { status: 503 }
      );
    }

    const missing = await requireForgeTables("video_projects");
    if (missing) return missing;

    const body = await req.json();
    const parsed = forgeVideoPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { renderMedia, ...planInput } = parsed.data;
    const shouldRender = renderMedia !== false;

    const plan = await generateVideoPlan(planInput);

    let pipeline = null;
    if (shouldRender) {
      try {
        pipeline = await runVideoPlanPipeline({
          plan,
          topic: planInput.topic,
        });
      } catch (pipeErr) {
        console.error("video-plan pipeline:", pipeErr);
      }
    }

    const planPayload = pipeline
      ? { ...plan, _pipeline: pipeline }
      : plan;

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("video_projects")
      .insert({
        user_id: gate.userId,
        topic: planInput.topic,
        platform: planInput.platform,
        duration: planInput.duration,
        plan_data: planPayload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("video_projects insert:", error);
      return NextResponse.json(
        { error: "Failed to save video plan" },
        { status: 500 }
      );
    }

    await finalizeGenerationCredit(gate.userId);

    return NextResponse.json({
      id: row.id,
      plan,
      pipeline,
      credits: {
        remaining: gate.creditCheck.remaining,
        plan: gate.creditCheck.plan,
      },
    });
  } catch (error) {
    return geminiErrorResponse(error, "Video plan generation failed");
  }
}
