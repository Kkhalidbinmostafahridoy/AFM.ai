/**
 * Redis queue for Node workers only (not imported by Next.js routes).
 */

import { globalMetricsBuffer } from "./store";

const CHANNEL = "afm:analytics:events";
const QUEUE_KEY = "afm:analytics:queue";

type RedisClient = {
  publish(channel: string, message: string): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  brpop(key: string, timeout: number): Promise<[string, string] | null>;
};

let redis: RedisClient | null = null;

export async function initRedisQueue(): Promise<boolean> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return false;
  try {
    const ioredis = await import("ioredis");
    const Redis = ioredis.default;
    const client = new Redis(url);
    redis = {
      publish: (c, m) => client.publish(c, m),
      lpush: (k, v) => client.lpush(k, v),
      brpop: (k, t) => client.brpop(k, t),
    };
    return true;
  } catch {
    return false;
  }
}

export async function enqueueAnalyticsEvent(
  payload: Record<string, unknown>
): Promise<void> {
  const line = JSON.stringify(payload);
  if (redis) {
    await redis.lpush(QUEUE_KEY, line);
    await redis.publish(CHANNEL, line);
  } else {
    globalMetricsBuffer.push(
      String(payload.type ?? "unknown"),
      payload as Record<string, unknown>
    );
  }
}

export async function drainAnalyticsQueue(
  handler: (line: string) => Promise<void>
): Promise<void> {
  if (!redis) return;
  for (;;) {
    const item = await redis.brpop(QUEUE_KEY, 5);
    if (!item) continue;
    await handler(item[1]);
  }
}
