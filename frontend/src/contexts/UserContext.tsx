"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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

  const checkAuth = useCallback(async (): Promise<void> => {
    console.log("[UserContext] checkAuth called", {
      user: !!user,
      loading,
      initializing,
    });
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.me();

      if (response.success && response.data?.user) {
        console.log("[UserContext] checkAuth success, setting user");
        // Store the raw user data for now
        // The PermissionsWrapper will handle adding permissions
        setUser(response.data.user);
      } else {
        console.log("[UserContext] checkAuth failed, clearing user");
        setUser(null);
      }
    } catch (err) {
      console.log("[UserContext] checkAuth error, clearing user", err);
      // Silent fail for auth check - user is simply not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    console.log("[UserContext] Initial auth effect triggered");
    const initAuth = async () => {
      await checkAuth();
      setInitializing(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const login = useCallback(
    async (credentials: UserLoginRequest): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        setEmailVerificationRequired(false); // Always reset before login

        const response = await userApi.login(credentials);

        // If backend signals email not verified in a normal response
        if (!response.success && response.error === "EMAIL_NOT_VERIFIED") {
          setEmailVerificationRequired(true);
          setError(null);
          return false;
        }

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          return true;
        } else {
          // Show detailed backend error if present
          setError(response.error || "Login failed");
          return false;
        }
      } catch (err: any) {
        // If error thrown by API contains response JSON with backend error
        if (err.response?.error === "EMAIL_NOT_VERIFIED") {
          setEmailVerificationRequired(true);
          setError(null);
          return false;
        }
        // Prefer backend-provided error message, then error.message, then fallback
        const errorMessage =
          err.response?.error ||
          err.response?.message ||
          err.message ||
          "Login failed";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = async (
    userData: UserRegistrationRequest
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.register(userData);

      if (response.success && response.data?.userId) {
        // For registration, we don't get the full user object back, just basic info
        // We'll need to call checkAuth to get the full user data
        await checkAuth();
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

  const logout = useCallback(async (): Promise<void> => {
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
  }, []);

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
