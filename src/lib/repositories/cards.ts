import {
  DeleteCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkCard, skCard } from "../dynamo";

interface CardItem {
  PK: string;
  SK: string;
  userId: string;
}

/** Map a cardId -> userId so scanned QR/NFC links resolve to an owner. */
export async function putCardMapping(
  cardId: string,
  userId: string
): Promise<void> {
  const item: CardItem = { PK: pkCard(cardId), SK: skCard(), userId };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export async function resolveCard(cardId: string): Promise<string | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: pkCard(cardId), SK: skCard() },
    })
  );
  return (res.Item as CardItem | undefined)?.userId ?? null;
}

export async function deleteCardMapping(cardId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pkCard(cardId), SK: skCard() },
    })
  );
}
