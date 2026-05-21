import { globalMetricsBuffer } from "./store";

const orchestrationSpans = new Map<string, number>();

export function startOrchestrationSpan(runId: string) {
  orchestrationSpans.set(runId, Date.now());
}

export function endOrchestrationSpan(
  runId: string,
  meta: { providers?: string[]; fusion?: boolean; userId?: string }
) {
  const t0 = orchestrationSpans.get(runId);
  const ms = t0 ? Date.now() - t0 : 0;
  orchestrationSpans.delete(runId);
  globalMetricsBuffer.push("ORCHESTRATION_COMPLETE", {
    orchestrationMs: ms,
    providers: meta.providers,
    fusion: meta.fusion,
    userId: meta.userId,
    latencyMs: ms,
  });
  return ms;
}
