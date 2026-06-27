import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkUser, skTrigger } from "../dynamo";
import type { TriggerLog } from "../types";

interface TriggerItem extends TriggerLog {
  PK: string;
  SK: string;
}

export async function recordTrigger(
  userId: string,
  log: TriggerLog
): Promise<void> {
  const item: TriggerItem = {
    ...log,
    PK: pkUser(userId),
    SK: skTrigger(log.timestamp),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

/** Most recent triggers first. */
export async function listTriggers(
  userId: string,
  limit = 50
): Promise<TriggerLog[]> {
  // Development: test account (no AWS required)
  if (userId === "test-user-123") {
    return [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        recipientCount: 2,
        successCount: 2,
        status: "sent",
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        recipientCount: 2,
        successCount: 2,
        status: "sent",
      },
    ];
  }

  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "TRIGGER#",
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (res.Items ?? []).map((item) => {
    const { PK: _pk, SK: _sk, ...rest } = item as TriggerItem;
    void _pk;
    void _sk;
    return rest as TriggerLog;
  });
}

/** Timestamp of the most recent trigger, for cooldown enforcement. */
export async function lastTriggerAt(userId: string): Promise<string | null> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "TRIGGER#",
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );
  const item = res.Items?.[0] as TriggerItem | undefined;
  return item?.timestamp ?? null;
}
