"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CoverImageSelector } from "@/components/admin/CoverImageSelector";

interface AlbumFormData {
  title: string;
  tags?: string[];
  isPublic: boolean;
  coverImageUrl?: string;
}

interface AlbumFormProps {
  initialData?: Partial<AlbumFormData>;
  onSubmit: (_data: AlbumFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
  albumId?: string; // For existing albums to load media
}

export function AlbumForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save",
  albumId,
}: AlbumFormProps) {
  const [formData, setFormData] = useState<AlbumFormData>({
    title: initialData?.title || "",
    tags: initialData?.tags || [],
    isPublic: initialData?.isPublic ?? false,
    ...(initialData?.coverImageUrl && {
      coverImageUrl: initialData.coverImageUrl,
    }),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors["title"] = "Title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors["title"] = "Title must be at least 2 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors["title"] = "Title must be less than 100 characters";
    }

    if (formData.tags && formData.tags.length > 20) {
      newErrors["tags"] = "Maximum 20 tags allowed";
    }

    if (formData.tags && formData.tags.some((tag) => tag.length > 50)) {
      newErrors["tags"] = "Each tag must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: AlbumFormData = {
      title: formData.title.trim(),
      isPublic: formData.isPublic,
    };

    if (formData.tags && formData.tags.length > 0) {
      submitData.tags = formData.tags;
    }

    if (formData.coverImageUrl) {
      submitData.coverImageUrl = formData.coverImageUrl;
    }

    onSubmit(submitData);
  };

  const handleInputChange = (
    field: keyof AlbumFormData,
    value: string | boolean | string[] | undefined
  ) => {
    setFormData((prev) => {
      if (value === undefined) {
        const { [field]: _, ...rest } = prev;
        return rest as AlbumFormData;
      }
      return { ...prev, [field]: value };
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCoverImageSelect = (coverUrl: string | undefined) => {
    handleInputChange("coverImageUrl", coverUrl);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag) && tag.length <= 50) {
      const newTags = [...(formData.tags || []), tag];
      if (newTags.length <= 20) {
        handleInputChange("tags", newTags);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = formData.tags?.filter((tag) => tag !== tagToRemove) || [];
    handleInputChange("tags", newTags);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card shadow-lg rounded-xl p-8 border border-border">
        <div className="space-y-8">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Album Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter a compelling album title"
              className={
                errors["title"]
                  ? "border-destructive focus:border-destructive focus:ring-destructive"
                  : "focus:border-admin-primary focus:ring-admin-primary"
              }
              disabled={loading}
            />
            {errors["title"] && (
              <p className="mt-2 text-sm text-destructive flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors["title"]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Tags
            </label>
            <div className="flex gap-3">
              <Input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add descriptive tags"
                className={
                  errors["tags"]
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "focus:border-admin-primary focus:ring-admin-primary"
                }
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={
                  loading ||
                  !tagInput.trim() ||
                  (formData.tags?.length || 0) >= 20
                }
                className="border-admin-primary/30 text-admin-primary hover:bg-admin-primary hover:text-admin-primary-foreground"
              >
                Add Tag
              </Button>
            </div>
            {errors["tags"] && (
              <p className="mt-2 text-sm text-destructive flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors["tags"]}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                Help users discover your album with relevant tags
              </p>
              <span className="text-xs font-medium text-admin-primary bg-admin-primary/10 px-2 py-1 rounded-full">
                {formData.tags?.length || 0}/20
              </span>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 text-admin-primary border border-admin-primary/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-admin-primary/60 hover:bg-admin-primary/20 hover:text-admin-primary transition-colors focus:outline-none"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-start space-x-3">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  handleInputChange("isPublic", e.target.checked)
                }
                className="mt-1 h-4 w-4 text-admin-primary focus:ring-admin-primary border-border rounded"
                disabled={loading}
              />
              <div className="flex-1">
                <label
                  htmlFor="isPublic"
                  className="block text-sm font-medium text-foreground cursor-pointer"
                >
                  Make this album public
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public albums are visible to all visitors. Private albums are
                  only accessible to you.
                </p>
              </div>
            </div>
          </div>

          {/* Cover Image Selector - only show for existing albums */}
          {albumId && (
            <div className="border-t border-border pt-6">
              <CoverImageSelector
                albumId={albumId}
                {...(formData.coverImageUrl && {
                  currentCoverUrl: formData.coverImageUrl,
                })}
                onCoverSelect={handleCoverImageSelect}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className="bg-gradient-to-r from-admin-primary to-admin-secondary hover:from-admin-primary/90 hover:to-admin-secondary/90 text-admin-primary-foreground px-8 shadow-lg"
        >
          {loading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </div>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </form>
  );
}
