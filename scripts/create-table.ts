/**
 * Creates the QRdose single-table DynamoDB table with GSI1 (email lookup).
 * Run once against AWS (us-east-1):  npm run create-table
 *
 * Requires AWS credentials + DYNAMODB_TABLE / AWS_REGION in the environment.
 */
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const tableName = process.env.DYNAMODB_TABLE || "QRdose";

const client = new DynamoDBClient({ region });

async function enableTtl() {
  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: { Enabled: true, AttributeName: "ttl" },
      })
    );
    console.log(`Enabled TTL on "ttl" attribute.`);
  } catch (err) {
    // TTL may already be enabled — that's fine.
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`TTL setup note: ${msg}`);
  }
}

async function main() {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "GSI1PK", KeyType: "HASH" },
              { AttributeName: "GSI1SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      })
    );
    console.log(`Created table "${tableName}" in ${region}.`);
    await waitUntilTableExists(
      { client, maxWaitTime: 120 },
      { TableName: tableName }
    );
    await enableTtl();
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      const desc = await client.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      console.log(
        `Table "${tableName}" already exists (status: ${desc.Table?.TableStatus}).`
      );
      await enableTtl();
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
