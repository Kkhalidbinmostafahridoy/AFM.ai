import { chatOpenAICompatible } from "../openai-compatible";
import type { AIProviderAdapter } from "./types";

function getKey() {
  return process.env.DEEPSEEK_API_KEY?.trim();
}

export const deepseekProvider: AIProviderAdapter = {
  id: "deepseek",
  label: "DeepSeek",
  isConfigured() {
    return Boolean(getKey());
  },
  defaultModel() {
    return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  },
  listModels() {
    const m = this.defaultModel();
    return [
      { id: m, label: m },
      { id: "deepseek-reasoner", label: "deepseek-reasoner" },
    ].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
  },
  async chat(params) {
    const key = getKey();
    if (!key) throw new Error("DEEPSEEK_API_KEY not set");

    const model = params.model?.trim() || this.defaultModel();
    const result = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl:
          process.env.DEEPSEEK_BASE_URL?.trim() ||
          "https://api.deepseek.com/v1",
        model,
        providerLabel: "DeepSeek",
      },
      params
    );
    return { ...result, provider: "deepseek" };
  },
};
