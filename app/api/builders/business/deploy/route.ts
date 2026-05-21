import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deployWebsiteProject } from "@/lib/builders/deploy";
import type { WebsiteBuildResult } from "@/lib/builders/website-generator";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  businessName: z.string().min(2).max(120),
  project: z.object({
    prompt: z.string(),
    stack: z.object({
      frontend: z.string(),
      backend: z.string(),
      database: z.string(),
      css: z.string(),
    }),
    files: z.array(z.object({ path: z.string(), content: z.string() })),
    readme: z.string(),
    deployNotes: z.string(),
  }),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`business-deploy:${userId}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const deployment = deployWebsiteProject({
    userId,
    businessName: parsed.data.businessName,
    project: parsed.data.project as WebsiteBuildResult,
  });

  return NextResponse.json({ deployment });
}
