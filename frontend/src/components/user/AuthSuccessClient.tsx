"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function AuthSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAnimated, setIsAnimated] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isNewUser = searchParams.get("new_user") === "true";

  useEffect(() => {
    // Trigger animation after component mounts
    const animationTimer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);

    // Auto-redirect countdown
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(animationTimer);
      clearInterval(countdownTimer);
    };
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Success Icon with Animation */}
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6 transition-all duration-700 transform ${
            isAnimated ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
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

        <h2
          className={`text-2xl font-bold text-foreground mb-2 transition-all duration-700 delay-200 transform ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {isNewUser ? "🎉 Welcome to PornSpot.ai!" : "🎉 Welcome back!"}
        </h2>

        <p
          className={`text-muted-foreground text-lg mb-4 transition-all duration-700 delay-300 transform ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {isNewUser
            ? "Your account has been successfully created and you're now signed in."
            : "You have successfully signed in to your account."}
        </p>

        {isNewUser && (
          <div
            className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6 transition-all duration-700 delay-400 transform ${
              isAnimated
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  Getting Started
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore AI-generated content, create your own albums, and
                  discover what PornSpot.ai has to offer!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className={`space-y-3 transition-all duration-700 delay-500 transform ${
          isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Link href="/" className="block">
          <Button
            variant="primary"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Explore PornSpot.ai
          </Button>
        </Link>

        {isNewUser && (
          <Link href="/user/profile" className="block">
            <Button variant="outline" className="w-full">
              Complete Your Profile
            </Button>
          </Link>
        )}

        <Link href="/albums" className="block">
          <Button variant="ghost" className="w-full">
            Browse Albums
          </Button>
        </Link>
      </div>

      {/* Auto-redirect Info */}
      <div
        className={`text-center text-sm text-muted-foreground border-t border-border pt-4 transition-all duration-700 delay-600 transform ${
          isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <p>
          Automatically redirecting to homepage in{" "}
          <span className="font-semibold text-foreground">{countdown}</span>{" "}
          {countdown === 1 ? "second" : "seconds"}...
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-primary hover:text-primary/80 underline underline-offset-2 mt-1 transition-colors"
        >
          Go now
        </button>
      </div>

      {/* Celebratory Confetti Effect (CSS Animation) */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .confetti {
          position: fixed;
          top: -10px;
          z-index: 1;
          pointer-events: none;
        }

        .confetti:nth-child(1) {
          left: 10%;
          animation: confetti-fall 3s linear infinite;
          background: #ff6b6b;
        }
        .confetti:nth-child(2) {
          left: 20%;
          animation: confetti-fall 3.2s linear infinite 0.2s;
          background: #4ecdc4;
        }
        .confetti:nth-child(3) {
          left: 30%;
          animation: confetti-fall 2.8s linear infinite 0.4s;
          background: #ffe66d;
        }
        .confetti:nth-child(4) {
          left: 40%;
          animation: confetti-fall 3.1s linear infinite 0.6s;
          background: #ff6b6b;
        }
        .confetti:nth-child(5) {
          left: 50%;
          animation: confetti-fall 2.9s linear infinite 0.8s;
          background: #a8e6cf;
        }
        .confetti:nth-child(6) {
          left: 60%;
          animation: confetti-fall 3.3s linear infinite 1s;
          background: #ffd93d;
        }
        .confetti:nth-child(7) {
          left: 70%;
          animation: confetti-fall 2.7s linear infinite 1.2s;
          background: #6bcf7f;
        }
        .confetti:nth-child(8) {
          left: 80%;
          animation: confetti-fall 3.2s linear infinite 1.4s;
          background: #4d79ff;
        }
        .confetti:nth-child(9) {
          left: 90%;
          animation: confetti-fall 2.8s linear infinite 1.6s;
          background: #ff6b9d;
        }
      `}</style>

      {/* Confetti Elements */}
      {isAnimated && isNewUser && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="confetti w-2 h-2 absolute"
              style={{
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
