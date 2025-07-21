"use client";

import { ReactNode } from "react";
import { useUser } from "@/hooks/useUser";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { createUserWithPlan, createMockUser } from "@/lib/userUtils";

interface PermissionsWrapperProps {
  children: ReactNode;
}

export function PermissionsWrapper({ children }: PermissionsWrapperProps) {
  const { user } = useUser();

  // Convert the current user to a permissions-compatible format
  // If no user is logged in, create a mock free user for permissions
  const userWithPermissions = user
    ? createUserWithPlan(user)
    : createMockUser("free");

  return (
    <PermissionsProvider user={userWithPermissions}>
      {children}
    </PermissionsProvider>
  );
}
