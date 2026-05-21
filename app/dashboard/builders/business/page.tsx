import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { BusinessBuilderClient } from "@/components/afm/business-builder-client";
import { AFM_MODULES } from "@/lib/afm/modules";

const mod = AFM_MODULES.find((m) => m.id === "business")!;

export default async function BusinessBuilderPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmModulePage module={mod}>
      <BusinessBuilderClient />
    </AfmModulePage>
  );
}
