import type {
  TranslationDirection,
  TranslationResult,
  TranslationStyle,
} from "@/types/translation";
import { generateGeminiJson } from "./generate-json";

const STYLE_INSTRUCTIONS: Record<TranslationStyle, string> = {
  natural: "Use natural, fluent phrasing that sounds native to an educated reader.",
  formal: "Use formal, polished register suitable for official or academic contexts.",
  casual: "Use casual, conversational tone — friendly and easy to read.",
  business:
    "Use professional business English/Bangla — clear, respectful, suitable for emails and meetings.",
};

const SYSTEM = `You are a professional Bangla ↔ English translator.
Return a single JSON object only (no markdown fences) with keys:
translated_text (string), source_language (string), target_language (string), notes (string, optional brief translator note).`;

type GeminiTranslationPayload = {
  translated_text: string;
  source_language?: string;
  target_language?: string;
  notes?: string;
};

export async function translateWithGemini(params: {
  text: string;
  direction: TranslationDirection;
  style: TranslationStyle;
}): Promise<TranslationResult> {
  const [sourceLang, targetLang] =
    params.direction === "bn_en"
      ? ["Bengali (Bangla)", "English"]
      : ["English", "Bengali (Bangla)"];

  const prompt = `Translate from ${sourceLang} to ${targetLang}.
Style: ${params.style} — ${STYLE_INSTRUCTIONS[params.style]}

Rules:
- Put only the translation in translated_text (no quotes wrapper, no explanations).
- For Bangla output use standard Bengali script (বাংলা).
- If the input mixes languages, translate only what belongs in the target language.
- Put brief translator notes in "notes", not in translated_text.

Source text:
"""
${params.text}
"""`;

  const parsed = await generateGeminiJson<GeminiTranslationPayload>({
    systemInstruction: SYSTEM,
    prompt,
    temperature: 0.35,
  });

  if (!parsed.translated_text?.trim()) {
    throw new Error("Invalid translation format from Gemini");
  }

  return {
    translated_text: parsed.translated_text.trim(),
    source_language: parsed.source_language || sourceLang,
    target_language: parsed.target_language || targetLang,
    style: params.style,
    notes: parsed.notes?.trim() || undefined,
  };
}
