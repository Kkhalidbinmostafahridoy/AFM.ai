import { generateImageFromPrompt } from "@/lib/gemini/generate-image";

export async function generateSceneImage(params: {
  prompt: string;
  aspectRatio?: string;
}): Promise<string> {
  return generateImageFromPrompt({
    prompt: params.prompt,
    aspectRatio: params.aspectRatio ?? "9:16",
  });
}
