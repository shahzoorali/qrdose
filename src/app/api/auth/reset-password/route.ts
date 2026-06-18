import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail, updatePassword } from "@/lib/repositories/users";
import {
  getResetCode,
  incrementResetAttempts,
  deleteResetCode,
} from "@/lib/repositories/resets";
import { RESET_MAX_ATTEMPTS } from "@/lib/env";
import { rateLimit, clientIp, tooManyResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const INVALID = { error: "Invalid or expired code" };

export async function POST(req: Request) {
  const rl = await rateLimit(`reset:${clientIp(req)}`, 10, 900);
  if (!rl.allowed) return tooManyResponse(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, code, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json(INVALID, { status: 400 });

  const reset = await getResetCode(user.userId);
  if (!reset) return NextResponse.json(INVALID, { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  if (reset.expiresAt < now || reset.attempts >= RESET_MAX_ATTEMPTS) {
    await deleteResetCode(user.userId);
    return NextResponse.json(INVALID, { status: 400 });
  }

  const ok = await bcrypt.compare(code, reset.codeHash);
  if (!ok) {
    const attempts = await incrementResetAttempts(user.userId);
    if (attempts >= RESET_MAX_ATTEMPTS) await deleteResetCode(user.userId);
    return NextResponse.json(INVALID, { status: 400 });
  }

  await updatePassword(user.userId, await bcrypt.hash(password, 10));
  await deleteResetCode(user.userId);

  return NextResponse.json({ ok: true });
}
