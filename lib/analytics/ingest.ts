import {
  ingestBatchSchema,
  sanitizeEventProperties,
  type AnalyticsEventPayload,
} from "@afm/analytics";
import { prisma, isDatabaseReady } from "@afm/db";
import type { Prisma } from "@prisma/client";

function toJson(
  props: Record<string, unknown> | undefined
): Prisma.InputJsonValue | undefined {
  if (!props) return undefined;
  return props as Prisma.InputJsonValue;
}
import { globalMetricsBuffer } from "./store";

export async function processAnalyticsBatch(
  body: unknown,
  userId?: string | null
): Promise<{ accepted: number; sessionId?: string }> {
  const parsed = ingestBatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Invalid batch");
  }

  const events = parsed.data.events.map((e) => ({
    ...e,
    userId: e.userId ?? userId ?? undefined,
    properties: sanitizeEventProperties(e.properties),
    timestamp: e.timestamp ?? Date.now(),
  }));

  for (const ev of events) {
    globalMetricsBuffer.push(ev.type, {
      sessionId: ev.sessionId,
      userId: ev.userId,
      ...ev.properties,
      latencyMs: ev.durationMs,
    });
  }

  const dbReady = await isDatabaseReady();
  if (dbReady) {
    await persistEvents(events);
  }

  return {
    accepted: events.length,
    sessionId: events[0]?.sessionId,
  };
}

async function persistEvents(events: AnalyticsEventPayload[]) {
  const sessionIds = new Set(events.map((e) => e.sessionId));

  for (const sessionId of sessionIds) {
    const sample = events.find((e) => e.sessionId === sessionId);
    if (!sample) continue;
    await prisma.analyticsSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        userId: sample.userId ?? null,
        deviceId: sample.deviceId ?? "unknown",
        tabId: sample.tabId,
        consentGiven: true,
        lastHeartbeatAt: new Date(),
      },
      update: {
        lastHeartbeatAt: new Date(),
        userId: sample.userId ?? undefined,
      },
    });
  }

  await prisma.analyticsEvent.createMany({
    data: events.map((e) => ({
      sessionId: e.sessionId,
      userId: e.userId ?? null,
      eventType: e.type,
      properties: toJson(e.properties),
      createdAt: new Date(e.timestamp ?? Date.now()),
    })),
  });

  for (const e of events) {
    if (e.type === "AI_REQUEST") {
      await prisma.analyticsAiRequest.create({
        data: {
          userId: e.userId ?? null,
          sessionId: e.sessionId,
          provider: String(e.properties?.provider ?? ""),
          model: String(e.properties?.model ?? ""),
          taskType: String(e.properties?.taskType ?? ""),
          status: "pending",
        },
      });
    }
    if (e.type === "PAGE_VIEW" && e.path) {
      await prisma.analyticsPageView.create({
        data: {
          sessionId: e.sessionId,
          userId: e.userId ?? null,
          path: e.path,
          title: String(e.properties?.title ?? ""),
        },
      });
    }
    if (
      e.type === "WORKFLOW_START" ||
      e.type === "WORKFLOW_COMPLETE" ||
      e.type === "AI_REQUEST"
    ) {
      await prisma.analyticsUserActivity.create({
        data: {
          sessionId: e.sessionId,
          userId: e.userId ?? null,
          eventType: e.type,
          path: e.path,
          durationMs: e.durationMs,
          properties: toJson(e.properties),
        },
      });
    }
  }
}
