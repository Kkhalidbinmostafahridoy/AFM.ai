import { isGeminiRetryableError } from "./errors";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry transient Gemini failures (503/429/504) with backoff. */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number }
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1200;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable =
        isGeminiRetryableError(err) ||
        (err instanceof Error &&
          /high demand|UNAVAILABLE|overloaded|timeout/i.test(err.message));

      if (!retryable || i === attempts - 1) throw err;

      await sleep(baseDelayMs * (i + 1));
    }
  }

  throw lastError ?? new Error("Gemini retry failed");
}
