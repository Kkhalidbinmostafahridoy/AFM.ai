import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { GeneratorForm } from "@/components/generator-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCreditStatus } from "@/lib/credits";
import { SupabaseSetupBanner } from "@/components/supabase-setup-banner";
import { SupabaseSchemaBanner } from "@/components/supabase-schema-banner";
import { ForgeMigrationBanner } from "@/components/forge-migration-banner";
import { GeminiSetupBanner } from "@/components/gemini-setup-banner";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function GeneratePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const credits = await getCreditStatus(userId);
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Viral script generator</h1>
            <p className="text-muted-foreground mt-1">
              Gemini-built hooks, 3-section cinematic spine, scenes, captions, and hashtags
            </p>
          </div>
          <SupabaseSetupBanner />
          <SupabaseSchemaBanner />
          <ForgeMigrationBanner />
          <GeminiSetupBanner />
          <GeneratorForm credits={credits} supabaseReady={supabaseReady} />
        </div>
      </main>
    </div>
  );
}
