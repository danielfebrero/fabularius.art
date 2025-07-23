"use client";

import { useRouter } from "next/navigation";
import { Share2, ArrowLeft } from "lucide-react";
import { Album, Media } from "@/types";
import { ShareDropdown } from "@/components/ui/ShareDropdown";
import { Tooltip } from "@/components/ui/Tooltip";
import { ViewTracker } from "@/components/ui/ViewTracker";
import { MediaGallery } from "@/components/MediaGallery";
import Link from "next/link";

interface AlbumDetailClientProps {
  album: Album;
  initialMedia: Media[];
  initialPagination: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
}

export function AlbumDetailClient({
  album,
  initialMedia,
  initialPagination,
}: AlbumDetailClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ViewTracker targetType="album" targetId={album.id} />

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center h-16 gap-4 px-4 border-b bg-background/80 backdrop-blur-sm border-border">
        <Tooltip content="Go Back" side="bottom">
          <button
            onClick={() => router.back()}
            className="p-2 transition-colors rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Tooltip>
        <h1 className="text-lg font-semibold truncate">
          {album.title}
        </h1>
        <div className="flex-grow" />
        <ShareDropdown
          trigger={({ toggle }: { toggle: () => void }) => (
            <Tooltip content="Share" side="bottom">
              <button
                onClick={toggle}
                className="p-2 transition-colors rounded-full hover:bg-muted"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </Tooltip>
          )}
        >
          {({ close }: { close: () => void }) => (
            <>
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  close();
                }}
              >
                Copy link
              </button>
              <a
                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                href={`https://www.reddit.com/submit?url=${encodeURIComponent(
                  window.location.href
                )}&title=${encodeURIComponent(album.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                Reddit
              </a>
              <a
                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                href={`https://x.com/intent/tweet?url=${encodeURIComponent(
                  window.location.href
                )}&text=${encodeURIComponent(album.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                X (Twitter)
              </a>
            </>
          )}
        </ShareDropdown>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="space-y-4">
          {album.tags && album.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {album.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-black/20 text-gray-500 border border-gray-300/60 backdrop-blur-sm hover:bg-black/30 hover:text-gray-600 hover:border-gray-400/70 hover:scale-105 transition-all duration-200 cursor-pointer"
                  title={`Filter albums by tag: ${tag}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <MediaGallery
            albumId={album.id}
            initialMedia={initialMedia}
            initialPagination={initialPagination}
          />
        </div>
      </main>
    </div>
  );
}
