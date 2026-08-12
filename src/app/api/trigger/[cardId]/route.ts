import { NextResponse } from "next/server";
import { resolveCard } from "@/lib/repositories/cards";
import { getUserById } from "@/lib/repositories/users";
import { listContacts } from "@/lib/repositories/contacts";
import { lastTriggerAt, recordTrigger } from "@/lib/repositories/history";
import { sendSms } from "@/lib/sns";
import { TRIGGER_COOLDOWN_SECONDS, STRIPE_ENABLED } from "@/lib/env";
import { rateLimit, clientIp, tooManyResponse } from "@/lib/rate-limit";
import { hasActiveSubscription } from "@/lib/billing";
import { isAccountDisabled, type TriggerLog } from "@/lib/types";
import { markDosesTakenNearby } from "@/lib/reminders";

export const runtime = "nodejs";

/** "Murt has taken his medication" -> "This message is from QRdose. ...at 2:34 PM on Jun 30, 2026." */
function formatMessage(base: string, timezone: string, when: Date): string {
  const dateTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone || "America/Chicago",
  }).format(when);
  return `This message is from QRdose. ${base} at ${dateTime}.`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Per-IP burst protection (the per-card cooldown below handles repeat taps).
  const rl = await rateLimit(`trigger:${clientIp(req)}`, 20, 60);
  if (!rl.allowed) return tooManyResponse(rl.retryAfter);

  const userId = await resolveCard(cardId);
  if (!userId) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Disabled accounts cannot send notifications.
  if (isAccountDisabled(user)) {
    return NextResponse.json(
      { error: "This account is disabled." },
      { status: 403 }
    );
  }

  // When Stripe is live, require an active subscription to send.
  if (STRIPE_ENABLED && !hasActiveSubscription(user)) {
    return NextResponse.json(
      { error: "This card's subscription is inactive." },
      { status: 402 }
    );
  }

  // Cooldown: prevent accidental/abusive repeat taps.
  const last = await lastTriggerAt(userId);
  if (last) {
    const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
    if (elapsed < TRIGGER_COOLDOWN_SECONDS) {
      const wait = Math.ceil(TRIGGER_COOLDOWN_SECONDS - elapsed);
      return NextResponse.json(
        {
          error: `Contacts were just notified. Please wait ${wait}s before sending again.`,
          retryAfter: wait,
        },
        { status: 429 }
      );
    }
  }

  const contacts = await listContacts(userId);
  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "No contacts configured for this card" },
      { status: 422 }
    );
  }

  const now = new Date();
  const body = formatMessage(user.notificationMessage, user.timezone, now);

  const results = await Promise.allSettled(
    contacts.map((c) => sendSms(c.phone, body))
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`SMS send failed for ${contacts[i]?.phone}:`, r.reason);
    }
  });
  const successCount = results.filter((r) => r.status === "fulfilled").length;

  // Optional self-receipt to the account owner.
  if (user.phone) {
    await sendSms(
      user.phone,
      `Receipt: your ${successCount} contact(s) were notified — "${body}"`
    ).catch(() => {
      /* receipt is best-effort; ignore failures */
    });
  }

  const status: TriggerLog["status"] =
    successCount === contacts.length
      ? "sent"
      : successCount === 0
        ? "failed"
        : "partial";

  await recordTrigger(userId, {
    timestamp: now.toISOString(),
    recipientCount: contacts.length,
    successCount,
    status,
  });

  // A scan is the user confirming they took their medication — clear any
  // doses scheduled around now so reminders don't fire for them.
  await markDosesTakenNearby(user, now);

  if (successCount === 0) {
    return NextResponse.json(
      { error: "Could not send notifications. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, recipientCount: successCount });
}
