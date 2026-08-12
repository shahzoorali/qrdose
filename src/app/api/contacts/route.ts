import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/session";
import { contactSchema } from "@/lib/validation";
import { normalizeUsPhone } from "@/lib/phone";
import { newContactId } from "@/lib/ids";
import {
  countContacts,
  listContacts,
  putContact,
} from "@/lib/repositories/contacts";
import { MAX_CONTACTS } from "@/lib/env";
import type { Contact } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await listContacts(userId);
  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const count = await countContacts(userId);
  if (count >= MAX_CONTACTS) {
    return NextResponse.json(
      { error: `You can add up to ${MAX_CONTACTS} contacts` },
      { status: 422 }
    );
  }

  const contact: Contact = {
    contactId: newContactId(),
    name: parsed.data.name,
    phone: phoneE164,
    createdAt: new Date().toISOString(),
    email: parsed.data.email || undefined,
  };
  await putContact(userId, contact);

  return NextResponse.json({ contact }, { status: 201 });
}
