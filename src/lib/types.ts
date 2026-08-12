export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string; // E.164
  notificationMessage: string;
  cardId: string;
  timezone: string; // IANA, e.g. America/Chicago
  createdAt: string; // ISO
  // Billing (Stripe). Optional so existing records remain valid.
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatus;
  // Mailing address (US). Optional so existing records remain valid.
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  // Admin & account control. Optional so existing records remain valid.
  isAdmin?: boolean;
  accountStatus?: AccountStatus; // undefined treated as "active"
  // Medication reminders. Optional so existing records remain valid.
  remindersEnabled?: boolean; // master switch; undefined treated as off
  reminderGraceMinutes?: number; // undefined falls back to DEFAULT_REMINDER_GRACE_MINUTES
  /** ISO instant reminders were last switched on. Doses due before it are
   *  ignored, so enabling the feature never back-fires on earlier doses. */
  remindersEnabledAt?: string;
}

export type AccountStatus = "active" | "disabled";

/** A disabled account cannot log in or send notifications. */
export function isAccountDisabled(
  user: Pick<User, "accountStatus">
): boolean {
  return user.accountStatus === "disabled";
}

export interface Contact {
  contactId: string;
  name: string;
  phone: string; // E.164
  createdAt: string;
  /** Optional. Only used to email missed-dose escalations. */
  email?: string;
}

export interface Medication {
  medId: string;
  name: string;
  /** Local wall-clock time of day, "HH:mm" in the user's timezone. */
  time: string;
  /** Per-medication switch, on top of the account-wide `remindersEnabled`. */
  enabled: boolean;
  createdAt: string;
}

/**
 * One record per medication per local date, tracking whether that day's dose
 * was confirmed and how far reminders have escalated. Makes the reminder cron
 * idempotent — it can run every few minutes without re-sending.
 */
export interface DoseRecord {
  medId: string;
  date: string; // local YYYY-MM-DD
  takenAt?: string; // ISO
  remindedAt?: string; // ISO — user was reminded
  escalatedAt?: string; // ISO — contacts were notified
}

export interface TriggerLog {
  timestamp: string; // ISO
  recipientCount: number;
  successCount: number;
  status: "sent" | "partial" | "failed";
}

/** Safe user shape for sending to the client (no passwordHash). */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _omit, ...rest } = user;
  void _omit;
  return rest;
}
