/** Anthropic Messages API (Claude) */
export const anthropicProvider = {
    id: "anthropic",
    label: "Claude",
    isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim()),
    defaultModel: () => process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022",
    listModels: () => [
        { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    ],
    async chat(params) {
        const key = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY).trim();
        const model = params.model?.trim() || this.defaultModel();
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                system: params.systemInstruction,
                messages: params.messages.map((m) => ({
                    role: m.role === "assistant" ? "assistant" : "user",
                    content: m.content,
                })),
            }),
        });
        const data = (await res.json());
        if (!res.ok) {
            throw new Error(data.error?.message ?? `Anthropic HTTP ${res.status}`);
        }
        const text = data.content?.map((c) => c.text ?? "").join("").trim();
        if (!text)
            throw new Error("Claude returned empty content");
        return { content: text, model, provider: "anthropic" };
    },
};
