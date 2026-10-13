import { createHash } from "crypto";
import {
  APP_BASE_URL,
  GOOGLE_CALENDAR_ENABLED,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
} from "./env";
import { localDateString } from "./time";
import { getUserById } from "./repositories/users";
import { listMedications } from "./repositories/medications";
import {
  deleteGoogleCalendarConnection,
  getGoogleCalendarConnection,
  putGoogleCalendarConnection,
} from "./repositories/googleCalendar";
import type { Medication } from "./types";

/**
 * One-way sync of medication times into a dedicated "QRdose Reminders"
 * calendar in the user's Google account.
 *
 * Uses only `calendar.app.created`, a non-sensitive scope: the app can manage
 * calendars it created and nothing else in the user's account. Events are
 * deliberately generic ("Take your medication") so drug names never leave
 * QRdose. The SMS/email reminder cron is unaffected — this is an extra nudge.
 */

export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
const API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_NAME = "QRdose Reminders";
const EVENT_MINUTES = 15;

export const GOOGLE_REDIRECT_URI = `${APP_BASE_URL}/api/google/callback`;

export class GoogleAuthRevokedError extends Error {}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    // Always re-prompt so Google issues a refresh token on every connect.
    prompt: "consent",
    include_granted_scopes: "false",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      ...body,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    error?: string;
  };
  if (data.error === "invalid_grant") throw new GoogleAuthRevokedError();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token request failed: ${data.error ?? res.status}`);
  }
  return data;
}

async function accessTokenFor(refreshToken: string): Promise<string> {
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return data.access_token!;
}

/** Thin Calendar API client. Returns null on 404/410 so deletes are idempotent. */
async function gapi<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404 || res.status === 410) return null;
  if (res.status === 401) throw new GoogleAuthRevokedError();
  if (!res.ok) {
    const err = new Error(
      `Google Calendar ${method} ${path} failed: ${res.status} ${await res.text()}`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

/** Finish the OAuth dance: store the token and create the reminders calendar. */
export async function connectGoogleCalendar(
  userId: string,
  code: string
): Promise<void> {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token");
  }

  const user = await getUserById(userId);
  const calendar = await gapi<{ id: string }>(
    tokens.access_token!,
    "POST",
    "/calendars",
    {
      summary: CALENDAR_NAME,
      description: "Medication reminders from QRdose.",
      timeZone: user?.timezone,
    }
  );
  if (!calendar) throw new Error("Could not create the reminders calendar");

  // Reconnecting replaces the previous link; drop its now-orphaned calendar.
  const previous = await getGoogleCalendarConnection(userId);
  if (previous) await removeCalendarQuietly(previous.refreshToken, previous.calendarId);

  await putGoogleCalendarConnection(userId, {
    refreshToken: tokens.refresh_token,
    calendarId: calendar.id,
    connectedAt: new Date().toISOString(),
  });

  await syncGoogleCalendar(userId);
}

/** Delete the calendar, revoke access and forget the link. */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  const connection = await getGoogleCalendarConnection(userId);
  await deleteGoogleCalendarConnection(userId);
  if (!connection) return;

  await removeCalendarQuietly(connection.refreshToken, connection.calendarId);
  await fetch(
    `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(connection.refreshToken)}`,
    { method: "POST" }
  ).catch(() => undefined);
}

async function removeCalendarQuietly(refreshToken: string, calendarId: string) {
  try {
    const token = await accessTokenFor(refreshToken);
    await gapi(token, "DELETE", `/calendars/${encodeURIComponent(calendarId)}`);
  } catch (err) {
    console.error("Could not delete Google reminders calendar:", err);
  }
}

/**
 * Event id derived from what the event depends on, so an unchanged medication
 * maps to the same event and a changed one gets a fresh event. Google ids use
 * base32hex ([a-v0-9]), which hex digests satisfy.
 */
function eventIdFor(med: Medication, timezone: string): string {
  return createHash("sha256")
    .update(`${med.medId}|${med.time}|${timezone}`)
    .digest("hex")
    .slice(0, 40);
}

function eventBody(med: Medication, timezone: string, startDate: string) {
  const [h, m] = med.time.split(":").map(Number);
  const endTotal = h * 60 + m + EVENT_MINUTES;
  // Clamp so a 23:50 dose doesn't spill into the next day.
  const end =
    endTotal >= 24 * 60
      ? "23:59"
      : `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;

  return {
    summary: "Take your medication",
    description: `Tap or scan your QRdose card once you've taken it.\n${APP_BASE_URL}/dashboard`,
    start: { dateTime: `${startDate}T${med.time}:00`, timeZone: timezone },
    end: { dateTime: `${startDate}T${end}:00`, timeZone: timezone },
    recurrence: ["RRULE:FREQ=DAILY"],
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 0 }] },
    transparency: "transparent", // don't mark the user as busy
    status: "confirmed",
  };
}

/**
 * Make the reminders calendar match the user's current medications.
 *
 * Reconciles rather than mirrors individual edits: compute the events that
 * should exist, delete the rest, create what's missing. That covers adds,
 * edits, deletes, toggles and timezone changes with one code path, and heals
 * any drift. Best-effort — a Google failure never fails the caller's request.
 */
export async function syncGoogleCalendar(userId: string): Promise<void> {
  if (!GOOGLE_CALENDAR_ENABLED) return;
  try {
    const connection = await getGoogleCalendarConnection(userId);
    if (!connection) return;

    const user = await getUserById(userId);
    if (!user) return;

    const token = await accessTokenFor(connection.refreshToken);
    const cal = `/calendars/${encodeURIComponent(connection.calendarId)}`;

    const medications = user.remindersEnabled
      ? (await listMedications(userId)).filter((m) => m.enabled)
      : [];
    const startDate = localDateString(new Date(), user.timezone);
    const wanted = new Map(
      medications.map((med) => [eventIdFor(med, user.timezone), med])
    );

    const existing = await gapi<{ items?: { id: string }[] }>(
      token,
      "GET",
      `${cal}/events?maxResults=250`
    );
    if (!existing) {
      // The user deleted the calendar themselves; treat that as disconnecting.
      await deleteGoogleCalendarConnection(userId);
      return;
    }
    const present = new Set((existing.items ?? []).map((e) => e.id));

    await Promise.all([
      ...[...present]
        .filter((id) => !wanted.has(id))
        .map((id) => gapi(token, "DELETE", `${cal}/events/${id}`)),
      ...[...wanted]
        .filter(([id]) => !present.has(id))
        .map(async ([id, med]) => {
          const body = { id, ...eventBody(med, user.timezone, startDate) };
          try {
            await gapi(token, "POST", `${cal}/events`, body);
          } catch (err) {
            // Ids of deleted events stay reserved; updating revives them.
            if ((err as { status?: number }).status !== 409) throw err;
            await gapi(token, "PUT", `${cal}/events/${id}`, body);
          }
        }),
    ]);
  } catch (err) {
    if (err instanceof GoogleAuthRevokedError) {
      // Access was revoked from the Google side; forget the dead link.
      await deleteGoogleCalendarConnection(userId).catch(() => undefined);
      return;
    }
    console.error(`Google Calendar sync failed for ${userId}:`, err);
  }
}
