import type { Server } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  buildDashboardMetrics,
  globalMetricsBuffer,
  activeWsConnections,
  type DashboardMetrics,
} from "@afm/analytics";

export function mountAnalyticsWs(server: Server, path = "/v1/ws/analytics") {
  const wss = new WebSocketServer({ server, path });

  wss.on("connection", (ws: WebSocket, req) => {
    const id = req.headers["sec-websocket-key"] ?? String(Date.now());
    activeWsConnections.add(String(id));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as {
          type?: string;
          sessionId?: string;
        };
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        }
        if (msg.sessionId) {
          globalMetricsBuffer.push("WEBSOCKET_HEARTBEAT", {
            sessionId: msg.sessionId,
          });
        }
      } catch {
        /* ignore */
      }
    });

    const pushMetrics = () => {
      const counters = globalMetricsBuffer.snapshot();
      counters.wsConnections = activeWsConnections.size;
      const metrics: DashboardMetrics = buildDashboardMetrics(counters);
      ws.send(JSON.stringify({ type: "metrics", metrics }));
    };

    pushMetrics();
    const interval = setInterval(pushMetrics, 10_000);

    ws.on("close", () => {
      clearInterval(interval);
      activeWsConnections.delete(String(id));
    });
  });

  return wss;
}

export function recordServerEvent(
  type: string,
  props?: Record<string, unknown>
) {
  globalMetricsBuffer.push(type, props);
}
