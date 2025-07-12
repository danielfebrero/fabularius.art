import Link from "next/link";
import { Album } from "../../types/index";
import { Card, CardContent, CardHeader } from "./Card";
import { cn } from "../../lib/utils";

interface AlbumCardProps {
  album: Album;
  className?: string;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, className }) => {
  return (
    <Link href={`/albums/${album.id}`} className="group block">
      <Card
        className={cn(
          "h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
          className
        )}
      >
        <CardHeader className="p-0">
          <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
            {album.coverImageUrl ? (
              <img
                src={album.coverImageUrl}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
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
            {album.mediaCount > 0 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {album.mediaCount} {album.mediaCount === 1 ? "item" : "items"}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {album.title}
            </h3>
            {album.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {album.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>{new Date(album.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
