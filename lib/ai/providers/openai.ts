import { chatOpenAICompatible } from "../openai-compatible";
import type { AIProviderAdapter } from "./types";

function getKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

export const openaiProvider: AIProviderAdapter = {
  id: "openai",
  label: "OpenAI",
  isConfigured() {
    return Boolean(getKey());
  },
  defaultModel() {
    return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  },
  listModels() {
    const m = this.defaultModel();
    return [
      { id: m, label: m },
      { id: "gpt-4o", label: "gpt-4o" },
      { id: "gpt-4o-mini", label: "gpt-4o-mini" },
    ].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
  },
  async chat(params) {
    const key = getKey();
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const model = params.model?.trim() || this.defaultModel();
    const result = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
        model,
        providerLabel: "OpenAI",
      },
      params
    );
    return { ...result, provider: "openai" };
  },
};
