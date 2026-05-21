import Link from "next/link";

export default async function DeployPreviewPage({
  params,
}: {
  params: Promise<{ userId: string; slug: string }>;
}) {
  const { userId, slug } = await params;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-violet-950/20 to-background">
      <div className="max-w-lg text-center space-y-4">
        <p className="text-sm text-violet-500 font-medium uppercase tracking-wide">
          AFM.ai — Live preview
        </p>
        <h1 className="text-3xl font-bold">{slug.replace(/-/g, " ")}</h1>
        <p className="text-muted-foreground">
          Your AI-generated site is deployed. Connect a custom domain in Business
          Builder settings or push to Vercel with{" "}
          <code className="text-xs">VERCEL_TOKEN</code>.
        </p>
        <p className="text-xs text-muted-foreground">
          Deployment ref: {userId.slice(0, 8)}…
        </p>
        <Link
          href="/dashboard/builders/business"
          className="inline-flex text-sm text-violet-600 hover:underline"
        >
          ← Back to Business Builder
        </Link>
      </div>
    </main>
  );
}
