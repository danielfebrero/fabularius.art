"use client";

import { useState } from "react";
import { FolderOpen, Search, Grid, List, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const UserAlbumsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder data - replace with actual API calls
  const [albums] = useState<any[]>([]);
  const [isLoading] = useState(false);
  const [totalCount] = useState(0);

  // Filter albums based on search term
  const filteredAlbums = albums.filter(
    (album) =>
      album.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Albums</h1>
              <p className="text-muted-foreground">
                Your personal photo collections
              </p>
            </div>
            <span className="bg-admin-primary/20 text-admin-primary text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} albums
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              }
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-admin-primary/60" />
          <input
            type="text"
            placeholder="Search your albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-admin-primary/20 rounded-xl focus:ring-2 focus:ring-admin-primary/50 focus:border-admin-primary/50 bg-card/50 backdrop-blur-sm transition-all duration-200"
          />
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
              <div
                key={`${album.id}-${index}`}
                className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300 group"
              >
                {/* Album content would go here */}
                <div className="aspect-video bg-gradient-to-br from-admin-primary/10 to-admin-secondary/10 flex items-center justify-center group-hover:from-admin-primary/20 group-hover:to-admin-secondary/20 transition-all duration-300">
                  <FolderOpen className="h-12 w-12 text-admin-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-admin-primary transition-colors duration-200">
                    {album.title || `Album ${album.id}`}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="bg-admin-accent/20 text-admin-accent px-2 py-1 rounded-md font-medium">
                      {album.mediaCount || 0} items
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(album.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
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
            <Button className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground shadow-lg flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Album</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAlbumsPage;
