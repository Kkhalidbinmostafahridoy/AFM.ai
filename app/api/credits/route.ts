import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCreditStatus } from "@/lib/credits";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getCreditStatus(userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Credits GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
