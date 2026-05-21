import { ALL_PROVIDERS } from "./providers/registry";
export function getProvidersHealth() {
    return ALL_PROVIDERS.map((p) => {
        let status = "missing";
        if (p.isConfigured())
            status = "online";
        return {
            id: p.id,
            label: p.label,
            status,
            model: p.isConfigured() ? p.defaultModel() : "—",
            message: status === "online"
                ? "API key configured"
                : "Add API key to .env.local",
        };
    });
}
