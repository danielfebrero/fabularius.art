"use client";

import { Suspense, useEffect, useState } from "react";
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
  const { validateOAuthState } = useGoogleAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const stateParam = searchParams.get("state");
        const error = searchParams.get("error");

        // Handle OAuth error from Google
        if (error) {
          setState("error");
          setMessage(`OAuth error: ${error}`);
          return;
        }

        // Check for required parameters
        if (!code) {
          setState("error");
          setMessage("Missing authorization code from OAuth provider.");
          return;
        }

        // Validate OAuth state parameter for security
        if (stateParam && !validateOAuthState(stateParam)) {
          setState("error");
          setMessage("Invalid OAuth state parameter. Possible CSRF attack.");
          return;
        }

        // Exchange authorization code for tokens
        const response = await userApi.googleOAuthCallback(
          code,
          stateParam || undefined
        );

        if (response.success && response.user) {
          setState("success");
          setMessage("Successfully signed in with Google!");

          // Refresh user context
          await checkAuth();

          // Redirect after a short delay
          setTimeout(() => {
            router.push(response.redirectUrl || "/");
          }, 2000);
        } else {
          setState("error");
          setMessage(response.error || "OAuth authentication failed.");
        }
      } catch (err) {
        setState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during OAuth authentication."
        );
      }
    };

    handleOAuthCallback();
  }, [searchParams, validateOAuthState, checkAuth, router]);

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
