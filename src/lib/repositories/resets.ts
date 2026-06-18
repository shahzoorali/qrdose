import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkUser, skReset } from "../dynamo";

export interface ResetCode {
  codeHash: string;
  expiresAt: number; // epoch seconds
  attempts: number;
}

interface ResetItem extends ResetCode {
  PK: string;
  SK: string;
  ttl: number; // DynamoDB TTL attribute (epoch seconds)
}

/** Store (or overwrite) the active reset code for a user. */
export async function putResetCode(
  userId: string,
  codeHash: string,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const item: ResetItem = {
    PK: pkUser(userId),
    SK: skReset(),
    codeHash,
    expiresAt,
    attempts: 0,
    ttl: expiresAt + 60,
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function getResetCode(userId: string): Promise<ResetCode | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skReset() },
    })
  );
  if (!res.Item) return null;
  const { codeHash, expiresAt, attempts } = res.Item as ResetItem;
  return { codeHash, expiresAt, attempts };
}

export async function incrementResetAttempts(userId: string): Promise<number> {
  const res = await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skReset() },
      UpdateExpression: "ADD attempts :one",
      ExpressionAttributeValues: { ":one": 1 },
      ReturnValues: "UPDATED_NEW",
    })
  );
  return Number(res.Attributes?.attempts ?? 0);
}

export async function deleteResetCode(userId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skReset() },
    })
  );
}
