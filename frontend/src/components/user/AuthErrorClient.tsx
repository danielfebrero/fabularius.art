"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function AuthErrorClient() {
  const searchParams = useSearchParams();
  const [isAnimated, setIsAnimated] = useState(false);

  const errorMessage =
    searchParams.get("error") || "An unknown authentication error occurred.";

  useEffect(() => {
    // Trigger animation after component mounts
    const animationTimer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);

    return () => {
      clearTimeout(animationTimer);
    };
  }, []);

  const getErrorTitle = (error: string) => {
    if (error.includes("cancelled") || error.includes("access_denied")) {
      return "Authentication Cancelled";
    }
    if (error.includes("Invalid") || error.includes("token")) {
      return "Authentication Failed";
    }
    if (error.includes("Missing")) {
      return "Authentication Error";
    }
    return "Something Went Wrong";
  };

  const getErrorIcon = (error: string) => {
    if (error.includes("cancelled") || error.includes("access_denied")) {
      return "⏸️";
    }
    return "⚠️";
  };

  return (
    <div className="space-y-8">
      {/* Error Icon with Animation */}
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6 transition-all duration-700 transform ${
            isAnimated ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <span className="text-3xl">{getErrorIcon(errorMessage)}</span>
        </div>

        <h2
          className={`text-2xl font-bold text-foreground mb-2 transition-all duration-700 delay-200 transform ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {getErrorTitle(errorMessage)}
        </h2>

        <p
          className={`text-muted-foreground mb-6 transition-all duration-700 delay-300 transform ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {errorMessage}
        </p>

        {/* Error Details Card */}
        <div
          className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 transition-all duration-700 delay-400 transform ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground text-sm mb-1">
                What can you do?
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Try signing in again with a different method</li>
                <li>• Make sure you allow permissions when prompted</li>
                <li>• Check if your browser is blocking pop-ups</li>
                <li>• Clear your browser cookies and try again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`space-y-3 transition-all duration-700 delay-500 transform ${
          isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Link href="/auth/login" className="block">
          <Button
            variant="primary"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try Again
          </Button>
        </Link>

        <Link href="/auth/register" className="block">
          <Button variant="outline" className="w-full">
            Create New Account
          </Button>
        </Link>

        <Link href="/" className="block">
          <Button variant="ghost" className="w-full">
            Back to Discover
          </Button>
        </Link>
      </div>

      {/* Support Info */}
      <div
        className={`text-center text-sm text-muted-foreground border-t border-border pt-4 transition-all duration-700 delay-600 transform ${
          isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <p>
          Still having trouble?{" "}
          <Link
            href="/contact"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
