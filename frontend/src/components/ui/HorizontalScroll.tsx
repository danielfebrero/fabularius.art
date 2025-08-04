"use client";

import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDevice } from "@/contexts/DeviceContext";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  showArrows?: boolean;
  gap?: "small" | "medium" | "large";
  itemWidth?: string;
}

export function HorizontalScroll({
  children,
  className,
  itemClassName,
  showArrows = true,
  gap = "medium",
  itemWidth = "auto",
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { isMobileInterface: isMobile } = useDevice();

  const gapClasses = {
    small: "gap-2",
    medium: "gap-4",
    large: "gap-6",
  };

  const checkScrollability = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    checkScrollability();

    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [children]);

  return (
    <div className={cn("relative group", className)}>
      {/* Left Arrow - Desktop only */}
      {showArrows && !isMobile && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 hover:bg-background border border-border rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Right Arrow - Desktop only */}
      {showArrows && !isMobile && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/80 hover:bg-background border border-border rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScrollability}
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          gapClasses[gap],
          // On mobile, enable smooth scrolling with momentum
          isMobile && "scroll-smooth overscroll-x-contain"
        )}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Render children with consistent sizing */}
        {Array.isArray(children) ? (
          children.map((child, index) => (
            <div
              key={index}
              className={cn("flex-shrink-0", itemClassName)}
              style={{
                width: itemWidth,
                scrollSnapAlign: "start",
              }}
            >
              {child}
            </div>
          ))
        ) : (
          <div
            className={cn("flex-shrink-0", itemClassName)}
            style={{
              width: itemWidth,
              scrollSnapAlign: "start",
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Scroll Indicators for Mobile */}
      {isMobile && (canScrollLeft || canScrollRight) && (
        <div className="flex justify-center mt-2 gap-1">
          <div
            className={cn(
              "w-2 h-2 rounded-full bg-muted transition-colors",
              !canScrollLeft && "bg-primary"
            )}
          />
          <div
            className={cn(
              "w-2 h-2 rounded-full bg-muted transition-colors",
              canScrollLeft && canScrollRight && "bg-primary"
            )}
          />
          <div
            className={cn(
              "w-2 h-2 rounded-full bg-muted transition-colors",
              !canScrollRight && "bg-primary"
            )}
          />
        </div>
      )}
    </div>
  );
}
