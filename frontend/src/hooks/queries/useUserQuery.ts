import { useQuery, useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { queryKeys, queryClient, invalidateQueries } from "@/lib/queryClient";

// Hook for fetching current user profile
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      return await userApi.me();
    },
    // Keep user profile fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Enable background refetching on window focus
    refetchOnWindowFocus: true,
    // Retry on failure
    retry: 2,
  });
}

// Hook for updating user profile
export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: async (updates: any) => {
      return await userApi.updateProfile(updates);
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(
        queryKeys.user.profile()
      );

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.user.profile(), (old: any) => {
        return old ? { ...old, ...updates } : old;
      });

      return { previousProfile };
    },
    onError: (error, variables, context) => {
      console.error("Failed to update profile:", error);

      // Rollback optimistic update
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.user.profile(),
          context.previousProfile
        );
      }
    },
    onSuccess: (updatedProfile) => {
      // Ensure cache is up to date with server response
      queryClient.setQueryData(queryKeys.user.profile(), updatedProfile);
    },
  });
}

// Hook for email verification
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      return await userApi.verifyEmail(token);
    },
    onSuccess: () => {
      // Refresh user profile after email verification
      invalidateQueries.user();
    },
  });
}

// Hook for resending verification email
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      return await userApi.resendVerification(email);
    },
  });
}

// Hook for user logout
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return await userApi.logout();
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}
