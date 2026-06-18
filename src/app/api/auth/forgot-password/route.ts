import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "@/lib/repositories/users";
import { putResetCode } from "@/lib/repositories/resets";
import { sixDigitCode } from "@/lib/ids";
import { sendSms } from "@/lib/sns";
import { formatUsPhone } from "@/lib/phone";
import { RESET_CODE_TTL_SECONDS } from "@/lib/env";
import { rateLimit, clientIp, tooManyResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// Generic response — never reveals whether an account exists.
const GENERIC = {
  ok: true,
  message:
    "If an account exists for that email, we've texted a reset code to the phone on file.",
};

export async function POST(req: Request) {
  const rl = await rateLimit(`forgot:${clientIp(req)}`, 5, 900);
  if (!rl.allowed) return tooManyResponse(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (user && user.phone) {
    const code = sixDigitCode();
    const codeHash = await bcrypt.hash(code, 10);
    await putResetCode(user.userId, codeHash, RESET_CODE_TTL_SECONDS);
    await sendSms(
      user.phone,
      `Your QRdose password reset code is ${code}. It expires in ${Math.round(
        RESET_CODE_TTL_SECONDS / 60
      )} minutes.`
    ).catch(() => {
      /* delivery failures are not surfaced to avoid account enumeration */
    });
  }

  // Hint which phone the code went to, without exposing the full number.
  const hint = user?.phone ? maskPhone(user.phone) : undefined;
  return NextResponse.json({ ...GENERIC, phoneHint: hint });
}

function maskPhone(e164: string): string {
  const national = formatUsPhone(e164); // e.g. (415) 555-2671
  const digits = national.replace(/\D/g, "");
  const last2 = digits.slice(-2);
  return `•••‑••${last2}`;
}
