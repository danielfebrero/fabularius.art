"use client";

import { Album } from "@/types";
import { Button } from "@/components/ui/Button";

interface AlbumTableProps {
  albums: Album[];
  selectedAlbums: string[];
  onSelectAlbum: (albumId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (albumId: string) => void;
  onDelete: (album: Album) => void;
  onManageMedia: (albumId: string) => void;
  loading?: boolean;
}

export function AlbumTable({
  albums,
  selectedAlbums,
  onSelectAlbum,
  onSelectAll,
  onEdit,
  onDelete,
  onManageMedia,
  loading = false,
}: AlbumTableProps) {
  const allSelected =
    albums.length > 0 && selectedAlbums.length === albums.length;
  const someSelected =
    selectedAlbums.length > 0 && selectedAlbums.length < albums.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && albums.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-8 text-center">
          <div className="text-gray-500">Loading albums...</div>
        </div>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-8 text-center">
          <div className="text-gray-500">No albums found</div>
          <p className="text-sm text-gray-400 mt-2">
            Create your first album to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Album
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Media Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {albums.map((album) => (
              <tr key={album.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAlbums.includes(album.id)}
                    onChange={(e) => onSelectAlbum(album.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {album.coverImageUrl && (
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={album.coverImageUrl}
                          alt={album.title}
                        />
                      </div>
                    )}
                    <div className={album.coverImageUrl ? "ml-4" : ""}>
                      <div className="text-sm font-medium text-gray-900">
                        {album.title}
                      </div>
                      {album.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {album.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      album.isPublic
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {album.isPublic ? "Public" : "Private"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {album.mediaCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(album.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(album.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageMedia(album.id)}
                    >
                      Media
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(album)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
