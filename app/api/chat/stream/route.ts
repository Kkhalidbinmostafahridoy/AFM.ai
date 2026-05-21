import { auth } from "@clerk/nextjs/server";
import { chatMessageSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAfmServerUrl } from "@/lib/gateway/afm-server";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const rate = checkRateLimit(`chat-stream:${userId}`);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
    });
  }

  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const upstream = await fetch(`${getAfmServerUrl()}/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: parsed.data.messages,
      userId,
    }),
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return new Response(
      JSON.stringify({
        error: "Stream unavailable",
        message: "Start AFM server: npm run dev:server",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
