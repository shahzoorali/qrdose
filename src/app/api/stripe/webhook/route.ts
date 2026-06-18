import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/env";
import { mapStripeStatus } from "@/lib/billing";
import { updateSubscription } from "@/lib/repositories/users";

export const runtime = "nodejs";

/**
 * Stripe webhook. Verifies the signature, then syncs subscription state onto
 * the user record. We resolve the user via metadata/client_reference_id set
 * when the checkout session was created (no extra lookup index needed).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid";
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : undefined;
      if (userId) {
        await updateSubscription(userId, {
          stripeCustomerId: customerId,
          subscriptionStatus: "active",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : undefined;
      if (userId) {
        await updateSubscription(userId, {
          stripeCustomerId: customerId,
          subscriptionStatus: mapStripeStatus(sub.status) ?? "none",
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
