"use client";

import { ReactNode, useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { createUserWithPlan, createMockUser } from "@/lib/userUtils";
import { UserWithPlan } from "@/types/permissions";

interface PermissionsWrapperProps {
  children: ReactNode;
}

export function PermissionsWrapper({ children }: PermissionsWrapperProps) {
  const { user, loading } = useUser();
  const [userWithPermissions, setUserWithPermissions] =
    useState<UserWithPlan | null>(null);
  const [lastProcessedUserId, setLastProcessedUserId] = useState<string | null>(
    null
  );

  // Convert the current user to a permissions-compatible format
  // If no user is logged in, create a mock free user for permissions
  useEffect(() => {
    console.log("[PermissionsWrapper] Effect triggered", {
      user: !!user,
      loading,
    });
    // Don't load permissions until user context is fully initialized
    if (loading) {
      console.log("[PermissionsWrapper] Still loading, skipping");
      return;
    }

    // Only process if user has actually changed (prevent unnecessary re-processing)
    const currentUserId = user?.userId || null;
    if (currentUserId === lastProcessedUserId && userWithPermissions !== null) {
      console.log(
        "[PermissionsWrapper] User unchanged, skipping permissions reload"
      );
      return;
    }

    console.log(
      "[PermissionsWrapper] Loading permissions for user:",
      currentUserId
    );
    setLastProcessedUserId(currentUserId);

    const loadUserPermissions = async () => {
      try {
        const userWithPerms = user
          ? await createUserWithPlan(user)
          : await createMockUser("free");
        setUserWithPermissions(userWithPerms);
      } catch (error) {
        console.error("Failed to load user permissions:", error);
        // Fallback to a basic free user
        const fallbackUser = await createMockUser("free");
        setUserWithPermissions(fallbackUser);
      }
    };

    loadUserPermissions();
  }, [user, loading, lastProcessedUserId, userWithPermissions]);

  // Show loading state while user context is initializing or permissions are being loaded
  if (loading || !userWithPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <PermissionsProvider user={userWithPermissions}>
      {children}
    </PermissionsProvider>
  );
}
