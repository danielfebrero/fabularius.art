"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (newValue: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  disabled?: boolean;
} | null>(null);

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, isOpen, setIsOpen, disabled }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  const { value } = context;
  return <span>{value || placeholder}</span>;
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) return null;

    const { setIsOpen, isOpen, disabled } = context;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 text-muted-foreground" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const context = React.useContext(SelectContext);

  React.useEffect(() => {
    if (!context || !context.isOpen || context.disabled) return;

    const handleClickOutside = () => context.setIsOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [context]);

  if (!context || !context.isOpen || context.disabled) return null;

  return (
    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
      <div className="max-h-60 overflow-auto p-1">{children}</div>
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  const { onValueChange, value: selectedValue, setIsOpen, disabled } = context;

  const handleSelect = () => {
    if (disabled) return;
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-popover-foreground",
        selectedValue === value && "bg-accent text-accent-foreground"
      )}
      onClick={handleSelect}
    >
      {children}
    </div>
  );
};

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
