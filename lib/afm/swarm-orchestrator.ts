import type { ChatTurn, ProviderId } from "@/types/chat";
import { orchestrateChat } from "@/lib/ai/orchestrator";
import { getConfiguredProviders, getProvider } from "@/lib/ai/registry";
import { FUSION_SYSTEM, ORCHESTRATOR_SYSTEM } from "@/lib/ai/prompts";
import { classifyTask } from "@/lib/ai/router";
import { analyzeIntent } from "./intent-analyzer";
import { pickSubtaskProvider } from "./task-router";
import type { SwarmAgentStatus, SwarmMode, SwarmResult } from "./types";

const AGENT_LABELS: Record<ProviderId, string> = {
  openai: "GPT",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  grok: "Grok",
  opencode: "OpenCode",
  cloud: "Cloud AI",
};

async function callOne(
  providerId: ProviderId,
  messages: ChatTurn[],
  systemInstruction?: string
): Promise<{ provider: ProviderId; content: string; model: string }> {
  const provider = getProvider(providerId);
  if (!provider?.isConfigured()) {
    throw new Error(`${providerId} not configured`);
  }
  const res = await provider.chat({
    messages,
    systemInstruction: systemInstruction ?? ORCHESTRATOR_SYSTEM,
  });
  return {
    provider: res.provider,
    content: res.content,
    model: res.model,
  };
}

function agentStatus(
  provider: ProviderId,
  status: SwarmAgentStatus["status"],
  snippet?: string
): SwarmAgentStatus {
  return {
    provider,
    displayName: AGENT_LABELS[provider],
    status,
    snippet,
  };
}

async function mergeDrafts(
  drafts: { provider: ProviderId; content: string }[],
  taskLabel: string
): Promise<string> {
  const synth = pickSubtaskProvider("openai");
  const mergePrompt = `Task: ${taskLabel}\n\n${drafts
    .map((d, i) => `Draft ${i + 1} (${AGENT_LABELS[d.provider]}):\n${d.content}`)
    .join("\n\n")}\n\nProduce one merged AFM.ai answer with ✅ Final Answer sections.`;

  const merged = await callOne(
    synth,
    [{ role: "user", content: mergePrompt }],
    FUSION_SYSTEM
  );
  return merged.content;
}

export async function runSwarmChat(params: {
  messages: ChatTurn[];
  mode: SwarmMode;
}): Promise<SwarmResult> {
  const userText =
    [...params.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const intent = analyzeIntent(userText);
  const taskCategory = classifyTask(userText);
  const configured = getConfiguredProviders();

  if (!configured.length) {
    throw new Error("No AI providers configured");
  }

  if (params.mode === "single" || params.mode === "auto") {
    const result = await orchestrateChat({
      messages: params.messages,
      fusion: params.mode === "auto",
    });
    return {
      reply: result.reply,
      mode: params.mode,
      agents: result.providersUsed.map((p) => {
        const id = p.split("/")[0] as ProviderId;
        return agentStatus(id, "done", p);
      }),
      taskCategory: result.taskCategory,
      intent: intent.intent,
      providersUsed: result.providersUsed,
      fusionUsed: result.fusionUsed,
    };
  }

  const agents: SwarmAgentStatus[] = [];

  if (params.mode === "research") {
    const researchChain: ProviderId[] = ["gemini", "grok", "openai"].filter(
      (id) => configured.some((p) => p.id === id)
    ) as ProviderId[];

    for (const id of researchChain) {
      agents.push(agentStatus(id, "thinking"));
    }

    const results = await Promise.allSettled(
      researchChain.slice(0, 2).map((id) =>
        callOne(id, params.messages, `${ORCHESTRATOR_SYSTEM}\nFocus on research and current trends.`)
      )
    );

    const ok: { provider: ProviderId; content: string }[] = [];
    results.forEach((r, i) => {
      const id = researchChain[i];
      if (r.status === "fulfilled") {
        ok.push({ provider: r.value.provider, content: r.value.content });
        agents[i] = agentStatus(id, "done", r.value.content.slice(0, 120));
      } else {
        agents[i] = agentStatus(id, "error");
      }
    });

    const reply =
      ok.length >= 2
        ? await mergeDrafts(ok, "Research synthesis")
        : ok[0]?.content ?? "Research failed — configure Gemini or Grok.";

    return {
      reply,
      mode: "research",
      agents,
      taskCategory,
      intent: intent.intent,
      providersUsed: ok.map((o) => `${o.provider}`),
      fusionUsed: ok.length >= 2,
    };
  }

  if (params.mode === "debate") {
    const pro = pickSubtaskProvider("openai");
    const contra = pickSubtaskProvider("deepseek", ["deepseek", "grok", "gemini"]);
    const judge = pickSubtaskProvider("gemini", ["gemini", "openai"]);

    agents.push(
      agentStatus(pro, "thinking"),
      agentStatus(contra, "thinking"),
      agentStatus(judge, "idle")
    );

    const draft = await callOne(pro, params.messages);
    agents[0] = agentStatus(pro, "done", draft.content.slice(0, 100));

    const challenge = await callOne(contra, [
      {
        role: "user",
        content: `Challenge the logic and gaps in this draft. Be constructive.\n\n${draft.content}`,
      },
    ]);
    agents[1] = agentStatus(contra, "done", challenge.content.slice(0, 100));

    agents[2] = agentStatus(judge, "thinking");
    const final = await callOne(
      judge,
      [
        {
          role: "user",
          content: `Merge the best of both into one answer.\n\nDraft:\n${draft.content}\n\nCritique:\n${challenge.content}`,
        },
      ],
      FUSION_SYSTEM
    );
    agents[2] = agentStatus(judge, "done");

    return {
      reply: final.content,
      mode: "debate",
      agents,
      taskCategory,
      intent: intent.intent,
      providersUsed: [pro, contra, judge].map((p) => `${p}`),
      fusionUsed: true,
    };
  }

  // swarm mode — parallel specialists
  const swarmIds: ProviderId[] = ["openai", "gemini", "deepseek", "grok"].filter(
    (id) => configured.some((p) => p.id === id)
  ) as ProviderId[];

  swarmIds.forEach((id) => agents.push(agentStatus(id, "thinking")));

  const results = await Promise.allSettled(
    swarmIds.slice(0, 3).map((id) => callOne(id, params.messages))
  );

  const ok: { provider: ProviderId; content: string }[] = [];
  results.forEach((r, i) => {
    const id = swarmIds[i];
    if (r.status === "fulfilled") {
      ok.push({ provider: r.value.provider, content: r.value.content });
      agents[i] = agentStatus(id, "done", r.value.content.slice(0, 80));
    } else {
      agents[i] = agentStatus(id, "error");
    }
  });

  const reply =
    ok.length >= 2
      ? await mergeDrafts(ok, intent.intent)
      : ok[0]?.content ?? "Swarm failed — add more API keys in .env.local.";

  return {
    reply,
    mode: "swarm",
    agents,
    taskCategory,
    intent: intent.intent,
    providersUsed: ok.map((o) => `${o.provider}`),
    fusionUsed: ok.length >= 2,
  };
}
