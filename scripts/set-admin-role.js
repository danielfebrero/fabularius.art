const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

// Configuration for local development
const isLocal = process.env.AWS_SAM_LOCAL === "true";
const clientConfig = {};

if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || "dev-pornspot-media";

async function setAdminRole(userEmail) {
  try {
    console.log(`🔍 Looking for user with email: ${userEmail}`);
    
    // First, find the user by email using GSI1
    const findResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
        ExpressionAttributeValues: {
          ":gsi1pk": "USER_EMAIL",
          ":gsi1sk": userEmail.toLowerCase(),
        },
        Limit: 1,
      })
    );

    if (!findResult.Items || findResult.Items.length === 0) {
      console.error(`❌ User not found with email: ${userEmail}`);
      return;
    }

    const user = findResult.Items[0];
    console.log(`👤 Found user: ${user.userId} (${user.email})`);
    console.log(`📊 Current role: ${user.role || "none"}`);

    // Update the user's role to admin
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${user.userId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET #role = :role",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":role": "admin",
        },
      })
    );

    console.log(`✅ Successfully set admin role for ${userEmail}`);
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Usage: node set-admin-role.js <user-email>");
  process.exit(1);
}

setAdminRole(userEmail);
