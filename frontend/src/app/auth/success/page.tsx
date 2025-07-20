import { Metadata } from "next";
import { Suspense } from "react";
import { AuthSuccessClient } from "@/components/user/AuthSuccessClient";

export const metadata: Metadata = {
  title: "Welcome - PornSpot.ai",
  description: "Welcome to PornSpot.ai! Your account is ready.",
};

function AuthSuccessFallback() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Loading...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<AuthSuccessFallback />}>
      <AuthSuccessClient />
    </Suspense>
  );
}
