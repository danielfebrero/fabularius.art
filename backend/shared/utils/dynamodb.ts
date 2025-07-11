import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { AlbumEntity, MediaEntity } from "../types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env["DYNAMODB_TABLE"]!;

export class DynamoDBService {
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
    albums: AlbumEntity[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
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

    const response: {
      albums: AlbumEntity[];
      lastEvaluatedKey?: Record<string, any>;
    } = {
      albums: (result.Items as AlbumEntity[]) || [],
    };

    if (result.LastEvaluatedKey) {
      response.lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return response;
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
}
