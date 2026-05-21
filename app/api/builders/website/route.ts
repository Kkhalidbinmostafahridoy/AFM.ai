import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWebsiteProject } from "@/lib/builders/website-generator";
import { isAnyProviderConfigured } from "@/lib/ai/registry";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  prompt: z.string().min(10).max(4000),
  frontend: z.string().max(80).optional(),
  backend: z.string().max(80).optional(),
  database: z.string().max(80).optional(),
});

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`website:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests", message: `Wait ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  if (!isAnyProviderConfigured()) {
    return NextResponse.json(
      {
        error: "No AI providers configured",
        message: "Add at least GEMINI_API_KEY or OPENAI_API_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const project = await generateWebsiteProject({
    prompt: parsed.data.prompt,
    stack: {
      frontend: parsed.data.frontend,
      backend: parsed.data.backend,
      database: parsed.data.database,
    },
  });

  return NextResponse.json(project);
}
