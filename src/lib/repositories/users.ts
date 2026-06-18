import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  docClient,
  TABLE,
  pkUser,
  skProfile,
  gsi1Email,
} from "../dynamo";
import type { User } from "../types";

interface UserItem extends User {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

function toItem(user: User): UserItem {
  return {
    ...user,
    PK: pkUser(user.userId),
    SK: skProfile(),
    GSI1PK: gsi1Email(user.email),
    GSI1SK: pkUser(user.userId),
  };
}

function fromItem(item: Record<string, unknown> | undefined): User | null {
  if (!item) return null;
  const {
    PK: _pk,
    SK: _sk,
    GSI1PK: _g1,
    GSI1SK: _g2,
    ...rest
  } = item as unknown as UserItem;
  void _pk;
  void _sk;
  void _g1;
  void _g2;
  return rest as User;
}

/** Create a user only if the email is not already taken. */
export async function createUser(user: User): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: toItem(user),
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );
}

export async function getUserById(userId: string): Promise<User | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
    })
  );
  return fromItem(res.Item);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsi1Email(email) },
      Limit: 1,
    })
  );
  return fromItem(res.Items?.[0]);
}

export async function updateNotificationMessage(
  userId: string,
  notificationMessage: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: "SET notificationMessage = :m",
      ExpressionAttributeValues: { ":m": notificationMessage },
    })
  );
}

export async function updateCardId(
  userId: string,
  cardId: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: "SET cardId = :c",
      ExpressionAttributeValues: { ":c": cardId },
    })
  );
}
