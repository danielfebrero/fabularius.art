# OAuth Admin Setup

This document explains how the role-based admin system works for Google Login with admin privileges.

## Overview

The system uses a single user table with role-based permissions:

- **User Entities**: All users (including admins) are stored as `User` entities with a `role` field
- **Role-Based Access**: Users can have roles like `user`, `admin`, or `moderator`
- **OAuth Integration**: Google OAuth users can have any role assigned

## OAuth Admin Setup

### How It Works

1. A user record is created in the database with basic information
2. The user's role is assigned using the `update-user-role.js` script
3. When the user logs in with Google OAuth, the system:
   - Checks if a user exists with that email
   - Links the Google account to the existing user record
   - The user inherits the role from the database record

### Automatic Setup

The `start-local-backend.sh` script automatically:

- Prepares an OAuth user for `febrero.daniel@gmail.com`
- Assigns admin role to that user

### Manual Setup

To prepare an OAuth admin user manually:

```bash
# Step 1: Prepare the OAuth user (creates basic user record)
node scripts/prepare-oauth-user.js local febrero.daniel@gmail.com

# Step 2: Assign admin role
node scripts/update-user-role.js local admin febrero.daniel@gmail.com
```

### Role Management Script

The `update-user-role.js` script can be used to manage user roles:

```bash
# Syntax: node scripts/update-user-role.js <env> <role> <email>

# Examples:
node scripts/update-user-role.js local admin febrero.daniel@gmail.com
node scripts/update-user-role.js dev moderator someone@example.com
node scripts/update-user-role.js prod user regular@user.com
```

Available roles:

- `user` - Regular user with basic permissions
- `admin` - Full administrative access
- `moderator` - Content moderation permissions

### Admin Email Fallback

The system also includes a fallback mechanism in `backend/shared/utils/plan.ts` that automatically grants admin role to these emails:

- `admin@pornspot.ai`
- `daniel@pornspot.ai`
- `support@pornspot.ai`
- `febrero.daniel@gmail.com`

This provides redundancy in case the database role is not set.

## Login Process

1. User clicks "Sign in with Google" on the frontend
2. Google OAuth flow completes
3. Backend checks if user exists by email
4. If user exists, they get the role assigned in the database
5. If user doesn't exist but email is in the admin fallback list, they get admin role automatically
6. If user doesn't exist and not in fallback list, a new user account is created with `user` role
7. User is logged in with appropriate permissions

## Development Usage

After running `./scripts/start-local-backend.sh`, you can:

1. Login with Google OAuth using `febrero.daniel@gmail.com` and get admin privileges automatically

## Legacy System Removal

The old `AdminUser` entity system has been removed in favor of the role-based approach:

- ✅ **New**: Role-based users with `User` entities
- ❌ **Removed**: Separate `AdminUser` entities with username/password

## Security Notes

- Admin emails are hardcoded in the backend for fallback security
- Database roles take precedence over email fallback
- Adding new admin emails requires code deployment
- Role changes can be made via script without code changes
