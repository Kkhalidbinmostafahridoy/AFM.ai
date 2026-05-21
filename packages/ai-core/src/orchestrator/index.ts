import type { ChatTurn, OrchestratorResult, ProviderId } from "../types";
import { getConfiguredProviders, getProvider } from "../providers/registry";
import { classifyTask, pickProviderChain } from "./router";
import { streamOpenAI } from "../providers/openai";

const SYSTEM = `You are AFM.ai, an AI Operating System assistant. Provide accurate, structured Markdown answers.`;

const FUSION = `Merge draft answers into one best answer. Remove contradictions.`;

function lastUser(messages: ChatTurn[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return messages.at(-1)?.content ?? "";
}

async function callProvider(
  id: ProviderId,
  messages: ChatTurn[],
  systemInstruction = SYSTEM
) {
  const p = getProvider(id);
  if (!p?.isConfigured()) throw new Error(`${id} not configured`);
  return p.chat({ messages, systemInstruction });
}

export async function orchestrateChat(params: {
  messages: ChatTurn[];
  fusion?: boolean;
  memoryContext?: string;
}): Promise<OrchestratorResult> {
  if (!getConfiguredProviders().length) {
    throw new Error("No AI providers configured in environment");
  }

  const userText = lastUser(params.messages);
  const task = classifyTask(userText);
  const chain = pickProviderChain(task);
  const sys = params.memoryContext
    ? `${SYSTEM}\n\nUser memory:\n${params.memoryContext}`
    : SYSTEM;

  const fusion =
    params.fusion === true &&
    process.env.CHAT_ENABLE_FUSION !== "0" &&
    chain.length >= 2;

  if (fusion) {
    const parallel = chain.slice(0, 2);
    const results = await Promise.allSettled(
      parallel.map((id) => callProvider(id, params.messages, sys))
    );
    const ok = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof callProvider>>> => r.status === "fulfilled")
      .map((r) => r.value);

    if (ok.length >= 2) {
      const mergePrompt = ok
        .map((d, i) => `Draft ${i + 1} (${d.provider}):\n${d.content}`)
        .join("\n\n");
      const merged = await callProvider(
        chain.find((id) => id === "openai" || id === "gemini") ?? ok[0].provider,
        [{ role: "user", content: `${mergePrompt}\n\nMerge into one answer.` }],
        FUSION
      );
      return {
        reply: merged.content,
        taskCategory: task,
        fusionUsed: true,
        providersUsed: ok.map((o) => `${o.provider}/${o.model}`),
        modelStrategy: `Fusion: ${parallel.join(" + ")} → ${merged.provider}`,
      };
    }
  }

  let lastError: unknown;
  for (const id of chain) {
    try {
      const result = await callProvider(id, params.messages, sys);
      return {
        reply: result.content,
        taskCategory: task,
        fusionUsed: false,
        providersUsed: [`${result.provider}/${result.model}`],
        modelStrategy: `Task ${task} → ${id} (fallback chain: ${chain.join(" → ")})`,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[ai-core] ${id} failed, trying fallback`);
    }
  }

  throw lastError ?? new Error("All providers failed");
}

/** Stream tokens when OpenAI is primary; else chunk full reply */
export async function* streamChat(params: {
  messages: ChatTurn[];
  memoryContext?: string;
}): AsyncGenerator<{ type: "token" | "done"; data: string; meta?: OrchestratorResult }> {
  const sys = params.memoryContext
    ? `${SYSTEM}\n\nUser memory:\n${params.memoryContext}`
    : SYSTEM;

  let full = "";
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      for await (const chunk of streamOpenAI({
        messages: params.messages,
        systemInstruction: sys,
      })) {
        full += chunk;
        yield { type: "token", data: chunk };
      }
      const task = classifyTask(lastUser(params.messages));
      yield {
        type: "done",
        data: full,
        meta: {
          reply: full,
          taskCategory: task,
          fusionUsed: false,
          providersUsed: ["openai/stream"],
          modelStrategy: "Streaming via OpenAI",
        },
      };
      return;
    } catch {
      /* fall through */
    }
  }

  const result = await orchestrateChat(params);
  const words = result.reply.split(/(\s+)/);
  for (const w of words) {
    yield { type: "token", data: w };
  }
  yield { type: "done", data: result.reply, meta: result };
}
