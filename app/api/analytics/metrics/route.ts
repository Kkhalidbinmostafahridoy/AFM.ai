import { auth } from "@clerk/nextjs/server";
import { getDashboardMetrics } from "@/lib/analytics/metrics";

export async function GET() {
  const { userId } = await auth();
  const metrics = await getDashboardMetrics(userId);
  return Response.json(metrics);
}
