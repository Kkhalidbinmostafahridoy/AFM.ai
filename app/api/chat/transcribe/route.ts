import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { transcribeAudioSchema } from "@/lib/validations";
import { transcribeAudioBase64 } from "@/lib/gemini/transcribe-audio";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { geminiErrorResponse } from "@/lib/gemini/route-errors";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(`transcribe:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Wait ${rate.retryAfterSec}s before another voice message.`,
        },
        { status: 429 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: "Gemini not configured",
          message:
            "Voice messages need GEMINI_API_KEY in .env.local (Google AI Studio key, not OpenAI).",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = transcribeAudioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudioBase64({
      audioBase64: parsed.data.audioBase64,
      mimeType: parsed.data.mimeType,
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    return geminiErrorResponse(error, "Voice transcription failed");
  }
}
