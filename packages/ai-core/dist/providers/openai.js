import { chatOpenAICompatible, streamOpenAICompatible } from "./openai-compat.js";
export const openaiProvider = {
    id: "openai",
    label: "GPT",
    isConfigured: () => Boolean(process.env.OPENAI_API_KEY?.trim()),
    defaultModel: () => process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    listModels: () => [
        { id: "gpt-4o-mini", label: "gpt-4o-mini" },
        { id: "gpt-4o", label: "gpt-4o" },
    ],
    async chat(params) {
        const key = process.env.OPENAI_API_KEY.trim();
        const model = params.model?.trim() || this.defaultModel();
        const r = await chatOpenAICompatible({
            apiKey: key,
            baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
            model,
            providerLabel: "OpenAI",
        }, params);
        return { ...r, provider: "openai" };
    },
};
export function streamOpenAI(params) {
    const key = process.env.OPENAI_API_KEY.trim();
    const model = params.model?.trim() || openaiProvider.defaultModel();
    return streamOpenAICompatible({
        apiKey: key,
        baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
        model,
        providerLabel: "OpenAI",
    }, params);
}
