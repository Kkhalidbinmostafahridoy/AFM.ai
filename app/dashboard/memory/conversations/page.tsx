import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { MemoryPanel } from "@/components/afm/memory-panel";

export default async function MemoryConversationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AfmPageShell title="Conversations" description="AFM Memory — chat context and summaries.">
      <MemoryPanel category="conversations" title="Conversation memory" />
    </AfmPageShell>
  );
}
