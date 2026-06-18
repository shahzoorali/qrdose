import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { listTriggers } from "@/lib/repositories/history";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const triggers = await listTriggers(userId);
  return NextResponse.json({ triggers });
}
