import { chatOpenAICompatible } from "./openai-compat.js";
export const deepseekProvider = {
    id: "deepseek",
    label: "DeepSeek",
    isConfigured: () => Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    defaultModel: () => process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
    listModels: () => [{ id: "deepseek-chat", label: "deepseek-chat" }],
    async chat(params) {
        const r = await chatOpenAICompatible({
            apiKey: process.env.DEEPSEEK_API_KEY.trim(),
            baseUrl: "https://api.deepseek.com/v1",
            model: params.model?.trim() || this.defaultModel(),
            providerLabel: "DeepSeek",
        }, params);
        return { ...r, provider: "deepseek" };
    },
};
