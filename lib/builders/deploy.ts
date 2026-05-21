import type { WebsiteBuildResult } from "./website-generator";

export interface DeployResult {
  id: string;
  status: "live" | "building" | "failed";
  url: string;
  provider: "vercel-sim" | "vercel";
  logs: string[];
  createdAt: string;
}

const deployments = new Map<string, DeployResult>();

export function deployWebsiteProject(params: {
  userId: string;
  project: WebsiteBuildResult;
  businessName?: string;
}): DeployResult {
  const slug = (params.businessName ?? "afm-site")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const id = `dep-${Date.now()}`;
  const host = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const url = `${host}/preview/${params.userId}/${slug}-${id.slice(-6)}`;

  const result: DeployResult = {
    id,
    status: "live",
    url,
    provider: process.env.VERCEL_TOKEN ? "vercel" : "vercel-sim",
    logs: [
      `[build] ${params.project.files.length} files packaged`,
      "[build] Next.js production compile simulated",
      process.env.VERCEL_TOKEN
        ? "[deploy] Vercel token detected — wire VERCEL_PROJECT_ID for real deploy"
        : "[deploy] Demo live URL generated (add VERCEL_TOKEN for production deploy)",
      `[live] ${url}`,
    ],
    createdAt: new Date().toISOString(),
  };

  deployments.set(`${params.userId}:${id}`, result);
  return result;
}

export function getDeployment(userId: string, deployId: string) {
  return deployments.get(`${userId}:${deployId}`);
}
