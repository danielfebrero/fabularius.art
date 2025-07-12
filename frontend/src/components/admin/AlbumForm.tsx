"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AlbumFormData {
  title: string;
  description?: string;
  isPublic: boolean;
}

interface AlbumFormProps {
  initialData?: Partial<AlbumFormData>;
  onSubmit: (_data: AlbumFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitText?: string;
}

export function AlbumForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save",
}: AlbumFormProps) {
  const [formData, setFormData] = useState<AlbumFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    isPublic: initialData?.isPublic ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors["title"] = "Title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors["title"] = "Title must be at least 2 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors["title"] = "Title must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors["description"] = "Description must be less than 500 characters";
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

    if (formData.description?.trim()) {
      submitData.description = formData.description.trim();
    }

    onSubmit(submitData);
  };

  const handleInputChange = (
    field: keyof AlbumFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <div className="mt-1">
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter album title"
                className={
                  errors["title"]
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                disabled={loading}
              />
              {errors["title"] && (
                <p className="mt-1 text-sm text-red-600">{errors["title"]}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter album description (optional)"
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors["description"]
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                disabled={loading}
              />
              {errors["description"] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors["description"]}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description?.length || 0}/500 characters
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  handleInputChange("isPublic", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-900"
              >
                Make this album public
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Public albums can be viewed by anyone. Private albums are only
              visible to you.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Saving..." : submitText}
        </Button>
      </div>
    </form>
  );
}
