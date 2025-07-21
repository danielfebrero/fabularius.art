import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  Album,
  AlbumEntity,
  MediaEntity,
  AdminUserEntity,
  AdminSessionEntity,
} from "../types";
import {
  UserEntity,
  UserSessionEntity,
  EmailVerificationTokenEntity,
  UserInteractionEntity,
} from "../types/user";

const isLocal = process.env["AWS_SAM_LOCAL"] === "true";

const clientConfig: any = {};

if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}

console.log(
  "🔧 DynamoDB Client Config:",
  JSON.stringify(clientConfig, null, 2)
);
console.log("🌍 AWS_SAM_LOCAL env var:", process.env["AWS_SAM_LOCAL"]);

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env["DYNAMODB_TABLE"]!;
console.log("📋 Table name from env:", TABLE_NAME);

export class DynamoDBService {
  // Helper method to convert AlbumEntity to Album
  private static convertAlbumEntityToAlbum(entity: AlbumEntity): Album {
    const album: Album = {
      id: entity.id,
      title: entity.title,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      mediaCount: entity.mediaCount,
      isPublic: entity.isPublic === "true",
    };

    if (entity.tags !== undefined) {
      album.tags = entity.tags;
    }

    if (entity.coverImageUrl !== undefined) {
      album.coverImageUrl = entity.coverImageUrl;
    }

    if (entity.thumbnailUrls !== undefined) {
      album.thumbnailUrls = entity.thumbnailUrls;
    }

    if (entity.likeCount !== undefined) {
      album.likeCount = entity.likeCount;
    }

    if (entity.bookmarkCount !== undefined) {
      album.bookmarkCount = entity.bookmarkCount;
    }

    if (entity.viewCount !== undefined) {
      album.viewCount = entity.viewCount;
    }

    return album;
  }

  // Album operations
  static async createAlbum(album: AlbumEntity): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: album,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  }

  static async getAlbum(albumId: string): Promise<AlbumEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
      })
    );

    return (result.Item as AlbumEntity) || null;
  }

  static async getAlbumForAPI(albumId: string): Promise<Album | null> {
    const entity = await this.getAlbum(albumId);
    return entity ? this.convertAlbumEntityToAlbum(entity) : null;
  }

  static async updateAlbum(
    albumId: string,
    updates: Partial<AlbumEntity>
  ): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) return;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  static async deleteAlbum(albumId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
      })
    );
  }

  static async listAlbums(
    limit: number = 20,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<{
    albums: Album[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    console.log("🔄 About to call DynamoDBService.listAlbums");
    console.log("📋 Using table name:", TABLE_NAME);
    console.log("🔍 Query parameters:", { limit, lastEvaluatedKey });

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": "ALBUM",
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const albumEntities = (result.Items as AlbumEntity[]) || [];

    const response: {
      albums: Album[];
      lastEvaluatedKey?: Record<string, any>;
    } = {
      albums: albumEntities.map((entity) =>
        this.convertAlbumEntityToAlbum(entity)
      ),
    };

    if (result.LastEvaluatedKey) {
      response.lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return response;
  }

  static async listAlbumsByPublicStatus(
    isPublic: boolean,
    limit: number = 20,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<{
    albums: Album[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    const isPublicString = isPublic.toString();

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "isPublic-createdAt-index",
        KeyConditionExpression: "#isPublic = :isPublic",
        ExpressionAttributeNames: {
          "#isPublic": "isPublic",
        },
        ExpressionAttributeValues: {
          ":isPublic": isPublicString,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const albumEntities = (result.Items as AlbumEntity[]) || [];

    // Convert AlbumEntity to Album format for API response
    const albums: Album[] = albumEntities.map((entity) =>
      this.convertAlbumEntityToAlbum(entity)
    );

    const response: {
      albums: Album[];
      lastEvaluatedKey?: Record<string, any>;
    } = {
      albums,
    };

    if (result.LastEvaluatedKey) {
      response.lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return response;
  }

  // Album counter operations
  static async incrementAlbumLikeCount(
    albumId: string,
    increment: number = 1
  ): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD likeCount :inc",
        ExpressionAttributeValues: {
          ":inc": increment,
        },
      })
    );
  }

  static async incrementAlbumBookmarkCount(
    albumId: string,
    increment: number = 1
  ): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD bookmarkCount :inc",
        ExpressionAttributeValues: {
          ":inc": increment,
        },
      })
    );
  }

  static async incrementAlbumViewCount(
    albumId: string,
    increment: number = 1
  ): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD viewCount :inc",
        ExpressionAttributeValues: {
          ":inc": increment,
        },
      })
    );
  }

  // Media operations
  static async createMedia(media: MediaEntity): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: media,
      })
    );
  }

  static async getMedia(
    albumId: string,
    mediaId: string
  ): Promise<MediaEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: `MEDIA#${mediaId}`,
        },
      })
    );

    return (result.Item as MediaEntity) || null;
  }

  static async listAlbumMedia(
    albumId: string,
    limit: number = 50,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<{
    media: MediaEntity[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": `MEDIA#${albumId}`,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const response: {
      media: MediaEntity[];
      lastEvaluatedKey?: Record<string, any>;
    } = {
      media: (result.Items as MediaEntity[]) || [],
    };

    if (result.LastEvaluatedKey) {
      response.lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return response;
  }

  static async findMediaById(mediaId: string): Promise<MediaEntity | null> {
    // Use GSI2 for efficient direct media lookup by ID
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :gsi2pk AND GSI2SK = :gsi2sk",
          ExpressionAttributeValues: {
            ":gsi2pk": "MEDIA_ID",
            ":gsi2sk": mediaId,
          },
          Limit: 1, // We expect only one result
        })
      );

      const items = result.Items as MediaEntity[] | undefined;
      return items?.[0] || null;
    } catch (error) {
      console.error("❌ Error finding media by ID:", error);
      return null;
    }
  }

  static async deleteMedia(albumId: string, mediaId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: `MEDIA#${mediaId}`,
        },
      })
    );
  }

  static async updateMedia(
    albumId: string,
    mediaId: string,
    updates: Partial<MediaEntity>
  ): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    // Build dynamic update expression
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && key !== "id" && key !== "albumId") {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    if (updateExpressions.length === 0) {
      return; // Nothing to update
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: `MEDIA#${mediaId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  static async incrementAlbumMediaCount(albumId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD mediaCount :inc SET updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  }

  static async decrementAlbumMediaCount(albumId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ALBUM#${albumId}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD mediaCount :dec SET updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":dec": -1,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  }

  // Admin operations
  static async createAdminUser(admin: AdminUserEntity): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: admin,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  }

  static async getAdminByUsername(
    username: string
  ): Promise<AdminUserEntity | null> {
    // Query using GSI1 to find admin by username
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
        ExpressionAttributeValues: {
          ":gsi1pk": "ADMIN_USERNAME",
          ":gsi1sk": username,
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as AdminUserEntity) || null;
  }

  static async getAdminById(adminId: string): Promise<AdminUserEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ADMIN#${adminId}`,
          SK: "METADATA",
        },
      })
    );

    return (result.Item as AdminUserEntity) || null;
  }

  static async createSession(session: AdminSessionEntity): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: session,
      })
    );
  }

  static async getSession(
    sessionId: string
  ): Promise<AdminSessionEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: "METADATA",
        },
      })
    );

    return (result.Item as AdminSessionEntity) || null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: "METADATA",
        },
      })
    );
  }

  static async updateSessionLastAccessed(sessionId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET lastAccessedAt = :lastAccessedAt",
        ExpressionAttributeValues: {
          ":lastAccessedAt": new Date().toISOString(),
        },
      })
    );
  }

  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date().toISOString();

    // Query for expired sessions using GSI1
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK < :now",
        ExpressionAttributeValues: {
          ":gsi1pk": "SESSION_EXPIRY",
          ":now": now,
        },
      })
    );

    // Delete expired sessions
    if (result.Items && result.Items.length > 0) {
      const deletePromises = result.Items.map((item) =>
        docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item["PK"],
              SK: item["SK"],
            },
          })
        )
      );

      await Promise.all(deletePromises);
    }
  }

  // User operations
  static async createUser(user: UserEntity): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  }

  static async getUserByEmail(email: string): Promise<UserEntity | null> {
    // Query using GSI1 to find user by email
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
        ExpressionAttributeValues: {
          ":gsi1pk": "USER_EMAIL",
          ":gsi1sk": email.toLowerCase(),
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as UserEntity) || null;
  }

  static async getUserById(userId: string): Promise<UserEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
      })
    );

    return (result.Item as UserEntity) || null;
  }

  static async getUserByGoogleId(googleId: string): Promise<UserEntity | null> {
    // Query using GSI2 to find user by Google ID
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :gsi2pk AND GSI2SK = :gsi2sk",
        ExpressionAttributeValues: {
          ":gsi2pk": "USER_GOOGLE",
          ":gsi2sk": googleId,
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as UserEntity) || null;
  }

  static async getUserByUsername(username: string): Promise<UserEntity | null> {
    // Query using GSI3 to find user by username
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :gsi3pk AND GSI3SK = :gsi3sk",
        ExpressionAttributeValues: {
          ":gsi3pk": "USER_USERNAME",
          ":gsi3sk": username.toLowerCase(),
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as UserEntity) || null;
  }

  static async updateUser(
    userId: string,
    updates: Partial<UserEntity>
  ): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpression.length === 0) return;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  }

  // User session operations
  static async createUserSession(session: UserSessionEntity): Promise<void> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: session,
        })
      );
    } catch (err) {
      console.error("[DDB] Failed to write user session", {
        pk: session.PK,
        table: TABLE_NAME,
        err,
      });
      throw err;
    }
  }

  static async getUserSession(
    sessionId: string
  ): Promise<UserSessionEntity | null> {
    // Diagnostic logging for debugging session bug
    console.log("[DDB] getUserSession called:", {
      sessionId,
      table: TABLE_NAME,
      region: process.env["AWS_REGION"],
      env: {
        IS_OFFLINE: process.env["IS_OFFLINE"],
        NODE_ENV: process.env["NODE_ENV"],
      },
    });

    const queryKey = {
      PK: `SESSION#${sessionId}`,
      SK: "METADATA",
    };

    console.log("🔍 DIAGNOSTIC - Exact DynamoDB query:", {
      TableName: TABLE_NAME,
      Key: queryKey,
    });

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: queryKey,
      })
    );

    console.log("🔍 DIAGNOSTIC - DynamoDB result:", {
      hasItem: !!result.Item,
      item: result.Item
        ? {
            PK: result.Item["PK"],
            SK: result.Item["SK"],
            sessionId: result.Item["sessionId"],
            userId: result.Item["userId"],
          }
        : null,
    });

    return (result.Item as UserSessionEntity) || null;
  }

  static async deleteUserSession(sessionId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: "METADATA",
        },
      })
    );
  }

  static async updateUserSessionLastAccessed(sessionId: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET lastAccessedAt = :lastAccessedAt",
        ExpressionAttributeValues: {
          ":lastAccessedAt": new Date().toISOString(),
        },
      })
    );
  }

  static async cleanupExpiredUserSessions(): Promise<void> {
    const now = new Date().toISOString();

    // Query for expired user sessions using GSI1
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK < :now",
        ExpressionAttributeValues: {
          ":gsi1pk": "USER_SESSION_EXPIRY",
          ":now": now,
        },
      })
    );

    // Delete expired sessions
    if (result.Items && result.Items.length > 0) {
      const deletePromises = result.Items.map((item) =>
        docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item["PK"],
              SK: item["SK"],
            },
          })
        )
      );

      await Promise.all(deletePromises);
    }
  }

  // Email verification token operations (for Phase 2)
  static async createEmailVerificationToken(
    token: EmailVerificationTokenEntity
  ): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: token,
      })
    );
  }

  static async getEmailVerificationToken(
    token: string
  ): Promise<EmailVerificationTokenEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `EMAIL_VERIFICATION#${token}`,
          SK: "METADATA",
        },
      })
    );

    return (result.Item as EmailVerificationTokenEntity) || null;
  }

  static async deleteEmailVerificationToken(token: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `EMAIL_VERIFICATION#${token}`,
          SK: "METADATA",
        },
      })
    );
  }

  static async cleanupExpiredEmailTokens(): Promise<void> {
    const now = new Date().toISOString();

    // Query for expired email verification tokens using GSI1
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK < :now",
        ExpressionAttributeValues: {
          ":gsi1pk": "EMAIL_VERIFICATION_EXPIRY",
          ":now": now,
        },
      })
    );

    // Delete expired tokens
    if (result.Items && result.Items.length > 0) {
      const deletePromises = result.Items.map((item) =>
        docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: item["PK"],
              SK: item["SK"],
            },
          })
        )
      );

      await Promise.all(deletePromises);
    }
  }

  // User interaction operations
  static async createUserInteraction(
    interaction: UserInteractionEntity
  ): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: interaction,
        ConditionExpression:
          "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );
  }

  static async deleteUserInteraction(
    userId: string,
    interactionType: "like" | "bookmark",
    targetId: string
  ): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `INTERACTION#${interactionType}#${targetId}`,
        },
      })
    );
  }

  static async getUserInteraction(
    userId: string,
    interactionType: "like" | "bookmark",
    targetId: string
  ): Promise<UserInteractionEntity | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `INTERACTION#${interactionType}#${targetId}`,
        },
      })
    );

    return (result.Item as UserInteractionEntity) || null;
  }

  static async getUserInteractions(
    userId: string,
    interactionType: "like" | "bookmark",
    limit: number = 20,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<{
    interactions: UserInteractionEntity[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk_prefix": `INTERACTION#${interactionType}#`,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const response: {
      interactions: UserInteractionEntity[];
      lastEvaluatedKey?: Record<string, any>;
    } = {
      interactions: (result.Items as UserInteractionEntity[]) || [],
    };

    if (result.LastEvaluatedKey) {
      response.lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return response;
  }

  static async getInteractionCounts(
    _targetType: "album" | "media",
    targetId: string
  ): Promise<{
    likeCount: number;
    bookmarkCount: number;
  }> {
    // Get like count
    const likeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": `INTERACTION#like#${targetId}`,
        },
        Select: "COUNT",
      })
    );

    // Get bookmark count
    const bookmarkResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": `INTERACTION#bookmark#${targetId}`,
        },
        Select: "COUNT",
      })
    );

    return {
      likeCount: likeResult.Count || 0,
      bookmarkCount: bookmarkResult.Count || 0,
    };
  }

  static async getUserInteractionStatus(
    userId: string,
    targetId: string
  ): Promise<{
    userLiked: boolean;
    userBookmarked: boolean;
  }> {
    // Check if user liked the target
    const likeResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `INTERACTION#like#${targetId}`,
        },
      })
    );

    // Check if user bookmarked the target
    const bookmarkResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `INTERACTION#bookmark#${targetId}`,
        },
      })
    );

    return {
      userLiked: !!likeResult.Item,
      userBookmarked: !!bookmarkResult.Item,
    };
  }

  static async getTotalLikesReceivedOnUserContent(
    userId: string
  ): Promise<number> {
    // First, get all user's albums
    const userAlbumsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "ALBUM#",
        },
      })
    );

    const userAlbums = userAlbumsResult.Items || [];
    const albumIds = userAlbums.map((album: any) =>
      album["SK"].replace("ALBUM#", "")
    );

    if (albumIds.length === 0) {
      return 0;
    }

    // Count likes on all user's albums
    let totalLikes = 0;

    for (const albumId of albumIds) {
      try {
        const likesResult = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk",
            ExpressionAttributeValues: {
              ":gsi1pk": `INTERACTION#like#${albumId}`,
            },
            Select: "COUNT",
          })
        );

        totalLikes += likesResult.Count || 0;
      } catch (error) {
        console.warn(`Failed to count likes for album ${albumId}:`, error);
      }
    }

    return totalLikes;
  }

  static async getTotalBookmarksReceivedOnUserContent(
    userId: string
  ): Promise<number> {
    // First, get all user's albums
    const userAlbumsResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": "ALBUM#",
        },
      })
    );

    const userAlbums = userAlbumsResult.Items || [];
    const albumIds = userAlbums.map((album: any) =>
      album["SK"].replace("ALBUM#", "")
    );

    if (albumIds.length === 0) {
      return 0;
    }

    // Count bookmarks on all user's albums
    let totalBookmarks = 0;

    for (const albumId of albumIds) {
      try {
        const bookmarksResult = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk",
            ExpressionAttributeValues: {
              ":gsi1pk": `INTERACTION#bookmark#${albumId}`,
            },
            Select: "COUNT",
          })
        );

        totalBookmarks += bookmarksResult.Count || 0;
      } catch (error) {
        console.warn(`Failed to count bookmarks for album ${albumId}:`, error);
      }
    }

    return totalBookmarks;
  }

  // Cleanup methods for orphaned interactions
  static async deleteAllInteractionsForTarget(targetId: string): Promise<void> {
    console.log(`🧹 Cleaning up all interactions for target: ${targetId}`);

    // Delete all likes for this target and decrement counts
    const likeCount = await this.deleteInteractionsByType(targetId, "like");

    // Delete all bookmarks for this target and decrement counts
    const bookmarkCount = await this.deleteInteractionsByType(
      targetId,
      "bookmark"
    );

    // If this is an album, decrement the counts on the album itself
    // Note: For media, we don't currently store individual media interaction counts
    try {
      const album = await this.getAlbum(targetId);
      if (album) {
        // This is an album, decrement the counts
        if (likeCount > 0) {
          await this.incrementAlbumLikeCount(targetId, -likeCount);
        }
        if (bookmarkCount > 0) {
          await this.incrementAlbumBookmarkCount(targetId, -bookmarkCount);
        }
        console.log(
          `📉 Decremented album counts: ${likeCount} likes, ${bookmarkCount} bookmarks`
        );
      }
    } catch (error) {
      // Target is not an album or doesn't exist, which is expected for media or deleted items
      console.log(
        `📝 Target ${targetId} is not an album or doesn't exist (expected for media)`
      );
    }
  }

  private static async deleteInteractionsByType(
    targetId: string,
    interactionType: "like" | "bookmark"
  ): Promise<number> {
    try {
      // Query GSI1 to find all interactions for this target
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :gsi1pk",
          ExpressionAttributeValues: {
            ":gsi1pk": `INTERACTION#${interactionType}#${targetId}`,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        console.log(
          `📭 No ${interactionType} interactions found for target: ${targetId}`
        );
        return 0;
      }

      console.log(
        `🗑️  Deleting ${result.Items.length} ${interactionType} interactions for target: ${targetId}`
      );

      // Delete each interaction in batches
      const batchSize = 25; // DynamoDB batch write limit
      for (let i = 0; i < result.Items.length; i += batchSize) {
        const batch = result.Items.slice(i, i + batchSize);

        const deleteRequests = batch.map((item: any) => ({
          DeleteRequest: {
            Key: {
              PK: item["PK"],
              SK: item["SK"],
            },
          },
        }));

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: deleteRequests,
            },
          })
        );
      }

      console.log(
        `✅ Deleted ${result.Items.length} ${interactionType} interactions for target: ${targetId}`
      );
      return result.Items.length;
    } catch (error) {
      console.error(
        `❌ Error deleting ${interactionType} interactions for target ${targetId}:`,
        error
      );
      throw error;
    }
  }
}
