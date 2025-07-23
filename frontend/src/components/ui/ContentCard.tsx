import { useState } from "react";
import { useRouter } from "next/navigation";
import { Media, Album, ThumbnailContext, ThumbnailSize } from "@/types";
import { LikeButton } from "@/components/user/LikeButton";
import { BookmarkButton } from "@/components/user/BookmarkButton";
import { InteractionCounts } from "@/components/user/InteractionCounts";
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
  const [actionsOpen, setActionsOpen] = useState(false);

  const isMedia = type === "media";
  const media = isMedia ? (item as Media) : null;
  const album = !isMedia ? (item as Album) : null;

  // Detect if user is on a mobile device
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const isVideo = isMedia && media?.mimeType.startsWith("video/");

  // Handle click events based on content type
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to content page
      if (isMedia && media) {
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

  const handleActionClick = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (isMobile) {
      setActionsOpen(!actionsOpen);
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
        className={cn(
          "group relative cursor-pointer overflow-hidden shadow-lg transition-all duration-200 rounded-lg sm:rounded-xl",
          !disableHoverEffects && "hover:shadow-xl hover:scale-[1.02]",
          aspectRatio === "square" ? "aspect-square" : "",
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
                className={cn("w-full h-full object-cover", imageClassName)}
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
                  "w-full h-full object-cover transition-transform duration-200",
                  !disableHoverEffects && "group-hover:scale-105",
                  imageClassName
                )}
                context={context}
                columns={columns}
                loading="lazy"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Play button for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/80 opacity-50 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
              </div>
            )}

            {/* Left column - Like and Bookmark over image */}
            {(canLike || canBookmark) && (
              <div
                className={cn(
                  "absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 sm:gap-2 transition-opacity duration-200",
                  isMobile
                    ? actionsOpen
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {canLike && (
                  <Tooltip content="Like" side="right">
                    <span
                      onClick={handleActionClick}
                      onTouchEnd={handleActionClick}
                    >
                      <LikeButton
                        targetType={type}
                        targetId={item.id}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        useCache={true}
                      />
                    </span>
                  </Tooltip>
                )}
                {canBookmark && (
                  <Tooltip content="Bookmark" side="right">
                    <span
                      onClick={handleActionClick}
                      onTouchEnd={handleActionClick}
                    >
                      <BookmarkButton
                        targetType={type}
                        targetId={item.id}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        useCache={true}
                      />
                    </span>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Right column - Action buttons over image */}
            {(canFullscreen || canAddToAlbum || canDownload || canDelete) && (
              <div
                className={cn(
                  "absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1 sm:gap-2 transition-opacity duration-200",
                  isMobile
                    ? actionsOpen
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

            {/* Media interaction counts */}
            {showCounts && media && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <InteractionCounts
                  targetType="media"
                  targetId={media.id}
                  likeCount={media.likeCount}
                  bookmarkCount={media.bookmarkCount}
                  showIcons={true}
                  size="sm"
                  className="text-white bg-black/50 rounded-md px-2 py-1"
                />
              </div>
            )}

            {/* Mobile touch area for actions */}
            {isMobile &&
              (canLike ||
                canBookmark ||
                canFullscreen ||
                canAddToAlbum ||
                canDownload ||
                canDelete) && (
                <button
                  className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black/50 rounded-full flex items-center justify-center md:hidden z-20"
                  onClick={handleActionClick}
                  onTouchEnd={handleActionClick}
                >
                  <span className="text-white text-xs">⋯</span>
                </button>
              )}
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
                "w-full h-full object-cover transition-transform duration-200",
                !disableHoverEffects && "group-hover:scale-105",
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
                        window.location.href = url;
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
                  <InteractionCounts
                    targetType="album"
                    targetId={album.id}
                    likeCount={album.likeCount}
                    bookmarkCount={album.bookmarkCount}
                    viewCount={album.viewCount}
                    showIcons={true}
                    size="sm"
                    className="text-white"
                  />
                )}
              </div>
            </div>

            {/* Left column - Like and Bookmark over image */}
            {(canLike || canBookmark) && (
              <div
                className={cn(
                  "absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 sm:gap-2 transition-opacity duration-200",
                  isMobile
                    ? actionsOpen
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {canLike && (
                  <Tooltip content="Like" side="right">
                    <span
                      onClick={handleActionClick}
                      onTouchEnd={handleActionClick}
                    >
                      <LikeButton
                        targetType={type}
                        targetId={item.id}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        useCache={true}
                      />
                    </span>
                  </Tooltip>
                )}
                {canBookmark && (
                  <Tooltip content="Bookmark" side="right">
                    <span
                      onClick={handleActionClick}
                      onTouchEnd={handleActionClick}
                    >
                      <BookmarkButton
                        targetType={type}
                        targetId={item.id}
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        useCache={true}
                      />
                    </span>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Right column - Action buttons over image */}
            {(canFullscreen || canAddToAlbum || canDownload || canDelete) && (
              <div
                className={cn(
                  "absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1 sm:gap-2 transition-opacity duration-200",
                  isMobile
                    ? actionsOpen
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

            {/* Mobile touch area for actions */}
            {isMobile &&
              (canLike ||
                canBookmark ||
                canFullscreen ||
                canAddToAlbum ||
                canDownload ||
                canDelete) && (
                <button
                  className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black/50 rounded-full flex items-center justify-center md:hidden z-20"
                  onClick={handleActionClick}
                  onTouchEnd={handleActionClick}
                >
                  <span className="text-white text-xs">⋯</span>
                </button>
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
