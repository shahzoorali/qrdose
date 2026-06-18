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

export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "QRdose";
export const SNS_SENDER_ID = process.env.SNS_SENDER_ID || "";
export const APP_BASE_URL =
  process.env.APP_BASE_URL || "http://localhost:3000";
export const TRIGGER_COOLDOWN_SECONDS = Number(
  process.env.TRIGGER_COOLDOWN_SECONDS || "60"
);

/** Max contacts a user may configure (per product spec). */
export const MAX_CONTACTS = 10;
