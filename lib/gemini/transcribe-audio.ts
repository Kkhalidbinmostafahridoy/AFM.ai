import { getGeminiClient } from "./client";
import { GEMINI_CHAT_MODEL } from "./models";

/** Transcribe a voice note (base64 audio) via Gemini multimodal. */
export async function transcribeAudioBase64(params: {
  audioBase64: string;
  mimeType: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const res = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.audioBase64,
            },
          },
          {
            text: "Transcribe this voice message exactly. Output only the spoken words, no commentary or labels.",
          },
        ],
      },
    ],
  });

  const text = res.text?.trim();
  if (!text) {
    throw new Error("Could not transcribe audio — empty response");
  }
  return text;
}
