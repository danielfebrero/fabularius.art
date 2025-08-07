import { useLocaleRouter } from "@/lib/navigation";
import { useReturnUrl } from "@/contexts/ReturnUrlContext";

/**
 * Hook that provides a function to redirect to login page when user is not authenticated
 * Preserves the current URL as a return path so user can be redirected back after login
 */
export function useAuthRedirect() {
  const router = useLocaleRouter();
  const { setReturnUrlFromCurrent } = useReturnUrl();

  /**
   * Redirects to login page with current URL as return path
   * @param currentPath - Optional current path, defaults to window.location.pathname + search
   */
  const redirectToLogin = (currentPath?: string) => {
    if (typeof window === "undefined") return;

    // Store the return URL in persistent context
    setReturnUrlFromCurrent(currentPath);

    // Also construct the returnTo parameter for backward compatibility
    const returnTo =
      currentPath || window.location.pathname + window.location.search;
    const loginUrl = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

    router.push(loginUrl);
  };

  return { redirectToLogin };
}
