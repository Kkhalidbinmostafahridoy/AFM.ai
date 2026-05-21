import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { getCreditStatus } from "@/lib/credits";
import { SupabaseSetupBanner } from "@/components/supabase-setup-banner";
import { SupabaseSchemaBanner } from "@/components/supabase-schema-banner";
import { ForgeMigrationBanner } from "@/components/forge-migration-banner";
import { CommandCenter } from "@/components/afm/command-center";
import { AFM_AI_NAME } from "@/lib/constants";
import { FREE_DAILY_LIMIT } from "@/lib/constants";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const credits = await getCreditStatus(userId);
  const supabaseReady = isSupabaseConfigured();

  let count = 0;
  if (supabaseReady) {
    const supabase = createServiceClient();
    const countResult = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    count = countResult.count ?? 0;
  }

  const creditsRemaining =
    credits.plan === "premium"
      ? "∞"
      : `${credits.remaining}/${FREE_DAILY_LIMIT}`;

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-7xl">
          <SupabaseSetupBanner />
          <SupabaseSchemaBanner />
          <ForgeMigrationBanner />

          <div className="mb-8">
            <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wide mb-1">
              {AFM_AI_NAME} · AI Operating System
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Multi-model orchestration, creative studio, automation, and live AI monitor.
            </p>
          </div>

          <CommandCenter
            plan={credits.plan}
            creditsRemaining={creditsRemaining}
            scriptCount={count}
          />
        </div>
      </main>
    </div>
  );
}
