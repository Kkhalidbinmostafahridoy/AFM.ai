import type { ProviderStatus } from "@/types/chat";
import { getProviderStatuses } from "@/lib/ai/registry";
import { getProvidersHealth } from "@afm/ai-core";

/** Normalize AFM server / ai-core health into chat UI provider chips. */
export function normalizeProvidersFromHealth(
  rows: Array<{ id: string; label: string; status?: string }>
): ProviderStatus[] {
  return rows.map((p) => ({
    id: p.id as ProviderStatus["id"],
    label: p.label,
    configured:
      p.status === "online" ||
      p.status === "configured" ||
      p.status === "healthy",
    models: [],
  }));
}

export function normalizeProvidersFromConfigured(
  rows: Array<{ id: string; label: string; models?: { id: string; label: string }[] }>
): ProviderStatus[] {
  return rows.map((p) => ({
    id: p.id as ProviderStatus["id"],
    label: p.label,
    configured: true,
    models: (p.models ?? []).map((m) => ({ id: m.id, label: m.label })),
  }));
}

export function getLocalProviderStatuses(): ProviderStatus[] {
  return getProviderStatuses();
}

export function getCoreHealthAsProviders(): ProviderStatus[] {
  return normalizeProvidersFromHealth(getProvidersHealth());
}

export function mergeProviderStatuses(
  ...lists: ProviderStatus[][]
): ProviderStatus[] {
  const map = new Map<string, ProviderStatus>();
  for (const list of lists) {
    for (const p of list) {
      const prev = map.get(p.id);
      map.set(p.id, {
        ...p,
        configured: Boolean(prev?.configured || p.configured),
        models: p.models?.length ? p.models : prev?.models ?? [],
      });
    }
  }
  return [...map.values()];
}

export function countConfigured(providers: ProviderStatus[]): number {
  return providers.filter((p) => p.configured).length;
}
