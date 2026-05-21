import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { AFM_MODULES } from "@/lib/afm/modules";

const mod = AFM_MODULES.find((m) => m.id === "3d")!;

export default async function ThreeDPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AfmModulePage module={mod} />;
}
