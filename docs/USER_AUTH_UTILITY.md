# User Authentication Utility

The `UserAuthUtil` class provides a centralized, consistent way to handle user authentication across all Lambda functions in the PornSpot.ai backend.

## Overview

This utility standardizes the authentication pattern used throughout the application:

1. **Authorizer Context First**: Check for userId in `event.requestContext.authorizer` (set by API Gateway authorizers)
2. **Session Fallback**: Fall back to session validation for local development or missing authorizer context
3. **Anonymous Support**: Optionally allow anonymous access for public endpoints
4. **Role Integration**: Optionally fetch user role information when needed

## Usage

### Basic Authentication (Required)

```typescript
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (event: APIGatewayProxyEvent) => {
  // Extract user authentication - requires valid user
  const authResult = await UserAuthUtil.requireAuth(event);

  // Handle error response from authentication
  if (UserAuthUtil.isErrorResponse(authResult)) {
    return authResult; // Returns 401 Unauthorized response
  }

  const userId = authResult.userId!; // Non-null user ID
  console.log("✅ Authenticated user:", userId);

  // Your endpoint logic here...
};
```

### Authentication with Role Information

```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  // Extract user authentication with role information
  const authResult = await UserAuthUtil.requireAuth(event, {
    includeRole: true,
  });

  if (UserAuthUtil.isErrorResponse(authResult)) {
    return authResult;
  }

  const userId = authResult.userId!;
  const userRole = authResult.userRole || "user"; // "admin", "moderator", or "user"

  console.log("✅ Authenticated user:", userId);
  console.log("🎭 User role:", userRole);

  // Check permissions based on role
  if (userRole !== "admin") {
    return ResponseUtil.forbidden(event, "Admin access required");
  }

  // Admin-only logic here...
};
```

### Anonymous Access (Optional Authentication)

```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  // Allow anonymous access - userId may be null
  const authResult = await UserAuthUtil.allowAnonymous(event);

  if (UserAuthUtil.isErrorResponse(authResult)) {
    return authResult; // Should rarely happen with allowAnonymous
  }

  const userId = authResult.userId; // Can be null for anonymous users

  if (userId) {
    console.log("✅ Authenticated user:", userId);
    // Show personalized content
  } else {
    console.log("ℹ️ Anonymous user - showing public content only");
    // Show public content only
  }

  // Your endpoint logic here...
};
```

### Advanced Configuration

```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  // Custom configuration
  const authResult = await UserAuthUtil.extractUserAuth(event, {
    allowAnonymous: true, // Allow anonymous access
    includeRole: true, // Include role information
  });

  if (UserAuthUtil.isErrorResponse(authResult)) {
    return authResult;
  }

  const { userId, userRole, userEmail, authSource } = authResult;

  console.log("Auth result:", {
    userId: userId || "anonymous",
    userRole: userRole || "none",
    authSource, // "authorizer", "session", or "anonymous"
  });

  // Your endpoint logic here...
};
```

## API Reference

### UserAuthUtil.requireAuth()

Convenience method for cases where authentication is required.

**Parameters:**

- `event: APIGatewayProxyEvent` - The Lambda event
- `options?: { includeRole?: boolean }` - Optional configuration

**Returns:**

- `UserAuthResult` - Success result with user information
- `APIGatewayProxyResult` - Error response (401 Unauthorized or 500 Internal Error)

### UserAuthUtil.allowAnonymous()

Convenience method for cases where anonymous access is allowed.

**Parameters:**

- `event: APIGatewayProxyEvent` - The Lambda event
- `options?: { includeRole?: boolean }` - Optional configuration

**Returns:**

- `UserAuthResult` - Success result (userId may be null for anonymous users)
- `APIGatewayProxyResult` - Error response (rare, usually 500 Internal Error)

### UserAuthUtil.extractUserAuth()

Main method with full configuration options.

**Parameters:**

- `event: APIGatewayProxyEvent` - The Lambda event
- `options?: UserAuthOptions` - Configuration options

**Returns:**

- `UserAuthResult` - Success result with user information
- `APIGatewayProxyResult` - Error response

### UserAuthUtil.isErrorResponse()

Type guard to check if the result is an error response.

**Parameters:**

- `result: UserAuthResult | APIGatewayProxyResult` - The result to check

**Returns:**

- `boolean` - True if the result is an error response

## Types

### UserAuthOptions

```typescript
interface UserAuthOptions {
  /** Allow anonymous access when no user is authenticated */
  allowAnonymous?: boolean;

  /** Include role information in the returned user context */
  includeRole?: boolean;
}
```

### UserAuthResult

```typescript
interface UserAuthResult {
  /** The authenticated user's ID, or null for anonymous access */
  userId: string | null;

  /** The user's role if includeRole was requested */
  userRole?: string;

  /** The user's email address if available from session validation */
  userEmail?: string;

  /** Whether the user was authenticated via authorizer context or session fallback */
  authSource: "authorizer" | "session" | "anonymous";
}
```

## Migration from Old Pattern

### Before (Old Pattern)

```typescript
// OLD - Manual authentication handling
let userId = event.requestContext.authorizer?.["userId"];

if (!userId) {
  console.log(
    "⚠️ No userId from authorizer, falling back to session validation"
  );
  const validation = await UserAuthMiddleware.validateSession(event);

  if (!validation.isValid || !validation.user) {
    console.log("❌ Session validation failed");
    return ResponseUtil.unauthorized(event, "No user session found");
  }

  userId = validation.user.userId;
  console.log("✅ Got userId from session validation:", userId);
}
```

### After (New Pattern)

```typescript
// NEW - Centralized authentication utility
const authResult = await UserAuthUtil.requireAuth(event);

if (UserAuthUtil.isErrorResponse(authResult)) {
  return authResult;
}

const userId = authResult.userId!;
console.log("✅ Authenticated user:", userId);
```

## Benefits

1. **Consistency**: All functions use the same authentication pattern
2. **Less Boilerplate**: Reduces repetitive authentication code from ~15 lines to ~5 lines
3. **Better Error Handling**: Standardized error responses and logging
4. **Type Safety**: Strong typing with TypeScript interfaces
5. **Flexibility**: Support for both required and optional authentication
6. **Role Integration**: Built-in role fetching when needed
7. **Maintainability**: Changes to auth logic only need to be made in one place

## Logging

The utility provides consistent, detailed logging:

- **Authorizer Context**: Logs userId and role from authorizer
- **Session Fallback**: Logs when falling back to session validation
- **Role Fetching**: Logs when role information is requested and fetched
- **Success**: Logs successful authentication with user details
- **Errors**: Detailed error logging for debugging

## Error Handling

The utility handles various error scenarios:

- **No Authentication**: Returns 401 Unauthorized for required auth
- **Invalid Session**: Returns 401 Unauthorized for invalid sessions
- **Internal Errors**: Returns 500 Internal Error for unexpected failures
- **Anonymous Allowed**: Returns null userId without error when configured

This utility significantly improves the developer experience and maintains consistency across the entire authentication system.
