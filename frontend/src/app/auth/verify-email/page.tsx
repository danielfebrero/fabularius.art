"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";

type VerificationState = "loading" | "success" | "error" | "invalid";

function VerifyEmailContent() {
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const { verifyEmail, user, checkAuth } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("invalid");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const performVerification = async () => {
      try {
        const success = await verifyEmail(token);

        if (success) {
          setState("success");
          setMessage("Your email has been successfully verified!");
          // Refresh user data to get updated verification status
          await checkAuth();
        } else {
          setState("error");
          setMessage(
            "Email verification failed. The link may be expired or invalid."
          );
        }
      } catch (err) {
        setState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during verification."
        );
      }
    };

    performVerification();
  }, [searchParams, verifyEmail, checkAuth]);

  const handleContinue = () => {
    if (user) {
      // User is logged in, redirect to dashboard or home
      router.push("/");
    } else {
      // User not logged in, redirect to login
      router.push("/auth/login");
    }
  };

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-foreground">
              Verifying your email...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we verify your email address.
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
                Email Verified Successfully!
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <Button onClick={handleContinue} className="w-full max-w-sm">
              Continue to PornSpot.ai
            </Button>
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
                Verification Failed
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full max-w-sm"
              >
                Go to Sign In
              </Button>

              <button
                onClick={() => router.push("/auth/register")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Need to create an account?
              </button>
            </div>
          </div>
        );

      case "invalid":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Invalid Verification Link
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full max-w-sm"
              >
                Go to Sign In
              </Button>

              <button
                onClick={() => router.push("/auth/register")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Create a new account
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
              <p className="text-muted-foreground mt-2">Email Verification</p>
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
