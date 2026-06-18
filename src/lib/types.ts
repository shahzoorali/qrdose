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
}

export interface Contact {
  contactId: string;
  name: string;
  phone: string; // E.164
  createdAt: string;
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
