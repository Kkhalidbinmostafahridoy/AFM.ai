import { Modality } from "@google/genai";
import { getGeminiClient } from "./client";
import { GEMINI_TTS_MODEL } from "./models";

export async function generateNarrationAudio(params: {
  script: string;
  languageCode?: string;
}): Promise<{ audioBase64: string; mimeType: string } | null> {
  const script = params.script.trim();
  if (!script) return null;

  const ai = getGeminiClient();

  try {
    const res = await ai.models.generateContent({
      model: GEMINI_TTS_MODEL,
      contents: `Read the following narration naturally for a short-form social video. Do not add intro or outro.\n\n${script.slice(0, 4000)}`,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          languageCode: params.languageCode ?? "en-US",
        },
      },
    });

    const part = res.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );
    const data = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType ?? "audio/wav";
    if (!data) return null;

    return { audioBase64: data, mimeType };
  } catch (err) {
    console.warn("Gemini TTS unavailable:", err);
    return null;
  }
}
