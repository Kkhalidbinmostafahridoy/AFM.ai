import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseSetupBanner } from "@/components/supabase-setup-banner";
import { SupabaseSchemaBanner } from "@/components/supabase-schema-banner";
import { ForgeMigrationBanner } from "@/components/forge-migration-banner";
import { ImageEditForgeForm } from "@/components/forge/image-edit-forge-form";

export default async function ForgeImageEditPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Image → image</h1>
            <p className="text-muted-foreground mt-1">
              Restyle, enhance, or cinematic-grade a reference image with Gemini.
            </p>
          </div>
          <SupabaseSetupBanner />
          <SupabaseSchemaBanner />
          <ForgeMigrationBanner />
          <ImageEditForgeForm supabaseReady={supabaseReady} />
        </div>
      </main>
    </div>
  );
}
