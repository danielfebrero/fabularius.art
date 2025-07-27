"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { TagManager } from "@/components/ui/TagManager";
import { Crown } from "lucide-react";
import { Album } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { CoverImageSelector } from "./CoverImageSelector";

interface EditAlbumDialogProps {
  album: Album | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    albumId: string,
    data: {
      title?: string;
      tags?: string[];
      isPublic?: boolean;
      coverImageUrl?: string;
    }
  ) => Promise<void>;
  loading?: boolean;
}

export function EditAlbumDialog({
  album,
  open,
  onClose,
  onSave,
  loading = false,
}: EditAlbumDialogProps) {
  const { canCreatePrivateContent } = usePermissions();
  const canMakePrivate = canCreatePrivateContent();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when album changes
  useEffect(() => {
    if (album) {
      setTitle(album.title || "");
      setTags(album.tags || []);
      // If user can't make content private, force album to be public
      setIsPublic(canMakePrivate ? album.isPublic || false : true);
      setCoverImageUrl(album.coverImageUrl || "");
    } else {
      setTitle("");
      setTags([]);
      setIsPublic(true); // Default to public
      setCoverImageUrl("");
    }
  }, [album, canMakePrivate]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  const handleSave = async () => {
    if (!album || !title.trim()) return;

    setSaving(true);
    try {
      await onSave(album.id, {
        title: title.trim(),
        tags,
        isPublic,
        coverImageUrl: coverImageUrl.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save album:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!album || !open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-card border border-border p-4 sm:p-6 shadow-2xl transition-all mx-4 sm:mx-0">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Edit Album
            </h3>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter album title..."
                className="w-full"
                disabled={saving || loading}
              />
            </div>

            {/* Tags */}
            <TagManager
              tags={tags}
              onTagsChange={setTags}
              label="Tags"
              placeholder="Add a tag..."
              helpText="Add tags to help users discover your album"
              maxTags={20}
              maxTagLength={50}
              showCounter={true}
              disabled={saving || loading}
              inputClassName="flex-1"
              buttonClassName="border-admin-primary/30 text-admin-primary hover:bg-admin-primary/10"
            />

            {/* Cover Image Selector - only show for existing albums */}
            {album && (
              <CoverImageSelector
                albumId={album.id}
                currentCoverUrl={coverImageUrl}
                onCoverSelect={({ url }) => setCoverImageUrl(url)}
                disabled={saving || loading}
              />
            )}

            {/* Public Toggle */}
            <div className={`space-y-3 ${!canMakePrivate ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">
                      Private Album
                    </label>
                    {!canMakePrivate && (
                      <div className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">
                          Pro Only
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {canMakePrivate
                      ? "Make this album visible only to you"
                      : "Private albums are available for Pro users"}
                  </p>
                </div>
                <Switch
                  checked={!isPublic}
                  onCheckedChange={(checked) => {
                    if (!canMakePrivate) return;
                    setIsPublic(!checked);
                  }}
                  disabled={saving || loading || !canMakePrivate}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || loading}
              className="border-muted-foreground/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saving || loading}
              className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
