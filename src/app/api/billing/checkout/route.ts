import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { APP_BASE_URL, STRIPE_ENABLED, STRIPE_PRICE_ID } from "@/lib/env";

export const runtime = "nodejs";

/** Start a Stripe Checkout session for the logged-in user. */
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();
  if (!STRIPE_ENABLED || !stripe) {
    return NextResponse.json(
      { error: "Billing is not yet available." },
      { status: 503 }
    );
  }

  const base = APP_BASE_URL.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    // Reuse an existing customer if we have one; else let Stripe create one.
    ...(user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : { customer_email: user.email }),
    client_reference_id: user.userId,
    subscription_data: { metadata: { userId: user.userId } },
    success_url: `${base}/dashboard/billing?status=success`,
    cancel_url: `${base}/dashboard/billing?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
