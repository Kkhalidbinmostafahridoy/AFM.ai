/**
 * Gateway: Next.js API → AFM backend server (never expose provider keys to browser).
 */

const BASE =
  process.env.AFM_API_URL?.trim() || "http://127.0.0.1:4000";

export function getAfmServerUrl() {
  return BASE;
}

export async function afmServerFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function afmHealth() {
  return afmServerFetch<{
    ok: boolean;
    database: string;
    providers: Array<{ id: string; label: string; status: string }>;
  }>("/health");
}
