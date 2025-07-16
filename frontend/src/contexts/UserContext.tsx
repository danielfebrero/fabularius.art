"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  UserContextType,
  UserLoginRequest,
  UserRegistrationRequest,
} from "@/types/user";
import { userApi } from "@/lib/api";

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationRequired, setEmailVerificationRequired] =
    useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setInitializing(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: UserLoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.login(credentials);

      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        // This part will now be handled by the error catching below
        setError("Login failed");
        return false;
      }
    } catch (err: any) {
      if (err.response?.error === "EMAIL_NOT_VERIFIED") {
        setEmailVerificationRequired(true);
        setError(null);
        return false;
      }
      const errorMessage = err.response?.error || err.message || "Login failed";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    userData: UserRegistrationRequest
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.register(userData);

      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        setError("Registration failed");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await userApi.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.me();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // Silent fail for auth check - user is simply not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.verifyEmail(token);

      if (response.success) {
        // Refresh user data to get updated email verification status
        await checkAuth();
        return true;
      } else {
        setError(response.error || "Email verification failed");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Email verification failed";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.resendVerification(email);

      if (response.success) {
        return true;
      } else {
        setError(response.error || "Failed to resend verification email");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend verification email";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: UserContextType = {
    user,
    loading: loading || initializing,
    error,
    isEmailVerified: user?.isEmailVerified || false,
    emailVerificationRequired,
    login,
    register,
    logout,
    checkAuth,
    verifyEmail,
    resendVerification,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
