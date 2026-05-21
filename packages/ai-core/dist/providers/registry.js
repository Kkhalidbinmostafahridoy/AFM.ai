import { openaiProvider } from "./openai";
import { geminiProvider } from "./gemini";
import { deepseekProvider } from "./deepseek";
import { grokProvider } from "./grok";
import { anthropicProvider } from "./anthropic";
const opencodeProvider = {
    id: "opencode",
    label: "OpenCode",
    isConfigured: () => Boolean(process.env.OPENCODE_API_KEY?.trim() && process.env.OPENCODE_BASE_URL?.trim()),
    defaultModel: () => process.env.OPENCODE_MODEL?.trim() || "default",
    listModels: () => [{ id: "default", label: "default" }],
    async chat(params) {
        const { chatOpenAICompatible } = await import("./openai-compat");
        const r = await chatOpenAICompatible({
            apiKey: process.env.OPENCODE_API_KEY.trim(),
            baseUrl: process.env.OPENCODE_BASE_URL.trim(),
            model: params.model?.trim() || this.defaultModel(),
            providerLabel: "OpenCode",
        }, params);
        return { ...r, provider: "opencode" };
    },
};
const cloudProvider = {
    id: "cloud",
    label: "Cloud AI",
    isConfigured: () => Boolean(process.env.CLOUD_AI_API_KEY?.trim() && process.env.CLOUD_AI_BASE_URL?.trim()),
    defaultModel: () => process.env.CLOUD_AI_MODEL?.trim() || "default",
    listModels: () => [{ id: "default", label: "default" }],
    async chat(params) {
        const { chatOpenAICompatible } = await import("./openai-compat");
        const r = await chatOpenAICompatible({
            apiKey: process.env.CLOUD_AI_API_KEY.trim(),
            baseUrl: process.env.CLOUD_AI_BASE_URL.trim(),
            model: params.model?.trim() || this.defaultModel(),
            providerLabel: "Cloud AI",
        }, params);
        return { ...r, provider: "cloud" };
    },
};
export const ALL_PROVIDERS = [
    openaiProvider,
    anthropicProvider,
    geminiProvider,
    deepseekProvider,
    grokProvider,
    opencodeProvider,
    cloudProvider,
];
export function getProvider(id) {
    return ALL_PROVIDERS.find((p) => p.id === id);
}
export function getConfiguredProviders() {
    return ALL_PROVIDERS.filter((p) => p.isConfigured());
}
