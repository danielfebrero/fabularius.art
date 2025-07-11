import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "filled";
  size?: "sm" | "default" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    const variants = {
      default: "border-gray-700 bg-background",
      filled: "bg-gray-800 border-gray-600",
    };

    const sizes = {
      sm: "h-8 text-xs",
      default: "h-10",
      lg: "h-12 text-base",
    };

    const errorClasses = error
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    const inputId =
      props.id ||
      (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && " *"}
          </label>
        )}
        <input
          type={type}
          className={cn(
            baseClasses,
            variants[variant],
            sizes[size],
            errorClasses,
            className
          )}
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
