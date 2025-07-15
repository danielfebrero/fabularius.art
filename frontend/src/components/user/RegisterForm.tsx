"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { useUser } from "@/hooks/useUser";
import { UserRegistrationFormData } from "@/types/user";
import Link from "next/link";

// Validation schema
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don&apos;t match",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const { register: registerUser, loading, error, clearError } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    watch,
  } = useForm<UserRegistrationFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  const watchedEmail = watch("email");

  const onSubmit = async (data: UserRegistrationFormData) => {
    try {
      clearError();

      const success = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        username: data.username || undefined,
      });

      if (success) {
        setRegistrationSuccess(true);
      } else {
        setFormError("root", {
          type: "manual",
          message: error || "Registration failed. Please try again.",
        });
      }
    } catch (err) {
      setFormError("root", {
        type: "manual",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const isLoading = loading || isSubmitting;

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <div className="space-y-6 text-center">
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
            Registration Successful!
          </h2>
          <p className="text-muted-foreground mt-2">
            Welcome to PornSpot.ai! Please check your email at{" "}
            <span className="font-medium text-foreground">{watchedEmail}</span>{" "}
            to verify your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Go to Sign In
          </Button>

          <button
            onClick={() => setRegistrationSuccess(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Join PornSpot.ai and start creating amazing content.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("firstName")}
            type="text"
            label="First name"
            placeholder="Enter your first name"
            error={errors.firstName?.message}
            disabled={isLoading}
            autoComplete="given-name"
          />

          <Input
            {...register("lastName")}
            type="text"
            label="Last name"
            placeholder="Enter your last name"
            error={errors.lastName?.message}
            disabled={isLoading}
            autoComplete="family-name"
          />
        </div>

        <Input
          {...register("username")}
          type="text"
          label="Username (optional)"
          placeholder="Choose a username"
          error={errors.username?.message}
          disabled={isLoading}
          autoComplete="username"
        />

        <Input
          {...register("email")}
          type="email"
          label="Email address"
          placeholder="Enter your email"
          error={errors.email?.message}
          disabled={isLoading}
          autoComplete="email"
          required
        />

        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showPassword ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          Password must be at least 8 characters with uppercase, lowercase, and
          number.
        </div>

        {(errors.root || error) && (
          <div className="text-sm text-destructive text-center">
            {errors.root?.message || error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          Create account
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleLoginButton disabled={isLoading} />

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/auth/login"
          className="text-primary hover:text-primary/90 font-medium"
        >
          Sign in
        </Link>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:text-primary/90">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:text-primary/90">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}

export default RegisterForm;
