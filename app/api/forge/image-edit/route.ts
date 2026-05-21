import { NextResponse } from "next/server";
import { requireForgeGeneration } from "@/lib/forge-auth";
import { requireForgeTables } from "@/lib/forge-tables";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { editImageFromPrompt } from "@/lib/gemini/generate-image";
import { finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";

const MAX_BYTES = 6 * 1024 * 1024;

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

    const formData = await req.formData();
    const file = formData.get("image");
    const prompt = formData.get("prompt");

    if (!(file instanceof Blob) || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Invalid input", message: "Provide image file and prompt" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large", message: "Max upload size is 6MB" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "image/jpeg";
    const buf = Buffer.from(await file.arrayBuffer());
    const imageBase64 = buf.toString("base64");

    const imageBytes = await editImageFromPrompt({
      prompt: prompt.trim(),
      imageBase64,
      mimeType,
    });

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("images")
      .insert({
        user_id: gate.userId,
        prompt: prompt.trim(),
        style: "image-to-image",
        model: process.env.GEMINI_IMAGE_EDIT_MODEL ?? "imagen-3",
        meta: { sourceMime: mimeType },
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
    return geminiErrorResponse(error, "Image edit failed");
  }
}
