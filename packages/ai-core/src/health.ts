import { ALL_PROVIDERS } from "./providers/registry";
import type { ProviderHealth, ProviderHealthStatus } from "./types";

export function getProvidersHealth(): ProviderHealth[] {
  return ALL_PROVIDERS.map((p) => {
    let status: ProviderHealthStatus = "missing";
    if (p.isConfigured()) status = "online";

    return {
      id: p.id,
      label: p.label,
      status,
      model: p.isConfigured() ? p.defaultModel() : "—",
      message:
        status === "online"
          ? "API key configured"
          : "Add API key to .env.local",
    };
  });
}
