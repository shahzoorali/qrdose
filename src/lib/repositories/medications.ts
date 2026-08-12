import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkUser, skMedication, skDose } from "../dynamo";
import type { DoseRecord, Medication } from "../types";

interface MedicationItem extends Medication {
  PK: string;
  SK: string;
}

interface DoseItem extends DoseRecord {
  PK: string;
  SK: string;
  /** Unix seconds; dose records are bookkeeping and expire on their own. */
  ttl: number;
}

const DOSE_TTL_DAYS = 90;

export async function listMedications(userId: string): Promise<Medication[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "MED#",
      },
    })
  );
  return (res.Items ?? [])
    .map((item) => {
      const { PK: _pk, SK: _sk, ...rest } = item as MedicationItem;
      void _pk;
      void _sk;
      return rest as Medication;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function countMedications(userId: string): Promise<number> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "MED#",
      },
      Select: "COUNT",
    })
  );
  return res.Count ?? 0;
}

export async function getMedication(
  userId: string,
  medId: string
): Promise<Medication | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skMedication(medId) },
    })
  );
  if (!res.Item) return null;
  const { PK: _pk, SK: _sk, ...rest } = res.Item as MedicationItem;
  void _pk;
  void _sk;
  return rest as Medication;
}

export async function putMedication(
  userId: string,
  medication: Medication
): Promise<void> {
  const item: MedicationItem = {
    ...medication,
    PK: pkUser(userId),
    SK: skMedication(medication.medId),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function deleteMedication(
  userId: string,
  medId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skMedication(medId) },
    })
  );
}

// ── Dose bookkeeping ────────────────────────────────────────────────

export async function getDose(
  userId: string,
  medId: string,
  date: string
): Promise<DoseRecord | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skDose(medId, date) },
    })
  );
  if (!res.Item) return null;
  const { PK: _pk, SK: _sk, ttl: _ttl, ...rest } = res.Item as DoseItem;
  void _pk;
  void _sk;
  void _ttl;
  return rest as DoseRecord;
}

/**
 * Set one timestamp field on a dose record, creating it if absent. The
 * conditional keeps the cron idempotent: a concurrent run that already wrote
 * the field leaves it untouched rather than sending a second message.
 */
async function stampDose(
  userId: string,
  medId: string,
  date: string,
  field: "takenAt" | "remindedAt" | "escalatedAt",
  when: Date
): Promise<boolean> {
  const ttl =
    Math.floor(when.getTime() / 1000) + DOSE_TTL_DAYS * 24 * 60 * 60;
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: pkUser(userId), SK: skDose(medId, date) },
        UpdateExpression:
          "SET #f = :when, medId = :medId, #d = :date, #ttl = :ttl",
        ConditionExpression: "attribute_not_exists(#f)",
        ExpressionAttributeNames: {
          "#f": field,
          "#d": "date",
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":when": when.toISOString(),
          ":medId": medId,
          ":date": date,
          ":ttl": ttl,
        },
      })
    );
    return true;
  } catch (err) {
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") {
      return false; // already stamped — nothing to do
    }
    throw err;
  }
}

export const markDoseTaken = (
  userId: string,
  medId: string,
  date: string,
  when: Date
) => stampDose(userId, medId, date, "takenAt", when);

export const markDoseReminded = (
  userId: string,
  medId: string,
  date: string,
  when: Date
) => stampDose(userId, medId, date, "remindedAt", when);

export const markDoseEscalated = (
  userId: string,
  medId: string,
  date: string,
  when: Date
) => stampDose(userId, medId, date, "escalatedAt", when);
