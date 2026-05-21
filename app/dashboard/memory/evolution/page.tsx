import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryEvolutionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="AI Evolution" description="How AFM adapts to you over time (Phase 3).">
      <MemoryPanel category="evolution" title="AI evolution log" />
    </AfmPageShell>
  );
}
