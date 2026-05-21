/**
 * Analytics event queue — in-memory by default.
 * For Redis: run apps/workers with REDIS_URL and ioredis installed (see analytics-worker).
 */

import { globalMetricsBuffer } from "./store";

const CHANNEL = "afm:analytics:events";
const QUEUE_KEY = "afm:analytics:queue";

/** Web app uses in-memory only (avoids optional ioredis bundle warnings). */
export async function initRedisQueue(): Promise<boolean> {
  void CHANNEL;
  void QUEUE_KEY;
  return false;
}

export async function enqueueAnalyticsEvent(
  payload: Record<string, unknown>
): Promise<void> {
  globalMetricsBuffer.push(
    String(payload.type ?? "unknown"),
    payload as Record<string, unknown>
  );
}

export async function drainAnalyticsQueue(
  _handler: (line: string) => Promise<void>
): Promise<void> {
  /* No-op in web bundle; workers use redis-queue-node.ts */
}
