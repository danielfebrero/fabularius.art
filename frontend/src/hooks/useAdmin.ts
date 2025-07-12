import { useCallback, useState } from "react";
import { AdminUser, LoginRequest } from "../types/index";

interface UseAdminReturn {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (_credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<AdminUser | null>;
}

export function useAdmin(): UseAdminReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl =
    process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api";

  const login = useCallback(
    async (credentials: LoginRequest): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for HTTP-only cookies
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.admin);
          return true;
        } else {
          setError(data.error || "Login failed");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  const logout = useCallback(async (): Promise<void> => {
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
  }, [apiUrl]);

  const checkAuth = useCallback(async (): Promise<AdminUser | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/admin/me`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.admin) {
          setUser(data.data.admin);
          return data.data.admin;
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
  }, [apiUrl]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };
}
