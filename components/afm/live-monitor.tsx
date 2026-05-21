"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MODEL_TASKS: Record<string, string> = {
  openai: "Creativity & copywriting",
  gemini: "Research & multimodal",
  deepseek: "Reasoning & logic",
  grok: "Real-time trends",
  opencode: "Custom inference",
  cloud: "Cloud fallback",
};

type ProviderRow = { id: string; label: string; configured: boolean };
type ProviderHealthRow = { id: string; label: string; status: string };

export function LiveMonitor() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/afm/health")
      .then((r) => r.json())
      .then((d: { providers?: ProviderHealthRow[]; configured?: string[] }) => {
        if (d.providers?.length) {
          setProviders(
            d.providers.map((p) => ({
              id: p.id,
              label: p.label,
              configured: p.status === "online" || p.status === "configured",
            }))
          );
        }
      })
      .finally(() => setLoading(false));

    const wsUrl =
      (process.env.NEXT_PUBLIC_AFM_WS_URL || "ws://127.0.0.1:4000") +
      "/v1/ws/monitor";
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as {
          type: string;
          providers?: Array<{ id: string; label: string; status: string }>;
        };
        if (msg.type === "health" && msg.providers) {
          setProviders(
            msg.providers.map((p) => ({
              id: p.id,
              label: p.label,
              configured: p.status === "online" || p.status === "configured",
            }))
          );
        }
      };
    } catch {
      /* ws optional */
    }
    return () => ws?.close();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Live AI agents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="font-medium text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {MODEL_TASKS[p.id] ?? "General tasks"}
                </p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  p.configured ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {p.configured ? (
                  <>
                    <Check className="h-3 w-3" /> Online
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" /> Offline
                  </>
                )}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">System status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>GPT generating ideas… {providers.find((p) => p.id === "openai")?.configured ? "✓" : "—"}</p>
          <p>Gemini researching… {providers.find((p) => p.id === "gemini")?.configured ? "✓" : "—"}</p>
          <p>DeepSeek reasoning… {providers.find((p) => p.id === "deepseek")?.configured ? "✓" : "—"}</p>
          <p>Grok tracking trends… {providers.find((p) => p.id === "grok")?.configured ? "✓" : "—"}</p>
          <p className="pt-2 text-xs">GPU monitoring — Phase 3 (Railway / K8s)</p>
        </CardContent>
      </Card>
    </div>
  );
}
