import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDraft,
  publishToChannel,
  saveDraft,
} from "@/lib/integrations/store";
import { INTEGRATION_CHANNELS } from "@/lib/afm/navigation";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  channelId: z.string().min(1).max(40),
  content: z.string().min(1).max(8000).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`integration-send:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const channel = INTEGRATION_CHANNELS.find((c) => c.id === parsed.data.channelId);
  if (!channel) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
  }

  const content =
    parsed.data.content?.trim() ||
    getDraft(userId, parsed.data.channelId)?.content?.trim();

  if (!content) {
    return NextResponse.json(
      {
        error: "No content",
        message: "Generate an AI post first, or pass content in the request body.",
      },
      { status: 400 }
    );
  }

  const result = await publishToChannel({
    userId,
    channelId: parsed.data.channelId,
    channelName: channel.name,
    content,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, channelId: result.channelId },
      { status: 400 }
    );
  }

  saveDraft({ userId, channelId: parsed.data.channelId, content });

  return NextResponse.json({
    channelId: result.channelId,
    channelName: result.channelName ?? channel.name,
    externalId: result.externalId,
    simulated: result.simulated,
    openUrl: result.openUrl ?? null,
    message: result.message,
  });
}
