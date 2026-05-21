import { chatOpenAICompatible } from "../openai-compatible";
import type { AIProviderAdapter } from "./types";

function getKey() {
  return process.env.OPENCODE_API_KEY?.trim();
}

function getBaseUrl() {
  return process.env.OPENCODE_BASE_URL?.trim();
}

export const opencodeProvider: AIProviderAdapter = {
  id: "opencode",
  label: "OpenCode AI",
  isConfigured() {
    return Boolean(getKey() && getBaseUrl());
  },
  defaultModel() {
    return process.env.OPENCODE_MODEL?.trim() || "default";
  },
  listModels() {
    return [{ id: this.defaultModel(), label: this.defaultModel() }];
  },
  async chat(params) {
    const key = getKey();
    const baseUrl = getBaseUrl();
    if (!key || !baseUrl) {
      throw new Error("OPENCODE_API_KEY and OPENCODE_BASE_URL required");
    }

    const model = params.model?.trim() || this.defaultModel();
    const result = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl,
        model,
        providerLabel: "OpenCode",
      },
      params
    );
    return { ...result, provider: "opencode" };
  },
};
