import { auth } from "@clerk/nextjs/server";
import { prisma, isDatabaseReady } from "@afm/db";
import { z } from "zod";

const sessionSchema = z.object({
  sessionId: z.string().max(64),
  deviceId: z.string().max(64),
  tabId: z.string().max(64).optional(),
  consent: z.boolean(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid session" }, { status: 400 });
  }

  if (await isDatabaseReady()) {
    await prisma.analyticsSession.upsert({
      where: { id: parsed.data.sessionId },
      create: {
        id: parsed.data.sessionId,
        userId: userId ?? null,
        deviceId: parsed.data.deviceId,
        tabId: parsed.data.tabId,
        consentGiven: parsed.data.consent,
      },
      update: {
        lastHeartbeatAt: new Date(),
        consentGiven: parsed.data.consent,
        userId: userId ?? undefined,
      },
    });
  }

  return Response.json({ ok: true, sessionId: parsed.data.sessionId });
}
