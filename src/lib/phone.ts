import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normalize a US phone number to E.164 (+1XXXXXXXXXX). Returns null when the
 * input is not a valid US number. US-only by product decision.
 */
export function normalizeUsPhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, "US");
  if (!parsed || !parsed.isValid() || parsed.country !== "US") {
    return null;
  }
  return parsed.number; // E.164, e.g. +14155552671
}

/** Human-friendly display, e.g. (415) 555-2671. Falls back to the raw value. */
export function formatUsPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164, "US");
  return parsed ? parsed.formatNational() : e164;
}
