/**
 * AFM background workers
 * Video render, batch images, scheduled workflows, analytics aggregation
 */
import { startAnalyticsWorker } from "./analytics-worker.js";

console.log("[afm-workers] Starting analytics aggregation worker…");
startAnalyticsWorker().catch((err) => {
  console.error("[afm-workers] Analytics worker failed", err);
});

console.log("[afm-workers] Connect REDIS_URL for distributed queues (BullMQ Phase 2)");
