import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateNarrationAudio } from "@/lib/gemini/generate-tts";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  text: z.string().min(1).max(4000),
  languageCode: z.string().max(12).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`chat-speak:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const audio = await generateNarrationAudio({
    script: parsed.data.text.slice(0, 2000),
    languageCode: parsed.data.languageCode,
  });

  if (audio) {
    return NextResponse.json({
      audioBase64: audio.audioBase64,
      mimeType: audio.mimeType,
      engine: "gemini-tts",
    });
  }

  return NextResponse.json({
    useBrowserTts: true,
    text: parsed.data.text.slice(0, 2000),
    message: "Gemini TTS unavailable — use browser speech synthesis.",
  });
}
