import { generateGeminiText } from "@/lib/gemini/generate-text";
import { getChatModelOptions } from "@/lib/gemini/models";
import { isGeminiConfigured } from "@/lib/gemini/client";
import type { AIProviderAdapter } from "./types";

export const geminiProvider: AIProviderAdapter = {
  id: "gemini",
  label: "Google Gemini",
  isConfigured: isGeminiConfigured,
  defaultModel() {
    return getChatModelOptions()[0]?.id ?? "gemini-2.5-flash";
  },
  listModels() {
    return getChatModelOptions().map((m) => ({ id: m.id, label: m.label }));
  },
  async chat(params) {
    const allowed = new Set(this.listModels().map((m) => m.id));
    const model =
      params.model && allowed.has(params.model)
        ? params.model
        : this.defaultModel();

    const contents = params.messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const content = await generateGeminiText({
      model,
      systemInstruction: params.systemInstruction,
      contents,
      temperature: params.temperature,
    });

    return { content, model, provider: "gemini" };
  },
};
