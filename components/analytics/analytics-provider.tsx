"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AfmAnalyticsClient } from "@/lib/analytics/client";

export const AnalyticsContext = createContext<{
  client: AfmAnalyticsClient;
} | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const [client] = useState(
    () =>
      new AfmAnalyticsClient({
        wsUrl: process.env.NEXT_PUBLIC_AFM_WS_URL,
      })
  );

  useEffect(() => {
    if (!isLoaded) return;
    client.setUserId(userId ?? null);
    if (client.hasConsent()) {
      client.start();
      if (userId) client.track("USER_LOGIN");
    }
    return () => {
      if (client.hasConsent()) {
        if (userId) client.track("USER_LOGOUT");
        client.stop();
      }
    };
  }, [isLoaded, userId, client]);

  useEffect(() => {
    if (!pathname || !client.hasConsent()) return;
    client.pageView(pathname, document.title);
  }, [pathname, client]);

  const value = useMemo(() => ({ client }), [client]);

  return (
    <AnalyticsContext.Provider value={value}>
      <AnalyticsConsentBanner />
      {children}
    </AnalyticsContext.Provider>
  );
}

function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);
  const ctx = useContext(AnalyticsContext);

  useEffect(() => {
    if (!ctx) return;
    setVisible(!ctx.client.hasConsent());
  }, [ctx]);

  if (!visible || !ctx) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 rounded-xl border bg-background/95 backdrop-blur p-4 shadow-lg text-sm"
    >
      <p className="font-medium mb-1">AFM.ai analytics</p>
      <p className="text-muted-foreground text-xs mb-3">
        GDPR-safe telemetry: no prompts stored, encrypted aggregation, you can
        opt out anytime.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-violet-600 text-white px-3 py-2 text-xs font-medium"
          onClick={() => {
            ctx.client.setConsent(true);
            setVisible(false);
          }}
        >
          Accept
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border px-3 py-2 text-xs"
          onClick={() => setVisible(false)}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
