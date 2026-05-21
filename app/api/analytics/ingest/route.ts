import { auth } from "@clerk/nextjs/server";
import { processAnalyticsBatch } from "@/lib/analytics/ingest";
import { enqueueAnalyticsEvent } from "@/lib/analytics/redis-queue";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  const rateKey = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
  const rate = checkRateLimit(`analytics:${rateKey}`);
  if (!rate.allowed) {
    return Response.json(
      { error: "Rate limited", retryAfterSec: rate.retryAfterSec },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = await processAnalyticsBatch(body, userId);
    const events = (body as { events?: unknown[] }).events ?? [];
    for (const ev of events.slice(0, 10)) {
      await enqueueAnalyticsEvent(ev as Record<string, unknown>);
    }
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
