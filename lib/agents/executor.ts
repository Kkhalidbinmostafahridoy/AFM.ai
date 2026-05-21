import { orchestrateChat } from "@/lib/ai/orchestrator";
import { runSwarmChat } from "@/lib/afm/swarm-orchestrator";
import { publishToChannel } from "@/lib/integrations/store";
import type { AgentId } from "./definitions";
import {
  createAgentTask,
  updateAgentTask,
  createAlarm,
  type AgentTask,
} from "./task-store";

export async function executeAgentAction(params: {
  userId: string;
  agentId: AgentId;
  action: string;
  input: Record<string, unknown>;
}): Promise<AgentTask> {
  const task = createAgentTask({
    userId: params.userId,
    agentId: params.agentId,
    action: params.action,
    input: params.input,
    scheduledAt:
      typeof params.input.scheduledAt === "string"
        ? params.input.scheduledAt
        : undefined,
  });

  updateAgentTask(task.id, { status: "running" });

  try {
    const output = await runAction({ ...params, userId: params.userId });
    return (
      updateAgentTask(task.id, {
        status: "completed",
        output,
        completedAt: new Date().toISOString(),
      }) ?? task
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    return (
      updateAgentTask(task.id, {
        status: "failed",
        error: message,
        completedAt: new Date().toISOString(),
      }) ?? task
    );
  }
}

async function runAction(params: {
  userId: string;
  agentId: AgentId;
  action: string;
  input: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const { agentId, action, input } = params;

  if (agentId === "alarm" && action === "create") {
    const at = String(input.at ?? "");
    const label = String(input.label ?? "Reminder");
    const recurring = input.recurring ? String(input.recurring) : undefined;
    const alarm = createAlarm({
      userId: params.userId,
      at,
      label,
      recurring,
    });
    return {
      alarm,
      message: `Alarm set for ${at}. Enable browser notifications to receive alerts.`,
      browserNotification: true,
    };
  }

  if (agentId === "social") {
    const platform = String(input.platform ?? "twitter");
    const topic = String(input.topic ?? input.prompt ?? "product launch");
    const result = await orchestrateChat({
      messages: [
        {
          role: "user",
          content: `Write a ${platform} post about: ${topic}. Include hashtags and a short CTA. Format: Post text, then Hashtags line.`,
        },
      ],
      modelSelection: "auto",
    });
    const channelId =
      platform === "facebook"
        ? "facebook"
        : platform === "linkedin"
          ? "linkedin"
          : platform === "instagram"
            ? "instagram"
            : "twitter";

    let publish:
      | Awaited<ReturnType<typeof publishToChannel>>
      | undefined;
    if (input.autoPublish) {
      publish = await publishToChannel({
        userId: params.userId,
        channelId,
        channelName: platform,
        content: result.reply,
      });
    }

    return {
      platform,
      channelId,
      post: result.reply,
      scheduledAt: input.scheduledAt ?? null,
      publish,
      publishReady: Boolean(input.autoPublish),
      note: publish?.ok
        ? publish.message
        : input.autoPublish
          ? "Connect channel in Integrations to auto-publish."
          : "Copy post or connect Integrations for scheduled publish.",
    };
  }

  if (agentId === "auto-comment") {
    const topic = String(input.topic ?? input.monitorQuery ?? "AI trends");
    const result = await orchestrateChat({
      messages: [
        {
          role: "user",
          content: `Draft 3 thoughtful, non-spam replies to recent posts about "${topic}". Avoid toxicity and sales tone. Number each reply.`,
        },
      ],
      modelSelection: "auto",
    });
    return {
      monitorQuery: topic,
      replies: result.reply,
      autoReplyEnabled: Boolean(input.autoReply),
      filterToxic: true,
    };
  }

  if (agentId === "content") {
    const niche = String(input.niche ?? "tech");
    const result = await orchestrateChat({
      messages: [
        {
          role: "user",
          content: `Create a daily content pack for ${niche}: 3 post ideas, 1 video hook, thumbnail prompt, and engagement tip.`,
        },
      ],
      modelSelection: "auto",
    });
    return { niche, pack: result.reply };
  }

  if (agentId === "research") {
    const query = String(input.query ?? input.topic ?? "AI industry trends");
    const swarm = await runSwarmChat({
      messages: [{ role: "user", content: `Research and summarize: ${query}` }],
      mode: "research",
    });
    return {
      query,
      report: swarm.reply,
      mode: "research",
      providers: swarm.providersUsed,
    };
  }

  throw new Error(`Unknown action ${action} for agent ${agentId}`);
}
