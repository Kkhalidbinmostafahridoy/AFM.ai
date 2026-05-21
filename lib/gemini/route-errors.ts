import { NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import {
  formatGeminiError,
  isGeminiAuthOrQuotaError,
  isGeminiOverloadError,
} from "./errors";

export function geminiErrorResponse(
  error: unknown,
  fallbackLabel: string
): NextResponse {
  if (isGeminiAuthOrQuotaError(error)) {
    return NextResponse.json(
      {
        error: "Gemini API key rejected or quota exceeded",
        message:
          "Verify GEMINI_API_KEY in .env.local and billing on Google AI Studio, then restart.",
      },
      { status: 502 }
    );
  }

  if (isGeminiOverloadError(error)) {
    console.warn(`${fallbackLabel} overload:`, formatGeminiError(error));
    return NextResponse.json(
      {
        error: "Gemini is busy",
        message:
          "The model is under high demand. Wait 30–60 seconds and try again, or switch to a lighter model in Chat settings.",
        retryable: true,
      },
      { status: 503 }
    );
  }

  if (error instanceof ApiError) {
    console.error(`${fallbackLabel} ApiError:`, error.status, error.message);
    return NextResponse.json(
      {
        error: "Gemini request failed",
        message: formatGeminiError(error),
        retryable: error.status === 429,
      },
      { status: error.status === 429 ? 429 : 502 }
    );
  }

  const message =
    error instanceof Error ? error.message.slice(0, 400) : "Unknown error";

  if (/enhancePrompt|Enterprise|Vertex|Agent Platform/i.test(message)) {
    return NextResponse.json(
      {
        error: fallbackLabel,
        message: `${message} Use Google AI Studio (Developer API) without enhancePrompt, or enable Vertex AI Enterprise for Imagen edit features.`,
        retryable: false,
      },
      { status: 502 }
    );
  }

  console.error(`${fallbackLabel}:`, error);
  return NextResponse.json(
    {
      error: fallbackLabel,
      message,
    },
    { status: 500 }
  );
}
