import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./env";

const globalForStripe = globalThis as unknown as { __qrdoseStripe?: Stripe };

/**
 * Returns a Stripe client, or null when no secret key is configured. Callers
 * must handle null so the app stays fully functional before billing goes live.
 */
export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  if (!globalForStripe.__qrdoseStripe) {
    // Use the account's default API version (avoids pinning to a literal that
    // must track the installed SDK types).
    globalForStripe.__qrdoseStripe = new Stripe(STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return globalForStripe.__qrdoseStripe;
}
