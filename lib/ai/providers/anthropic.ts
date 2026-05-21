import type { AIProviderAdapter } from "./types";

export const anthropicProvider: AIProviderAdapter = {
  id: "anthropic",
  label: "Claude",
  isConfigured: () =>
    Boolean(
      process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim()
    ),
  defaultModel: () =>
    process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022",
  listModels: () => [
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
  async chat({ messages, systemInstruction, model, temperature }) {
    const key =
      process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.CLAUDE_API_KEY?.trim();
    if (!key) throw new Error("Anthropic not configured");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model ?? this.defaultModel(),
        max_tokens: 4096,
        temperature: temperature ?? 0.7,
        system: systemInstruction,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message ?? `Anthropic HTTP ${res.status}`);
    }
    const text = data.content?.find((c: { type: string }) => c.type === "text")
      ?.text;
    if (!text) throw new Error("Claude returned empty content");
    return {
      content: text,
      model: model ?? this.defaultModel(),
      provider: "anthropic",
    };
  },
};
