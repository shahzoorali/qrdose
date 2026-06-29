import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DYNAMODB_TABLE } from "./env";

// Reuse a single client across hot reloads / lambda invocations.
const globalForDynamo = globalThis as unknown as {
  __qrdoseDocClient?: DynamoDBDocumentClient;
};

const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = { region: AWS_REGION };
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY };
}
const baseClient = new DynamoDBClient(clientConfig);

export const docClient =
  globalForDynamo.__qrdoseDocClient ??
  DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: { removeUndefinedValues: true },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDynamo.__qrdoseDocClient = docClient;
}

export const TABLE = DYNAMODB_TABLE;

// Key helpers — single-table design.
export const pkUser = (userId: string) => `USER#${userId}`;
export const skProfile = () => "PROFILE";
export const skContact = (contactId: string) => `CONTACT#${contactId}`;
export const skTrigger = (iso: string) => `TRIGGER#${iso}`;
export const pkCard = (cardId: string) => `CARD#${cardId}`;
export const skCard = () => "CARD";
export const gsi1Email = (email: string) => `EMAIL#${email.toLowerCase()}`;
// Password-reset code item (one per user, overwritten on re-request).
export const skReset = () => "RESET";
// Rate-limit counter items (TTL-expired). Bucket identifies the action+subject.
export const pkRate = (bucket: string) => `RATE#${bucket}`;
export const skRateWindow = (windowId: number) => `W#${windowId}`;
