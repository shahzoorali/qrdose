import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { CRON_SECRET } from "@/lib/env";
import { listAllUsers } from "@/lib/repositories/users";
import { processUserReminders, remindersActive } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  if (!CRON_SECRET) return false; // cron stays disabled until a secret is set
  const header = req.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(header);
  const b = Buffer.from(CRON_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Missed-dose sweep. Intended to run every ~5 minutes from EventBridge.
 *
 * Walks every account with reminders on and sends whatever each is due for.
 * All state lives in per-dose records, so running more often (or twice at
 * once) sends no duplicates — it just finds nothing left to do.
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let scanned = 0;
  let reminded = 0;
  let escalated = 0;
  let failed = 0;

  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await listAllUsers(100, startKey);
    for (const user of page.users) {
      if (!remindersActive(user)) continue;
      scanned++;
      try {
        const result = await processUserReminders(user, now);
        reminded += result.reminded;
        escalated += result.escalated;
      } catch (err) {
        // One bad account must not stop the sweep for everyone else.
        failed++;
        console.error(`Reminder sweep failed for ${user.userId}:`, err);
      }
    }
    startKey = page.lastKey;
  } while (startKey);

  return NextResponse.json({ ok: true, scanned, reminded, escalated, failed });
}
