#!/usr/bin/env node

/**
 * Script to prepare a user for OAuth login
 * This creates a basic user entry that can be used for Google OAuth login
 * Usage: node scripts/prepare-oauth-user.js <environment> <email>
 * Example: node scripts/prepare-oauth-user.js local febrero.daniel@gmail.com
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Environment-specific configurations
const getClientConfig = (environment) => {
  if (environment === "local") {
    return {
      endpoint: "http://localhost:4566",
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    };
  }

  // For staging/prod, use default AWS credentials from environment/profile
  return {
    region: process.env.AWS_REGION || "us-east-1",
  };
};

const getTableName = (environment) => {
  return `${environment}-pornspot-media`;
};

async function prepareOAuthUser(environment, email) {
  try {
    const clientConfig = getClientConfig(environment);
    const tableName = getTableName(environment);

    console.log(`Preparing OAuth user: ${email} in ${environment} environment`);
    console.log(`Using table: ${tableName}`);

    // Initialize DynamoDB client
    const client = new DynamoDBClient(clientConfig);
    const docClient = DynamoDBDocumentClient.from(client);

    // Check if user already exists by email
    const existingResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
        ExpressionAttributeValues: {
          ":gsi1pk": "USER_EMAIL",
          ":gsi1sk": email.toLowerCase(),
        },
        Limit: 1,
      })
    );

    if (existingResult.Items && existingResult.Items.length > 0) {
      const existingUser = existingResult.Items[0];
      console.log(`✅ User already exists with ID: ${existingUser.userId}`);
      console.log(`   Role: ${existingUser.role || "user"}`);
      console.log(`   Username: ${existingUser.username || "N/A"}`);
      return;
    }

    // Generate a unique username from email
    const baseUsername =
      email
        .split("@")[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "user";
    let username = baseUsername;
    let counter = 1;

    // Check if username is unique
    while (true) {
      const usernameCheck = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI3",
          KeyConditionExpression: "GSI3PK = :gsi3pk AND GSI3SK = :gsi3sk",
          ExpressionAttributeValues: {
            ":gsi3pk": "USER_USERNAME",
            ":gsi3sk": username.toLowerCase(),
          },
          Limit: 1,
        })
      );

      if (!usernameCheck.Items || usernameCheck.Items.length === 0) {
        break;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }

    const userId = uuidv4();
    const now = new Date().toISOString();

    // Create basic user entity (role will be assigned later or by email fallback)
    const userEntity = {
      PK: `USER#${userId}`,
      SK: "METADATA",
      GSI1PK: "USER_EMAIL",
      GSI1SK: email.toLowerCase(),
      GSI3PK: "USER_USERNAME",
      GSI3SK: username.toLowerCase(),
      EntityType: "User",
      userId,
      email: email.toLowerCase(),
      username,
      provider: "oauth_prepared", // Special marker for OAuth prepared users
      createdAt: now,
      isActive: true,
      isEmailVerified: true, // Pre-verified for OAuth
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: userEntity,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );

    console.log(`✅ OAuth user prepared successfully!`);
    console.log(`Environment: ${environment}`);
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Role: user (default - use update-user-role.js to change)`);
    console.log(`Created at: ${now}`);
    console.log(`Note: User will be able to login with Google OAuth`);
    console.log(`To assign admin role, run:`);
    console.log(`  node update-user-role.js ${environment} admin ${email}`);
  } catch (error) {
    console.error(`❌ Error preparing OAuth user:`, error.message);

    if (error.name === "ResourceNotFoundException") {
      console.error(
        `❌ DynamoDB table '${getTableName(environment)}' not found.`
      );
      console.error(
        `   Make sure the infrastructure is deployed for environment: ${environment}`
      );
    } else if (
      error.name === "CredentialsError" ||
      error.name === "UnauthorizedOperation"
    ) {
      console.error(
        `❌ AWS credentials error. Make sure you have proper AWS credentials configured.`
      );
      console.error(
        `   For production, ensure your AWS profile has DynamoDB write permissions.`
      );
    }

    process.exit(1);
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEnvironment(environment) {
  const validEnvironments = ["local", "dev", "staging", "prod"];
  if (!validEnvironments.includes(environment)) {
    throw new Error(
      `Invalid environment: ${environment}. Valid options: ${validEnvironments.join(
        ", "
      )}`
    );
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error(
    "Usage: node scripts/prepare-oauth-user.js <environment> <email>"
  );
  console.error("Environments: local, dev, staging, prod");
  console.error(
    "Example: node scripts/prepare-oauth-user.js local febrero.daniel@gmail.com"
  );
  console.error("");
  console.error("This script prepares a basic user entry for OAuth login.");
  console.error(
    "Use update-user-role.js to assign specific roles after creation."
  );
  process.exit(1);
}

const [environment, email] = args;

if (!environment || !email) {
  console.error("All parameters (environment, email) are required");
  process.exit(1);
}

try {
  validateEnvironment(environment);

  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  if (environment === "prod") {
    console.log("⚠️  WARNING: You are preparing an OAuth user in PRODUCTION!");
    console.log("⚠️  Make sure this is intentional and the email is correct.");
    console.log("");
  }

  prepareOAuthUser(environment, email);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
