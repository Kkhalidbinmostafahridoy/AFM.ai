import { redirect } from "next/navigation";

export default function LegacyAgentRedirect() {
  redirect("/dashboard/agents");
}
