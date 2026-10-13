import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkUser, skGoogleCalendar } from "../dynamo";
import { requireEnv } from "../env";

/** A user's link to the QRdose Reminders calendar in their Google account. */
export interface GoogleCalendarConnection {
  refreshToken: string;
  calendarId: string;
  connectedAt: string; // ISO
}

interface ConnectionItem {
  PK: string;
  SK: string;
  /** AES-256-GCM: base64 of iv(12) | tag(16) | ciphertext. */
  refreshTokenEnc: string;
  calendarId: string;
  connectedAt: string;
}

/**
 * Refresh tokens are encrypted at rest with a key derived from AUTH_SECRET.
 * Rotating AUTH_SECRET makes stored tokens unreadable, which simply reads as
 * "not connected" and the user reconnects.
 */
function key(): Buffer {
  return createHash("sha256")
    .update(`qrdose-gcal:${requireEnv("AUTH_SECRET")}`)
    .digest();
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

function decrypt(encoded: string): string | null {
  try {
    const buf = Buffer.from(encoded, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([
      decipher.update(buf.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export async function getGoogleCalendarConnection(
  userId: string
): Promise<GoogleCalendarConnection | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skGoogleCalendar() },
    })
  );
  const item = res.Item as ConnectionItem | undefined;
  if (!item) return null;
  const refreshToken = decrypt(item.refreshTokenEnc);
  if (!refreshToken) return null;
  return {
    refreshToken,
    calendarId: item.calendarId,
    connectedAt: item.connectedAt,
  };
}

export async function putGoogleCalendarConnection(
  userId: string,
  connection: GoogleCalendarConnection
): Promise<void> {
  const item: ConnectionItem = {
    PK: pkUser(userId),
    SK: skGoogleCalendar(),
    refreshTokenEnc: encrypt(connection.refreshToken),
    calendarId: connection.calendarId,
    connectedAt: connection.connectedAt,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function deleteGoogleCalendarConnection(
  userId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skGoogleCalendar() },
    })
  );
}
