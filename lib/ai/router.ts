import type { ProviderId, TaskCategory } from "@/types/chat";
import { getConfiguredProviders } from "./registry";

const ROUTING_PRIORITY: Record<TaskCategory, ProviderId[]> = {
  coding: ["deepseek", "openai", "opencode", "gemini", "cloud"],
  reasoning: ["openai", "deepseek", "gemini", "grok"],
  creative: ["grok", "openai", "gemini", "deepseek"],
  multimodal: ["gemini", "openai", "deepseek"],
  realtime: ["grok", "cloud", "openai", "gemini"],
  education: ["openai", "deepseek", "gemini"],
  fast: ["cloud", "gemini", "deepseek", "openai"],
  general: ["openai", "gemini", "deepseek", "grok", "cloud", "opencode"],
};

export function classifyTask(userMessage: string): TaskCategory {
  const t = userMessage.toLowerCase();

  if (
    /\b(debug|typescript|javascript|python|react|next\.?js|api|sql|function|class|component|error|stack trace|refactor|npm|git)\b/.test(
      t
    ) ||
    /```/.test(userMessage)
  ) {
    return "coding";
  }
  if (
    /\b(image|video|vision|screenshot|photo|thumbnail|frame|ocr|describe this|analyze (this )?(image|video)|text to image|image to text|img2img|dub|dubbing|transcribe|voice over)\b/.test(
      t
    ) ||
    /\.(png|jpe?g|webp|gif|mp4|mov|webm)\b/i.test(userMessage)
  ) {
    return "multimodal";
  }
  if (
    /\b(prove|theorem|equation|calculate|math|logic|reason|step by step|analyze deeply)\b/.test(
      t
    )
  ) {
    return "reasoning";
  }
  if (
    /\b(tweet|viral|trend|news today|x\.com|twitter|current events|what.?s happening)\b/.test(
      t
    )
  ) {
    return "realtime";
  }
  if (
    /\b(story|poem|script|marketing|caption|hook|blog|creative|slogan|brand)\b/.test(
      t
    )
  ) {
    return "creative";
  }
  if (
    /\b(explain|teach|learn|tutorial|how does|what is|eli5|education|study)\b/.test(
      t
    )
  ) {
    return "education";
  }
  if (userMessage.length < 80 && !/\?/.test(userMessage)) {
    return "fast";
  }
  return "general";
}

export function pickProviderChain(task: TaskCategory): ProviderId[] {
  const configured = new Set(
    getConfiguredProviders().map((p) => p.id)
  );
  const ordered = ROUTING_PRIORITY[task].filter((id) => configured.has(id));

  if (ordered.length) return ordered;

  return getConfiguredProviders().map((p) => p.id);
}

export function describeRouting(
  task: TaskCategory,
  chain: ProviderId[],
  used: ProviderId[]
): string {
  const taskLabels: Record<TaskCategory, string> = {
    coding: "Coding / debugging",
    reasoning: "Reasoning / math",
    creative: "Creative / content",
    multimodal: "Image / video / vision",
    realtime: "Real-time / social style",
    education: "Education / explanation",
    fast: "Quick answer",
    general: "General assistant",
  };

  const lines = [
    `Task detected: ${taskLabels[task]}`,
    `Priority chain: ${chain.join(" → ") || "none"}`,
    `Models used: ${used.map((id) => id).join(", ") || "none"}`,
  ];
  return lines.join("\n");
}
