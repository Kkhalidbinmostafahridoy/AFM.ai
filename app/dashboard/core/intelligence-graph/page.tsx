import { redirect } from "next/navigation";

export default function LegacyGraphRedirect() {
  redirect("/dashboard/monitor");
}
