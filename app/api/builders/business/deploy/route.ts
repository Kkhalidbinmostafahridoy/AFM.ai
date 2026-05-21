import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deployWebsiteProject } from "@/lib/builders/deploy";
import {
  normalizeWebsiteProject,
  type WebsiteBuildResult,
} from "@/lib/builders/website-generator";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  businessName: z.string().trim().min(2).max(120),
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

  const body = await req.json();
  const normalized = {
    businessName:
      typeof body?.businessName === "string" ? body.businessName : "",
    project:
      body?.project && typeof body.project === "object"
        ? normalizeWebsiteProject(body.project)
        : body?.project,
  };
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!parsed.data.project.files.length) {
    return NextResponse.json(
      {
        error: "Nothing to deploy",
        message: "Build the website first — no project files were generated.",
      },
      { status: 400 }
    );
  }

  const deployment = deployWebsiteProject({
    userId,
    businessName: parsed.data.businessName,
    project: parsed.data.project as WebsiteBuildResult,
  });

  return NextResponse.json({ deployment });
}
