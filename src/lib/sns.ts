import {
  SNSClient,
  PublishCommand,
  type MessageAttributeValue,
} from "@aws-sdk/client-sns";
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SNS_SENDER_ID } from "./env";

const globalForSns = globalThis as unknown as { __qrdoseSns?: SNSClient };

const snsConfig: ConstructorParameters<typeof SNSClient>[0] = { region: AWS_REGION };
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  snsConfig.credentials = { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY };
}
export const snsClient = globalForSns.__qrdoseSns ?? new SNSClient(snsConfig);

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
