import { Modality, RawReferenceImage } from "@google/genai";
import { getGeminiClient } from "./client";
import {
  GEMINI_IMAGE_EDIT_CHAT_MODEL,
  GEMINI_IMAGE_EDIT_MODEL,
  getImageModelCandidates,
} from "./models";
import { sleep, withGeminiRetry } from "./retry";

function isEnterpriseOnlyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Enterprise|Vertex|Agent Platform|enhancePrompt/i.test(msg);
}

export async function generateImageFromPrompt(params: {
  prompt: string;
  aspectRatio?: string;
  enhancePrompt?: boolean;
}): Promise<string> {
  const ai = getGeminiClient();
  const models = getImageModelCandidates();
  const useEnhancePrompt = params.enhancePrompt === true;
  let lastError: unknown;

  for (const model of models) {
    try {
      const bytes = await withGeminiRetry(async () => {
        const config: {
          numberOfImages: number;
          aspectRatio: string;
          enhancePrompt?: boolean;
        } = {
          numberOfImages: 1,
          aspectRatio: params.aspectRatio ?? "9:16",
        };
        if (useEnhancePrompt) config.enhancePrompt = true;

        const res = await ai.models.generateImages({
          model,
          prompt: params.prompt,
          config,
        });
        const b = res.generatedImages?.[0]?.image?.imageBytes;
        if (!b) throw new Error(`No image returned from ${model}`);
        return b;
      });
      return bytes;
    } catch (err) {
      lastError = err;
      console.warn(`generateImageFromPrompt: ${model} failed`, err);
      await sleep(1500);
    }
  }

  throw lastError ?? new Error("Image generation failed on all models");
}

async function editImageViaGenerateContent(params: {
  prompt: string;
  imageBase64: string;
  mimeType: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const res = await ai.models.generateContent({
    model: GEMINI_IMAGE_EDIT_CHAT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.imageBase64,
            },
          },
          {
            text: `Edit this image per the instruction. Return the edited image.\n\n${params.prompt}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const part = res.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  );
  const bytes = part?.inlineData?.data;
  if (!bytes) {
    throw new Error(
      `No edited image from ${GEMINI_IMAGE_EDIT_CHAT_MODEL} (Developer API path)`
    );
  }
  return bytes;
}

export async function editImageFromPrompt(params: {
  prompt: string;
  imageBase64: string;
  mimeType: string;
}): Promise<string> {
  const ai = getGeminiClient();

  try {
    return await withGeminiRetry(async () => {
      const ref = new RawReferenceImage();
      ref.referenceImage = {
        imageBytes: params.imageBase64,
        mimeType: params.mimeType,
      };
      ref.referenceId = 1;

      const res = await ai.models.editImage({
        model: GEMINI_IMAGE_EDIT_MODEL,
        prompt: params.prompt,
        referenceImages: [ref],
        config: { numberOfImages: 1 },
      });

      const bytes = res.generatedImages?.[0]?.image?.imageBytes;
      if (!bytes) {
        throw new Error("No edited image returned from Gemini");
      }
      return bytes;
    });
  } catch (err) {
    if (!isEnterpriseOnlyError(err)) throw err;
    return withGeminiRetry(() => editImageViaGenerateContent(params));
  }
}
