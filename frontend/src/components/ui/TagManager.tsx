"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

export interface TagManagerProps {
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
  label?: string;
  helpText?: string;
  showCounter?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  tagSize?: "sm" | "md" | "lg";
}

export function TagManager({
  tags,
  onTagsChange,
  maxTags = 20,
  maxTagLength = 50,
  placeholder = "Add tags...",
  label,
  helpText,
  showCounter = true,
  disabled = false,
  error,
  className,
  inputClassName,
  buttonClassName,
  tagSize = "md",
}: TagManagerProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const tag = tagInput.trim();
    if (
      tag &&
      !tags.includes(tag) &&
      tag.length <= maxTagLength &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const canAddTag = tagInput.trim() && tags.length < maxTags && !disabled;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      {/* Input and Add Button */}
      <div className="flex gap-3">
        <Input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={handleTagInputKeyPress}
          placeholder={placeholder}
          className={cn(
            "flex-1",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : "focus:border-admin-primary focus:ring-admin-primary",
            inputClassName
          )}
          disabled={disabled}
          maxLength={maxTagLength}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          disabled={!canAddTag}
          className={cn(
            "border-admin-primary/30 text-admin-primary hover:bg-admin-primary/10",
            buttonClassName
          )}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Help Text and Counter */}
      {(helpText || showCounter) && (
        <div className="flex items-center justify-between">
          {helpText && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
          {showCounter && (
            <span className="text-xs font-medium text-admin-primary bg-admin-primary/10 px-2 py-1 rounded-full">
              {tags.length}/{maxTags}
            </span>
          )}
        </div>
      )}

      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Tag
              key={index}
              variant="removable"
              size={tagSize}
              onRemove={() => removeTag(tag)}
              disabled={disabled}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
