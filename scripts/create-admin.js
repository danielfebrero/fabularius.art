#!/usr/bin/env node

/**
 * Script to create an admin user in production
 * Usage: node scripts/create-admin-prod.js <environment> <username> <password>
 * Example: node scripts/create-admin-prod.js prod admin MySecurePassword123!
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

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

async function createAdminUser(environment, username, password) {
  try {
    const clientConfig = getClientConfig(environment);
    const tableName = getTableName(environment);

    console.log(
      `Creating admin user: ${username} in ${environment} environment`
    );
    console.log(`Using table: ${tableName}`);

    // Initialize DynamoDB client
    const client = new DynamoDBClient(clientConfig);
    const docClient = DynamoDBDocumentClient.from(client);

    // Check if username already exists
    const existingResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
        ExpressionAttributeValues: {
          ":gsi1pk": "ADMIN_USERNAME",
          ":gsi1sk": username,
        },
        Limit: 1,
      })
    );

    if (existingResult.Items && existingResult.Items.length > 0) {
      throw new Error("Username already exists");
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed:\n${passwordValidation.errors.join("\n")}`
      );
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    const adminId = uuidv4();
    const now = new Date().toISOString();

    const adminEntity = {
      PK: `ADMIN#${adminId}`,
      SK: "METADATA",
      GSI1PK: "ADMIN_USERNAME",
      GSI1SK: username,
      EntityType: "AdminUser",
      adminId,
      username,
      passwordHash,
      salt,
      createdAt: now,
      isActive: true,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: adminEntity,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );

    console.log(`✅ Admin user created successfully!`);
    console.log(`Environment: ${environment}`);
    console.log(`Admin ID: ${adminId}`);
    console.log(`Username: ${username}`);
    console.log(`Created at: ${now}`);

    if (environment === "prod") {
      console.log(`⚠️  IMPORTANT: Store these credentials securely!`);
      console.log(`⚠️  This is the only time the password will be shown.`);
    }
  } catch (error) {
    console.error(`❌ Error creating admin user:`, error.message);

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

function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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
    "Usage: node scripts/create-admin-prod.js <environment> <username> <password>"
  );
  console.error("Environments: local, dev, staging, prod");
  console.error(
    "Example: node scripts/create-admin-prod.js prod admin MySecurePassword123!"
  );
  console.error("");
  console.error("Password requirements:");
  console.error("- At least 8 characters long");
  console.error("- At least one uppercase letter");
  console.error("- At least one lowercase letter");
  console.error("- At least one number");
  console.error("- At least one special character");
  process.exit(1);
}

const [environment, username, password] = args;

if (!environment || !username || !password) {
  console.error(
    "All parameters (environment, username, password) are required"
  );
  process.exit(1);
}

try {
  validateEnvironment(environment);

  if (environment === "prod") {
    console.log("⚠️  WARNING: You are creating an admin user in PRODUCTION!");
    console.log(
      "⚠️  Make sure this is intentional and the credentials are secure."
    );
    console.log("");
  }

  createAdminUser(environment, username, password);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
