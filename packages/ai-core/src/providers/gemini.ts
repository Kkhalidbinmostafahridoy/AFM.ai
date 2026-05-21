import { GoogleGenAI } from "@google/genai";
import type { AIProviderAdapter } from "../types.js";

function client() {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenAI({ apiKey: key });
}

export const geminiProvider: AIProviderAdapter = {
  id: "gemini",
  label: "Gemini",
  isConfigured: () =>
    Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()),
  defaultModel: () =>
    process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash",
  listModels: () => [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  ],
  async chat(params) {
    const ai = client();
    const model = params.model?.trim() || this.defaultModel();
    const res = await ai.models.generateContent({
      model,
      contents: params.messages.map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.7,
      },
    });
    const text = res.text?.trim();
    if (!text) throw new Error("Gemini empty response");
    return { content: text, model, provider: "gemini" };
  },
};
