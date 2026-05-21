import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { z } from "zod";
import {
  orchestrateChat,
  streamChat,
  getProvidersHealth,
  getConfiguredProviders,
  type AIProviderAdapter,
} from "@afm/ai-core";
import { prisma, isDatabaseReady } from "@afm/db";

const PORT = Number(process.env.AFM_SERVER_PORT || 4000);

const app = express();
app.use(cors({ origin: process.env.AFM_CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {
  const db = await isDatabaseReady();
  res.json({
    ok: true,
    service: "afm-server",
    database: db ? "connected" : "unavailable",
    providers: getProvidersHealth(),
  });
});

app.get("/v1/providers", (_req, res) => {
  res.json({
    configured: getConfiguredProviders().map((p: AIProviderAdapter) => ({
      id: p.id,
      label: p.label,
      models: p.listModels(),
    })),
    health: getProvidersHealth(),
  });
});

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(12000),
    })
  ),
  fusion: z.boolean().optional(),
  userId: z.string().optional(),
  memoryContext: z.string().max(8000).optional(),
});

app.post("/v1/chat", async (req, res) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const result = await orchestrateChat({
      messages: parsed.data.messages,
      fusion: parsed.data.fusion,
      memoryContext: parsed.data.memoryContext,
    });

    if (parsed.data.userId && (await isDatabaseReady())) {
      const conv = await prisma.afmConversation.create({
        data: {
          userId: parsed.data.userId,
          title: parsed.data.messages.at(-1)?.content.slice(0, 80),
        },
      });
      const lastUser = parsed.data.messages.filter((m) => m.role === "user").at(-1);
      if (lastUser) {
        await prisma.afmMessage.create({
          data: {
            conversationId: conv.id,
            role: "user",
            content: lastUser.content,
          },
        });
      }
      await prisma.afmMessage.create({
        data: {
          conversationId: conv.id,
          role: "assistant",
          content: result.reply,
          provider: result.providersUsed[0]?.split("/")[0],
          model: result.providersUsed[0]?.split("/")[1],
        },
      });
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    res.status(502).json({ error: message });
  }
});

app.post("/v1/chat/stream", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let full = "";
    for await (const event of streamChat({
      messages: parsed.data.messages,
      memoryContext: parsed.data.memoryContext,
    })) {
      if (event.type === "token") {
        full += event.data;
        res.write(`data: ${JSON.stringify({ type: "token", data: event.data })}\n\n`);
      } else if (event.type === "done") {
        const reply = event.data || full;
        res.write(
          `data: ${JSON.stringify({ type: "done", reply, meta: event.meta })}\n\n`
        );
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stream failed";
    res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    res.end();
  }
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/v1/ws/monitor" });

wss.on("connection", (ws) => {
  const interval = setInterval(() => {
    ws.send(
      JSON.stringify({
        type: "health",
        providers: getProvidersHealth(),
        ts: Date.now(),
      })
    );
  }, 5000);

  ws.on("close", () => clearInterval(interval));
});

httpServer.listen(PORT, () => {
  console.log(`[afm-server] http://127.0.0.1:${PORT}`);
  console.log(`[afm-server] ws monitor ws://127.0.0.1:${PORT}/v1/ws/monitor`);
});
