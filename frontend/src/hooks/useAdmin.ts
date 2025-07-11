import { useState } from "react";
import { AdminUser, LoginRequest } from "../types/index";

interface UseAdminReturn {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<AdminUser | null>;
}

export function useAdmin(): UseAdminReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl =
    process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api";

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // DIAGNOSTIC LOGGING - START
      console.log("=== FRONTEND LOGIN DIAGNOSTIC ===");
      console.log("API URL:", `${apiUrl}/admin/login`);
      console.log("Request credentials:", credentials);
      console.log("Fetch options:", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      // DIAGNOSTIC LOGGING - END

      const response = await fetch(`${apiUrl}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for HTTP-only cookies
        body: JSON.stringify(credentials),
      });

      // DIAGNOSTIC LOGGING - START
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );
      console.log("Response ok:", response.ok);
      // DIAGNOSTIC LOGGING - END

      const data = await response.json();

      // DIAGNOSTIC LOGGING - START
      console.log("Response data:", data);
      console.log("Data structure:", JSON.stringify(data, null, 2));
      // DIAGNOSTIC LOGGING - END

      if (response.ok && data.success) {
        // Backend returns { success: true, admin: {...}, sessionId: "..." }
        setUser(data.admin);
        return true;
      } else {
        setError(data.error || "Login failed");
        return false;
      }
    } catch (err) {
      // DIAGNOSTIC LOGGING - START
      console.log("=== FRONTEND LOGIN ERROR ===");
      console.log("Error type:", typeof err);
      console.log("Error instance:", err instanceof Error);
      console.log(
        "Error message:",
        err instanceof Error ? err.message : String(err)
      );
      console.log("Full error:", err);
      // DIAGNOSTIC LOGGING - END

      const errorMessage = err instanceof Error ? err.message : "Login failed";
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

      await fetch(`${apiUrl}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async (): Promise<AdminUser | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/admin/me`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          setUser(data.data.user);
          return data.data.user;
        }
      }

      setUser(null);
      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Auth check failed";
      setError(errorMessage);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };
}
