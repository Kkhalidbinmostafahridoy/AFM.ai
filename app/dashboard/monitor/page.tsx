import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { LiveMonitor } from "@/components/afm/live-monitor";

export default async function MonitorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="Live AI Monitor"
      description="Real-time agent status, model health, and orchestration activity."
      maxWidth="max-w-4xl"
    >
      <LiveMonitor />
    </AfmPageShell>
  );
}
