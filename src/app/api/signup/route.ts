import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation";
import { normalizeUsPhone } from "@/lib/phone";
import { newUserId, newCardId } from "@/lib/ids";
import { createUser, getUserByEmail } from "@/lib/repositories/users";
import { putCardMapping } from "@/lib/repositories/cards";
import { DEFAULT_TIMEZONE } from "@/lib/env";
import { rateLimit, clientIp, tooManyResponse } from "@/lib/rate-limit";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Limit signups per IP to curb automated abuse.
  const rl = await rateLimit(`signup:${clientIp(req)}`, 5, 3600);
  if (!rl.allowed) return tooManyResponse(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, phone } = parsed.data;

  const phoneE164 = normalizeUsPhone(phone);
  if (!phoneE164) {
    return NextResponse.json(
      { error: "Enter a valid US phone number" },
      { status: 400 }
    );
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const userId = newUserId();
  const cardId = newCardId();
  const user: User = {
    userId,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name,
    phone: phoneE164,
    notificationMessage: `${name} has taken their medication`,
    cardId,
    timezone: DEFAULT_TIMEZONE,
    createdAt: new Date().toISOString(),
    subscriptionStatus: "none",
  };

  await createUser(user);
  await putCardMapping(cardId, userId);

  return NextResponse.json({ ok: true }, { status: 201 });
}
