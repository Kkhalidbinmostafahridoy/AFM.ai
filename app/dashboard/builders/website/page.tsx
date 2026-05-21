import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { WebsiteBuilderClient } from "@/components/afm/website-builder-client";
import { AFM_MODULES } from "@/lib/afm/modules";

const mod = AFM_MODULES.find((m) => m.id === "website")!;

export default async function WebsiteBuilderPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title={mod.label}
      description="Generate full-stack websites from a prompt — Next.js, APIs, Prisma, Tailwind."
      maxWidth="max-w-6xl"
    >
      <WebsiteBuilderClient />
    </AfmPageShell>
  );
}
