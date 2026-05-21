import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ translations: [] });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const favoritesOnly = searchParams.get("favorites") === "1";

  const supabase = createServiceClient();
  let query = supabase
    .from("translations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (favoritesOnly) {
    query = query.eq("is_favorite", true);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST205") {
      return NextResponse.json({ translations: [] });
    }
    console.error("translations list:", error);
    return NextResponse.json(
      { error: "Failed to load translations" },
      { status: 500 }
    );
  }

  let rows = data ?? [];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.source_text?.toLowerCase().includes(q) ||
        r.translated_text?.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ translations: rows });
}
