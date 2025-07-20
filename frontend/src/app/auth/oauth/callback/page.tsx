"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { userApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import useGoogleAuth from "@/hooks/useGoogleAuth";

type CallbackState = "loading" | "success" | "error";

function OAuthCallbackContent() {
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState("");
  const { checkAuth } = useUser();
  const { validateOAuthState, clearOAuthState } = useGoogleAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get("code");
      const stateParam = searchParams.get("state");
      const error = searchParams.get("error");

      // Create a unique key for this OAuth request
      const requestKey = `oauth_processed_${stateParam || code}`;
      
      // Check if we've already processed this exact OAuth request
      if (typeof window !== "undefined") {
        const alreadyProcessed = sessionStorage.getItem(requestKey);
        if (alreadyProcessed) {
          console.log("OAuth callback already processed for this request, skipping");
          return;
        }
        // Mark this request as being processed
        sessionStorage.setItem(requestKey, "processing");
      }

      // Prevent multiple simultaneous calls
      if (isProcessingRef.current || hasProcessedRef.current) {
        console.log("OAuth callback already processed or in progress, skipping");
        return;
      }

      try {
        isProcessingRef.current = true;

        // Handle OAuth error from Google
        if (error) {
          setState("error");
          setMessage(`OAuth error: ${error}`);
          hasProcessedRef.current = true;
          
          // Mark as processed with error
          if (typeof window !== "undefined") {
            sessionStorage.setItem(requestKey, "error");
          }
          return;
        }

        // Check for required parameters
        if (!code) {
          setState("error");
          setMessage("Missing authorization code from OAuth provider.");
          hasProcessedRef.current = true;
          
          // Mark as processed with error
          if (typeof window !== "undefined") {
            sessionStorage.setItem(requestKey, "error");
          }
          return;
        }

        // Validate OAuth state parameter for security (but don't block on failure)
        if (stateParam && !validateOAuthState(stateParam)) {
          console.warn(
            "OAuth state validation failed, but continuing with backend validation"
          );
          console.warn("State validation details:", {
            receivedState: stateParam,
            storedState:
              typeof window !== "undefined"
                ? sessionStorage.getItem("google_oauth_state")
                : null,
          });
        } else if (stateParam) {
          console.log("OAuth state validation passed");
        }

        // Exchange authorization code for tokens
        const response = await userApi.googleOAuthCallback(
          code,
          stateParam || undefined
        );

        if (response.success && response.user) {
          setState("success");
          setMessage("Successfully signed in with Google!");

          // Clear OAuth state after successful authentication
          clearOAuthState();

          // Refresh user context
          await checkAuth();

          hasProcessedRef.current = true;
          
          // Mark as successfully processed
          if (typeof window !== "undefined") {
            sessionStorage.setItem(requestKey, "completed");
          }
          
          router.push(response.redirectUrl || "/auth/success");
        } else {
          setState("error");
          setMessage(response.error || "OAuth authentication failed.");
          hasProcessedRef.current = true;
          
          // Mark as processed with error
          if (typeof window !== "undefined") {
            sessionStorage.setItem(requestKey, "error");
          }
        }
      } catch (err) {
        setState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during OAuth authentication."
        );
        hasProcessedRef.current = true;
        
        // Mark as processed with error
        if (typeof window !== "undefined") {
          sessionStorage.setItem(requestKey, "error");
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleOAuthCallback();
  }, [searchParams, validateOAuthState, clearOAuthState, checkAuth, router]);

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-foreground">
              Completing sign in...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we complete your Google sign in.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome to PornSpot.ai!
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Redirecting you to the dashboard...
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full max-w-sm"
              >
                Try Again
              </Button>

              <button
                onClick={() => router.push("/")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                PornSpot.ai
              </h1>
              <p className="text-muted-foreground mt-2">
                Google Authentication
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">
              Processing authentication...
            </p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
