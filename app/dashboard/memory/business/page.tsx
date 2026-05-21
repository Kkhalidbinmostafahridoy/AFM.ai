import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryBusinessPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="Business Data" description="Brand, audience, offers, and history.">
      <MemoryPanel category="business" title="Business memory" />
    </AfmPageShell>
  );
}
