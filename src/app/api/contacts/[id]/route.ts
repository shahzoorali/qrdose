import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { contactSchema } from "@/lib/validation";
import { normalizeUsPhone } from "@/lib/phone";
import { deleteContact, putContact } from "@/lib/repositories/contacts";
import type { Contact } from "@/lib/types";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const phoneE164 = normalizeUsPhone(parsed.data.phone);
  if (!phoneE164) {
    return NextResponse.json(
      { error: "Enter a valid US phone number" },
      { status: 400 }
    );
  }

  // Upsert preserving the id; createdAt is reset to now for simplicity.
  const contact: Contact = {
    contactId: id,
    name: parsed.data.name,
    phone: phoneE164,
    createdAt: new Date().toISOString(),
  };
  await putContact(userId, contact);

  return NextResponse.json({ contact });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteContact(userId, id);
  return NextResponse.json({ ok: true });
}
