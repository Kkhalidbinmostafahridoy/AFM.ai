import { NextResponse } from "next/server";
import { forgeTranslateSchema } from "@/lib/validations";
import { requireForgeGeneration } from "@/lib/forge-auth";
import { requireForgeTables } from "@/lib/forge-tables";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { translateWithGemini } from "@/lib/gemini/translate";
import { finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";
import { checkRateLimit } from "@/lib/rate-limit";

/** Gemini + Supabase can exceed the default serverless limit on long inputs. */
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const gate = await requireForgeGeneration();
    if (!gate.ok) return gate.response;

    const rate = checkRateLimit(gate.userId);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Please wait ${rate.retryAfterSec}s before translating again.`,
        },
        { status: 429 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "Gemini not configured",
          message:
            "Add GEMINI_API_KEY to .env.local (Google AI Studio) and restart the dev server.",
        },
        { status: 503 }
      );
    }

    const missing = await requireForgeTables("translations");
    if (missing) return missing;

    const body = await req.json();
    const parsed = forgeTranslateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await translateWithGemini(parsed.data);

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("translations")
      .insert({
        user_id: gate.userId,
        direction: parsed.data.direction,
        style: parsed.data.style,
        source_text: parsed.data.text,
        translated_text: result.translated_text,
        meta: result,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("translations insert:", error);
      return NextResponse.json(
        { error: "Failed to save translation" },
        { status: 500 }
      );
    }

    await finalizeGenerationCredit(gate.userId);

    return NextResponse.json({
      id: row.id,
      created_at: row.created_at,
      translation: result,
      credits: {
        remaining: gate.creditCheck.remaining,
        plan: gate.creditCheck.plan,
      },
    });
  } catch (error) {
    return geminiErrorResponse(error, "Translation failed");
  }
}
