import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectChannel, disconnectChannel } from "@/lib/integrations/store";
import { INTEGRATION_CHANNELS } from "@/lib/afm/navigation";

const schema = z.object({
  channelId: z.string().min(1).max(40),
  action: z.enum(["connect", "disconnect"]),
  accessToken: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const channel = INTEGRATION_CHANNELS.find((c) => c.id === parsed.data.channelId);
  if (!channel) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
  }

  if (parsed.data.action === "disconnect") {
    disconnectChannel(userId, parsed.data.channelId);
    return NextResponse.json({ status: "disconnected", channelId: parsed.data.channelId });
  }

  const conn = connectChannel({
    userId,
    channelId: parsed.data.channelId,
    token: parsed.data.accessToken,
  });

  return NextResponse.json({
    status: conn.status,
    channelId: conn.channelId,
    message: `${channel.name} connected. Use AI post → Send to open ${channel.name} and publish.`,
    oauthUrl: `/dashboard/settings?connect=${parsed.data.channelId}`,
  });
}
