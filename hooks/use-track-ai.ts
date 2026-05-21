"use client";

import { useCallback, useRef } from "react";
import { useAnalytics } from "./use-analytics";
import { AnalyticsEventType } from "@afm/analytics";

export function useTrackAI() {
  const { client, track } = useAnalytics();
  const streamStart = useRef(0);

  const trackRequest = useCallback(
    (meta: { provider?: string; model?: string; taskType?: string }) => {
      client.startAiInteraction(meta);
    },
    [client]
  );

  const trackResponse = useCallback(
    (meta: {
      provider?: string;
      model?: string;
      latencyMs?: number;
      tokens?: number;
      status?: string;
    }) => {
      client.endAiInteraction(meta);
    },
    [client]
  );

  const trackStreamStart = useCallback(() => {
    streamStart.current = Date.now();
    track(AnalyticsEventType.AI_STREAM_START);
  }, [track]);

  const trackStreamEnd = useCallback(
    (meta?: Record<string, unknown>) => {
      const ms = streamStart.current ? Date.now() - streamStart.current : 0;
      track(AnalyticsEventType.AI_STREAM_END, { ...meta, streamingMs: ms });
      streamStart.current = 0;
    },
    [track]
  );

  return {
    trackRequest,
    trackResponse,
    trackStreamStart,
    trackStreamEnd,
  };
}
