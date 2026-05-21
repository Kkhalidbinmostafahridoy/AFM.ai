"use client";

import { useCallback, useContext } from "react";
import { AnalyticsContext } from "@/components/analytics/analytics-provider";
import { AnalyticsEventType } from "@afm/analytics";

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }

  const track = useCallback(
    (type: string, props?: Record<string, unknown>) => {
      ctx.client.track(type, { properties: props });
    },
    [ctx.client]
  );

  return {
    client: ctx.client,
    track,
    trackLogin: () => track(AnalyticsEventType.USER_LOGIN),
    trackLogout: () => track(AnalyticsEventType.USER_LOGOUT),
    trackError: (code: string) =>
      track(AnalyticsEventType.ERROR_EVENT, { code }),
    trackApiFailure: (route: string, status: number) =>
      track(AnalyticsEventType.API_FAILURE, { route, status }),
    setConsent: (granted: boolean) => ctx.client.setConsent(granted),
    hasConsent: ctx.client.hasConsent(),
    buckets: ctx.client.getBuckets(),
  };
}
