import type { ProviderId } from "@/types/chat";
import type { TaskRoute } from "./types";
import { getConfiguredProviders } from "@/lib/ai/registry";

const DISPLAY: Record<ProviderId, string> = {
  openai: "GPT",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  grok: "Grok",
  opencode: "OpenCode",
  cloud: "Cloud AI",
};

/** Example: tourism marketing campaign → multi-AI task split */
export function getCampaignTaskRoutes(): TaskRoute[] {
  const plan: Omit<TaskRoute, "reason">[] = [
    { task: "Strategy", provider: "openai", displayName: "GPT" },
    { task: "Research", provider: "gemini", displayName: "Gemini" },
    { task: "Copywriting", provider: "openai", displayName: "GPT" },
    { task: "SEO", provider: "deepseek", displayName: "DeepSeek" },
    { task: "Video Script", provider: "openai", displayName: "GPT" },
    { task: "Image", provider: "gemini", displayName: "Gemini Imagen" },
  ];

  const configured = new Set(getConfiguredProviders().map((p) => p.id));

  return plan.map((p) => ({
    ...p,
    displayName: DISPLAY[p.provider] ?? p.displayName,
    reason: configured.has(p.provider)
      ? `Route ${p.task} to ${DISPLAY[p.provider]}`
      : `${DISPLAY[p.provider]} not configured — fallback in Swarm merge`,
  }));
}

export function pickSubtaskProvider(
  preferred: ProviderId,
  fallback: ProviderId[] = ["openai", "gemini", "deepseek", "grok"]
): ProviderId {
  const configured = new Set(getConfiguredProviders().map((p) => p.id));
  if (configured.has(preferred)) return preferred;
  return fallback.find((id) => configured.has(id)) ?? "openai";
}
