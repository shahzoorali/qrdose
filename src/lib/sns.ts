import {
  SNSClient,
  PublishCommand,
  type MessageAttributeValue,
} from "@aws-sdk/client-sns";
import { AWS_REGION, SNS_SENDER_ID } from "./env";

const globalForSns = globalThis as unknown as { __qrdoseSns?: SNSClient };

export const snsClient =
  globalForSns.__qrdoseSns ?? new SNSClient({ region: AWS_REGION });

if (process.env.NODE_ENV !== "production") {
  globalForSns.__qrdoseSns = snsClient;
}

/**
 * Send a single transactional SMS to a US (+1) E.164 number via AWS SNS.
 * Real wiring: requires valid AWS credentials in the environment. Throws on
 * failure so callers can record per-recipient status.
 */
export async function sendSms(toE164: string, body: string): Promise<string> {
  const attributes: Record<string, MessageAttributeValue> = {
    "AWS.SNS.SMS.SMSType": {
      DataType: "String",
      StringValue: "Transactional",
    },
  };

  if (SNS_SENDER_ID) {
    attributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: SNS_SENDER_ID,
    };
  }

  const result = await snsClient.send(
    new PublishCommand({
      PhoneNumber: toE164,
      Message: body,
      MessageAttributes: attributes,
    })
  );

  return result.MessageId ?? "";
}
