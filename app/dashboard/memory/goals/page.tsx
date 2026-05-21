import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryGoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="Goals" description="Business and personal goals AFM tracks over time.">
      <MemoryPanel category="goals" title="Goals memory" />
    </AfmPageShell>
  );
}
