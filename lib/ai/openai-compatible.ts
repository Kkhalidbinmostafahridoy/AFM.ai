import type { ChatTurn } from "@/types/chat";

export interface OpenAICompatConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  providerLabel: string;
}

export async function chatOpenAICompatible(
  config: OpenAICompatConfig,
  params: {
    messages: ChatTurn[];
    systemInstruction: string;
    temperature?: number;
  }
): Promise<{ content: string; model: string }> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body = {
    model: config.model,
    temperature: params.temperature ?? 0.7,
    messages: [
      { role: "system", content: params.systemInstruction },
      ...params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const msg =
      data.error?.message ?? `${config.providerLabel} HTTP ${res.status}`;
    const err = new Error(msg);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${config.providerLabel} returned empty content`);
  }

  return { content, model: config.model };
}
