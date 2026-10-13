import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { settingsSchema } from "@/lib/validation";
import {
  updateUserSettings,
  getUserByEmail,
  getUserById,
} from "@/lib/repositories/users";
import { syncGoogleCalendar } from "@/lib/gcal";
import { normalizeUsPhone } from "@/lib/phone";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, timezone, email, address, city, state, zip } = parsed.data;

  const phone = normalizeUsPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid US phone number" },
      { status: 400 }
    );
  }

  // If the email is changing, make sure it isn't already taken by another user.
  const existing = await getUserByEmail(email);
  if (existing && existing.userId !== userId) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const existingSelf = await getUserById(userId);
  await updateUserSettings(userId, { name, timezone, phone, email, address, city, state, zip });
  // Event times are pinned to the user's timezone; re-sync if it moved.
  if (existingSelf && existingSelf.timezone !== timezone) {
    await syncGoogleCalendar(userId);
  }
  return NextResponse.json({ ok: true });
}
