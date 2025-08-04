# Admin Authentication Query Hook Migration

## Overview

Successfully migrated `useAdmin.ts` from custom state management to TanStack Query patterns with `useAdminQuery.ts`, providing improved caching, optimistic updates, and better session management.

## New Admin Authentication Hooks

### Core Hooks

- **`useAdminProfile()`** - Fetches and caches current admin profile
- **`useAdminLogin()`** - Admin login mutation with cache updates
- **`useAdminLogout()`** - Admin logout mutation with cache clearing
- **`useCheckAdminAuth()`** - Manual admin authentication check
- **`useRefreshAdminProfile()`** - Manual profile refresh utility

## Migration Changes

### Before (Legacy `useAdmin.ts`)

```typescript
import { useAdmin } from "@/hooks/useAdmin";

function AdminComponent() {
  const { user, loading, error, login, logout, checkAuth } = useAdmin();

  // Manual state management
  // Session storage handling
  // Direct fetch calls
}
```

### After (TanStack Query `useAdminQuery.ts`)

```typescript
import {
  useAdminProfile,
  useAdminLogin,
  useAdminLogout,
} from "@/hooks/queries/useAdminQuery";

function AdminComponent() {
  const { data: adminData, isLoading, error } = useAdminProfile();
  const loginMutation = useAdminLogin();
  const logoutMutation = useAdminLogout();

  // Automatic caching and state management
  // Optimistic updates
  // Background refetching
}
```

## Key Improvements

### 1. **Centralized API Management**

- Uses `adminApi` from `/lib/api/admin.ts`
- Follows established API patterns
- Consistent error handling

### 2. **Smart Caching Strategy**

- 5-minute stale time for admin profile
- 10-minute garbage collection time
- Background refetching on window focus
- Automatic retry on failures

### 3. **Optimistic Session Management**

- Login pre-populates cache with response data
- Logout clears all admin-related cache
- Auth check updates cache with fresh data
- Failed auth check clears stale cache

### 4. **Type Safety**

- Full TypeScript support
- Proper response type definitions
- Type-safe query keys

## Cache Strategy

### Query Keys Structure

```typescript
// Admin profile
queryKeys.admin.profile();
// → ["admin", "profile"]

// All admin data
queryKeys.admin.all();
// → ["admin"]
```

### Cache Invalidation

```typescript
// Refresh admin profile
invalidateQueries.adminProfile();

// Clear all admin cache
invalidateQueries.admin();
```

## Implementation Details

### Admin API Module (`/lib/api/admin.ts`)

- **`adminApi.login()`** - Admin authentication
- **`adminApi.logout()`** - Session termination
- **`adminApi.me()`** - Current admin profile

### Query Configuration

- **Stale Time**: 5 minutes (admin data changes infrequently)
- **GC Time**: 10 minutes (shorter than user data)
- **Retry**: 2 attempts (admin auth is critical)
- **Refetch on Focus**: Enabled (security sensitivity)

### Error Handling

- Failed login attempts don't affect cache
- Failed auth checks clear potentially stale cache
- Network errors trigger automatic retries
- Clear error messages for admin users

## Testing Recommendations

### 1. **Authentication Flow**

- Test login → cache population → profile access
- Test logout → cache clearing → redirect handling
- Test auth check → cache refresh → state updates

### 2. **Cache Behavior**

- Verify 5-minute stale time works correctly
- Test background refetching on window focus
- Confirm cache invalidation on mutations

### 3. **Error Scenarios**

- Test failed login → no cache pollution
- Test expired session → cache clearing
- Test network errors → retry behavior

## Migration Benefits

### Performance

- **Cache Hit Rate**: Eliminates redundant admin profile calls
- **Background Updates**: Fresh data without blocking UI
- **Optimistic Updates**: Instant logout/cache clearing

### Developer Experience

- **Consistent Patterns**: Follows established TanStack Query patterns
- **Type Safety**: Full TypeScript support throughout
- **Error Handling**: Centralized error management

### User Experience

- **Faster Navigation**: Cached admin profile data
- **Smooth Logout**: Instant cache clearing
- **Better Error Recovery**: Automatic retries and clear messages

## Future Enhancements

### 1. **Session Monitoring**

- Add periodic session validation
- Implement session expiry warnings
- Auto-logout on session expiration

### 2. **Advanced Caching**

- Implement admin-specific cache warming
- Add predictive data loading for admin workflows
- Consider admin action history caching

### 3. **Real-time Updates**

- WebSocket integration for admin notifications
- Real-time session status updates
- Live admin activity monitoring

## Related Documentation

- [TanStack Query Implementation](TANSTACK_QUERY_IMPLEMENTATION.md)
- [Admin Authentication](ADMIN_AUTH.md)
- [API Documentation](API.md)
- [Frontend Architecture](FRONTEND_ARCHITECTURE.md)

---

**Status**: ✅ Complete
**Next Step**: Update admin components to use new hooks
**Migration Date**: August 4, 2025
