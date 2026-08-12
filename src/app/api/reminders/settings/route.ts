import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { reminderSettingsSchema } from "@/lib/validation";
import { getUserById, updateReminderSettings } from "@/lib/repositories/users";
import { DEFAULT_REMINDER_GRACE_MINUTES } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    remindersEnabled: user.remindersEnabled ?? false,
    reminderGraceMinutes:
      user.reminderGraceMinutes ?? DEFAULT_REMINDER_GRACE_MINUTES,
  });
}

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reminderSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Only re-stamp on an off -> on transition, so adjusting the grace window
  // while reminders are already running doesn't reset the floor.
  const user = await getUserById(userId);
  const turningOn = parsed.data.remindersEnabled && !user?.remindersEnabled;

  await updateReminderSettings(userId, {
    ...parsed.data,
    enabledAt: turningOn ? new Date().toISOString() : undefined,
  });
  return NextResponse.json({ ok: true });
}
