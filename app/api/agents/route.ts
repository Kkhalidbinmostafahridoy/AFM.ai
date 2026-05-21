import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AFM_AGENTS } from "@/lib/agents/definitions";
import { listAgentTasks } from "@/lib/agents/task-store";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = listAgentTasks(userId);
  return NextResponse.json({ agents: AFM_AGENTS, tasks });
}
