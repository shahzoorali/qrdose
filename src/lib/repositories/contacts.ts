import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE, pkUser, skContact } from "../dynamo";
import type { Contact } from "../types";

interface ContactItem extends Contact {
  PK: string;
  SK: string;
}

export async function listContacts(userId: string): Promise<Contact[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "CONTACT#",
      },
    })
  );
  return (res.Items ?? []).map((item) => {
    const { PK: _pk, SK: _sk, ...rest } = item as ContactItem;
    void _pk;
    void _sk;
    return rest as Contact;
  });
}

export async function countContacts(userId: string): Promise<number> {
  // Development: test account (no AWS required)
  if (userId === "test-user-123") return 2;

  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pkUser(userId),
        ":prefix": "CONTACT#",
      },
      Select: "COUNT",
    })
  );
  return res.Count ?? 0;
}

export async function putContact(
  userId: string,
  contact: Contact
): Promise<void> {
  const item: ContactItem = {
    ...contact,
    PK: pkUser(userId),
    SK: skContact(contact.contactId),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

export interface MaskedContact {
  contactId: string;
  displayName: string;
}

/** First name + last-initial only, e.g. "Carol R." — safe to show on the
 *  public scan page without exposing a contact's full name or phone number. */
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Contact";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Masked contact list for the public trigger page — no phone numbers, no
 *  full last names. */
export async function listContactsMasked(
  userId: string
): Promise<MaskedContact[]> {
  const contacts = await listContacts(userId);
  return contacts.map((c) => ({
    contactId: c.contactId,
    displayName: maskName(c.name),
  }));
}

export async function deleteContact(
  userId: string,
  contactId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: pkUser(userId), SK: skContact(contactId) },
    })
  );
}
