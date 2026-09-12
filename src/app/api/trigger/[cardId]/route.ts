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

const MAX_ADDITIONAL_TEXT = 60;

/**
 * Clean up scanner-supplied "additional text" before it goes anywhere near
 * an SMS body. This field is filled in by an anonymous, unauthenticated
 * visitor to a public page, so it's treated as hostile input: strip links
 * (no phishing via a "medication alert"), strip markup, collapse whitespace,
 * and hard-cap the length.
 */
function sanitizeAdditionalText(input: unknown): string {
  if (typeof input !== "string") return "";
  let text = input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/www\.\S+/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > MAX_ADDITIONAL_TEXT) {
    text = text.slice(0, MAX_ADDITIONAL_TEXT).trim();
  }
  return text;
}

/** "Carol has taken her medication" -> "This message is from QRdose. ...at 2:34 PM on Jun 30, 2026." */
function formatMessage(
  base: string,
  additionalText: string,
  timezone: string,
  when: Date
): string {
  const dateTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone || "America/Chicago",
  }).format(when);
  const note = additionalText ? ` (${additionalText})` : "";
  return `This message is from QRdose. ${base}${note} at ${dateTime}.`;
}

/** One line of streamed progress as each contact is dispatched. */
type ProgressLine =
  | { contactId: string; ok: true }
  | { contactId: string; ok: false }
  | { done: true; successCount: number; recipientCount: number };

function line(data: ProgressLine): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data) + "\n");
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

  const body = await req.json().catch(() => ({}));
  const additionalText = sanitizeAdditionalText(
    (body as { additionalText?: unknown }).additionalText
  );

  const now = new Date();
  const message = formatMessage(user.notificationMessage, additionalText, user.timezone, now);

  // Stream one line of progress per contact as they're dispatched, in order,
  // so the scan page can check names off one-by-one instead of a single
  // all-or-nothing spinner.
  let successCount = 0;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const contact of contacts) {
        try {
          await sendSms(contact.phone, message);
          successCount++;
          controller.enqueue(line({ contactId: contact.contactId, ok: true }));
        } catch (err) {
          console.error(`SMS send failed for ${contact.phone}:`, err);
          controller.enqueue(line({ contactId: contact.contactId, ok: false }));
        }
      }

      // Optional self-receipt to the account owner.
      if (user.phone) {
        await sendSms(
          user.phone,
          `Receipt: your ${successCount} contact(s) were notified — "${message}"`
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

      controller.enqueue(
        line({ done: true, successCount, recipientCount: contacts.length })
      );
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
