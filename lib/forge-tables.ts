import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export function isTableMissingError(
  err: { code?: string; message?: string } | null
): boolean {
  if (!err) return false;
  if (err.code === "PGRST205") return true;
  return (
    typeof err.message === "string" &&
    err.message.includes("Could not find the table")
  );
}

/** Fail fast when ViralForge migration was not applied */
export async function requireForgeTables(
  table: "images" | "video_projects" | "analyses" | "translations"
): Promise<NextResponse | null> {
  const supabase = createServiceClient();
  const { error } = await supabase.from(table).select("id").limit(1);
  if (isTableMissingError(error)) {
    return NextResponse.json(
      {
        error: "Forge database tables missing",
        message:
          "Run database/migrations/002_viralforge.sql, 003_translations_projects.sql, and optionally 004_pipeline.sql in the Supabase SQL Editor, then retry.",
      },
      { status: 503 }
    );
  }
  return null;
}
