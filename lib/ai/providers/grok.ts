import { chatOpenAICompatible } from "../openai-compatible";
import type { AIProviderAdapter } from "./types";

function getKey() {
  return (
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim()
  );
}

export const grokProvider: AIProviderAdapter = {
  id: "grok",
  label: "Grok (xAI)",
  isConfigured() {
    return Boolean(getKey());
  },
  defaultModel() {
    return process.env.GROK_MODEL?.trim() || "grok-2-latest";
  },
  listModels() {
    const m = this.defaultModel();
    return [
      { id: m, label: m },
      { id: "grok-2-latest", label: "grok-2-latest" },
    ].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
  },
  async chat(params) {
    const key = getKey();
    if (!key) throw new Error("XAI_API_KEY or GROK_API_KEY not set");

    const model = params.model?.trim() || this.defaultModel();
    const result = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl: process.env.GROK_BASE_URL?.trim() || "https://api.x.ai/v1",
        model,
        providerLabel: "Grok",
      },
      params
    );
    return { ...result, provider: "grok" };
  },
};
