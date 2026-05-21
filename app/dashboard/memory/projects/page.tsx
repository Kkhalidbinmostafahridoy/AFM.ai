import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="Projects" description="Unfinished work, designs, and code structure.">
      <MemoryPanel category="projects" title="Project memory" />
    </AfmPageShell>
  );
}
