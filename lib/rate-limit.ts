/** Simple in-memory rate limit for API routes (per user, per window). */

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const key = userId;
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > MAX_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true };
}
