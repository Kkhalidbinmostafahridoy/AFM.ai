import { NextResponse } from "next/server";
import { forgeAnalyzeVideoSchema } from "@/lib/validations";
import { requireForgeGeneration } from "@/lib/forge-auth";
import { requireForgeTables } from "@/lib/forge-tables";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { analyzeVideoWithGemini } from "@/lib/gemini/analyze-video";
import { runAnalysisRecapPipeline } from "@/lib/pipeline/orchestrator";
import { finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";

function detectPlatform(url: string): string | undefined {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  return undefined;
}

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

    const missing = await requireForgeTables("analyses");
    if (missing) return missing;

    const body = await req.json();
    const parsed = forgeAnalyzeVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const platform =
      parsed.data.platformHint ?? detectPlatform(parsed.data.videoUrl);

    const shouldRenderRecap = parsed.data.renderRecap !== false;

    const analysis = await analyzeVideoWithGemini({
      videoUrl: parsed.data.videoUrl,
      transcript: parsed.data.transcript,
      platformHint: platform,
    });

    let pipeline = null;
    if (shouldRenderRecap && analysis.recap_scenes?.length) {
      try {
        pipeline = await runAnalysisRecapPipeline({
          analysis,
          sourceUrl: parsed.data.videoUrl,
        });
      } catch (pipeErr) {
        console.error("analyze-video pipeline:", pipeErr);
      }
    }

    const analysisPayload = pipeline
      ? { ...analysis, _pipeline: pipeline }
      : analysis;

    const excerpt = parsed.data.transcript?.slice(0, 2000) ?? null;

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("analyses")
      .insert({
        user_id: gate.userId,
        source_url: parsed.data.videoUrl,
        platform: platform ?? null,
        transcript_excerpt: excerpt,
        analysis_data: analysisPayload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("analyses insert:", error);
      return NextResponse.json(
        { error: "Failed to save analysis" },
        { status: 500 }
      );
    }

    await finalizeGenerationCredit(gate.userId);

    return NextResponse.json({
      id: row.id,
      analysis,
      pipeline,
      credits: {
        remaining: gate.creditCheck.remaining,
        plan: gate.creditCheck.plan,
      },
    });
  } catch (error) {
    return geminiErrorResponse(error, "Video analysis failed");
  }
}
