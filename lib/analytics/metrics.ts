import { buildDashboardMetrics, type ProductivityInput } from "@afm/analytics";
import { prisma, isDatabaseReady } from "@afm/db";
import { globalMetricsBuffer, activeWsConnections } from "./store";
import os from "os";

export async function getDashboardMetrics(userId?: string | null) {
  const counters = globalMetricsBuffer.snapshot();
  counters.wsConnections = activeWsConnections.size;

  const dbReady = await isDatabaseReady();
  if (dbReady) {
    try {
      const [totalUsers, activeSessions, aiCount, failures] = await Promise.all([
        prisma.afmUser.count(),
        prisma.analyticsSession.count({ where: { isActive: true } }),
        prisma.analyticsAiRequest.count({
          where: {
            requestAt: { gte: new Date(Date.now() - 86_400_000) },
          },
        }),
        prisma.analyticsAiRequest.count({
          where: {
            status: "failed",
            requestAt: { gte: new Date(Date.now() - 86_400_000) },
          },
        }),
      ]);
      counters.totalUsers = Math.max(totalUsers, counters.totalUsers);
      counters.activeSessions = Math.max(activeSessions, counters.activeSessions);
      counters.aiRequests24h = Math.max(aiCount, counters.aiRequests24h);
      counters.aiFailures24h = Math.max(failures, counters.aiFailures24h);
    } catch {
      /* use buffer */
    }
  }

  const productivity: ProductivityInput = {
    activeMs: 3_600_000,
    idleMs: 600_000,
    aiInteractionMs: 900_000,
    creativeMs: 1_200_000,
    researchMs: 400_000,
    workflowCompleted: 12,
    workflowStarted: 15,
    aiRequests: counters.aiRequests24h,
    aiFailures: counters.aiFailures24h,
    automationRuns: 8,
  };

  const metrics = buildDashboardMetrics(counters, productivity);
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  metrics.system.cpuUsagePercent = Math.round(os.loadavg()[0] * 10);
  metrics.system.ramUsagePercent = Math.round((mem.rss / totalMem) * 100);
  metrics.system.websocketConnections = activeWsConnections.size;

  if (userId) {
    metrics.productivity = buildDashboardMetrics(counters, {
      ...productivity,
      activeMs: 1_800_000,
    }).productivity;
  }

  return metrics;
}
