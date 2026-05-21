import { redirect } from "next/navigation";

export default function LegacyRouterRedirect() {
  redirect("/dashboard/workspace");
}
