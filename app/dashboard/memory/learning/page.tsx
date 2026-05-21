import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryLearningPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="Learning Style" description="How you prefer explanations and formats.">
      <MemoryPanel category="learning" title="Learning style" />
    </AfmPageShell>
  );
}
