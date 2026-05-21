"use client";

import { useCallback, useRef } from "react";
import { useAnalytics } from "./use-analytics";
import { AnalyticsEventType } from "@afm/analytics";

export function useTrackWorkflow() {
  const { track, client } = useAnalytics();
  const startRef = useRef(0);

  const trackStart = useCallback(
    (workflowId: string) => {
      startRef.current = Date.now();
      track(AnalyticsEventType.WORKFLOW_START, { workflowId });
    },
    [track]
  );

  const trackComplete = useCallback(
    (workflowId: string, status: "success" | "failed" = "success") => {
      const ms = startRef.current ? Date.now() - startRef.current : 0;
      client.addBucket("workflowMs", ms);
      track(AnalyticsEventType.WORKFLOW_COMPLETE, {
        workflowId,
        status,
        durationMs: ms,
      });
      startRef.current = 0;
    },
    [track, client]
  );

  return { trackStart, trackComplete };
}
