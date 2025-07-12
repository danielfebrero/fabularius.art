"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AdminContextType, LoginRequest } from "../types/index";
import { useAdmin } from "../hooks/useAdmin";

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    loading: hookLoading,
    error: hookError,
    login: hookLogin,
    logout: hookLogout,
    checkAuth,
  } = useAdmin();

  const [initializing, setInitializing] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setInitializing(false);
    };

    initAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    const success = await hookLogin(credentials);
    return success;
  };

  const logout = async (): Promise<void> => {
    await hookLogout();
  };

  const checkAuthWrapper = async (): Promise<void> => {
    await checkAuth();
  };

  const contextValue: AdminContextType = {
    user,
    loading: hookLoading || initializing,
    error: hookError,
    login,
    logout,
    checkAuth: checkAuthWrapper,
  };

  return (
    <AdminContext.Provider value={contextValue}>
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
