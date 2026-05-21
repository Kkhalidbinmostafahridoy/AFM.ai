import { chatOpenAICompatible } from "../openai-compatible";
import type { AIProviderAdapter } from "./types";

function getKey() {
  return (
    process.env.CLOUD_AI_API_KEY?.trim() ||
    process.env.CLOUD_API_KEY?.trim()
  );
}

function getBaseUrl() {
  return (
    process.env.CLOUD_AI_BASE_URL?.trim() ||
    process.env.CLOUD_API_BASE_URL?.trim()
  );
}

export const cloudProvider: AIProviderAdapter = {
  id: "cloud",
  label: "Cloud AI",
  isConfigured() {
    return Boolean(getKey() && getBaseUrl());
  },
  defaultModel() {
    return process.env.CLOUD_AI_MODEL?.trim() || "default";
  },
  listModels() {
    return [{ id: this.defaultModel(), label: this.defaultModel() }];
  },
  async chat(params) {
    const key = getKey();
    const baseUrl = getBaseUrl();
    if (!key || !baseUrl) {
      throw new Error("CLOUD_AI_API_KEY and CLOUD_AI_BASE_URL required");
    }

    const model = params.model?.trim() || this.defaultModel();
    const result = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl,
        model,
        providerLabel: "Cloud AI",
      },
      params
    );
    return { ...result, provider: "cloud" };
  },
};
