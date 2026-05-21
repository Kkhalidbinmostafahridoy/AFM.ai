/** Parse "0:03" or "00:03.5" style timestamps to milliseconds. */
export function parseTimeToMs(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const parts = trimmed.split(":").map((p) => parseFloat(p.replace(/s$/i, "")));
  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 3) {
    return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
  }
  if (parts.length === 2) {
    return Math.round((parts[0] * 60 + parts[1]) * 1000);
  }
  return Math.round(parts[0] * 1000);
}

export function sceneDurationMs(
  tStart: string,
  tEnd: string,
  fallbackMs = 3000
): number {
  const start = parseTimeToMs(tStart);
  const end = parseTimeToMs(tEnd);
  const diff = end - start;
  return diff > 200 ? diff : fallbackMs;
}
