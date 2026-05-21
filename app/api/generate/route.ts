import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateScriptSchema } from "@/lib/validations";
import { generateScript } from "@/lib/gemini/generate-script";
import { checkAndUseCredit, finalizeGenerationCredit } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const body = await req.json();
    const parsed = generateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const creditCheck = await checkAndUseCredit(userId);
    if (creditCheck.error === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "Database not configured",
          message:
            "Add Supabase keys to .env.local and restart the dev server. See the setup banner on the dashboard.",
        },
        { status: 503 }
      );
    }
    if (creditCheck.error === "SUPABASE_TABLES_MISSING") {
      return NextResponse.json(
        {
          error: "Database tables missing",
          message:
            "Run database/schema.sql in the Supabase SQL Editor, then try again. See docs/SUPABASE_SETUP.md.",
        },
        { status: 503 }
      );
    }
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          message: "Upgrade to Premium for unlimited generations",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const script = await generateScript(parsed.data);

    const supabase = createServiceClient();
    const { data: saved, error } = await supabase
      .from("scripts")
      .insert({
        user_id: userId,
        topic: parsed.data.topic,
        platform: parsed.data.platform,
        language: parsed.data.language,
        tone: parsed.data.tone,
        duration: parsed.data.duration,
        audience: parsed.data.audience,
        content_style: parsed.data.contentStyle,
        hook: script.hook,
        script_data: script,
        caption: script.caption,
        hashtags: script.hashtags,
        cta: script.cta,
        thumbnail_idea: script.thumbnail_idea,
        music_suggestion: script.music_suggestion,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save script" },
        { status: 500 }
      );
    }

    await finalizeGenerationCredit(userId);

    return NextResponse.json({
      script,
      id: saved.id,
      credits: {
        remaining: creditCheck.remaining,
        plan: creditCheck.plan,
      },
    });
  } catch (error) {
    return geminiErrorResponse(error, "Failed to generate script");
  }
}
