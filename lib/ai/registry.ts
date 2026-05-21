import type { ProviderId, ProviderStatus } from "@/types/chat";
import { geminiProvider } from "./providers/gemini";
import { anthropicProvider } from "./providers/anthropic";
import { openaiProvider } from "./providers/openai";
import { deepseekProvider } from "./providers/deepseek";
import { grokProvider } from "./providers/grok";
import { opencodeProvider } from "./providers/opencode";
import { cloudProvider } from "./providers/cloud";
import type { AIProviderAdapter } from "./providers/types";

export const ALL_PROVIDERS: AIProviderAdapter[] = [
  openaiProvider,
  anthropicProvider,
  deepseekProvider,
  grokProvider,
  geminiProvider,
  opencodeProvider,
  cloudProvider,
];

export function getProvider(id: ProviderId): AIProviderAdapter | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function getConfiguredProviders(): AIProviderAdapter[] {
  return ALL_PROVIDERS.filter((p) => p.isConfigured());
}

export function isAnyProviderConfigured(): boolean {
  return getConfiguredProviders().length > 0;
}

export function getProviderStatuses(): ProviderStatus[] {
  return ALL_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(),
    models: p.isConfigured() ? p.listModels() : [],
  }));
}

/** UI model id: `provider:model` or `auto` */
export function parseModelSelection(selection: string | undefined): {
  mode: "auto" | "manual";
  provider?: ProviderId;
  model?: string;
} {
  if (!selection || selection === "auto") {
    return { mode: "auto" };
  }
  const [provider, ...rest] = selection.split(":");
  const model = rest.join(":");
  const p = getProvider(provider as ProviderId);
  if (p?.isConfigured()) {
    return {
      mode: "manual",
      provider: p.id,
      model: model || p.defaultModel(),
    };
  }
  return { mode: "auto" };
}

export function listSelectableModels(): {
  id: string;
  label: string;
  description: string;
}[] {
  const options: { id: string; label: string; description: string }[] = [
    {
      id: "auto",
      label: "Auto orchestrator",
      description: "Route by task type with fallbacks",
    },
  ];

  for (const p of getConfiguredProviders()) {
    for (const m of p.listModels()) {
      options.push({
        id: `${p.id}:${m.id}`,
        label: `${p.label} · ${m.label}`,
        description: `Manual: always use ${p.label}`,
      });
    }
  }

  return options;
}
