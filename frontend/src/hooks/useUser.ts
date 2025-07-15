"use client";

import { useUserContext } from "@/contexts/UserContext";
import { UserContextType } from "@/types/user";

/**
 * Custom hook for user authentication state and operations
 * Provides a convenient way to access the UserContext
 */
export function useUser(): UserContextType {
  const context = useUserContext();

  return context;
}

export default useUser;
