import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  SES_FROM_EMAIL,
} from "./env";

const globalForSes = globalThis as unknown as { __qrdoseSes?: SESv2Client };

const sesConfig: ConstructorParameters<typeof SESv2Client>[0] = {
  region: AWS_REGION,
};
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  sesConfig.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
}
export const sesClient = globalForSes.__qrdoseSes ?? new SESv2Client(sesConfig);

if (process.env.NODE_ENV !== "production") {
  globalForSes.__qrdoseSes = sesClient;
}

/** True only when a verified sender is configured. */
export const EMAIL_ENABLED = Boolean(SES_FROM_EMAIL);

/**
 * Send a plain-text transactional email via SES. No-ops when SES_FROM_EMAIL is
 * unset so the app runs without email configured. Throws on send failure so
 * callers can record per-recipient status.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  if (!EMAIL_ENABLED) return;

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Text: { Data: body, Charset: "UTF-8" } },
        },
      },
    })
  );
}
