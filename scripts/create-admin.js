#!/usr/bin/env node

/**
 * Script to create an initial admin user
 * Usage: node scripts/create-admin.js <username> <password>
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

const clientConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
};

// Initialize DynamoDB client
const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

async function createAdminUser(username, password) {
  try {
    const tableName = "local-fabularius-media";

    console.log(`Creating admin user: ${username}`);

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
    console.log(`Admin ID: ${adminId}`);
    console.log(`Username: ${username}`);
    console.log(`Created at: ${now}`);
  } catch (error) {
    console.error(`❌ Error creating admin user:`, error.message);
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

// Main execution
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error("Usage: node scripts/create-admin.js <username> <password>");
  console.error(
    "Example: node scripts/create-admin.js admin MySecurePassword123!"
  );
  process.exit(1);
}

const [username, password] = args;

if (!username || !password) {
  console.error("Both username and password are required");
  process.exit(1);
}

createAdminUser(username, password);
