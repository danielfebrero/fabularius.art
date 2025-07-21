import Link from "next/link";
import { Heart, Bookmark, Eye } from "lucide-react";
import { Album } from "../../types/index";
import { Card, CardContent, CardHeader } from "./Card";
import { cn, formatDateShort, ThumbnailContext } from "../../lib/utils";
import { composeAlbumCoverUrl, composeThumbnailUrls } from "../../lib/urlUtils";
import ResponsivePicture from "./ResponsivePicture";
import { LikeButton } from "../user/LikeButton";
import { BookmarkButton } from "../user/BookmarkButton";
import { interactionApi } from "../../lib/api";

interface AlbumCardProps {
  album: Album;
  className?: string;
  context?: ThumbnailContext;
  columns?: number;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  className,
  context = "homepage",
  columns,
}) => {
  const handleViewClick = async () => {
    try {
      await interactionApi.trackView({
        targetType: "album",
        targetId: album.id,
      });
    } catch (error) {
      // Silently fail view tracking - not critical
      console.debug("View tracking failed:", error);
    }
  };
  return (
    <Card
      className={cn(
        "h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group",
        className
      )}
    >
      <CardHeader className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          <Link
            href={`/albums/${album.id}`}
            className="block w-full h-full"
            onClick={handleViewClick}
          >
            {album.coverImageUrl ? (
              <ResponsivePicture
                thumbnailUrls={composeThumbnailUrls(album.thumbnailUrls)}
                fallbackUrl={composeAlbumCoverUrl(album.coverImageUrl)}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                context={context}
                columns={columns}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                <div className="text-center text-muted-foreground">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">No Cover</p>
                </div>
              </div>
            )}
          </Link>

          {/* Media count overlay */}
          {album.mediaCount > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {album.mediaCount} {album.mediaCount === 1 ? "item" : "items"}
            </div>
          )}

          {/* Action buttons overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <LikeButton
              targetType="album"
              targetId={album.id}
              size="sm"
              variant="default"
              className="bg-white/90 hover:bg-white shadow-lg"
            />
            <BookmarkButton
              targetType="album"
              targetId={album.id}
              size="sm"
              variant="default"
              className="bg-white/90 hover:bg-white shadow-lg"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          <Link href={`/albums/${album.id}`} onClick={handleViewClick}>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {album.title}
            </h3>
          </Link>

          {album.tags && album.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {album.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 text-admin-primary border border-admin-primary/20"
                >
                  {tag}
                </span>
              ))}
              {album.tags.length > 3 && (
                <span className="text-xs text-muted-foreground font-medium">
                  +{album.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Interaction stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {/* Album interaction counts from database */}
            <div className="flex items-center gap-3">
              {/* Likes */}
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500 fill-current" />
                <span className="text-xs text-muted-foreground font-medium">
                  {album.likeCount || 0}
                </span>
              </div>

              {/* Bookmarks */}
              <div className="flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-blue-500 fill-current" />
                <span className="text-xs text-muted-foreground font-medium">
                  {album.bookmarkCount || 0}
                </span>
              </div>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {album.viewCount || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDateShort(album.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
