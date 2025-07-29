"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

interface GradientTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any; // Allow other textarea props
}

export const GradientTextarea: React.FC<GradientTextareaProps> = ({
  value,
  onChange,
  placeholder = "",
  className = "",
  disabled = false,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll position between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      const textarea = textareaRef.current;
      const overlay = overlayRef.current;
      const textContent = overlay.firstElementChild as HTMLElement;

      if (textContent) {
        // Move the text content to match scroll position
        textContent.style.transform = `translate(-${textarea.scrollLeft}px, -${textarea.scrollTop}px)`;
      }
    }
  }, []);

  // Sync dimensions and styling
  useEffect(() => {
    const syncStyles = () => {
      if (textareaRef.current && overlayRef.current) {
        const textarea = textareaRef.current;
        const overlay = overlayRef.current;
        const textContent = overlay.firstElementChild as HTMLElement;

        // Copy computed styles to ensure pixel-perfect alignment
        const computedStyle = window.getComputedStyle(textarea);

        // Apply styles to the text content div
        if (textContent) {
          textContent.style.padding = computedStyle.padding;
          textContent.style.fontSize = computedStyle.fontSize;
          textContent.style.fontFamily = computedStyle.fontFamily;
          textContent.style.lineHeight = computedStyle.lineHeight;
          textContent.style.letterSpacing = computedStyle.letterSpacing;
          textContent.style.wordSpacing = computedStyle.wordSpacing;
          textContent.style.textAlign = computedStyle.textAlign;
          textContent.style.whiteSpace = "pre-wrap";
          textContent.style.wordWrap = "break-word";

          // Position the text content to match scroll offset
          textContent.style.transform = `translate(-${textarea.scrollLeft}px, -${textarea.scrollTop}px)`;
        }
      }
    };

    syncStyles();

    // Re-sync on resize and input
    const resizeObserver = new ResizeObserver(syncStyles);
    const currentTextarea = textareaRef.current;

    if (currentTextarea) {
      resizeObserver.observe(currentTextarea);
    }

    // Also sync when content changes
    const handleInput = () => {
      requestAnimationFrame(syncStyles);
    };

    if (currentTextarea) {
      currentTextarea.addEventListener("input", handleInput);
    }

    return () => {
      resizeObserver.disconnect();
      if (currentTextarea) {
        currentTextarea.removeEventListener("input", handleInput);
      }
    };
  }, [value]); // Re-run when value changes

  // Process text for display - handle placeholder and content
  const displayText = value || placeholder;
  const isPlaceholder = !value && placeholder;

  // Extract relevant classes for initial styling
  const extractedClasses = className
    .split(" ")
    .filter(
      (cls) =>
        cls.startsWith("text-") ||
        cls.startsWith("p-") ||
        cls.startsWith("font-")
    )
    .join(" ");

  return (
    <div className="relative">
      {/* Invisible textarea for input */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        disabled={disabled}
        placeholder="" // Remove native placeholder
        className={cn(
          "relative z-20 text-transparent bg-transparent caret-primary selection:bg-primary/20 resize-none",
          className
        )}
        style={{
          caretColor: "hsl(var(--primary))",
          color: "transparent",
        }}
        {...props}
      />

      {/* Gradient text overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
      >
        <div
          className={cn(
            "whitespace-pre-wrap break-words",
            isPlaceholder ? "opacity-60" : "opacity-100",
            extractedClasses // Apply relevant classes from parent to prevent flash
          )}
          style={{
            background:
              "linear-gradient(to right, hsl(var(--primary)), #9333ea)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {displayText}
        </div>
      </div>

      {/* Custom CSS to hide webkit scrollbars */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
