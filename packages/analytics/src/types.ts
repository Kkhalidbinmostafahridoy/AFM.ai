import { z } from "zod";
import { AnalyticsEventType } from "./events";

export const analyticsEventSchema = z.object({
  type: z.string(),
  timestamp: z.number().optional(),
  sessionId: z.string().max(64),
  userId: z.string().max(128).optional(),
  deviceId: z.string().max(64).optional(),
  tabId: z.string().max(64).optional(),
  path: z.string().max(512).optional(),
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
  properties: z.record(z.unknown()).optional(),
});

export const ingestBatchSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(100),
  consent: z.boolean().optional(),
  clientVersion: z.string().max(32).optional(),
});

export type AnalyticsEventPayload = z.infer<typeof analyticsEventSchema>;
export type IngestBatchPayload = z.infer<typeof ingestBatchSchema>;

export const ALLOWED_EVENT_TYPES = new Set(Object.values(AnalyticsEventType));

export interface SessionTimingState {
  sessionId: string;
  startedAt: number;
  lastActiveAt: number;
  activeMs: number;
  idleMs: number;
  aiInteractionMs: number;
  pageViewMs: number;
  workflowMs: number;
  websocketMs: number;
}

export interface ProductivityScores {
  focusTimeMs: number;
  creativeTimeMs: number;
  researchTimeMs: number;
  productivityScore: number;
  aiEfficiencyScore: number;
  workflowCompletionRate: number;
  automationSavingsHours: number;
  estimatedHoursSaved: number;
}

export interface DashboardMetrics {
  users: UserAnalytics;
  ai: AIAnalytics;
  media: MediaAnalytics;
  system: SystemAnalytics;
  productivity?: ProductivityScores;
  updatedAt: string;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  concurrentUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDurationMs: number;
  retentionRate: number;
  engagementScore: number;
}

export interface AIAnalytics {
  requestsPerMinute: number;
  totalTokens: number;
  providerUsage: Record<string, number>;
  avgLatencyMs: number;
  avgResponseSpeedMs: number;
  failedRequests: number;
  fallbackFrequency: number;
  orchestrationTimingMs: number;
}

export interface MediaAnalytics {
  videoRenders: number;
  imageGenerations: number;
  avgRenderDurationMs: number;
  gpuUsagePercent: number;
  queueWaitMs: number;
  storageUsageGb: number;
}

export interface SystemAnalytics {
  cpuUsagePercent: number;
  ramUsagePercent: number;
  redisUsageMb: number;
  postgresLatencyMs: number;
  websocketConnections: number;
  workerHealth: "healthy" | "degraded" | "offline";
  queueHealth: "healthy" | "degraded" | "offline";
}
