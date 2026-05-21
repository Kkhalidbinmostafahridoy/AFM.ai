import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { intentSchema } from "@/lib/validations";
import { analyzeIntent } from "@/lib/afm/intent-analyzer";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = intentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json(analyzeIntent(parsed.data.message));
}
