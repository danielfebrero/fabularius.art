"use client";

import { useRouter } from "next/navigation";
import { useAlbums } from "../hooks/useAlbums";
import { AlbumGrid } from "../components/AlbumGrid";
import { Album } from "../types/index";

export default function HomePage() {
  const router = useRouter();
  const { albums, loading, error, pagination, refetch, loadMore } = useAlbums({
    isPublic: true,
    limit: 12,
  });

  const handleAlbumClick = (album: Album) => {
    router.push(`/albums/${album.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to Fabularius.art
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A minimalist gallery for showcasing your art and photography
          collections. Discover beautiful albums from our community of artists.
        </p>
      </div>

      {/* Albums Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            Featured Albums
          </h2>
          {error && (
            <button
              onClick={refetch}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        <AlbumGrid
          albums={albums}
          loading={loading}
          error={error}
          pagination={pagination}
          onAlbumClick={handleAlbumClick}
          onLoadMore={loadMore}
        />
      </div>

      {/* Features Section - Only show if there are albums or no error */}
      {!error && albums.length > 0 && (
        <>
          <div className="border-t pt-8 mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Features
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Create Albums</h3>
                </div>
                <div className="card-content">
                  <p className="text-muted-foreground">
                    Organize your artwork into beautiful albums with custom
                    titles and descriptions.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Upload Media</h3>
                </div>
                <div className="card-content">
                  <p className="text-muted-foreground">
                    Upload high-quality images with automatic optimization and
                    thumbnail generation.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Share & Showcase</h3>
                </div>
                <div className="card-content">
                  <p className="text-muted-foreground">
                    Share your albums publicly or keep them private. Perfect for
                    portfolios and exhibitions.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button className="btn-primary text-lg px-8 py-3">
                Get Started
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
