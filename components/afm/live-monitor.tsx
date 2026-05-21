"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MODEL_TASKS: Record<string, string> = {
  openai: "Creativity & copywriting",
  anthropic: "General tasks & coding",
  gemini: "Research & multimodal",
  deepseek: "Reasoning & logic",
  grok: "Real-time trends",
  opencode: "Custom inference",
  cloud: "Cloud fallback",
};

type ProviderRow = {
  id: string;
  label: string;
  status: string;
  message?: string;
};

type LogLine = { id: number; ts: number; text: string };

function statusLabel(status: string) {
  if (status === "online" || status === "configured" || status === "healthy")
    return { label: "Online", ok: true };
  if (status === "slow" || status === "busy" || status === "processing")
    return { label: status.charAt(0).toUpperCase() + status.slice(1), ok: true };
  return { label: "Offline", ok: false };
}

export function LiveMonitor() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logsRef = useRef<LogLine[]>([]);
  const logIdRef = useRef(0);
  const lastDupRef = useRef({ text: "", at: 0 });

  const pushLog = (text: string) => {
    const now = Date.now();
    if (
      lastDupRef.current.text === text &&
      now - lastDupRef.current.at < 2000
    ) {
      return;
    }
    lastDupRef.current = { text, at: now };
    const line: LogLine = {
      id: ++logIdRef.current,
      ts: now,
      text,
    };
    logsRef.current = [line, ...logsRef.current].slice(0, 30);
    setLogs([...logsRef.current]);
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let wsAttempts = 0;
    let disposed = false;

    const load = () =>
      fetch("/api/afm/health", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then(
          (d: {
            providers?: ProviderRow[];
            source?: string;
            service?: string;
          }) => {
            const rows = d.providers ?? [];
            setProviders(rows);
            setSource(d.source ?? d.service ?? "health");
            const online = rows.filter(
              (p) =>
                p.status === "online" ||
                p.status === "configured" ||
                p.status === "healthy"
            ).length;
            pushLog(
              rows.length
                ? `Health poll: ${online}/${rows.length} providers up (${d.source ?? "api"})`
                : "Health poll: no provider rows — check .env.local API keys"
            );
          }
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "poll failed";
          pushLog(`Health poll failed (${msg}) — start npm run dev:server`);
        })
        .finally(() => setLoading(false));

    const connectWs = () => {
      if (disposed) return;
      const base = (
        process.env.NEXT_PUBLIC_AFM_WS_URL || "ws://127.0.0.1:4000"
      ).replace(/\/$/, "");
      const wsUrl = `${base}/v1/ws/monitor`;
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          wsAttempts = 0;
          pushLog("WebSocket monitor connected");
        };
        ws.onmessage = (ev) => {
          const msg = JSON.parse(ev.data) as {
            type: string;
            providers?: ProviderRow[];
            ts?: number;
          };
          if (msg.type === "health" && msg.providers?.length) {
            setProviders(msg.providers);
            setSource("websocket");
            pushLog(
              `WS update @ ${new Date(msg.ts ?? Date.now()).toLocaleTimeString()}`
            );
          }
        };
        ws.onerror = () => pushLog("WebSocket error — HTTP poll active");
        ws.onclose = () => {
          if (disposed) return;
          pushLog("WebSocket closed — reconnecting…");
          wsAttempts += 1;
          reconnectTimer = setTimeout(connectWs, Math.min(30_000, 2000 * wsAttempts));
        };
      } catch {
        pushLog("WebSocket not available");
      }
    };

    void load();
    const poll = setInterval(load, 8000);
    connectWs();

    return () => {
      disposed = true;
      clearInterval(poll);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const onlineCount = providers.filter(
    (p) =>
      p.status === "online" ||
      p.status === "configured" ||
      p.status === "healthy"
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Source: {source || "local"} · {onlineCount}/{providers.length} online ·
        polls every 8s + WebSocket when server runs
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">AI providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!providers.length && (
              <p className="text-sm text-muted-foreground">
                Start <code className="text-xs">npm run dev:server</code> and add API keys in{" "}
                <code className="text-xs">.env.local</code>
              </p>
            )}
            {providers.map((p) => {
              const st = statusLabel(p.status);
              return (
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
                      "flex items-center gap-1 text-xs capitalize",
                      st.ok ? "text-green-600" : "text-muted-foreground"
                    )}
                  >
                    {st.ok ? (
                      <Check className="h-3 w-3" />
                    ) : p.status === "slow" || p.status === "busy" ? (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {st.label}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Live system log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto font-mono text-xs text-muted-foreground">
            {logs.map((l) => (
              <p key={l.id}>
                [{new Date(l.ts).toLocaleTimeString()}] {l.text}
              </p>
            ))}
            {!logs.length && <p>Waiting for events…</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
