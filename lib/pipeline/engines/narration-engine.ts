import { generateNarrationAudio } from "@/lib/gemini/generate-tts";

export async function generatePipelineNarration(params: {
  script: string;
  languageCode?: string;
}): Promise<{ audioBase64: string; mimeType: string } | null> {
  return generateNarrationAudio(params);
}
