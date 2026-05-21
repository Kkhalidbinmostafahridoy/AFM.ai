"use client";

import { useEffect, useState } from "react";
import type { DashboardMetrics } from "@afm/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricBar, StatCard, Sparkline } from "./charts";
import { Loader2, Activity, Cpu, Brain, Film } from "lucide-react";

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      fetch("/api/analytics/metrics")
        .then((r) => r.json())
        .then((d: DashboardMetrics) => setMetrics(d))
        .catch(() => null)
        .finally(() => setLoading(false));

    load();
    const wsUrl =
      (process.env.NEXT_PUBLIC_AFM_WS_URL || "ws://127.0.0.1:4000") +
      "/v1/ws/analytics";
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as { type: string; metrics?: DashboardMetrics };
        if (msg.type === "metrics" && msg.metrics) setMetrics(msg.metrics);
      };
    } catch {
      /* optional */
    }
    const interval = setInterval(load, 30_000);
    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Analytics unavailable. Enable consent in the dashboard and ensure the API
        is running.
      </p>
    );
  }

  const { users, ai, media, system, productivity } = metrics;
  const providerEntries = Object.entries(ai.providerUsage);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-violet-500" />
          User analytics
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total users" value={users.totalUsers} />
          <StatCard title="Active users" value={users.activeUsers} />
          <StatCard title="DAU" value={users.dailyActiveUsers} />
          <StatCard title="MAU" value={users.monthlyActiveUsers} />
          <StatCard
            title="Concurrent"
            value={users.concurrentUsers}
            trend={[2, 4, 3, 8, users.concurrentUsers]}
          />
          <StatCard
            title="Avg session"
            value={`${Math.round(users.avgSessionDurationMs / 60000)}m`}
          />
          <StatCard title="Retention" value={`${users.retentionRate}%`} />
          <StatCard title="Engagement" value={users.engagementScore} sub="/100" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-violet-500" />
          AI analytics
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Orchestration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar
                label="Requests / min"
                value={ai.requestsPerMinute}
                max={Math.max(ai.requestsPerMinute, 100)}
              />
              <MetricBar
                label="Avg latency (ms)"
                value={ai.avgLatencyMs}
                max={5000}
              />
              <MetricBar
                label="Failed requests"
                value={ai.failedRequests}
                max={Math.max(ai.failedRequests, 50)}
              />
              <p className="text-xs text-muted-foreground">
                Tokens (24h): {ai.totalTokens.toLocaleString()} · Fallback:{" "}
                {ai.fallbackFrequency}%
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Provider usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {providerEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No provider data yet</p>
              ) : (
                providerEntries.map(([id, count]) => (
                  <MetricBar
                    key={id}
                    label={id}
                    value={count}
                    max={Math.max(...providerEntries.map(([, c]) => c), 1)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Film className="h-5 w-5 text-violet-500" />
          Media analytics
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Video renders" value={media.videoRenders} />
          <StatCard title="Image gens" value={media.imageGenerations} />
          <StatCard
            title="Avg render"
            value={`${media.avgRenderDurationMs}ms`}
          />
          <StatCard title="Queue wait" value={`${media.queueWaitMs}ms`} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-violet-500" />
          System analytics
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-3">
              <MetricBar label="CPU" value={system.cpuUsagePercent} max={100} unit="%" />
              <MetricBar label="RAM" value={system.ramUsagePercent} max={100} unit="%" />
              <MetricBar label="Redis" value={system.redisUsageMb} max={512} unit=" MB" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 text-sm space-y-2">
              <p>
                WebSockets: <strong>{system.websocketConnections}</strong>
              </p>
              <p>
                Workers: <strong>{system.workerHealth}</strong>
              </p>
              <p>
                Queue: <strong>{system.queueHealth}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Postgres latency ~{system.postgresLatencyMs}ms
              </p>
              <Sparkline
                data={[12, 18, 14, 22, system.postgresLatencyMs || 12]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {productivity && (
        <section>
          <h2 className="text-lg font-semibold mb-4">AI productivity engine</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Productivity score"
              value={productivity.productivityScore}
              sub="/100"
            />
            <StatCard
              title="AI efficiency"
              value={productivity.aiEfficiencyScore}
              sub="/100"
            />
            <StatCard
              title="Workflow completion"
              value={`${productivity.workflowCompletionRate}%`}
            />
            <StatCard
              title="Hours saved (est.)"
              value={productivity.estimatedHoursSaved}
            />
          </div>
        </section>
      )}

      <p className="text-[10px] text-muted-foreground text-right">
        Updated {new Date(metrics.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
