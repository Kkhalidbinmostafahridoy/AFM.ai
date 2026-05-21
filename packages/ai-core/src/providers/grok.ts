import { chatOpenAICompatible } from "./openai-compat.js";
import type { AIProviderAdapter } from "../types.js";

export const grokProvider: AIProviderAdapter = {
  id: "grok",
  label: "Grok",
  isConfigured: () =>
    Boolean(process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim()),
  defaultModel: () => process.env.GROK_MODEL?.trim() || "grok-2-latest",
  listModels: () => [{ id: "grok-2-latest", label: "grok-2-latest" }],
  async chat(params) {
    const key = (process.env.XAI_API_KEY || process.env.GROK_API_KEY)!.trim();
    const r = await chatOpenAICompatible(
      {
        apiKey: key,
        baseUrl: "https://api.x.ai/v1",
        model: params.model?.trim() || this.defaultModel(),
        providerLabel: "Grok",
      },
      params
    );
    return { ...r, provider: "grok" };
  },
};
