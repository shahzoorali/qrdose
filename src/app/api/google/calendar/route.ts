import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { GOOGLE_CALENDAR_ENABLED } from "@/lib/env";
import { getGoogleCalendarConnection } from "@/lib/repositories/googleCalendar";
import { disconnectGoogleCalendar } from "@/lib/gcal";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!GOOGLE_CALENDAR_ENABLED) {
    return NextResponse.json({ available: false, connected: false });
  }
  const connection = await getGoogleCalendarConnection(userId);
  return NextResponse.json({
    available: true,
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt ?? null,
  });
}

export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await disconnectGoogleCalendar(userId);
  return NextResponse.json({ ok: true });
}
