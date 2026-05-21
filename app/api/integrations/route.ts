import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { INTEGRATION_CHANNELS } from "@/lib/afm/navigation";
import { listConnections } from "@/lib/integrations/store";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = listConnections(userId);
  const channels = INTEGRATION_CHANNELS.map((ch) => {
    const conn = connections.find((c) => c.channelId === ch.id);
    return {
      ...ch,
      status: conn?.status ?? "disconnected",
      connectedAt: conn?.connectedAt,
    };
  });

  return NextResponse.json({ channels });
}
