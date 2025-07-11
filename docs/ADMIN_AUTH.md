# Admin Authentication System

This document describes the admin authentication system implemented for the Fabularius.art gallery admin panel.

## Overview

The admin authentication system provides secure session-based authentication for administrative users. It includes:

- Session-based authentication with DynamoDB storage
- HTTP-only cookies for session management
- Secure password hashing using bcrypt
- Session validation middleware
- Admin login/logout/me endpoints

## Architecture

### Database Schema

The system uses a single-table DynamoDB design with the following entity types:

#### Admin User Entity

```
PK: "ADMIN#{adminId}"
SK: "METADATA"
GSI1PK: "ADMIN_USERNAME"
GSI1SK: "{username}"
EntityType: "AdminUser"
adminId: string
username: string
passwordHash: string (bcrypt hashed)
salt: string
createdAt: string (ISO 8601)
isActive: boolean
```

#### Admin Session Entity

```
PK: "SESSION#{sessionId}"
SK: "METADATA"
GSI1PK: "SESSION_EXPIRY"
GSI1SK: "{expiresAt}#{sessionId}"
EntityType: "AdminSession"
sessionId: string
adminId: string
adminUsername: string
createdAt: string (ISO 8601)
expiresAt: string (ISO 8601)
lastAccessedAt: string (ISO 8601)
```

### API Endpoints

#### POST /admin/login

Authenticates an admin user and creates a session.

**Request:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "admin": {
    "adminId": "uuid",
    "username": "admin",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "isActive": true
  },
  "sessionId": "uuid"
}
```

**Cookies Set:**

- `admin_session`: HTTP-only, Secure, SameSite=Strict session cookie

#### POST /admin/logout

Logs out the current admin user and destroys the session.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /admin/me

Returns information about the currently authenticated admin user.

**Response:**

```json
{
  "success": true,
  "data": {
    "admin": {
      "adminId": "uuid",
      "username": "admin",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "isActive": true
    },
    "session": {
      "sessionId": "uuid",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "expiresAt": "2023-01-02T00:00:00.000Z",
      "lastAccessedAt": "2023-01-01T12:00:00.000Z"
    }
  }
}
```

## Security Features

### Password Security

- Passwords are hashed using bcrypt with 12 salt rounds
- Individual salt generated for each password
- Password strength validation enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Session Security

- Sessions expire after 24 hours by default
- HTTP-only cookies prevent XSS attacks
- Secure flag ensures HTTPS-only transmission
- SameSite=Strict prevents CSRF attacks
- Session cleanup for expired sessions
- Last accessed time tracking

### Rate Limiting

- Basic IP-based logging for login attempts
- Failed login attempts are logged for monitoring

## Setup Instructions

### 1. Deploy the Infrastructure

The admin authentication functions are included in the SAM template. Deploy using:

```bash
sam build
sam deploy
```

### 2. Create Initial Admin User

Use the provided script to create the first admin user:

```bash
# Set the DynamoDB table name environment variable
export DYNAMODB_TABLE="dev-fabularius-media"

# Create admin user
node scripts/create-admin.js admin "MySecurePassword123!"
```

### 3. Environment Variables

Ensure the following environment variables are set:

- `DYNAMODB_TABLE`: Name of the DynamoDB table
- `ENVIRONMENT`: Environment name (dev, staging, prod)

## Usage Examples

### Frontend Integration

```typescript
// Login
const loginResponse = await fetch("/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    username: "admin",
    password: "password",
  }),
});

// Check authentication status
const meResponse = await fetch("/admin/me", {
  credentials: "include",
});

// Logout
const logoutResponse = await fetch("/admin/logout", {
  method: "POST",
  credentials: "include",
});
```

### Session Validation Middleware

```typescript
import { AuthMiddleware } from "./middleware";

// In your Lambda function
const validation = await AuthMiddleware.validateSession(event);
if (!validation.isValid) {
  return ResponseUtil.unauthorized("Authentication required");
}

// Access admin info
const admin = validation.admin;
const session = validation.session;
```

## File Structure

```
backend/
├── functions/admin/auth/
│   ├── login.ts          # Admin login endpoint
│   ├── logout.ts         # Admin logout endpoint
│   ├── me.ts            # Get current admin info
│   └── middleware.ts    # Session validation middleware
├── shared/
│   ├── types/index.ts   # Admin-related TypeScript types
│   └── utils/
│       ├── admin.ts     # Admin utility functions
│       └── dynamodb.ts  # Database operations (updated)
└── scripts/
    └── create-admin.js  # Script to create admin users
```

## Security Considerations

1. **Password Storage**: Never store plain text passwords. Always use bcrypt hashing.

2. **Session Management**:

   - Sessions should be invalidated on logout
   - Implement session cleanup for expired sessions
   - Consider implementing session limits per user

3. **Cookie Security**:

   - Always use HTTP-only cookies for sessions
   - Use Secure flag in production (HTTPS)
   - Implement proper SameSite policies

4. **Rate Limiting**:

   - Implement proper rate limiting for login endpoints
   - Consider account lockout after failed attempts
   - Monitor and alert on suspicious activity

5. **Environment Security**:
   - Use different admin credentials per environment
   - Rotate passwords regularly
   - Implement proper access controls

## Monitoring and Logging

The system logs the following events:

- Successful login attempts
- Failed login attempts
- Session validation failures
- Admin user creation

Monitor CloudWatch logs for:

- Unusual login patterns
- Failed authentication attempts
- Session-related errors

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
2. **Role-based Access Control (RBAC)**
3. **Account lockout after failed attempts**
4. **Password reset functionality**
5. **Admin user management interface**
6. **Audit logging for admin actions**
7. **Session management dashboard**
