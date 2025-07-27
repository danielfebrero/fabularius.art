"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "removable";
  size?: "sm" | "md" | "lg";
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
}

export function Tag({
  children,
  variant = "default",
  size = "md",
  onRemove,
  className,
  disabled = false,
}: TagProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const removeButtonSizes = {
    sm: "w-3 h-3 ml-1",
    md: "w-4 h-4 ml-2",
    lg: "w-5 h-5 ml-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 text-admin-primary border border-admin-primary/20 transition-colors",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
      {variant === "removable" && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-center rounded-full text-admin-primary/60 hover:bg-admin-primary/20 hover:text-admin-primary transition-colors focus:outline-none focus:ring-2 focus:ring-admin-primary/20",
            removeButtonSizes[size],
            disabled &&
              "cursor-not-allowed hover:bg-transparent hover:text-admin-primary/60"
          )}
          aria-label="Remove tag"
        >
          <X className="w-full h-full" />
        </button>
      )}
    </span>
  );
}
