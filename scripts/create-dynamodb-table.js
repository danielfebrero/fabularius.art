#!/usr/bin/env node

/**
 * Script to create the DynamoDB table for local development.
 * The table definition is hardcoded to match the one in template.yaml.
 */

const {
  DynamoDBClient,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

const clientConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
};

const DYNAMODB_TABLE_NAME = "local-pornspot-media";

const tableParams = {
  TableName: DYNAMODB_TABLE_NAME,
  AttributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "GSI1PK", AttributeType: "S" },
    { AttributeName: "GSI1SK", AttributeType: "S" },
    { AttributeName: "GSI2PK", AttributeType: "S" },
    { AttributeName: "GSI2SK", AttributeType: "S" },
    { AttributeName: "GSI3PK", AttributeType: "S" },
    { AttributeName: "GSI3SK", AttributeType: "S" },
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
      Projection: {
        ProjectionType: "ALL",
      },
    },
    {
      IndexName: "GSI2",
      KeySchema: [
        { AttributeName: "GSI2PK", KeyType: "HASH" },
        { AttributeName: "GSI2SK", KeyType: "RANGE" },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
    {
      IndexName: "GSI3",
      KeySchema: [
        { AttributeName: "GSI3PK", KeyType: "HASH" },
        { AttributeName: "GSI3SK", KeyType: "RANGE" },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

async function createTable() {
  try {
    console.log(
      "Creating DynamoDB table for local development on LocalStack..."
    );

    const client = new DynamoDBClient(clientConfig);
    const command = new CreateTableCommand(tableParams);

    await client.send(command);

    console.log(`✅ Table '${DYNAMODB_TABLE_NAME}' created successfully.`);
  } catch (error) {
    // Gracefully handle if the table already exists
    if (error.name === "ResourceInUseException") {
      console.log(
        `🟡 Table '${DYNAMODB_TABLE_NAME}' already exists. Skipping.`
      );
    } else {
      console.error("❌ Error creating table:", error);
      process.exit(1);
    }
  }
}

createTable();
