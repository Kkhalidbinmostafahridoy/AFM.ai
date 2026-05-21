import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Read env at call time so Next.js picks up .env.local after restart */
function getSupabaseEnv() {
  // SUPABASE_KEY = name used in Supabase dashboard quickstart snippet (anon key)
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_KEY?.trim() ||
    "";

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    anonKey,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
}

const PLACEHOLDER_MARKERS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "paste_",
  "xxx",
];

function isRealEnvValue(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

/** Project URL must be https://<ref>.supabase.co — not anon/service keys or sb_secret_* */
function isValidSupabaseProjectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceKey } = getSupabaseEnv();
  return (
    isValidSupabaseProjectUrl(url) &&
    isRealEnvValue(serviceKey) &&
    serviceKey.startsWith("eyJ")
  );
}

export function getSupabaseConfigStatus() {
  const { url, anonKey, serviceKey } = getSupabaseEnv();
  return {
    hasUrl: isValidSupabaseProjectUrl(url),
    hasAnonKey: isRealEnvValue(anonKey),
    hasServiceKey: isRealEnvValue(serviceKey),
    configured: isSupabaseConfigured(),
  };
}

/**
 * True if the `credits` table is visible to PostgREST (schema applied).
 * When keys are set but `database/schema.sql` was not run, this is false (PGRST205).
 */
export async function isSupabaseCreditsTableReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  const supabase = createServiceClient();
  const { error } = await supabase.from("credits").select("user_id").limit(1);
  if (!error) return true;
  if (error.code === "PGRST205") return false;
  if (
    typeof error.message === "string" &&
    error.message.includes("Could not find the table")
  ) {
    return false;
  }
  return true;
}

/**
 * True when ViralForge migration tables exist (`images`, etc.).
 */
export async function isSupabaseForgeTablesReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  const supabase = createServiceClient();
  const { error } = await supabase.from("images").select("id").limit(1);
  if (!error) return true;
  if (error.code === "PGRST205") return false;
  if (
    typeof error.message === "string" &&
    error.message.includes("Could not find the table")
  ) {
    return false;
  }
  return true;
}

// Server-side client with service role (bypasses RLS)
export function createServiceClient(): SupabaseClient {
  const { url, serviceKey } = getSupabaseEnv();

  if (!isValidSupabaseProjectUrl(url)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL. Use https://YOUR-PROJECT.supabase.co (not API keys). Current value looks wrong.`
    );
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// Client-side anon client
export function createBrowserClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, anonKey);
}
