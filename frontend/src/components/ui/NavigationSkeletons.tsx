import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Share2 } from "lucide-react";

export function AppHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>

          {/* Mobile Generate Button - Center */}
          <div className="sm:hidden">
            <Skeleton className="w-8 h-8 rounded" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="hidden md:block">
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MediaDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* App Header Skeleton */}
      <AppHeaderSkeleton />

      {/* Page Header Skeleton */}
      <header className="sticky top-0 z-20 flex items-center h-16 gap-4 md:px-4 border-b bg-background/80 backdrop-blur-sm border-border">
        <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <Skeleton className="h-6 w-64 max-w-full" />
        </div>
        <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media Display Skeleton */}
          <div className="lg:col-span-2">
            <div className="relative bg-card shadow-lg rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
              <Skeleton className="w-full h-[400px] md:h-[500px]" />
            </div>
          </div>

          {/* Right Column: Information & Details Skeleton */}
          <aside className="space-y-6">
            {/* Media Details Section */}
            <div className="border border-border/10 rounded-lg bg-background/20 backdrop-blur-sm">
              <div className="flex items-center justify-between w-full md:p-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
              <div className="md:p-4 py-4 pt-0 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Generation Parameters Section */}
            <div className="border border-border/10 rounded-lg bg-background/20 backdrop-blur-sm">
              <div className="flex items-center justify-between w-full md:p-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-5 w-44" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
            </div>

            {/* In Albums Section */}
            <div className="border border-border/10 rounded-lg bg-background/20 backdrop-blur-sm">
              <div className="flex items-center justify-between w-full md:p-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
              <div className="md:p-4 py-4 pt-0">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-48">
                      <Skeleton className="aspect-square rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border border-border/10 rounded-lg bg-background/20 backdrop-blur-sm">
              <div className="flex items-center justify-between w-full md:p-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="w-5 h-5" />
              </div>
              <div className="md:p-4 py-4 pt-0 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function AlbumDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* App Header Skeleton */}
      <AppHeaderSkeleton />

      {/* Page Header Skeleton */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm border-border">
        <div className="flex items-center h-16 gap-4 md:px-4">
          <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-64 max-w-full" />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
          <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container mx-auto md:p-6 lg:p-8">
        <div className="space-y-4">
          {/* Tags Skeleton */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>

          {/* Media Gallery Skeleton */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="relative group cursor-pointer overflow-hidden shadow-lg transition-all duration-200 rounded-lg sm:rounded-xl aspect-square"
                >
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>

            {/* Load More Button Skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
