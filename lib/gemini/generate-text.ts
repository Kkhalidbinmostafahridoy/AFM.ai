import { ApiError } from "@google/genai";
import { getGeminiClient } from "./client";
import {
  GEMINI_CHAT_MODEL,
  GEMINI_TEXT_MODEL,
  getChatModelOptions,
} from "./models";
import { isGeminiRetryableError } from "./errors";
import { sleep, withGeminiRetry } from "./retry";

const FALLBACK_TEXT_MODELS = [
  GEMINI_TEXT_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
].filter((m, i, arr) => arr.indexOf(m) === i);

export async function generateGeminiText(params: {
  model?: string;
  systemInstruction?: string;
  contents: string | Array<{ role: "user" | "model"; parts: { text: string }[] }>;
  temperature?: number;
}): Promise<string> {
  const preferred = params.model?.trim();
  const models = preferred
    ? [preferred, ...FALLBACK_TEXT_MODELS.filter((m) => m !== preferred)]
    : FALLBACK_TEXT_MODELS;

  let lastError: unknown;

  for (const model of models) {
    try {
      return await withGeminiRetry(async () => {
        const ai = getGeminiClient();
        const res = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.7,
          },
        });
        const text = res.text?.trim();
        if (!text) throw new Error(`Empty response from ${model}`);
        return text;
      });
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && !isGeminiRetryableError(err)) throw err;
      console.warn(`generateGeminiText: ${model} failed`, err);
      await sleep(800);
    }
  }

  throw lastError ?? new Error("All Gemini text models failed");
}

export { getChatModelOptions, GEMINI_CHAT_MODEL };
