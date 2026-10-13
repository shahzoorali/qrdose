import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { currentUserId } from "@/lib/session";
import { APP_BASE_URL, GOOGLE_CALENDAR_ENABLED } from "@/lib/env";
import { googleAuthUrl } from "@/lib/gcal";

export const runtime = "nodejs";

// Route modules may only export handlers; the callback repeats this name.
const STATE_COOKIE = "gcal_oauth_state";

/** Start the Google OAuth flow for calendar sync. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.redirect(`${APP_BASE_URL}/login`);
  if (!GOOGLE_CALENDAR_ENABLED) {
    return NextResponse.json({ error: "Google Calendar sync is not configured" }, { status: 404 });
  }

  // CSRF guard: the callback must echo back the nonce held in this cookie.
  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: APP_BASE_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });
  return res;
}
