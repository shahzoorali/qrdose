import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { currentUserId } from "@/lib/session";
import { APP_BASE_URL } from "@/lib/env";
import { connectGoogleCalendar, GOOGLE_SCOPE } from "@/lib/gcal";

export const runtime = "nodejs";

const STATE_COOKIE = "gcal_oauth_state";

function back(result: "connected" | "denied" | "error") {
  const res = NextResponse.redirect(
    `${APP_BASE_URL}/dashboard/reminders?gcal=${result}`
  );
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/google" });
  return res;
}

function sameState(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.redirect(`${APP_BASE_URL}/login`);

  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";
  const expected = (await cookies()).get(STATE_COOKIE)?.value ?? "";
  if (!state || !expected || !sameState(state, expected)) return back("error");

  if (url.searchParams.get("error")) return back("denied");

  // The user can untick the scope on Google's consent screen.
  const granted = (url.searchParams.get("scope") ?? "").split(" ");
  if (!granted.includes(GOOGLE_SCOPE)) return back("denied");

  const code = url.searchParams.get("code");
  if (!code) return back("error");

  try {
    await connectGoogleCalendar(userId, code);
    return back("connected");
  } catch (err) {
    console.error(`Google Calendar connect failed for ${userId}:`, err);
    return back("error");
  }
}
