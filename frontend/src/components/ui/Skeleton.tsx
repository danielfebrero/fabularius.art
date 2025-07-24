import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden",
        className
      )}
    >
      <Skeleton className="aspect-square" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function MediaCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden",
        className
      )}
    >
      <Skeleton className="aspect-square" />
      {/* Media cards typically don't have text content, so no additional skeleton needed */}
    </div>
  );
}

export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <Skeleton className="w-16 h-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function GridSkeleton({
  itemCount = 8,
  itemType = "card",
  className,
}: {
  itemCount?: number;
  itemType?: "card" | "media" | "list";
  className?: string;
}) {
  const SkeletonComponent =
    itemType === "media"
      ? MediaCardSkeleton
      : itemType === "list"
      ? ListItemSkeleton
      : CardSkeleton;

  return (
    <div
      className={cn(
        "grid gap-4",
        itemType === "list"
          ? "grid-cols-1"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: itemCount }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

export function InteractionButtonSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeConfig = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Skeleton className={cn("rounded-full", sizeConfig[size], className)} />
  );
}

export function InteractionCountSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeConfig = {
    sm: "h-3 w-6",
    md: "h-4 w-8",
    lg: "h-5 w-10",
  };

  return <Skeleton className={cn(sizeConfig[size], className)} />;
}
