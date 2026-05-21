import { ApiError } from "@google/genai";
import { getGeminiClient } from "./client";
import { GEMINI_TEXT_MODEL } from "./models";
import { isGeminiRetryableError } from "./errors";
import { parseGeminiJson } from "./json-response";
import { sleep, withGeminiRetry } from "./retry";

const FALLBACK_TEXT_MODELS = [
  GEMINI_TEXT_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
].filter((m, i, arr) => arr.indexOf(m) === i);

export async function generateGeminiJson<T>(params: {
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
}): Promise<T> {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (const model of FALLBACK_TEXT_MODELS) {
    try {
      const raw = await withGeminiRetry(async () => {
        const res = await ai.models.generateContent({
          model,
          contents: params.prompt,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: "application/json",
            temperature: params.temperature ?? 0.4,
          },
        });
        const text = res.text?.trim();
        if (!text) throw new Error(`Empty response from ${model}`);
        return text;
      });

      return parseGeminiJson<T>(raw);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && !isGeminiRetryableError(err)) {
        throw err;
      }
      console.warn(`generateGeminiJson: ${model} failed`, err);
      await sleep(1000);
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}
