"use client";

import React, { createContext, useContext } from "react";
import { useUser } from "@/hooks/useUser";
import { UserWithPlanInfo } from "@/types/user";

interface AdminContextType {
  user: UserWithPlanInfo | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAdmin: boolean;
  isModerator: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const userContext = useUser();

  const user = userContext.user as UserWithPlanInfo | null;
  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";
  const hasAdminAccess = isAdmin || isModerator;

  // No need to call checkAuth here since UserContext already does it on mount
  // We can rely on userContext.loading to know when initialization is complete
  // const initialized = !userContext.loading;

  // Admin-specific context that wraps the user context
  const adminContextValue: AdminContextType = {
    user: hasAdminAccess ? user : null,
    loading: userContext.loading,
    error: userContext.error,
    login: userContext.login,
    logout: userContext.logout,
    checkAuth: userContext.checkAuth,
    isAdmin,
    isModerator,
  };

  // Don't render children until we've checked auth
  // if (!initialized) {
  //   return <div>Loading...</div>;
  // }

  return (
    <AdminContext.Provider value={adminContextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
}
