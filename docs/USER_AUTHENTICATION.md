# User Authentication

This document provides a comprehensive overview of the user authentication and session management system for the PornSpot.ai application.

## Authentication Flow

The user authentication system supports both email/password registration and Google OAuth.

```mermaid
graph TD
    A[Start] --> B{User chooses authentication method};
    B --> C[Email/Password];
    B --> D[Google OAuth];

    C --> E{User Registers};
    E --> F{Verification Email Sent};
    F --> G{User Verifies Email};
    G --> H{User Logs In};
    H --> I{Session Created};

    D --> J{User Signs in with Google};
    J --> K{Google Authenticates User};
    K --> L{Account Created/Linked};
    L --> I;

    I --> M[User is Authenticated];
```

## Email/Password Authentication

### 1. **Registration**

- **Endpoint**: `POST /user/auth/register`
- **Handler**: [`backend/functions/user/auth/register.ts`](../backend/functions/user/auth/register.ts)
- **Process**:
  1.  The user provides an email, password, and required username.
  2.  The system validates the email format, password strength, and username format.
  3.  The system checks that the username is unique across all users.
  4.  A new user is created in the database with `isEmailVerified` set to `false`.
  5.  A verification token is generated and sent to the user's email.

### 2. **Username Availability Check**

- **Endpoint**: `GET /user/auth/check-username?username={username}` or `POST /user/auth/check-username`
- **Handler**: [`backend/functions/user/auth/check-username.ts`](../backend/functions/user/auth/check-username.ts)
- **Process**:
  1.  The user provides a username to check for availability.
  2.  The system validates the username format (minimum 3 characters, alphanumeric with underscores/hyphens allowed).
  3.  The system checks if the username is already taken by querying the GSI3 index.
  4.  Returns availability status with appropriate message.
- **Usage**: This endpoint is designed for real-time username validation during registration with debouncing support.

### 3. **Email Verification**

- **Endpoint**: `GET /user/auth/verify-email`
- **Handler**: [`backend/functions/user/auth/verify-email.ts`](../backend/functions/user/auth/verify-email.ts)
- **Process**:
  1.  The user clicks the verification link in the email, which contains a verification token.
  2.  The system validates the token.
  3.  If the token is valid, the user's `isEmailVerified` status is set to `true`.
  4.  The verification token is deleted from the database.
  5.  A welcome email is sent to the user.

### 4. **Login**

- **Endpoint**: `POST /user/auth/login`
- **Handler**: [`backend/functions/user/auth/login.ts`](../backend/functions/user/auth/login.ts)
- **Process**:
  1.  The user provides their email and password.
  2.  The system checks if the user exists and if the email is verified.
  3.  The provided password is compared with the hashed password in the database.
  4.  If the credentials are valid, a new session is created and a session cookie is returned.

## Google OAuth Authentication

### 1. **OAuth Flow**

- **Endpoint**: `GET /user/auth/oauth/google/callback`
- **Handler**: [`backend/functions/user/auth/oauth-google.ts`](../backend/functions/user/auth/oauth-google.ts)
- **Process**:
  1. The user is redirected to Google's OAuth consent screen.
  2. After user grants permission, Google redirects back with an authorization code.
  3. The system exchanges the code for an access token and retrieves user information.
  4. If the user's email exists in the system, the Google account is linked to the existing user.
  5. If the user is new, a new account is created with Google OAuth provider.
  6. **Automatic Username Generation**: OAuth users receive a unique username in the format `{adjective}-{noun}-{number}` (e.g., `brilliant-eagle-042`).
  7. A session is created and the user is authenticated.

### 2. **Username Generation for OAuth Users**

OAuth users don't choose their username during registration. Instead, the system automatically generates a unique username using:

- **Format**: `{adjective}-{noun}-{number}`
- **Components**:
  - 500 predefined adjectives (e.g., "brilliant", "creative", "amazing")
  - 500 predefined nouns (e.g., "eagle", "mountain", "galaxy")
  - Numbers 001-999 (zero-padded to 3 digits)
- **Examples**: `brilliant-eagle-042`, `creative-mountain-158`, `amazing-galaxy-999`

#### Username Repair

For existing OAuth users who have basic usernames (e.g., email-based), the system automatically repairs their username to the new format when they log in:

- **Trigger**: Automatic on OAuth login if username doesn't match new format
- **Process**:
  1. System detects old/invalid username format
  2. Generates new username using the adjective-noun-number format
  3. Updates user record with new username
  4. Logs the repair action for monitoring

#### Implementation

The username generation is handled by the `UsernameGenerator` utility:

```typescript
// Generate a new random username
const username = await UsernameGenerator.generateUniqueUsername();

// Generate username preferring email base, fallback to random
const username = await UsernameGenerator.generateUsernameFromEmail(email);

// Repair existing user's username if needed
const username = await OAuthUserUtil.repairUsernameIfNeeded(user);
```

### 2. **Environment Variables**

The Google OAuth integration requires the following environment variables:

- `GOOGLE_CLIENT_ID`: Your Google application's client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google application's client secret (should be stored securely, e.g., in AWS Parameter Store).
- `FRONTEND_BASE_URL`: The base URL of your frontend application.

## Session Management

### Session Creation

- A new session is created upon successful login or OAuth authentication.
- A session is stored as a `UserSessionEntity` in the DynamoDB table.
- A secure, HTTP-only session cookie is set in the user's browser. The session duration is 30 days.

### Session Validation

- **Authorizer**: [`backend/functions/user/auth/authorizer.ts`](../backend/functions/user/auth/authorizer.ts)
- **Process**:
  1.  For each request to a protected endpoint, a Lambda authorizer is invoked.
  2.  The authorizer checks for the session cookie in the request headers.
  3.  The session ID is extracted from the cookie and used to retrieve the session from the database.
  4.  If the session is valid and not expired, the authorizer generates an IAM policy that allows the request to proceed.
  5.  The authorizer also passes user context (e.g., `userId`, `email`) to the downstream Lambda function.

### Authentication Redirects

The application supports automatic redirect functionality for unauthenticated users:

- **Login Redirects**: When an unauthenticated user attempts to access protected features (like, bookmark, add to album), they are automatically redirected to the login page with a `returnTo` parameter preserving their current location.
- **Post-Login Redirect**: After successful authentication, users are automatically redirected back to their original location using the `returnTo` parameter.
- **Implementation**:
  - Frontend components use the `useAuthRedirect` hook to handle redirects
  - Login form processes the `returnTo` query parameter for post-login navigation
  - Protected features in `ContentCard`, `LikeButton`, and `BookmarkButton` components automatically redirect unauthenticated users

### Session Expiration and Cleanup

- Sessions expire after 30 days of inactivity.
- The `cleanupExpiredUserSessions` function in [`backend/shared/utils/dynamodb.ts`](../backend/shared/utils/dynamodb.ts) is responsible for deleting expired sessions from the database. This is typically run as a scheduled task.

## Security Considerations

- **Password Hashing**: Passwords are hashed using `bcrypt` with a salt.
- **CSRF Protection**: The Google OAuth flow uses a `state` parameter to protect against Cross-Site Request Forgery (CSRF) attacks.
- **Secure Cookies**: Session cookies are configured as HTTP-only, secure, and `SameSite=Strict`.
- **Timing Attacks**: The login endpoint includes a delay to prevent timing attacks when a user does not exist.
- **Email Enumeration Protection**: The resend verification endpoint always returns the same response regardless of whether the email exists, account status, or verification state to prevent email enumeration attacks.
- **Enhanced Email Verification**: Verification emails include both clickable links and copy-pasteable tokens for improved user experience and reliability.
