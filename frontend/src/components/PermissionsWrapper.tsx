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
  const { user } = useUser();
  const [userWithPermissions, setUserWithPermissions] =
    useState<UserWithPlan | null>(null);

  // Convert the current user to a permissions-compatible format
  // If no user is logged in, create a mock free user for permissions
  useEffect(() => {
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
  }, [user]);

  // Show loading state while permissions are being loaded
  if (!userWithPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
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
