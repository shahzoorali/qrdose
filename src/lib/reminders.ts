import {
  DEFAULT_REMINDER_GRACE_MINUTES,
  DOSE_MATCH_WINDOW_MINUTES,
  REMINDER_ESCALATION_MULTIPLIER,
  STRIPE_ENABLED,
} from "./env";
import { hasActiveSubscription } from "./billing";
import { isAccountDisabled, type Medication, type User } from "./types";
import { localDateString, previousDate, zonedTimeToUtc, formatTimeOfDay } from "./time";
import {
  getDose,
  listMedications,
  markDoseEscalated,
  markDoseReminded,
  markDoseTaken,
} from "./repositories/medications";
import { listContacts } from "./repositories/contacts";
import { sendSms } from "./sns";
import { sendEmail } from "./ses";

const MINUTE_MS = 60_000;

/** How long past the escalation point a dose stays actionable. */
const STALE_AFTER_ESCALATION_MINUTES = 6 * 60;

/** A specific day's dose of a specific medication. */
export interface ScheduledDose {
  medication: Medication;
  date: string; // local YYYY-MM-DD
  scheduled: Date; // real instant
  minutesLate: number;
}

export function graceMinutesFor(user: User): number {
  const value = user.reminderGraceMinutes;
  return typeof value === "number" && value > 0
    ? value
    : DEFAULT_REMINDER_GRACE_MINUTES;
}

/** True when the account is in a state where reminders should be sent at all. */
export function remindersActive(user: User): boolean {
  if (!user.remindersEnabled) return false;
  if (isAccountDisabled(user)) return false;
  if (STRIPE_ENABLED && !hasActiveSubscription(user)) return false;
  return true;
}

/**
 * Every dose that has already come due and is still worth acting on, soonest
 * first.
 *
 * Considers today and yesterday in the user's timezone so a late-evening dose
 * is still handled after local midnight. Doses past `maxLatenessMinutes` are
 * dropped: once a dose is many hours stale, alerting about it is noise rather
 * than a useful nudge, and it would otherwise fire the moment an account turns
 * reminders on.
 */
export function dueDoses(
  medications: Medication[],
  timezone: string,
  now: Date,
  maxLatenessMinutes: number
): ScheduledDose[] {
  const today = localDateString(now, timezone);
  const dates = [today, previousDate(today)];
  const doses: ScheduledDose[] = [];

  for (const medication of medications) {
    if (!medication.enabled) continue;
    for (const date of dates) {
      const scheduled = zonedTimeToUtc(date, medication.time, timezone);
      const minutesLate = (now.getTime() - scheduled.getTime()) / MINUTE_MS;
      if (minutesLate < 0) continue; // not due yet
      if (minutesLate > maxLatenessMinutes) continue; // stale
      doses.push({ medication, date, scheduled, minutesLate });
    }
  }

  return doses.sort((a, b) => a.minutesLate - b.minutesLate);
}

/**
 * Record that a scan confirmed the user's medication.
 *
 * A single tap confirms every dose scheduled near that moment, so a user with
 * two 8 AM medications only has to scan once. Best-effort: reminder
 * bookkeeping must never fail the notification the user actually asked for.
 */
export async function markDosesTakenNearby(
  user: User,
  now: Date
): Promise<void> {
  if (!user.remindersEnabled) return;
  try {
    const medications = await listMedications(user.userId);
    const today = localDateString(now, user.timezone);
    const dates = [today, previousDate(today)];

    await Promise.all(
      medications.flatMap((medication) => {
        if (!medication.enabled) return [];
        return dates.flatMap((date) => {
          const scheduled = zonedTimeToUtc(date, medication.time, user.timezone);
          const driftMinutes =
            Math.abs(now.getTime() - scheduled.getTime()) / MINUTE_MS;
          if (driftMinutes > DOSE_MATCH_WINDOW_MINUTES) return [];
          return [markDoseTaken(user.userId, medication.medId, date, now)];
        });
      })
    );
  } catch (err) {
    console.error(`Dose bookkeeping failed for ${user.userId}:`, err);
  }
}

/** What a single cron pass did for one user. */
export interface ReminderResult {
  reminded: number;
  escalated: number;
}

/**
 * Send any reminders this user is due for.
 *
 * Two steps, both keyed off the account's grace window: the user alone is
 * reminded at (dose time + grace), and contacts are brought in only if the
 * dose is still unconfirmed at (dose time + grace x2).
 */
export async function processUserReminders(
  user: User,
  now: Date
): Promise<ReminderResult> {
  const result: ReminderResult = { reminded: 0, escalated: 0 };
  if (!remindersActive(user)) return result;

  const medications = await listMedications(user.userId);
  if (medications.length === 0) return result;

  const grace = graceMinutesFor(user);
  const escalateAfter = grace * REMINDER_ESCALATION_MULTIPLIER;
  const maxLateness = escalateAfter + STALE_AFTER_ESCALATION_MINUTES;

  // Doses that came due before the user switched reminders on were never
  // something they agreed to be tracked for — alerting on them would fire a
  // burst of false alarms the first time the cron runs for a new account.
  const enabledAt = user.remindersEnabledAt
    ? new Date(user.remindersEnabledAt)
    : null;

  for (const dose of dueDoses(medications, user.timezone, now, maxLateness)) {
    if (dose.minutesLate < grace) continue;
    if (enabledAt && dose.scheduled < enabledAt) continue;

    const record = await getDose(user.userId, dose.medication.medId, dose.date);
    if (record?.takenAt) continue;

    const when = formatTimeOfDay(dose.medication.time);
    const medName = dose.medication.name;

    if (dose.minutesLate >= escalateAfter && !record?.escalatedAt) {
      const claimed = await markDoseEscalated(
        user.userId,
        dose.medication.medId,
        dose.date,
        now
      );
      if (claimed) {
        await notifyContacts(user, medName, when);
        result.escalated++;
      }
      continue;
    }

    if (!record?.remindedAt) {
      const claimed = await markDoseReminded(
        user.userId,
        dose.medication.medId,
        dose.date,
        now
      );
      if (claimed) {
        await notifyUser(user, medName, when);
        result.reminded++;
      }
    }
  }

  return result;
}

async function notifyUser(user: User, medName: string, when: string) {
  const body =
    `QRdose reminder: your ${when} dose of ${medName} hasn't been confirmed yet. ` +
    `Tap or scan your card once you've taken it.`;

  await Promise.allSettled([
    user.phone ? sendSms(user.phone, body) : Promise.resolve(),
    user.email
      ? sendEmail(user.email, `Reminder: ${medName} (${when})`, body)
      : Promise.resolve(),
  ]).then((results) =>
    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error(`Reminder to ${user.userId} failed:`, r.reason);
      }
    })
  );
}

async function notifyContacts(user: User, medName: string, when: string) {
  const contacts = await listContacts(user.userId);
  if (contacts.length === 0) return;

  const body =
    `This message is from QRdose. ${user.name} hasn't confirmed their ` +
    `${when} dose of ${medName} yet. You may want to check in.`;

  const sends = contacts.flatMap((contact) => [
    sendSms(contact.phone, body),
    contact.email
      ? sendEmail(contact.email, `${user.name} missed a dose`, body)
      : Promise.resolve(),
  ]);

  const results = await Promise.allSettled(sends);
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error(`Escalation for ${user.userId} failed:`, r.reason);
    }
  });
}
