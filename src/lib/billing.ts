import { STRIPE_ENABLED } from "./env";
import type { User } from "./types";

/**
 * Whether a user may use paid features.
 *
 * When Stripe is NOT configured (no keys yet), billing is disabled and every
 * account is treated as active — the app runs unrestricted during the pre-
 * launch period. Once Stripe is live, only active/trialing subscriptions pass.
 */
export function hasActiveSubscription(user: Pick<User, "subscriptionStatus">) {
  if (!STRIPE_ENABLED) return true;
  return (
    user.subscriptionStatus === "active" ||
    user.subscriptionStatus === "trialing"
  );
}

/** Map a Stripe subscription.status to our stored enum. */
export function mapStripeStatus(status: string): User["subscriptionStatus"] {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}
