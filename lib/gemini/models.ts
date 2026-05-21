/** Override via .env — defaults work with Google AI Studio / Gemini API. */
export const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-2.5-flash";

export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash";

export const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL?.trim() || "imagen-4.0-generate-001";

export const GEMINI_IMAGE_EDIT_MODEL =
  process.env.GEMINI_IMAGE_EDIT_MODEL?.trim() || "imagen-3.0-capability-001";

/** Image→image via Gemini generateContent (Google AI Studio / Developer API). */
export const GEMINI_IMAGE_EDIT_CHAT_MODEL =
  process.env.GEMINI_IMAGE_EDIT_CHAT_MODEL?.trim() ||
  "gemini-2.5-flash-image";

export const GEMINI_TTS_MODEL =
  process.env.GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";

const IMAGE_FALLBACKS = [
  "imagen-3.0-generate-002",
  "imagen-3.0-fast-generate-001",
];

export function getImageModelCandidates(): string[] {
  return [GEMINI_IMAGE_MODEL, ...IMAGE_FALLBACKS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );
}

export interface ChatModelOption {
  id: string;
  label: string;
  description: string;
}

/** Models users can pick in AI Chat (all via Gemini API). */
export function getChatModelOptions(): ChatModelOption[] {
  return [
    {
      id: GEMINI_CHAT_MODEL,
      label: "Gemini 2.5 Flash (default)",
      description: "Fast, great for everyday chat",
    },
    {
      id: "gemini-2.5-flash-lite",
      label: "Gemini 2.5 Flash Lite",
      description: "Lightest — use when Flash is busy",
    },
    {
      id: "gemini-2.0-flash",
      label: "Gemini 2.0 Flash",
      description: "Stable fallback",
    },
    {
      id: "gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      description: "Deeper reasoning (slower)",
    },
  ].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
}
