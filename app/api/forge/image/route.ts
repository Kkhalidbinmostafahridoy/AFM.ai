import { NextResponse } from "next/server";
import { forgeImageSchema } from "@/lib/validations";
import { requireForgeGeneration } from "@/lib/forge-auth";
import { requireForgeTables } from "@/lib/forge-tables";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { generateImageFromPrompt } from "@/lib/gemini/generate-image";
import { finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";

export const maxDuration = 120;

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

    const missing = await requireForgeTables("images");
    if (missing) return missing;

    const body = await req.json();
    const parsed = forgeImageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const style = parsed.data.style ? `Style: ${parsed.data.style}. ` : "";
    const fullPrompt = `${style}${parsed.data.prompt}`;

    // #region agent log
    fetch("http://127.0.0.1:7938/ingest/c46fc04b-713c-4d5a-a34c-ae4b25273b0a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5be219",
      },
      body: JSON.stringify({
        sessionId: "5be219",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "app/api/forge/image/route.ts:POST:beforeGenerate",
        message: "forge image route calling generate",
        data: {
          aspectRatio: parsed.data.aspectRatio ?? "9:16",
          promptLen: fullPrompt.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const imageBytes = await generateImageFromPrompt({
      prompt: fullPrompt,
      aspectRatio: parsed.data.aspectRatio,
    });

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("images")
      .insert({
        user_id: gate.userId,
        prompt: parsed.data.prompt,
        style: parsed.data.style ?? null,
        model: process.env.GEMINI_IMAGE_MODEL ?? "imagen-4",
        meta: { aspectRatio: parsed.data.aspectRatio ?? "9:16" },
      })
      .select("id")
      .single();

    if (error) {
      console.error("images insert:", error);
      return NextResponse.json(
        { error: "Failed to save image record" },
        { status: 500 }
      );
    }

    await finalizeGenerationCredit(gate.userId);

    return NextResponse.json({
      id: row.id,
      mimeType: "image/png",
      imageBase64: imageBytes,
      credits: {
        remaining: gate.creditCheck.remaining,
        plan: gate.creditCheck.plan,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    // #region agent log
    fetch("http://127.0.0.1:7938/ingest/c46fc04b-713c-4d5a-a34c-ae4b25273b0a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5be219",
      },
      body: JSON.stringify({
        sessionId: "5be219",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "app/api/forge/image/route.ts:POST:catch",
        message: "forge image route error",
        data: { errMsg: errMsg.slice(0, 400) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return geminiErrorResponse(error, "Image generation failed");
  }
}
