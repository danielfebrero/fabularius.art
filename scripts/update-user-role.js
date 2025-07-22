#!/usr/bin/env node

/**
 * Script to update user role in the database
 * Usage: node scripts/update-user-role.js <environment> <role> <user_email>
 * Example: node scripts/update-user-role.js local admin febrero.daniel@gmail.com
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

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

async function updateUserRole(environment, role, email) {
  try {
    const clientConfig = getClientConfig(environment);
    const tableName = getTableName(environment);

    console.log(
      `Updating user role: ${email} -> ${role} in ${environment} environment`
    );
    console.log(`Using table: ${tableName}`);

    // Initialize DynamoDB client
    const client = new DynamoDBClient(clientConfig);
    const docClient = DynamoDBDocumentClient.from(client);

    // Find user by email
    const result = await docClient.send(
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

    if (!result.Items || result.Items.length === 0) {
      throw new Error(`User not found with email: ${email}`);
    }

    const user = result.Items[0];
    console.log(`Found user: ${user.userId} (${user.username || user.email})`);

    if (user.role === role) {
      console.log(`✅ User already has role: ${role}`);
      return;
    }

    // Update user role
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          PK: user.PK,
          SK: user.SK,
        },
        UpdateExpression: "SET #role = :role",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":role": role,
        },
      })
    );

    console.log(`✅ Successfully updated user role!`);
    console.log(`Environment: ${environment}`);
    console.log(`User ID: ${user.userId}`);
    console.log(`Email: ${email}`);
    console.log(`Previous Role: ${user.role || "user"}`);
    console.log(`New Role: ${role}`);
    console.log(`Username: ${user.username || "N/A"}`);
  } catch (error) {
    console.error(`❌ Error updating user role:`, error.message);

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

function validateRole(role) {
  const validRoles = ["user", "admin", "moderator"];
  return validRoles.includes(role);
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

if (args.length !== 3) {
  console.error(
    "Usage: node scripts/update-user-role.js <environment> <role> <user_email>"
  );
  console.error("Environments: local, dev, staging, prod");
  console.error("Roles: user, admin, moderator");
  console.error(
    "Example: node scripts/update-user-role.js local admin febrero.daniel@gmail.com"
  );
  process.exit(1);
}

const [environment, role, email] = args;

if (!environment || !role || !email) {
  console.error("All parameters (environment, role, user_email) are required");
  process.exit(1);
}

try {
  validateEnvironment(environment);

  if (!validateRole(role)) {
    throw new Error(
      `Invalid role: ${role}. Valid options: user, admin, moderator`
    );
  }

  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  if (environment === "prod") {
    console.log("⚠️  WARNING: You are updating a user role in PRODUCTION!");
    console.log("⚠️  Make sure this is intentional.");
    console.log("");
  }

  updateUserRole(environment, role, email);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
