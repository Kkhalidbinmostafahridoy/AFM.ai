import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PipelinesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title="AI Pipelines" description="Forge media pipelines — script → image → voice → video plan.">
      <Button variant="gradient" asChild>
        <Link href="/dashboard/forge/video">Open video pipeline</Link>
      </Button>
    </AfmPageShell>
  );
}
