import { NextResponse } from "next/server";
import { afmHealth, getAfmServerUrl } from "@/lib/gateway/afm-server";
import { getProvidersHealth, getConfiguredProviders } from "@afm/ai-core";

export async function GET() {
  try {
    const remote = await afmHealth();
    if (remote.ok) {
      return NextResponse.json({
        source: "afm-server",
        server: getAfmServerUrl(),
        ...remote.data,
      });
    }
  } catch {
    /* server offline — local fallback */
  }

  return NextResponse.json({
    source: "local",
    ok: true,
    database: "use AFM server + DATABASE_URL",
    providers: getProvidersHealth(),
    configured: getConfiguredProviders().map((p) => p.id),
  });
}
