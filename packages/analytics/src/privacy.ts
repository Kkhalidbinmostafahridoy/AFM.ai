/** GDPR-safe telemetry: strip prompts, PII, and oversized payloads. */

const SENSITIVE_KEYS = new Set([
  "prompt",
  "content",
  "message",
  "messages",
  "input",
  "output",
  "text",
  "body",
  "password",
  "token",
  "apiKey",
  "authorization",
  "email",
  "phone",
]);

const MAX_PROP_KEYS = 32;
const MAX_STRING_LEN = 256;

export function sanitizeEventProperties(
  props: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!props || typeof props !== "object") return undefined;

  const out: Record<string, unknown> = {};
  let count = 0;

  for (const [key, value] of Object.entries(props)) {
    if (count >= MAX_PROP_KEYS) break;
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(lower)) continue;
    if (lower.includes("prompt") || lower.includes("secret")) continue;

    if (typeof value === "string") {
      out[key] = value.slice(0, MAX_STRING_LEN);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.slice(0, 8).map((v) =>
        typeof v === "string" ? v.slice(0, 64) : typeof v === "number" ? v : "[redacted]"
      );
    } else {
      out[key] = "[object]";
    }
    count += 1;
  }

  return Object.keys(out).length ? out : undefined;
}

/** Hash user id for anonymous aggregation buckets. */
export function bucketUserId(userId: string, salt = ""): string {
  let h = 2166136261;
  const s = userId + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `u_${(h >>> 0).toString(16)}`;
}
