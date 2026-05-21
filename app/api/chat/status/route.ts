import { NextResponse } from "next/server";
import {
  isAnyProviderConfigured,
  listSelectableModels,
} from "@/lib/ai/registry";
import { getAfmServerUrl } from "@/lib/gateway/afm-server";
import { getConfiguredProviders } from "@afm/ai-core";
import {
  mergeProviderStatuses,
  normalizeProvidersFromConfigured,
  normalizeProvidersFromHealth,
  getCoreHealthAsProviders,
  getLocalProviderStatuses,
  countConfigured,
} from "@/lib/afm/provider-status";

/** Public read-only chat capability probe (no auth). */
export async function GET() {
  const localProviders = getLocalProviderStatuses();
  const coreProviders = getCoreHealthAsProviders();
  let providers = mergeProviderStatuses(localProviders, coreProviders);
  let backend = "local";
  let fusionAvailable =
    process.env.CHAT_ENABLE_FUSION !== "0" && countConfigured(providers) >= 2;

  const healthRes = await fetch(`${getAfmServerUrl()}/v1/providers`, {
    cache: "no-store",
  }).catch(() => null);

  if (healthRes?.ok) {
    const data = await healthRes.json();
    const fromHealth = Array.isArray(data.health)
      ? normalizeProvidersFromHealth(data.health)
      : [];
    const fromConfigured = Array.isArray(data.configured)
      ? normalizeProvidersFromConfigured(data.configured)
      : [];
    providers = mergeProviderStatuses(providers, fromHealth, fromConfigured);
    fusionAvailable =
      process.env.CHAT_ENABLE_FUSION !== "0" &&
      (data.configured?.length ?? countConfigured(providers)) >= 2;
    backend = "afm-server";
  }

  const configuredCount = countConfigured(providers);
  const chatEnabled =
    isAnyProviderConfigured() || getConfiguredProviders().length > 0 || configuredCount > 0;

  return NextResponse.json({
    models: listSelectableModels(),
    providers,
    configuredCount,
    chatEnabled,
    fusionAvailable,
    backend,
  });
}
