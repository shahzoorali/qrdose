/**
 * Centralized access to runtime configuration. Throws clear errors when a
 * required value is missing so failures surface at the call site rather than
 * as opaque AWS SDK errors deeper in the stack.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`
    );
  }
  return value;
}

export const AWS_REGION = process.env.APP_AWS_REGION || process.env.AWS_REGION || "us-east-1";
export const AWS_ACCESS_KEY_ID = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "QRdose";
export const SNS_SENDER_ID = process.env.SNS_SENDER_ID || "";
export const APP_BASE_URL =
  process.env.APP_BASE_URL || "http://localhost:3000";
export const TRIGGER_COOLDOWN_SECONDS = Number(
  process.env.TRIGGER_COOLDOWN_SECONDS || "60"
);

/** Max contacts a user may configure (per product spec). */
export const MAX_CONTACTS = 10;

// ── Medication reminders ────────────────────────────────────────────
/** Max medications a user may configure (per product spec). */
export const MAX_MEDICATIONS = 10;

/** Minutes after a scheduled dose before the user is reminded. Users can
 *  override this per account; this is the fallback for accounts that haven't. */
export const DEFAULT_REMINDER_GRACE_MINUTES = Number(
  process.env.DEFAULT_REMINDER_GRACE_MINUTES || "30"
);

/** Contacts are escalated to at (dose time + grace * this multiplier). */
export const REMINDER_ESCALATION_MULTIPLIER = 2;

/** A scan counts as confirming any scheduled dose within this many minutes. */
export const DOSE_MATCH_WINDOW_MINUTES = Number(
  process.env.DOSE_MATCH_WINDOW_MINUTES || "180"
);

/** Verified SES sender, e.g. "QRdose <alerts@qrdose.com>". Empty disables email. */
export const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "";

/**
 * Region holding the verified SES identity. Separate from AWS_REGION because
 * SES identities are per-region: qrdose.com is verified in ap-south-1 while
 * DynamoDB and SNS run in us-east-1.
 */
export const SES_REGION =
  process.env.SES_REGION || process.env.APP_SES_REGION || "ap-south-1";

/** Shared secret the reminder cron endpoint requires. Empty disables the cron. */
export const CRON_SECRET = process.env.CRON_SECRET || "";

/** Default timezone for new accounts (US central). */
export const DEFAULT_TIMEZONE = "America/Chicago";

// ── Stripe (billing) ────────────────────────────────────────────────
// Billing is pre-wired but stays fully disabled until these are set.
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

/** True only when Stripe is fully configured. When false, billing is a
 *  no-op and subscription gating is disabled so the app runs unrestricted. */
export const STRIPE_ENABLED = Boolean(
  STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && STRIPE_PRICE_ID
);

// ── Password reset (SMS OTP) ────────────────────────────────────────
export const RESET_CODE_TTL_SECONDS = Number(
  process.env.RESET_CODE_TTL_SECONDS || "900" // 15 minutes
);
export const RESET_MAX_ATTEMPTS = 5;
