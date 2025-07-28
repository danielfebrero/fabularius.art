import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "outlined";
  size?: "sm" | "md" | "lg";
  hideBorder?: boolean;
  hideMargin?: boolean;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hidePadding?: boolean;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hidePadding?: boolean;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { 
      className, 
      children, 
      variant = "default", 
      size = "md", 
      hideBorder = false,
      hideMargin = false,
      ...props 
    },
    ref
  ) => {
    const variantClasses = {
      default: "border bg-card text-card-foreground shadow-sm",
      outlined: "border-2 bg-transparent text-foreground",
    };

    const sizeClasses = {
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    // Apply conditional styles based on hideBorder and hideMargin
    const conditionalClasses = cn(
      "rounded-lg",
      !hideBorder && variantClasses[variant],
      !hideMargin && sizeClasses[size],
      hideBorder && "bg-transparent shadow-none border-none",
      hideMargin && "p-0"
    );

    return (
      <div
        ref={ref}
        className={cn(conditionalClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, hidePadding = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5",
        !hidePadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, hidePadding = false, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        !hidePadding && "p-6 pt-0",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
