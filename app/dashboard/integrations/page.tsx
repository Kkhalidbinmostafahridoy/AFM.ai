import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { IntegrationsGrid } from "@/components/afm/integrations-grid";

export default async function IntegrationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="AI Connect"
      description="WhatsApp, TikTok, YouTube, Shopify, GitHub, and more — AI acts, not only talks."
      maxWidth="max-w-6xl"
    >
      <IntegrationsGrid />
    </AfmPageShell>
  );
}
