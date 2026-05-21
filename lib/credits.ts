import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient, isSupabaseConfigured } from "./supabase";
import { FREE_DAILY_LIMIT } from "./constants";
import type { PlanType } from "@/types";

/** PostgREST: table missing from schema / not exposed (run database/schema.sql). */
function isSupabaseTableMissingError(err: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!err) return false;
  if (err.code === "PGRST205") return true;
  return (
    typeof err.message === "string" &&
    err.message.includes("Could not find the table")
  );
}

/**
 * Check whether the user may generate (quota / premium) and ensure a credits row exists.
 * Does not increment usage — call {@link finalizeGenerationCredit} after a successful save.
 */
export async function checkAndUseCredit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  plan: PlanType;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      allowed: false,
      remaining: 0,
      plan: "free",
      error: "SUPABASE_NOT_CONFIGURED",
    };
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // Get or create credits record
  const { data: initialCredits, error: selectError } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  let credits = initialCredits;

  if (isSupabaseTableMissingError(selectError)) {
    return {
      allowed: false,
      remaining: 0,
      plan: "free",
      error: "SUPABASE_TABLES_MISSING",
    };
  }

  let insertError: { code?: string; message?: string } | null = null;

  if (!credits) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userRow) {
      const cu = await currentUser();
      const email =
        cu?.primaryEmailAddress?.emailAddress ??
        cu?.emailAddresses?.[0]?.emailAddress ??
        "";
      const safeEmail =
        email.trim() ||
        `user-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}@placeholder.invalid`;
      const { error: upsertUserError } = await supabase.from("users").upsert(
        {
          id: userId,
          email: safeEmail,
          full_name: cu?.fullName ?? null,
          avatar_url: cu?.imageUrl ?? null,
        },
        { onConflict: "id" }
      );
      if (isSupabaseTableMissingError(upsertUserError)) {
        return {
          allowed: false,
          remaining: 0,
          plan: "free",
          error: "SUPABASE_TABLES_MISSING",
        };
      }
    }

    const { data: newCredits, error: insertErr } = await supabase
      .from("credits")
      .insert({
        user_id: userId,
        plan: "free",
        generations_today: 0,
        last_reset_date: today,
      })
      .select()
      .single();
    insertError = insertErr;
    credits = newCredits;
  }

  if (!credits) {
    if (isSupabaseTableMissingError(insertError)) {
      return {
        allowed: false,
        remaining: 0,
        plan: "free",
        error: "SUPABASE_TABLES_MISSING",
      };
    }
    throw new Error("Failed to initialize credits");
  }

  // Premium users have unlimited generations
  if (credits.plan === "premium") {
    return { allowed: true, remaining: -1, plan: "premium" };
  }

  // Reset daily count if new day
  if (credits.last_reset_date !== today) {
    await supabase
      .from("credits")
      .update({ generations_today: 0, last_reset_date: today })
      .eq("user_id", userId);
    credits.generations_today = 0;
  }

  if (credits.generations_today >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      plan: credits.plan as PlanType,
    };
  }

  // Usage is finalized in finalizeGenerationCredit() only after a successful save,
  // so failed AI/DB steps do not consume the daily allowance.

  return {
    allowed: true,
    remaining: FREE_DAILY_LIMIT - credits.generations_today - 1,
    plan: credits.plan as PlanType,
  };
}

/**
 * Increment free-tier usage after a generation was fully persisted.
 * No-op when Supabase is off or the user is on premium.
 */
export async function finalizeGenerationCredit(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServiceClient();
  const { data: credits, error } = await supabase
    .from("credits")
    .select("plan, generations_today")
    .eq("user_id", userId)
    .single();

  if (error || !credits || credits.plan === "premium") return;

  await supabase
    .from("credits")
    .update({ generations_today: credits.generations_today + 1 })
    .eq("user_id", userId);
}

/**
 * Get current credit status without consuming
 */
export async function getCreditStatus(userId: string) {
  if (!isSupabaseConfigured()) {
    return {
      plan: "free" as PlanType,
      used: 0,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT,
    };
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: credits, error: statusSelectError } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (isSupabaseTableMissingError(statusSelectError)) {
    return {
      plan: "free" as PlanType,
      used: 0,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT,
    };
  }

  if (!credits) {
    return {
      plan: "free" as PlanType,
      used: 0,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT,
    };
  }

  const used =
    credits.last_reset_date === today ? credits.generations_today : 0;
  const isPremium = credits.plan === "premium";

  return {
    plan: credits.plan as PlanType,
    used: isPremium ? 0 : used,
    limit: isPremium ? -1 : FREE_DAILY_LIMIT,
    remaining: isPremium ? -1 : FREE_DAILY_LIMIT - used,
  };
}
