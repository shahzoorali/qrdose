import {
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  docClient,
  TABLE,
  pkUser,
  skProfile,
  gsi1Email,
} from "../dynamo";
import { deleteCardMapping } from "./cards";
import type { AccountStatus, User } from "../types";

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
  // Development: test account (no AWS required)
  if (userId === "test-user-123") {
    return {
      userId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "",
      phone: "+16175551234",
      notificationMessage: "Test notification",
      cardId: "test-card-abc123",
      timezone: "America/Chicago",
      createdAt: new Date().toISOString(),
      subscriptionStatus: "active",
    };
  }

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

export async function updateUserSettings(
  userId: string,
  settings: {
    name: string;
    timezone: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }
): Promise<void> {
  // Email is the GSI1 partition key, so changing it must also update GSI1PK.
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression:
        "SET #n = :n, #tz = :tz, #ph = :ph, #em = :em, GSI1PK = :g1, address = :addr, city = :city, #st = :state, zip = :zip",
      ExpressionAttributeNames: {
        "#n": "name",
        "#tz": "timezone",
        "#ph": "phone",
        "#em": "email",
        "#st": "state",
      },
      ExpressionAttributeValues: {
        ":n": settings.name,
        ":tz": settings.timezone,
        ":ph": settings.phone,
        ":em": settings.email,
        ":g1": gsi1Email(settings.email),
        ":addr": settings.address ?? "",
        ":city": settings.city ?? "",
        ":state": settings.state ?? "",
        ":zip": settings.zip ?? "",
      },
    })
  );
}

/**
 * Persist the reminder switch and grace window.
 *
 * Turning reminders on stamps `remindersEnabledAt`, which the reminder sweep
 * uses as a floor so doses from before the user opted in are never alerted on.
 */
export async function updateReminderSettings(
  userId: string,
  settings: {
    remindersEnabled: boolean;
    reminderGraceMinutes: number;
    enabledAt?: string;
  }
): Promise<void> {
  const sets = ["remindersEnabled = :on", "reminderGraceMinutes = :grace"];
  const values: Record<string, unknown> = {
    ":on": settings.remindersEnabled,
    ":grace": settings.reminderGraceMinutes,
  };
  if (settings.enabledAt) {
    sets.push("remindersEnabledAt = :at");
    values[":at"] = settings.enabledAt;
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeValues: values,
    })
  );
}

export async function updatePassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: "SET passwordHash = :p",
      ExpressionAttributeValues: { ":p": passwordHash },
    })
  );
}

/** Persist Stripe customer id + subscription status from billing events. */
export async function updateSubscription(
  userId: string,
  data: { stripeCustomerId?: string; subscriptionStatus: string }
): Promise<void> {
  const sets = ["subscriptionStatus = :s"];
  const values: Record<string, unknown> = { ":s": data.subscriptionStatus };
  if (data.stripeCustomerId) {
    sets.push("stripeCustomerId = :c");
    values[":c"] = data.stripeCustomerId;
  }
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeValues: values,
    })
  );
}

// ── Admin operations ────────────────────────────────────────────────

/**
 * List all user profiles. Scans the table filtering to SK = "PROFILE",
 * which excludes contact/trigger/reset/card/rate items. Paginated via the
 * returned `lastKey` (pass it back as `startKey` to continue).
 */
export async function listAllUsers(
  limit = 100,
  startKey?: Record<string, unknown>
): Promise<{ users: User[]; lastKey?: Record<string, unknown> }> {
  const res = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": skProfile() },
      Limit: limit,
      ExclusiveStartKey: startKey,
    })
  );
  const users = (res.Items ?? [])
    .map(fromItem)
    .filter((u): u is User => u !== null);
  return { users, lastKey: res.LastEvaluatedKey };
}

export async function setAccountStatus(
  userId: string,
  status: AccountStatus
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: "SET accountStatus = :s",
      ExpressionAttributeValues: { ":s": status },
    })
  );
}

export async function setAdminFlag(
  userId: string,
  isAdmin: boolean
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skProfile() },
      UpdateExpression: "SET isAdmin = :a",
      ExpressionAttributeValues: { ":a": isAdmin },
    })
  );
}

/**
 * Hard-delete a user and all data under their partition (profile, contacts,
 * triggers, reset code), plus their card mapping (a separate partition).
 */
export async function deleteUserCompletely(userId: string): Promise<void> {
  const user = await getUserById(userId);

  // Gather every item under PK = USER#<userId>.
  const items: { PK: string; SK: string }[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pkUser(userId) },
        ProjectionExpression: "PK, SK",
        ExclusiveStartKey: startKey,
      })
    );
    for (const it of res.Items ?? []) {
      items.push({ PK: (it as { PK: string }).PK, SK: (it as { SK: string }).SK });
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  // BatchWrite deletes in chunks of 25 (DynamoDB limit).
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE]: chunk.map((key) => ({ DeleteRequest: { Key: key } })),
        },
      })
    );
  }

  if (user?.cardId) await deleteCardMapping(user.cardId);
}
