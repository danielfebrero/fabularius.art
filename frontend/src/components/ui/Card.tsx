import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "outlined";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = "default",
      size = "md",
      onClick,
      ...props
    },
    ref
  ) => {
    const isClickable = !!onClick;

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (isClickable && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg transition-colors",
          {
            // Variants
            "bg-gray-900 border border-gray-800": variant === "default",
            "bg-transparent border border-gray-700": variant === "outlined",

            // Sizes
            "p-3": size === "sm",
            "p-6": size === "md",
            "p-8": size === "lg",

            // Clickable states
            "cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900":
              isClickable,
          },
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
