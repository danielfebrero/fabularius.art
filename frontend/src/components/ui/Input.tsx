import React from "react";
import { cn } from "../../lib/utils";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "filled";
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = "default",
      size = "md",
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-200"
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900",
            {
              // Variants
              "bg-gray-900 border border-gray-700 hover:border-gray-600":
                variant === "default",
              "bg-gray-800 border border-transparent": variant === "filled",

              // Sizes
              "h-8 text-xs": size === "sm",
              "h-10": size === "md",
              "h-12 text-base": size === "lg",

              // Error state
              "border-red-500 focus:ring-red-500": error,

              // Disabled state
              "opacity-50 cursor-not-allowed": props.disabled,
            },
            className
          )}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-sm text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
