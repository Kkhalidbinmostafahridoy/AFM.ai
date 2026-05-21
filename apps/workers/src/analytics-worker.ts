/**
 * AFM analytics aggregation worker — drains Redis queue, rolls up metrics.
 */
import { buildDashboardMetrics, globalMetricsBuffer } from "@afm/analytics";
import {
  initRedisQueue,
  drainAnalyticsQueue,
} from "../../../lib/analytics/redis-queue-node.js";

const AGGREGATE_INTERVAL_MS = 60_000;

export async function startAnalyticsWorker() {
  const redisOk = await initRedisQueue();
  console.log(`[analytics-worker] Redis: ${redisOk ? "connected" : "in-memory fallback"}`);

  if (redisOk) {
    drainAnalyticsQueue(async (line) => {
      try {
        const ev = JSON.parse(line) as { type?: string; [k: string]: unknown };
        globalMetricsBuffer.push(String(ev.type ?? "unknown"), ev);
      } catch {
        /* skip bad line */
      }
    }).catch((err) => console.error("[analytics-worker] drain error", err));
  }

  setInterval(() => {
    const counters = globalMetricsBuffer.snapshot();
    const metrics = buildDashboardMetrics(counters);
    console.log(
      `[analytics-worker] rollup dau=${metrics.users.dailyActiveUsers} ai_rpm=${metrics.ai.requestsPerMinute}`
    );
  }, AGGREGATE_INTERVAL_MS);
}
