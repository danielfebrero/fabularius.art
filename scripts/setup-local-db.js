const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  DescribeTableCommand,
  UpdateTableCommand,
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
    { AttributeName: "GSI2PK", AttributeType: "S" },
    { AttributeName: "GSI2SK", AttributeType: "S" },
    { AttributeName: "GSI3PK", AttributeType: "S" },
    { AttributeName: "GSI3SK", AttributeType: "S" },
    { AttributeName: "GSI4PK", AttributeType: "S" },
    { AttributeName: "GSI4SK", AttributeType: "S" },
    { AttributeName: "isPublic", AttributeType: "S" },
    { AttributeName: "createdAt", AttributeType: "S" },
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
    {
      IndexName: "GSI2",
      KeySchema: [
        { AttributeName: "GSI2PK", KeyType: "HASH" },
        { AttributeName: "GSI2SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "GSI3",
      KeySchema: [
        { AttributeName: "GSI3PK", KeyType: "HASH" },
        { AttributeName: "GSI3SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "isPublic-createdAt-index",
      KeySchema: [
        { AttributeName: "isPublic", KeyType: "HASH" },
        { AttributeName: "createdAt", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "GSI4",
      KeySchema: [
        { AttributeName: "GSI4PK", KeyType: "HASH" },
        { AttributeName: "GSI4SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
};

async function checkAndCreateMissingIndexes() {
  try {
    console.log("🔍 Checking for missing indexes...");

    const describeResult = await client.send(
      new DescribeTableCommand({ TableName: tableName })
    );

    const existingIndexes = describeResult.Table.GlobalSecondaryIndexes || [];
    const existingIndexNames = existingIndexes.map((index) => index.IndexName);

    const requiredIndexes = tableSchema.GlobalSecondaryIndexes;
    const missingIndexes = requiredIndexes.filter(
      (index) => !existingIndexNames.includes(index.IndexName)
    );

    if (missingIndexes.length === 0) {
      console.log("✅ All required indexes already exist");
      return;
    }

    console.log(`🚀 Creating ${missingIndexes.length} missing index(es)...`);

    for (const missingIndex of missingIndexes) {
      console.log(`   Creating index: ${missingIndex.IndexName}`);

      // Get required attribute definitions for this index
      const indexAttributes = [
        ...missingIndex.KeySchema.map((key) => key.AttributeName),
      ];

      const requiredAttributeDefinitions =
        tableSchema.AttributeDefinitions.filter((attr) =>
          indexAttributes.includes(attr.AttributeName)
        );

      const updateParams = {
        TableName: tableName,
        AttributeDefinitions: requiredAttributeDefinitions,
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: missingIndex.IndexName,
              KeySchema: missingIndex.KeySchema,
              Projection: missingIndex.Projection,
            },
          },
        ],
      };

      await client.send(new UpdateTableCommand(updateParams));
      console.log(
        `   ✅ Index '${missingIndex.IndexName}' created successfully`
      );

      // Wait a bit between index creations to avoid throttling
      if (missingIndexes.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("✅ All missing indexes created successfully");
  } catch (error) {
    console.error("❌ Error checking/creating indexes:", error);
    throw error;
  }
}

async function setupLocalDatabase() {
  try {
    console.log("🔍 Checking existing tables...");
    const existingTables = await client.send(new ListTablesCommand({}));

    if (
      existingTables.TableNames &&
      existingTables.TableNames.includes(tableName)
    ) {
      console.log(`✅ Table '${tableName}' already exists`);

      // Check and create missing indexes for existing table
      await checkAndCreateMissingIndexes();
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
