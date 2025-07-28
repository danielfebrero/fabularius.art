# User Interactions

This document provides a detailed overview of the user interaction system for the PornSpot.ai application, which includes features like "likes" and "bookmarks".

## Interaction System

The interaction system allows users to engage with content by liking or bookmarking albums and media items.

### Interaction Types

- **Like**: A user can like an album or a media item.
- **Bookmark**: A user can bookmark an album or a media item for later viewing.

### API Endpoints

- `POST /user/interactions/like`: Like or unlike an item.
- `POST /user/interactions/bookmark`: Bookmark or unbookmark an item.
- `GET /user/interactions/likes`: Get a list of items liked by the user.
- `GET /user/interactions/bookmarks`: Get a list of items bookmarked by the user.

## Database Schema

User interactions are stored in the same DynamoDB table as other entities, following the single-table design pattern.

### `UserInteraction` Entity

- **PK**: `USER#<userId>`
- **SK**: `INTERACTION#<interactionType>#<targetId>`
- **GSI1PK**: `MEDIA_INTERACTION#<targetId>`
- **GSI1SK**: `<interactionType>#<userId>`
- **EntityType**: `UserInteraction`

| Attribute         | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `userId`          | `string` | The ID of the user who made the interaction.    |
| `interactionType` | `string` | The type of interaction (`like` or `bookmark`). |
| `targetType`      | `string` | The type of the target (`album` or `media`).    |
| `targetId`        | `string` | The ID of the target item.                      |
| `createdAt`       | `string` | The ISO 8601 timestamp of the interaction.      |

## Backend Implementation

### Creating and Deleting Interactions

- **Handlers**:
  - [`backend/functions/user/interactions/like.ts`](../backend/functions/user/interactions/like.ts)
  - [`backend/functions/user/interactions/bookmark.ts`](../backend/functions/user/interactions/bookmark.ts)
- **Process**:
  1.  The user's session is validated to ensure they are authenticated.
  2.  The request body is parsed to get the `targetType`, `targetId`, and `action` (`add` or `remove`).
  3.  The target item (album or media) is verified to exist.
  4.  If the action is `add`, a new `UserInteraction` item is created in the database.
  5.  If the action is `remove`, the corresponding `UserInteraction` item is deleted from the database.

### Retrieving Interactions

- **Handlers**:
  - [`backend/functions/user/interactions/get-likes.ts`](../backend/functions/user/interactions/get-likes.ts)
  - [`backend/functions/user/interactions/get-bookmarks.ts`](../backend/functions/user/interactions/get-bookmarks.ts)
- **Process**:
  1.  The user's session is validated.
  2.  The `getUserInteractions` function from `DynamoDBService` is called to retrieve a paginated list of interactions for the user.
  3.  The details of the target items (albums or media) are fetched to enrich the response.

## Frontend Implementation

The frontend uses custom hooks to interact with the user interactions API. These hooks provide a simple interface for components to like, bookmark, and retrieve liked or bookmarked items.

- `useLikes`: Manages the state for liked items (supports both current user and profile views via `user` parameter)
- `useBookmarks`: Manages the state for bookmarked items

These hooks are then used in components to display like/bookmark buttons and to show lists of liked or bookmarked items in the user's dashboard and profile pages.
