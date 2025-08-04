# User Authentication Query Optimization

## Issue

Pages using `useUserProfile` were making repeated calls to `/me` endpoint even when users were unauthenticated (401 responses), causing unnecessary API traffic and potential performance issues.

## Root Cause

The `useUserProfile` hook was operating independently of the `UserContext` authentication state, leading to:

1. Duplicate API calls to `/me` endpoint
2. Continued querying even when `UserContext` had determined no authentication exists
3. Inefficient caching strategy for unauthenticated states

## Solution

### 1. Enhanced `useUserProfile` Hook

Modified `/frontend/src/hooks/queries/useUserQuery.ts` to:

- **Coordinate with UserContext**: Use `useUserContext()` to access centralized authentication state
- **Prevent unnecessary queries**: Disable queries when `UserContext` indicates no authentication
- **Respect initialization state**: Wait for `UserContext` to complete initialization before querying
- **Optimize cache initialization**: Pre-populate cache with `UserContext` data when available

### 2. UserContext Integration

Updated `UserContextType` interface and `UserContext` to expose `initializing` state:

- Added `initializing: boolean` to `UserContextType` interface
- Export `initializing` state from `UserProvider`
- Allow downstream hooks to coordinate with context initialization

### 3. Query Behavior Logic

```typescript
enabled: (() => {
  // If UserContext is still initializing, wait for it
  if (userContext?.initializing) {
    return false;
  }

  // If UserContext has definitively determined there's no user and isn't loading,
  // don't query
  if (!userContext?.user && !userContext?.loading) {
    return false;
  }

  // Otherwise, allow the query to proceed
  return true;
})(),
```

### 4. Cache Optimization

```typescript
// If UserContext already has user data, initialize the cache with it
initialData: userContext?.user ? {
  success: true,
  data: { user: userContext.user }
} : undefined,
```

## Benefits

1. **Reduced API Calls**: Prevents `/me` calls when user is clearly unauthenticated
2. **Better Performance**: Eliminates redundant 401 responses and retries
3. **Improved UX**: Faster page loads by leveraging cached authentication state
4. **Consistent State**: Single source of truth for authentication between UserContext and useUserProfile

## Implementation Details

### Files Modified

- `/frontend/src/hooks/queries/useUserQuery.ts` - Enhanced useUserProfile hook
- `/frontend/src/types/user.ts` - Added initializing property to UserContextType
- `/frontend/src/contexts/UserContext.tsx` - Export initializing state

### Backwards Compatibility

The changes are fully backwards compatible:

- Existing components using `useUserProfile` will automatically benefit
- No changes required to consuming components
- API response format remains unchanged

### Error Handling

The solution maintains existing error handling patterns:

- Authentication errors still cached for 15 minutes
- No retry for authentication failures
- Graceful degradation when UserContext is unavailable

## Testing Recommendations

1. **Unauthenticated Users**: Verify no `/me` calls after UserContext initialization
2. **Authenticated Users**: Confirm normal behavior and data freshness
3. **Login/Logout Flow**: Test cache invalidation and state synchronization
4. **Page Navigation**: Ensure no duplicate API calls during route changes

## Future Enhancements

1. **Sync UserContext Updates**: Consider updating UserContext when useUserProfile gets fresh data
2. **Offline Support**: Add offline detection to prevent queries when offline
3. **Selective Refresh**: Allow components to request fresh data while respecting optimization

## Related Documentation

- [User Authentication](USER_AUTHENTICATION.md)
- [TanStack Query Implementation](TANSTACK_QUERY_IMPLEMENTATION.md)
- [Frontend Architecture](FRONTEND_ARCHITECTURE.md)
