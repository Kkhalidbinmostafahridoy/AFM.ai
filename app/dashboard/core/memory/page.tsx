import { redirect } from "next/navigation";

export default function LegacyMemoryRedirect() {
  redirect("/dashboard/memory/projects");
}
