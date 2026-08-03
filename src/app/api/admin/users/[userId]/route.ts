import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { settingsSchema } from "@/lib/validation";
import {
  getUserById,
  getUserByEmail,
  updateUserSettings,
  deleteUserCompletely,
} from "@/lib/repositories/users";
import { listContacts } from "@/lib/repositories/contacts";
import { listTriggers } from "@/lib/repositories/history";
import { normalizeUsPhone } from "@/lib/phone";
import { toPublicUser } from "@/lib/types";

export const runtime = "nodejs";

/** Full detail: the user plus their contacts and notification history. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [contacts, history] = await Promise.all([
    listContacts(userId),
    listTriggers(userId),
  ]);

  return NextResponse.json({ user: toPublicUser(user), contacts, history });
}

/** Edit a user's details (name, email, phone, timezone). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const existing = await getUserByEmail(email);
  if (existing && existing.userId !== userId) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  await updateUserSettings(userId, {
    name,
    timezone,
    phone,
    email,
    address,
    city,
    state,
    zip,
  });
  return NextResponse.json({ ok: true });
}

/** Hard-delete a user and all their data. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  if (userId === admin.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteUserCompletely(userId);
  return NextResponse.json({ ok: true });
}
