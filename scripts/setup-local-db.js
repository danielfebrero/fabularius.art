const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const tableName = "local-pornspot-media";

const tableSchema = {
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
};

async function setupLocalDatabase() {
  try {
    console.log("🔍 Checking existing tables...");
    const existingTables = await client.send(new ListTablesCommand({}));

    if (
      existingTables.TableNames &&
      existingTables.TableNames.includes(tableName)
    ) {
      console.log(`✅ Table '${tableName}' already exists`);
      return;
    }

    console.log(`🚀 Creating table '${tableName}'...`);
    await client.send(new CreateTableCommand(tableSchema));

    console.log(`✅ Table '${tableName}' created successfully`);
    console.log("🎉 Local database setup complete!");
  } catch (error) {
    console.error("❌ Error setting up local database:", error);
    process.exit(1);
  }
}

setupLocalDatabase();
