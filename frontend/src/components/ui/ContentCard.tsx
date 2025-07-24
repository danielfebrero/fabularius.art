import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Media, Album, ThumbnailContext, ThumbnailSize } from "@/types";
import { LikeButton } from "@/components/user/LikeButton";
import { BookmarkButton } from "@/components/user/BookmarkButton";
import { Lightbox } from "@/components/ui/Lightbox";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { composeMediaUrl } from "@/lib/urlUtils";
import { Maximize2, Plus, Download, Trash2, PlayCircle } from "lucide-react";
import ResponsivePicture from "./ResponsivePicture";
import { composeThumbnailUrls } from "@/lib/urlUtils";

interface ContentCardProps {
  item: Media | Album;
  type: "media" | "album";
  title?: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: "square" | "auto";

  // Button visibility controls
  canLike?: boolean;
  canBookmark?: boolean;
  canFullscreen?: boolean;
  canAddToAlbum?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;

  // Show counts
  showLikeCount?: boolean;
  showBookmarkCount?: boolean;
  showCounts?: boolean;

  // Disable hover effects
  disableHoverEffects?: boolean;

  // Layout controls
  useAllAvailableSpace?: boolean; // When true, extends to edge of screen without cropping

  // Event handlers (optional - if not provided, default behavior will be used)
  onClick?: () => void;
  onFullscreen?: () => void;
  onAddToAlbum?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;

  // Additional props for media
  context?: ThumbnailContext;
  columns?: number;

  // Thumbnail size control
  preferredThumbnailSize?: ThumbnailSize;

  // Lightbox support - pass array of media for navigation
  mediaList?: Media[];
  currentIndex?: number;
}

export function ContentCard({
  item,
  type,
  title,
  className = "",
  imageClassName = "",
  aspectRatio = "square",
  canLike = true,
  canBookmark = true,
  canFullscreen = true,
  canAddToAlbum = true,
  canDownload = false,
  canDelete = false,
  showCounts = true,
  disableHoverEffects = false,
  useAllAvailableSpace = false,
  onClick,
  onFullscreen,
  onAddToAlbum,
  onDownload,
  onDelete,
  context = "default",
  columns,
  preferredThumbnailSize,
  mediaList,
  currentIndex = 0,
}: ContentCardProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isMedia = type === "media";
  const media = isMedia ? (item as Media) : null;
  const album = !isMedia ? (item as Album) : null;

  // Detect if user is on a mobile device
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const isVideo = isMedia && media?.mimeType.startsWith("video/");

  // Hide mobile actions when clicking outside or after timeout
  useEffect(() => {
    if (!isMobile || !showMobileActions) return;

    const handleClickOutside = (event: Event) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowMobileActions(false);
      }
    };

    const timeoutId = setTimeout(() => {
      setShowMobileActions(false);
    }, 5000); // Auto-hide after 5 seconds

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      clearTimeout(timeoutId);
    };
  }, [isMobile, showMobileActions]);

  // Handle click events based on content type
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      // For media on mobile: taps only show actions, no navigation
      if (isMedia && isMobile) {
        e.preventDefault();
        setShowMobileActions(true);
        return;
      }

      // Default behavior: navigate to content page (desktop only for media)
      if (isMedia && media && !isMobile) {
        router.push(`/media/${media.id}`);
      } else if (album) {
        router.push(`/albums/${album.id}`);
      }
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    } else if (isMedia && media) {
      // Default behavior: open lightbox with proper index
      const lightboxMedia = getLightboxMedia();
      let index = 0;
      if (lightboxMedia.length > 1) {
        const foundIndex = lightboxMedia.findIndex((m) => m.id === media.id);
        index = foundIndex >= 0 ? foundIndex : currentIndex;
      }
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleAddToAlbum = () => {
    if (onAddToAlbum) {
      onAddToAlbum();
    } else {
      // Default behavior: show add to album modal/functionality
      console.log("Add to album:", item.id);
      // TODO: Implement default add to album functionality
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else if (isMedia && media) {
      // Default behavior: download the media file
      const mediaUrl = composeMediaUrl(media.url);
      const filename = media.originalFilename || media.filename;

      try {
        // Try using fetch + blob approach for better cross-browser compatibility
        const response = await fetch(mediaUrl);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const blob = await response.blob();

        // Create object URL for the blob
        const blobUrl = URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";

        // Add to DOM, click, and clean up
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (error) {
        console.error(
          "Download failed with fetch, falling back to direct link:",
          error
        );

        // Fallback to direct link method
        const link = document.createElement("a");
        link.href = mediaUrl;
        link.download = filename;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      // Default behavior: show confirmation and delete
      const confirmed = window.confirm(
        `Are you sure you want to delete this ${type}?`
      );
      if (confirmed) {
        console.log("Delete:", item.id);
        // TODO: Implement default delete functionality
      }
    }
  };

  // Get the appropriate media list for lightbox
  const getLightboxMedia = (): Media[] => {
    if (mediaList && mediaList.length > 0) {
      return mediaList;
    } else if (isMedia && media) {
      return [media];
    }
    return [];
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "group relative cursor-pointer overflow-hidden shadow-lg transition-all duration-200",
          !useAllAvailableSpace && "rounded-lg sm:rounded-xl",
          !disableHoverEffects &&
            !useAllAvailableSpace &&
            "hover:shadow-xl hover:scale-[1.02]",
          aspectRatio === "square" && !useAllAvailableSpace
            ? "aspect-square"
            : "",
          useAllAvailableSpace ? "w-full h-full" : "",
          className
        )}
        onClick={handleClick}
      >
        {/* Content based on type */}
        {isMedia && media ? (
          <div className="relative w-full h-full">
            {isVideo ? (
              <video
                src={composeMediaUrl(media.url)}
                poster={composeMediaUrl(media.thumbnailUrl)}
                className={cn(
                  "w-full h-full",
                  useAllAvailableSpace ? "object-contain" : "object-cover",
                  imageClassName
                )}
                preload="metadata"
                muted
                playsInline
              />
            ) : (
              <ResponsivePicture
                thumbnailUrls={
                  preferredThumbnailSize
                    ? undefined
                    : composeThumbnailUrls(media.thumbnailUrls)
                }
                fallbackUrl={composeMediaUrl(
                  preferredThumbnailSize
                    ? media.thumbnailUrls?.[preferredThumbnailSize] ??
                        (media.thumbnailUrl || media.url)
                    : media.thumbnailUrl || media.url
                )}
                alt={title || media.originalFilename || media.filename}
                className={cn(
                  "w-full h-full transition-transform duration-200",
                  useAllAvailableSpace ? "object-contain" : "object-cover",
                  !disableHoverEffects &&
                    !useAllAvailableSpace &&
                    "group-hover:scale-105",
                  imageClassName
                )}
                context={context}
                columns={columns}
                loading="lazy"
              />
            )}

            {/* Overlay */}
            <div className={cn(
              "absolute inset-0 transition-colors duration-300",
              isMobile && showMobileActions 
                ? "bg-black/30" 
                : "bg-black/0 group-hover:bg-black/20"
            )} />

            {/* Media overlay with gradient - only visible on hover/tap */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
                isMobile
                  ? showMobileActions
                    ? "opacity-100"
                    : "opacity-0"
                  : "opacity-0 group-hover:opacity-100"
              )}
            />

            {/* Play button for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/80 opacity-50 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
              </div>
            )}

            {/* Right column - Action buttons over image */}
            {(canFullscreen || canAddToAlbum || canDownload || canDelete) && (
              <div
                className={cn(
                  "absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1 sm:gap-2 transition-opacity duration-200",
                  isMobile
                    ? showMobileActions
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {canFullscreen && (
                  <Tooltip content="View fullscreen" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFullscreen();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="View fullscreen"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canAddToAlbum && (
                  <Tooltip content="Add to album" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToAlbum();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Add to album"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canDownload && (
                  <Tooltip content="Download" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Download"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip content="Delete" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Bottom content for media - exactly like albums */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                {/* Empty space for alignment - could add media title here if needed */}
                <div></div>

                {/* Like, Bookmark, View count */}
                {showCounts && (
                  <div className="flex items-center gap-3">
                    {canLike && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "transition-opacity duration-200",
                          isMobile
                            ? showMobileActions
                              ? "opacity-100"
                              : "opacity-0"
                            : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <LikeButton
                          targetType="media"
                          targetId={media.id}
                          size="sm"
                          className="text-white hover:text-red-400 transition-colors duration-200"
                          useCache={true}
                          showCount={true}
                        />
                      </div>
                    )}
                    {canBookmark && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "transition-opacity duration-200",
                          isMobile
                            ? showMobileActions
                              ? "opacity-100"
                              : "opacity-0"
                            : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <BookmarkButton
                          targetType="media"
                          targetId={media.id}
                          size="sm"
                          className="text-white hover:text-blue-400 transition-colors duration-200"
                          useCache={true}
                          showCount={false}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-white text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{media.viewCount ?? 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : album ? (
          <div className="relative w-full h-full">
            <ResponsivePicture
              thumbnailUrls={
                preferredThumbnailSize
                  ? undefined
                  : composeThumbnailUrls(album.thumbnailUrls)
              }
              fallbackUrl={composeMediaUrl(
                preferredThumbnailSize
                  ? album.thumbnailUrls?.[preferredThumbnailSize] ??
                      album.coverImageUrl
                  : album.coverImageUrl
              )}
              alt={title || album.title}
              className={cn(
                "w-full h-full transition-transform duration-200",
                useAllAvailableSpace ? "object-contain" : "object-cover",
                !disableHoverEffects &&
                  !useAllAvailableSpace &&
                  "group-hover:scale-105",
                imageClassName
              )}
              context={context}
              columns={columns}
              loading="lazy"
            />

            {/* Album overlay with title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-sm line-clamp-2">
                {title || album.title}
              </h3>

              {/* Tags */}
              {album.tags && album.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 -ml-2">
                  {album.tags.slice(0, 3).map((tag, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `/?tag=${encodeURIComponent(tag)}`;
                        router.push(url);
                      }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 transition-all duration-200 cursor-pointer"
                      title={`Filter by tag: ${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                  {album.tags.length > 3 && (
                    <span className="text-xs text-white/70 font-medium px-2 py-1">
                      +{album.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-1">
                {album.mediaCount && (
                  <p className="text-white/80 text-xs">
                    {album.mediaCount}{" "}
                    {album.mediaCount === 1 ? "item" : "items"}
                  </p>
                )}
                {showCounts && (
                  <div className="flex items-center gap-3">
                    {canLike && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <LikeButton
                          targetType="album"
                          targetId={album.id}
                          size="sm"
                          className="text-white hover:text-red-400 transition-colors duration-200"
                          useCache={true}
                          showCount={true}
                        />
                      </div>
                    )}
                    {canBookmark && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <BookmarkButton
                          targetType="album"
                          targetId={album.id}
                          size="sm"
                          className="text-white hover:text-blue-400 transition-colors duration-200"
                          useCache={true}
                          showCount={false}
                        />
                      </div>
                    )}
                    {album.viewCount && (
                      <div className="flex items-center gap-1 text-white text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{album.viewCount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Action buttons over image */}
            {(canFullscreen || canAddToAlbum || canDownload || canDelete) && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1 sm:gap-2">
                {canFullscreen && (
                  <Tooltip content="View fullscreen" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFullscreen();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="View fullscreen"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canAddToAlbum && (
                  <Tooltip content="Add to album" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToAlbum();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Add to album"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canDownload && (
                  <Tooltip content="Download" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Download"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip content="Delete" side="left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors shadow-lg hover:shadow-xl hover:scale-110"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Lightbox for fullscreen view */}
      {lightboxOpen && isMedia && media && (
        <Lightbox
          media={getLightboxMedia()}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNext={() => {
            const lightboxMedia = getLightboxMedia();
            if (lightboxIndex < lightboxMedia.length - 1) {
              setLightboxIndex(lightboxIndex + 1);
            }
          }}
          onPrevious={() => {
            if (lightboxIndex > 0) {
              setLightboxIndex(lightboxIndex - 1);
            }
          }}
        />
      )}
    </>
  );
}
