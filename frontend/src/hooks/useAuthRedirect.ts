import { useLocaleRouter } from "@/lib/navigation";

/**
 * Hook that provides a function to redirect to login page when user is not authenticated
 * Preserves the current URL as a return path so user can be redirected back after login
 */
export function useAuthRedirect() {
  const router = useLocaleRouter();

  /**
   * Redirects to login page with current URL as return path
   * @param currentPath - Optional current path, defaults to window.location.pathname
   */
  const redirectToLogin = (currentPath?: string) => {
    if (typeof window === "undefined") return;

    const returnTo = currentPath || window.location.pathname;
    const loginUrl = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

    router.push(loginUrl);
  };

  return { redirectToLogin };
}
