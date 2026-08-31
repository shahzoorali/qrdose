import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { adminBillingSchema } from "@/lib/validation";
import { getUserById, setGrandfathered } from "@/lib/repositories/users";

export const runtime = "nodejs";

/**
 * Grant or revoke comped (Stripe-free) access. Refuses to touch an account
 * that has a real `stripeCustomerId` — that one's status belongs to the
 * Stripe webhook, not this button.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = adminBillingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const target = await getUserById(userId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.stripeCustomerId) {
    return NextResponse.json(
      { error: "This account has a real Stripe subscription — manage it in Stripe, not here." },
      { status: 400 }
    );
  }

  try {
    await setGrandfathered(userId, parsed.data.grandfathered);
  } catch {
    // ConditionExpression failure: a stripeCustomerId appeared between the
    // read above and the write (race with a checkout completing).
    return NextResponse.json(
      { error: "This account just became a real Stripe subscriber — refresh and check Stripe." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
