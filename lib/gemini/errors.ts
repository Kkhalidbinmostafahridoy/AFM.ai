import { ApiError } from "@google/genai";

export function isGeminiAuthOrQuotaError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401 || error.status === 403) return true;
  if (error.status === 429) return true;
  return /API key|API_KEY|permission|quota|billing/i.test(error.message);
}

export function isGeminiRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status === 429 || error.status === 503 || error.status === 504;
}

export function isGeminiOverloadError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status === 503 || error.status === 504;
}

export function formatGeminiError(error: unknown): string {
  if (error instanceof ApiError) {
    const hint =
      error.status === 429
        ? " Rate limited — wait a moment or upgrade billing."
        : error.status === 503 || error.status === 504
          ? " Gemini is overloaded or timed out — try again."
          : error.status === 400
            ? " Check GEMINI_TEXT_MODEL in .env.local."
            : "";
    return `Gemini HTTP ${error.status}: ${error.message.slice(0, 320)}${hint}`;
  }
  if (error instanceof Error) return error.message.slice(0, 400);
  return "Unknown Gemini error";
}
