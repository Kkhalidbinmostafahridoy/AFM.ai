import type {
  AIAnalytics,
  DashboardMetrics,
  MediaAnalytics,
  ProductivityScores,
  SystemAnalytics,
  UserAnalytics,
} from "./types";
import { computeProductivityScores, type ProductivityInput } from "./productivity";

export interface RawCounters {
  totalUsers: number;
  activeSessions: number;
  dau: number;
  mau: number;
  aiRequests24h: number;
  aiFailures24h: number;
  aiTokens24h: number;
  avgAiLatencyMs: number;
  videoRenders24h: number;
  imageGens24h: number;
  avgRenderMs: number;
  wsConnections: number;
  providerCounts: Record<string, number>;
  sessionDurationSumMs: number;
  sessionCount: number;
}

export function buildDashboardMetrics(
  counters: RawCounters,
  productivity?: ProductivityInput
): DashboardMetrics {
  const users: UserAnalytics = {
    totalUsers: counters.totalUsers,
    activeUsers: counters.activeSessions,
    concurrentUsers: counters.activeSessions,
    dailyActiveUsers: counters.dau,
    monthlyActiveUsers: counters.mau,
    avgSessionDurationMs:
      counters.sessionCount > 0
        ? Math.round(counters.sessionDurationSumMs / counters.sessionCount)
        : 0,
    retentionRate:
      counters.mau > 0
        ? Math.round((counters.dau / counters.mau) * 1000) / 10
        : 0,
    engagementScore: Math.min(
      100,
      Math.round((counters.dau / Math.max(1, counters.totalUsers)) * 100)
    ),
  };

  const ai: AIAnalytics = {
    requestsPerMinute: Math.round(counters.aiRequests24h / (24 * 60)),
    totalTokens: counters.aiTokens24h,
    providerUsage: counters.providerCounts,
    avgLatencyMs: counters.avgAiLatencyMs,
    avgResponseSpeedMs: counters.avgAiLatencyMs,
    failedRequests: counters.aiFailures24h,
    fallbackFrequency:
      counters.aiRequests24h > 0
        ? Math.round(
            (counters.aiFailures24h / counters.aiRequests24h) * 1000
          ) / 10
        : 0,
    orchestrationTimingMs: counters.avgAiLatencyMs,
  };

  const media: MediaAnalytics = {
    videoRenders: counters.videoRenders24h,
    imageGenerations: counters.imageGens24h,
    avgRenderDurationMs: counters.avgRenderMs,
    gpuUsagePercent: 0,
    queueWaitMs: 0,
    storageUsageGb: 0,
  };

  const system: SystemAnalytics = {
    cpuUsagePercent: 0,
    ramUsagePercent: 0,
    redisUsageMb: 0,
    postgresLatencyMs: counters.avgAiLatencyMs > 0 ? 12 : 0,
    websocketConnections: counters.wsConnections,
    workerHealth: "healthy",
    queueHealth: "healthy",
  };

  let prod: ProductivityScores | undefined;
  if (productivity) {
    prod = computeProductivityScores(productivity);
  }

  return {
    users,
    ai,
    media,
    system,
    productivity: prod,
    updatedAt: new Date().toISOString(),
  };
}

/** In-memory rolling window for dev / no-Redis fallback. */
export class MetricsBuffer {
  private events: Array<{ type: string; ts: number; props?: Record<string, unknown> }> =
    [];
  private readonly max = 50_000;

  push(type: string, props?: Record<string, unknown>) {
    this.events.push({ type, ts: Date.now(), props });
    if (this.events.length > this.max) {
      this.events = this.events.slice(-this.max / 2);
    }
  }

  snapshot(): RawCounters {
    const now = Date.now();
    const day = 86_400_000;
    const recent = this.events.filter((e) => now - e.ts < day);
    const sessions = new Set<string>();
    let aiReq = 0;
    let aiFail = 0;
    let tokens = 0;
    let latencySum = 0;
    let latencyN = 0;
    let video = 0;
    let image = 0;
    let renderSum = 0;
    let renderN = 0;
    const providers: Record<string, number> = {};
    const users = new Set<string>();

    for (const e of recent) {
      if (e.props?.sessionId) sessions.add(String(e.props.sessionId));
      if (e.props?.userId) users.add(String(e.props.userId));
      if (e.type === "AI_REQUEST") aiReq += 1;
      if (e.type === "API_FAILURE" || e.type === "ERROR_EVENT") aiFail += 1;
      if (e.type === "AI_RESPONSE" && typeof e.props?.tokens === "number") {
        tokens += e.props.tokens as number;
      }
      if (typeof e.props?.latencyMs === "number") {
        latencySum += e.props.latencyMs as number;
        latencyN += 1;
      }
      if (e.type === "VIDEO_RENDER_COMPLETE") video += 1;
      if (e.type === "IMAGE_GENERATION_COMPLETE") image += 1;
      if (typeof e.props?.durationMs === "number" && e.type.includes("COMPLETE")) {
        renderSum += e.props.durationMs as number;
        renderN += 1;
      }
      const prov = e.props?.provider;
      if (typeof prov === "string") {
        providers[prov] = (providers[prov] ?? 0) + 1;
      }
    }

    return {
      totalUsers: Math.max(users.size, 1),
      activeSessions: sessions.size,
      dau: users.size,
      mau: users.size,
      aiRequests24h: aiReq,
      aiFailures24h: aiFail,
      aiTokens24h: tokens,
      avgAiLatencyMs: latencyN ? Math.round(latencySum / latencyN) : 0,
      videoRenders24h: video,
      imageGens24h: image,
      avgRenderMs: renderN ? Math.round(renderSum / renderN) : 0,
      wsConnections: 0,
      providerCounts: providers,
      sessionDurationSumMs: 0,
      sessionCount: sessions.size,
    };
  }
}
