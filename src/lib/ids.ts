import { randomBytes, randomUUID } from "crypto";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** URL-safe high-entropy token, used for card ids (the QR/NFC capability). */
export function base62Token(bytes = 16): string {
  const buf = randomBytes(bytes);
  let out = "";
  for (const byte of buf) {
    out += BASE62[byte % 62];
  }
  return out;
}

export function newUserId(): string {
  return randomUUID();
}

export function newContactId(): string {
  return randomUUID();
}

/** Card id is the secret embedded in the QR code and NFC card URL. */
export function newCardId(): string {
  return base62Token(16);
}
