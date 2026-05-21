"use client";

import type { AnalyticsEventPayload } from "@afm/analytics";
import { AnalyticsEventType } from "@afm/analytics";
import {
  createClientSessionId,
  getOrCreateDeviceId,
  getOrCreateTabId,
  getStoredSessionId,
  setStoredSessionId,
} from "./session";
import {
  createTimeBuckets,
  HEARTBEAT_MS,
  IDLE_THRESHOLD_MS,
  type TimeBucketKey,
  type TimeBuckets,
} from "./time-tracking";

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH = 50;
const CONSENT_KEY = "afm_analytics_consent";

type TrackOptions = {
  path?: string;
  durationMs?: number;
  properties?: Record<string, unknown>;
};

export type AnalyticsClientConfig = {
  userId?: string | null;
  enabled?: boolean;
  ingestUrl?: string;
  wsUrl?: string;
  onMetrics?: (buckets: TimeBuckets) => void;
};

export class AfmAnalyticsClient {
  private queue: AnalyticsEventPayload[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string;
  private deviceId: string;
  private tabId: string;
  private userId: string | null = null;
  private enabled = true;
  private ingestUrl = "/api/analytics/ingest";
  private ws: WebSocket | null = null;
  private buckets = createTimeBuckets();
  private lastActivity = Date.now();
  private isIdle = false;
  private isLeaderTab = true;
  private channel: BroadcastChannel | null = null;
  private started = false;
  private activityBound = false;
  private visibilityBound = false;
  private leaderInterval: ReturnType<typeof setInterval> | null = null;
  private currentPath = "";
  private pageEnteredAt = 0;
  private wsConnectedAt = 0;
  private aiInteractionStart = 0;

  constructor(config: AnalyticsClientConfig = {}) {
    this.sessionId = getStoredSessionId() ?? createClientSessionId();
    this.deviceId = getOrCreateDeviceId();
    this.tabId = getOrCreateTabId();
    this.userId = config.userId ?? null;
    this.enabled = config.enabled ?? this.hasConsent();
    this.ingestUrl = config.ingestUrl ?? "/api/analytics/ingest";
    if (config.wsUrl) this.connectWebSocket(config.wsUrl);
    this.ensureBroadcastChannel();
  }

  /** Recreate channel if missing or closed (e.g. after stop() in Strict Mode). */
  private ensureBroadcastChannel() {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    try {
      if (!this.channel) {
        this.channel = new BroadcastChannel("afm_analytics_sync");
        this.channel.onmessage = (ev) => this.onBroadcast(ev.data);
      }
    } catch {
      this.channel = null;
    }
  }

  private broadcast(message: { kind: string; payload?: AnalyticsEventPayload }) {
    this.ensureBroadcastChannel();
    if (!this.channel) return;
    try {
      this.channel.postMessage(message);
    } catch {
      this.channel = null;
      this.ensureBroadcastChannel();
      try {
        this.channel?.postMessage(message);
      } catch {
        /* channel unavailable */
      }
    }
  }

  hasConsent(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CONSENT_KEY) === "1";
  }

  setConsent(granted: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(CONSENT_KEY, granted ? "1" : "0");
    this.enabled = granted;
    if (granted) this.start();
    else this.stop();
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  getSessionId() {
    return this.sessionId;
  }

  getBuckets(): TimeBuckets {
    return { ...this.buckets };
  }

  start() {
    if (!this.enabled || typeof window === "undefined" || this.started) return;
    this.started = true;
    this.ensureBroadcastChannel();
    this.track(AnalyticsEventType.SESSION_START);
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    if (!this.visibilityBound) {
      this.bindVisibility();
      this.visibilityBound = true;
    }
    if (!this.activityBound) {
      this.bindActivity();
      this.activityBound = true;
    }
    this.electLeader();
    window.addEventListener("beforeunload", this.onUnload);
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.track(AnalyticsEventType.SESSION_END, { durationMs: this.sessionDuration() });
    this.flush(true);
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (this.leaderInterval) clearInterval(this.leaderInterval);
    this.leaderInterval = null;
    window.removeEventListener("beforeunload", this.onUnload);
    // Keep BroadcastChannel open — stop() runs on Strict Mode remount; closing breaks re-start.
  }

  track(type: string, opts: TrackOptions = {}) {
    if (!this.enabled) return;
    const payload: AnalyticsEventPayload = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId ?? undefined,
      deviceId: this.deviceId,
      tabId: this.tabId,
      path: opts.path ?? this.currentPath,
      durationMs: opts.durationMs,
      properties: opts.properties,
    };
    this.queue.push(payload);
    if (this.queue.length >= MAX_BATCH) this.flush();
    this.broadcast({ kind: "event", payload });
  }

  pageView(path: string, title?: string) {
    if (this.currentPath && this.pageEnteredAt) {
      const dur = Date.now() - this.pageEnteredAt;
      this.buckets.pageViewMs += dur;
      this.track(AnalyticsEventType.PAGE_CLOSE, {
        path: this.currentPath,
        durationMs: dur,
      });
    }
    this.currentPath = path;
    this.pageEnteredAt = Date.now();
    this.track(AnalyticsEventType.PAGE_OPEN, { path, properties: { title } });
    this.track(AnalyticsEventType.PAGE_VIEW, { path, properties: { title } });
  }

  startAiInteraction(meta?: Record<string, unknown>) {
    this.aiInteractionStart = Date.now();
    this.track(AnalyticsEventType.AI_REQUEST, { properties: meta });
  }

  endAiInteraction(meta?: Record<string, unknown>) {
    const ms = this.aiInteractionStart
      ? Date.now() - this.aiInteractionStart
      : 0;
    this.buckets.aiInteractionMs += ms;
    this.track(AnalyticsEventType.AI_RESPONSE, {
      durationMs: ms,
      properties: meta,
    });
    this.aiInteractionStart = 0;
  }

  addBucket(key: TimeBucketKey, ms: number) {
    this.buckets[key] += ms;
  }

  private sessionDuration() {
    return Date.now() - (this.pageEnteredAt || Date.now());
  }

  private heartbeat() {
    if (!this.isLeaderTab) return;
    const slice = HEARTBEAT_MS;
    if (this.isIdle) this.buckets.idleMs += slice;
    else this.buckets.activeMs += slice;
    this.track(AnalyticsEventType.SESSION_HEARTBEAT, {
      properties: { ...this.buckets },
    });
  }

  private markActive() {
    this.lastActivity = Date.now();
    if (this.isIdle) {
      this.isIdle = false;
      this.track(AnalyticsEventType.IDLE_END);
    }
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.isIdle = true;
      this.track(AnalyticsEventType.IDLE_START);
    }, IDLE_THRESHOLD_MS);
  }

  private bindActivity() {
    const throttle = { last: 0 };
    const onAct = (type: string) => {
      const now = Date.now();
      if (now - throttle.last < 2000 && type === AnalyticsEventType.MOUSE_MOVE) return;
      throttle.last = now;
      this.markActive();
      if (type !== AnalyticsEventType.MOUSE_MOVE) {
        this.track(type, { path: this.currentPath });
      }
    };
    window.addEventListener("click", () => onAct(AnalyticsEventType.CLICK), true);
    window.addEventListener(
      "keydown",
      () => onAct(AnalyticsEventType.KEYBOARD),
      true
    );
    window.addEventListener(
      "scroll",
      () => onAct(AnalyticsEventType.SCROLL),
      { passive: true }
    );
    window.addEventListener(
      "mousemove",
      () => onAct(AnalyticsEventType.MOUSE_MOVE),
      { passive: true }
    );
  }

  private bindVisibility() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.track(AnalyticsEventType.TAB_INACTIVE);
        this.track(AnalyticsEventType.BROWSER_MINIMIZED);
      } else {
        this.track(AnalyticsEventType.TAB_ACTIVE);
        this.track(AnalyticsEventType.BROWSER_VISIBLE);
        this.markActive();
      }
    });
  }

  private electLeader() {
    const key = "afm_tab_leader";
    const claim = `${this.tabId}:${Date.now()}`;
    try {
      const existing = localStorage.getItem(key);
      if (!existing || Date.now() - Number(existing.split(":")[1] ?? 0) > HEARTBEAT_MS * 2) {
        localStorage.setItem(key, claim);
        this.isLeaderTab = true;
      } else {
        this.isLeaderTab = existing.startsWith(this.tabId);
      }
      if (this.leaderInterval) clearInterval(this.leaderInterval);
      this.leaderInterval = setInterval(() => {
        if (this.isLeaderTab) localStorage.setItem(key, claim);
      }, HEARTBEAT_MS);
    } catch {
      this.isLeaderTab = true;
    }
  }

  private onBroadcast(data: { kind: string; payload?: AnalyticsEventPayload }) {
    if (data.kind === "event" && data.payload && !this.isLeaderTab) {
      this.queue.push(data.payload);
    }
    if (data.kind === "session" && data.payload?.sessionId) {
      this.sessionId = data.payload.sessionId;
      setStoredSessionId(this.sessionId);
    }
  }

  private onUnload = () => {
    this.track(AnalyticsEventType.SESSION_END);
    this.flush(true);
  };

  private connectWebSocket(wsBase: string) {
    try {
      const url = `${wsBase.replace(/\/$/, "")}/v1/ws/analytics`;
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        this.wsConnectedAt = Date.now();
        this.track(AnalyticsEventType.WEBSOCKET_CONNECT);
        this.ws?.send(
          JSON.stringify({
            type: "register",
            sessionId: this.sessionId,
            userId: this.userId,
            deviceId: this.deviceId,
          })
        );
      };
      this.ws.onclose = () => {
        const dur = this.wsConnectedAt ? Date.now() - this.wsConnectedAt : 0;
        this.buckets.websocketMs += dur;
        this.track(AnalyticsEventType.WEBSOCKET_DISCONNECT, { durationMs: dur });
      };
    } catch {
      /* optional */
    }
  }

  async flush(useBeacon = false) {
    if (!this.queue.length) return;
    const batch = this.queue.splice(0, MAX_BATCH);
    const body = JSON.stringify({
      events: batch,
      consent: this.hasConsent(),
      clientVersion: "1.0",
    });
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(this.ingestUrl, body);
      return;
    }
    try {
      await fetch(this.ingestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: useBeacon,
      });
    } catch {
      this.queue.unshift(...batch);
    }
  }
}

let singleton: AfmAnalyticsClient | null = null;

export function getAnalyticsClient(config?: AnalyticsClientConfig): AfmAnalyticsClient {
  if (!singleton) singleton = new AfmAnalyticsClient(config);
  return singleton;
}
