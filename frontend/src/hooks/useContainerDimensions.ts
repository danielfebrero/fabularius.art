import { useRef, useEffect, useState } from "react";

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Custom hook to observe container dimensions using ResizeObserver
 * Provides efficient dimension tracking for responsive components
 *
 * @returns Object containing containerRef and current dimensions
 *
 * @example
 * ```tsx
 * const { containerRef, dimensions } = useContainerDimensions();
 *
 * return (
 *   <div ref={containerRef}>
 *     Container size: {dimensions.width} x {dimensions.height}
 *   </div>
 * );
 * ```
 */
export function useContainerDimensions() {
  const containerRef = useRef<HTMLElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    // Use ResizeObserver for efficient dimension tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    });

    resizeObserver.observe(container);

    // Initial measurement
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, dimensions };
}

export default useContainerDimensions;
