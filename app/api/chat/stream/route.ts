import { auth } from "@clerk/nextjs/server";
import { chatMessageSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAfmServerUrl } from "@/lib/gateway/afm-server";
import { streamChat } from "@afm/ai-core";
import { isAnyProviderConfigured } from "@/lib/ai/registry";

export const maxDuration = 120;

function sseLine(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rate = checkRateLimit(`chat-stream:${userId}`);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = await fetch(`${getAfmServerUrl()}/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: parsed.data.messages,
      userId,
      fusion: parsed.data.fusion,
    }),
  }).catch(() => null);

  if (upstream?.ok && upstream.body) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  if (!isAnyProviderConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Stream unavailable",
        message: "Add API keys in .env.local or start: npm run dev:server",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const event of streamChat({
          messages: parsed.data.messages,
        })) {
          if (event.type === "token") {
            controller.enqueue(enc.encode(sseLine({ type: "token", data: event.data })));
          } else if (event.type === "done") {
            controller.enqueue(
              enc.encode(
                sseLine({
                  type: "done",
                  reply: event.data,
                  meta: event.meta,
                })
              )
            );
          }
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(enc.encode(sseLine({ type: "error", message })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
