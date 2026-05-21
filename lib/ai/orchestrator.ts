import type {
  ChatTurn,
  OrchestratorChatResult,
  ProviderId,
  TaskCategory,
} from "@/types/chat";
import { FUSION_SYSTEM, ORCHESTRATOR_SYSTEM } from "./prompts";
import {
  getConfiguredProviders,
  getProvider,
  parseModelSelection,
} from "./registry";
import { classifyTask, describeRouting, pickProviderChain } from "./router";
import type { ProviderChatResult } from "./providers/types";

function lastUserMessage(messages: ChatTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return messages[messages.length - 1]?.content ?? "";
}

async function callProvider(
  providerId: ProviderId,
  params: {
    messages: ChatTurn[];
    model?: string;
    temperature?: number;
    systemInstruction?: string;
  }
): Promise<ProviderChatResult> {
  const provider = getProvider(providerId);
  if (!provider?.isConfigured()) {
    throw new Error(`${providerId} is not configured`);
  }
  return provider.chat({
    messages: params.messages,
    systemInstruction: params.systemInstruction ?? ORCHESTRATOR_SYSTEM,
    model: params.model,
    temperature: params.temperature,
  });
}

async function tryChain(
  chain: ProviderId[],
  params: { messages: ChatTurn[] }
): Promise<{ result: ProviderChatResult; tried: ProviderId[] }> {
  const tried: ProviderId[] = [];
  let lastError: unknown;

  for (const id of chain) {
    tried.push(id);
    try {
      const result = await callProvider(id, params);
      return { result, tried };
    } catch (err) {
      lastError = err;
      console.warn(`orchestrator: ${id} failed`, err);
    }
  }

  throw lastError ?? new Error("All configured providers failed");
}

async function fuseResponses(
  drafts: ProviderChatResult[],
  task: TaskCategory
): Promise<string> {
  const synthesizerOrder: ProviderId[] = [
    "openai",
    "deepseek",
    "gemini",
    "grok",
    "cloud",
    "opencode",
  ];
  const configured = new Set(
    getConfiguredProviders().map((p) => p.id)
  );
  const synthId = synthesizerOrder.find((id) => configured.has(id));
  if (!synthId) {
    return drafts[0]?.content ?? "";
  }

  const mergePrompt = `Task category: ${task}

Draft A (${drafts[0]?.provider} / ${drafts[0]?.model}):
${drafts[0]?.content}

${
  drafts[1]
    ? `Draft B (${drafts[1].provider} / ${drafts[1].model}):
${drafts[1].content}`
    : ""
}

Produce one merged answer.`;

  const merged = await callProvider(synthId, {
    messages: [{ role: "user", content: mergePrompt }],
    systemInstruction: FUSION_SYSTEM,
    temperature: 0.4,
  });

  return merged.content;
}

export async function orchestrateChat(params: {
  messages: ChatTurn[];
  modelSelection?: string;
  fusion?: boolean;
}): Promise<OrchestratorChatResult> {
  if (!getConfiguredProviders().length) {
    throw new Error(
      "No AI providers configured. Add at least one API key in .env.local (GEMINI_API_KEY, OPENAI_API_KEY, etc.)."
    );
  }

  const userText = lastUserMessage(params.messages);
  const task = classifyTask(userText);
  const selection = parseModelSelection(params.modelSelection);

  const fusionEnabled =
    params.fusion === true &&
    process.env.CHAT_ENABLE_FUSION !== "0" &&
    getConfiguredProviders().length >= 2;

  if (selection.mode === "manual" && selection.provider) {
    const result = await callProvider(selection.provider, {
      messages: params.messages,
      model: selection.model,
    });
    return {
      reply: result.content,
      taskCategory: task,
      fusionUsed: false,
      providersUsed: [`${result.provider}/${result.model}`],
      modelStrategy: describeRouting(task, [selection.provider], [
        selection.provider,
      ]),
    };
  }

  const chain = pickProviderChain(task);

  if (fusionEnabled && chain.length >= 2) {
    const parallel = chain.slice(0, 2);
    const results = await Promise.allSettled(
      parallel.map((id) =>
        callProvider(id, { messages: params.messages })
      )
    );
    const ok = results
      .filter(
        (r): r is PromiseFulfilledResult<ProviderChatResult> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);

    if (ok.length >= 2) {
      const reply = await fuseResponses(ok, task);
      return {
        reply,
        taskCategory: task,
        fusionUsed: true,
        providersUsed: ok.map((r) => `${r.provider}/${r.model}`),
        modelStrategy: describeRouting(task, chain, ok.map((r) => r.provider)),
      };
    }
    if (ok.length === 1) {
      return {
        reply: ok[0].content,
        taskCategory: task,
        fusionUsed: false,
        providersUsed: [`${ok[0].provider}/${ok[0].model}`],
        modelStrategy: describeRouting(task, chain, [ok[0].provider]),
      };
    }
  }

  const { result, tried } = await tryChain(chain, {
    messages: params.messages,
  });

  return {
    reply: result.content,
    taskCategory: task,
    fusionUsed: false,
    providersUsed: [`${result.provider}/${result.model}`],
    modelStrategy: describeRouting(
      task,
      chain,
      tried.filter((id) => id === result.provider)
    ),
  };
}
