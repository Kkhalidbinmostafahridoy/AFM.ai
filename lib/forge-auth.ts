import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkAndUseCredit } from "@/lib/credits";
import type { PlanType } from "@/types";

export type ForgeGate =
  | {
      ok: true;
      userId: string;
      creditCheck: {
        allowed: boolean;
        remaining: number;
        plan: PlanType;
        error?: string;
      };
    }
  | { ok: false; response: NextResponse };

/**
 * Shared guard: Clerk session + Supabase credits (check only; finalize after success).
 */
export async function requireForgeGeneration(): Promise<ForgeGate> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const creditCheck = await checkAndUseCredit(userId);

  if (creditCheck.error === "SUPABASE_NOT_CONFIGURED") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Database not configured",
          message:
            "Add Supabase keys to .env.local and restart the dev server.",
        },
        { status: 503 }
      ),
    };
  }

  if (creditCheck.error === "SUPABASE_TABLES_MISSING") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Database tables missing",
          message:
            "Run database/schema.sql (and migrations) in the Supabase SQL Editor, then try again.",
        },
        { status: 503 }
      ),
    };
  }

  if (!creditCheck.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Daily limit reached",
          message: "Upgrade to Premium for unlimited generations",
          remaining: 0,
        },
        { status: 429 }
      ),
    };
  }

  return { ok: true, userId, creditCheck };
}
