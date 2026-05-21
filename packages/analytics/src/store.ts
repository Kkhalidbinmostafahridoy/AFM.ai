import { MetricsBuffer } from "./aggregation";

export const globalMetricsBuffer = new MetricsBuffer();
export const activeWsConnections = new Set<string>();
