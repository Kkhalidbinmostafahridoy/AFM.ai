import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { AFM_MODULES } from "@/lib/afm/modules";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const mod = AFM_MODULES.find((m) => m.id === "agents")!;

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmModulePage module={mod}>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          "Marketing Agent",
          "Coding Agent",
          "Research Agent",
          "SEO Agent",
          "Video Agent",
          "Business Agent",
        ].map((name) => (
          <div
            key={name}
            className="rounded-xl border p-4 bg-muted/20"
          >
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground mt-1">Phase 2 — autonomous execution</p>
          </div>
        ))}
      </div>
      <Button variant="gradient" className="mt-6" asChild>
        <Link href="/dashboard/swarm">Use Swarm until agents launch</Link>
      </Button>
    </AfmModulePage>
  );
}
