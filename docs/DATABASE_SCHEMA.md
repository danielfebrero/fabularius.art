# Database Schema

This document provides a detailed overview of the DynamoDB database schema for the PornSpot.ai application. The database uses a single-table design, which is a common pattern for DynamoDB that allows for efficient data retrieval with a single request.

## Single-Table Design

All entities in the application are stored in a single DynamoDB table. This design is optimized for the access patterns of the application, and it minimizes the number of requests needed to fetch data. Each item in the table has a `PK` (Partition Key) and a `SK` (Sort Key) that define its identity and relationships with other items.

## Key Schema

- **Partition Key (PK)**: The primary identifier for an item. It is composed of the entity type and a unique ID (e.g., `ALBUM#<albumId>`).
- **Sort Key (SK)**: Used to define relationships between items and to sort items within a partition. For a primary item, the sort key is often `METADATA`. For related items, it can be a combination of the entity type and other attributes.

## Global Secondary Indexes (GSIs)

The table uses Global Secondary Indexes (GSIs) to support additional query patterns.

- **GSI1**: Used for querying items by type and other attributes.
  - `GSI1PK`: The partition key for GSI1.
  - `GSI1SK`: The sort key for GSI1.
- **GSI2**: Used for querying users by their Google ID.
  - `GSI2PK`: The partition key for GSI2.
  - `GSI2SK`: The sort key for GSI2.

## Entity Schemas

### Album Entity

Represents a collection of media items.

- **PK**: `ALBUM#<albumId>`
- **SK**: `METADATA`
- **GSI1PK**: `ALBUM`
- **GSI1SK**: `<createdAt>#<albumId>`
- **EntityType**: `Album`

| Attribute       | Type       | Description                                |
| --------------- | ---------- | ------------------------------------------ |
| `id`            | `string`   | The unique ID of the album.                |
| `title`         | `string`   | The title of the album.                    |
| `tags`          | `string[]` | Optional tags for the album.               |
| `coverImageUrl` | `string`   | The URL of the album's cover image.        |
| `thumbnailUrls` | `object`   | URLs for different thumbnail sizes.        |
| `createdAt`     | `string`   | The ISO 8601 timestamp of creation.        |
| `updatedAt`     | `string`   | The ISO 8601 timestamp of the last update. |
| `mediaCount`    | `number`   | The number of media items in the album.    |
| `isPublic`      | `boolean`  | Whether the album is public.               |

### Media Entity

Represents a single media item (e.g., an image).

- **PK**: `ALBUM#<albumId>`
- **SK**: `MEDIA#<mediaId>`
- **GSI1PK**: `MEDIA#<albumId>`
- **GSI1SK**: `<createdAt>#<mediaId>`
- **EntityType**: `Media`

| Attribute          | Type     | Description                                |
| ------------------ | -------- | ------------------------------------------ |
| `id`               | `string` | The unique ID of the media item.           |
| `albumId`          | `string` | The ID of the album it belongs to.         |
| `filename`         | `string` | The name of the file in S3.                |
| `originalFilename` | `string` | The original name of the uploaded file.    |
| `mimeType`         | `string` | The MIME type of the file.                 |
| `size`             | `number` | The size of the file in bytes.             |
| `width`            | `number` | The width of the image in pixels.          |
| `height`           | `number` | The height of the image in pixels.         |
| `url`              | `string` | The URL of the original file.              |
| `thumbnailUrls`    | `object` | URLs for different thumbnail sizes.        |
| `status`           | `string` | The processing status of the media item.   |
| `createdAt`        | `string` | The ISO 8601 timestamp of creation.        |
| `updatedAt`        | `string` | The ISO 8601 timestamp of the last update. |
| `metadata`         | `object` | Additional metadata for the media item.    |

### Admin User Entity

Represents an administrative user.

- **PK**: `ADMIN#<adminId>`
- **SK**: `METADATA`
- **GSI1PK**: `ADMIN_USERNAME`
- **GSI1SK**: `<username>`
- **EntityType**: `AdminUser`

| Attribute      | Type      | Description                             |
| -------------- | --------- | --------------------------------------- |
| `adminId`      | `string`  | The unique ID of the admin user.        |
| `username`     | `string`  | The username of the admin user.         |
| `passwordHash` | `string`  | The hashed password.                    |
| `salt`         | `string`  | The salt used for hashing the password. |
| `createdAt`    | `string`  | The ISO 8601 timestamp of creation.     |
| `isActive`     | `boolean` | Whether the admin user is active.       |

### Admin Session Entity

Represents a session for an administrative user.

- **PK**: `SESSION#<sessionId>`
- **SK**: `METADATA`
- **GSI1PK**: `SESSION_EXPIRY`
- **GSI1SK**: `<expiresAt>#<sessionId>`
- **EntityType**: `AdminSession`

| Attribute        | Type     | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `sessionId`      | `string` | The unique ID of the session.                    |
| `adminId`        | `string` | The ID of the admin user this session is for.    |
| `adminUsername`  | `string` | The username of the admin user.                  |
| `createdAt`      | `string` | The ISO 8601 timestamp of creation.              |
| `expiresAt`      | `string` | The ISO 8601 timestamp when the session expires. |
| `lastAccessedAt` | `string` | The ISO 8601 timestamp of the last access.       |
| `ttl`            | `number` | The Time To Live value for DynamoDB TTL.         |

### User Entity

Represents a regular user.

- **PK**: `USER#<userId>`
- **SK**: `METADATA`
- **GSI1PK**: `USER_EMAIL`
- **GSI1SK**: `<email>`
- **GSI2PK**: `USER_GOOGLE`
- **GSI2SK**: `<googleId>`
- **EntityType**: `User`

| Attribute       | Type      | Description                           |
| --------------- | --------- | ------------------------------------- |
| `userId`        | `string`  | The unique ID of the user.            |
| `email`         | `string`  | The email of the user.                |
| `passwordHash`  | `string`  | The hashed password.                  |
| `googleId`      | `string`  | The user's Google ID for OAuth.       |
| `createdAt`     | `string`  | The ISO 8601 timestamp of creation.   |
| `emailVerified` | `boolean` | Whether the user's email is verified. |

### User Session Entity

Represents a session for a regular user.

- **PK**: `USER_SESSION#<sessionId>`
- **SK**: `METADATA`
- **GSI1PK**: `USER_SESSION_EXPIRY`
- **GSI1SK**: `<expiresAt>#<sessionId>`
- **EntityType**: `UserSession`

| Attribute        | Type     | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `sessionId`      | `string` | The unique ID of the session.                    |
| `userId`         | `string` | The ID of the user this session is for.          |
| `createdAt`      | `string` | The ISO 8601 timestamp of creation.              |
| `expiresAt`      | `string` | The ISO 8601 timestamp when the session expires. |
| `lastAccessedAt` | `string` | The ISO 8601 timestamp of the last access.       |

### Email Verification Token Entity

Represents a token for verifying a user's email.

- **PK**: `EMAIL_VERIFICATION_TOKEN#<token>`
- **SK**: `METADATA`
- **EntityType**: `EmailVerificationToken`

| Attribute   | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `token`     | `string` | The verification token.                        |
| `userId`    | `string` | The ID of the user this token is for.          |
| `expiresAt` | `string` | The ISO 8601 timestamp when the token expires. |

### User Interaction Entity

Represents a user's interaction with a media item (e.g., a like or a bookmark).

- **PK**: `USER#<userId>`
- **SK**: `INTERACTION#<interactionType>#<mediaId>`
- **GSI1PK**: `MEDIA_INTERACTION#<mediaId>`
- **GSI1SK**: `<interactionType>#<userId>`
- **EntityType**: `UserInteraction`

| Attribute         | Type     | Description                                         |
| ----------------- | -------- | --------------------------------------------------- |
| `userId`          | `string` | The ID of the user who made the interaction.        |
| `mediaId`         | `string` | The ID of the media item.                           |
| `interactionType` | `string` | The type of interaction (e.g., `like`, `bookmark`). |
| `createdAt`       | `string` | The ISO 8601 timestamp of the interaction.          |

## Entity Relationship Diagram

```mermaid
erDiagram
    ALBUM ||--o{ MEDIA : contains
    USER ||--o{ USER_INTERACTION : "interacts with"
    MEDIA ||--o{ USER_INTERACTION : "is interacted with by"
    USER ||--o{ USER_SESSION : "has"
    ADMIN_USER ||--o{ ADMIN_SESSION : "has"
    USER ||--o{ EMAIL_VERIFICATION_TOKEN : "has"

    ALBUM {
        string PK "ALBUM#<albumId>"
        string SK "METADATA"
        string GSI1PK "ALBUM"
        string GSI1SK "<createdAt>#<albumId>"
    }

    MEDIA {
        string PK "ALBUM#<albumId>"
        string SK "MEDIA#<mediaId>"
        string GSI1PK "MEDIA#<albumId>"
        string GSI1SK "<createdAt>#<mediaId>"
    }

    ADMIN_USER {
        string PK "ADMIN#<adminId>"
        string SK "METADATA"
        string GSI1PK "ADMIN_USERNAME"
        string GSI1SK "<username>"
    }

    ADMIN_SESSION {
        string PK "SESSION#<sessionId>"
        string SK "METADATA"
        string GSI1PK "SESSION_EXPIRY"
        string GSI1SK "<expiresAt>#<sessionId>"
    }

    USER {
        string PK "USER#<userId>"
        string SK "METADATA"
        string GSI1PK "USER_EMAIL"
        string GSI1SK "<email>"
    }

    USER_SESSION {
        string PK "USER_SESSION#<sessionId>"
        string SK "METADATA"
        string GSI1PK "USER_SESSION_EXPIRY"
        string GSI1SK "<expiresAt>#<sessionId>"
    }

    EMAIL_VERIFICATION_TOKEN {
        string PK "EMAIL_VERIFICATION_TOKEN#<token>"
        string SK "METADATA"
    }

    USER_INTERACTION {
        string PK "USER#<userId>"
        string SK "INTERACTION#<type>#<mediaId>"
        string GSI1PK "MEDIA_INTERACTION#<mediaId>"
        string GSI1SK "<type>#<userId>"
    }
```
