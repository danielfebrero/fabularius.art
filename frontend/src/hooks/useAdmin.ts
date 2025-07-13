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
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = sessionStorage.getItem("adminUser");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });
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
          setUser(data.data.admin);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "adminUser",
              JSON.stringify(data.data.admin)
            );
          }
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
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("adminUser");
      }
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

      console.log("CheckAuth response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("CheckAuth data:", data);
        if (data.success && data.data.admin) {
          console.log("CheckAuth successful, setting user:", data.data.admin);
          setUser(data.data.admin);
          return data.data.admin;
        }
      }

      console.log("CheckAuth failed, clearing user");
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("adminUser");
      }
      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Auth check failed";
      setError(errorMessage);
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("adminUser");
      }
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
