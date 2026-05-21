import type { ChatTurn } from "../types.js";

export async function chatOpenAICompatible(
  config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    providerLabel: string;
  },
  params: {
    messages: ChatTurn[];
    systemInstruction: string;
    temperature?: number;
  }
): Promise<{ content: string; model: string }> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: params.temperature ?? 0.7,
      messages: [
        { role: "system", content: params.systemInstruction },
        ...params.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? `${config.providerLabel} HTTP ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error(`${config.providerLabel} empty response`);
  return { content, model: config.model };
}

export async function* streamOpenAICompatible(
  config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    providerLabel: string;
  },
  params: {
    messages: ChatTurn[];
    systemInstruction: string;
    temperature?: number;
  }
): AsyncGenerator<string> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      temperature: params.temperature ?? 0.7,
      messages: [
        { role: "system", content: params.systemInstruction },
        ...params.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const full = await chatOpenAICompatible(config, params);
    yield full.content;
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const chunk = json.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        /* skip malformed SSE */
      }
    }
  }
}
