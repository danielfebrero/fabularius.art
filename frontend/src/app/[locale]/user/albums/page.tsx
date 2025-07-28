"use client";

import { useState } from "react";
import { FolderOpen, Grid, List, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import LocaleLink from "@/components/ui/LocaleLink";
import { ContentCard } from "@/components/ui/ContentCard";
import { cn } from "@/lib/utils";
import { useAlbums } from "@/hooks/useAlbums";
import { EditAlbumDialog } from "@/components/albums/EditAlbumDialog";
import { DeleteAlbumDialog } from "@/components/albums/DeleteAlbumDialog";
import { Album } from "@/types";

const UserAlbumsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);

  // Use the proper user albums hook - rely on session authentication
  const {
    albums,
    loading: isLoading,
    error,
    totalCount,
    updateAlbum,
    deleteAlbum,
  } = useAlbums();

  // Filter albums based on search term
  const filteredAlbums = albums.filter(
    (album) =>
      album.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle album edit
  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
  };

  // Handle album delete
  const handleDeleteAlbum = (album: Album) => {
    setDeletingAlbum(album);
  };

  // Handle save album
  const handleSaveAlbum = async (albumId: string, data: any) => {
    updateAlbum && (await updateAlbum(albumId, data));
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (deletingAlbum) {
      deleteAlbum && (await deleteAlbum(deletingAlbum.id));
      setDeletingAlbum(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/50 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted/50 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                <div className="aspect-video bg-muted/50"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Albums</h1>
              <p className="text-muted-foreground">
                Your personal photo collections
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Unable to load albums
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {error}. Please try refreshing the page or contact support if the
            problem persists.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground shadow-lg"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Albums</h1>
                <p className="text-sm text-muted-foreground">
                  Your personal collections
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="bg-admin-primary/20 text-admin-primary text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} albums
            </span>
            <LocaleLink href="/user/albums/create">
              <Button className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            </LocaleLink>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Albums</h1>
              <p className="text-muted-foreground">
                Your personal photo collections
              </p>
            </div>
            <span className="bg-admin-primary/20 text-admin-primary text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} albums
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <LocaleLink href="/user/albums/create">
              <Button className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Album</span>
              </Button>
            </LocaleLink>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "hidden sm:inline-flex",
                viewMode === "grid"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "hidden sm:inline-flex",
                viewMode === "list"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredAlbums.length > 0 ? (
        <div className="space-y-6">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {filteredAlbums.map((album, index) => (
              <ContentCard
                key={`${album.id}-${index}`}
                item={album}
                type="album"
                showTags={false}
                customActions={[
                  {
                    label: "Edit",
                    icon: <Edit className="h-3 w-3" />,
                    onClick: () => handleEditAlbum(album),
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 className="h-3 w-3" />,
                    onClick: () => handleDeleteAlbum(album),
                    variant: "destructive" as const,
                  },
                ]}
                preferredThumbnailSize={
                  viewMode === "grid" ? undefined : "originalSize"
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-admin-primary/20 to-admin-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="h-10 w-10 text-admin-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {searchTerm ? "No matching albums found" : "No albums yet"}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {searchTerm
              ? `Try adjusting your search for "${searchTerm}"`
              : "Create your first album to organize your content and start building your collection!"}
          </p>
          <div className="flex justify-center space-x-4">
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="border-admin-primary/30 text-admin-primary hover:bg-admin-primary/10"
              >
                Clear Search
              </Button>
            )}
            <LocaleLink href="/user/albums/create">
              <Button className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Album</span>
              </Button>
            </LocaleLink>
          </div>
        </div>
      )}

      {/* Edit Album Dialog */}
      <EditAlbumDialog
        album={editingAlbum}
        open={!!editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSave={handleSaveAlbum}
        loading={isLoading}
      />

      {/* Delete Album Dialog */}
      <DeleteAlbumDialog
        albumTitle={deletingAlbum?.title || ""}
        open={!!deletingAlbum}
        onClose={() => setDeletingAlbum(null)}
        onConfirm={handleConfirmDelete}
        loading={isLoading}
      />
    </div>
  );
};

export default UserAlbumsPage;
