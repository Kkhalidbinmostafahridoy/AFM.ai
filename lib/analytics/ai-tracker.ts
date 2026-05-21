import { AnalyticsEventType } from "@afm/analytics";
import { globalMetricsBuffer } from "./store";

export interface AiTrackMeta {
  userId?: string;
  sessionId?: string;
  provider?: string;
  model?: string;
  taskType?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  streamingMs?: number;
  fallbackUsed?: boolean;
  orchestrationMs?: number;
  status?: "success" | "failed" | "pending";
}

/** Server-side AI usage tracker (no prompt content). */
export function trackAiRequest(meta: AiTrackMeta) {
  globalMetricsBuffer.push(AnalyticsEventType.AI_REQUEST, {
    ...meta,
    userId: meta.userId,
    sessionId: meta.sessionId,
    provider: meta.provider,
  });
}

export function trackAiResponse(meta: AiTrackMeta) {
  globalMetricsBuffer.push(AnalyticsEventType.AI_RESPONSE, {
    ...meta,
    latencyMs: meta.latencyMs,
    tokens: (meta.tokensIn ?? 0) + (meta.tokensOut ?? 0),
  });
}
