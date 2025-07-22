"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Lightbox } from "@/components/ui/Lightbox";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import Image from "next/image";
import {
  ImageIcon,
  Crown,
  Zap,
  Grid3X3,
  Lock,
  Download,
  MinusCircle,
  Plus,
  Trash2,
  Heart,
  Bookmark,
} from "lucide-react";

interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  imageSize: string;
  customWidth: number;
  customHeight: number;
  batchCount: number;
  selectedLoras: string[];
}

const IMAGE_SIZES = [
  {
    value: "1024x1024",
    label: "1024×1024 (Square)",
    width: 1024,
    height: 1024,
  },
  {
    value: "1536x1024",
    label: "1536×1024 (Landscape)",
    width: 1536,
    height: 1024,
  },
  {
    value: "1024x1536",
    label: "1024×1536 (Portrait)",
    width: 1024,
    height: 1536,
  },
  { value: "1792x1024", label: "1792×1024 (Wide)", width: 1792, height: 1024 },
  { value: "1024x1792", label: "1024×1792 (Tall)", width: 1024, height: 1792 },
  { value: "custom", label: "Custom", width: 1024, height: 1024 },
];

const LORA_MODELS = [
  {
    id: "realistic-enhance",
    name: "Realistic Enhancement",
    description: "Enhances photo-realism",
  },
  {
    id: "artistic-style",
    name: "Artistic Style",
    description: "Adds artistic flair",
  },
  {
    id: "detail-boost",
    name: "Detail Boost",
    description: "Increases fine details",
  },
  {
    id: "color-enhance",
    name: "Color Enhancement",
    description: "Vibrant colors",
  },
  {
    id: "lighting-master",
    name: "Lighting Master",
    description: "Perfect lighting",
  },
];

export function GenerateClient() {
  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: "",
    negativePrompt: "",
    imageSize: "1024x1024",
    customWidth: 1024,
    customHeight: 1024,
    batchCount: 1,
    selectedLoras: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [allGeneratedImages, setAllGeneratedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const {
    canGenerateImages,
    checkGenerationLimits,
    getCurrentPlan,
    canUseBulkGeneration,
    canUseLoRAModels,
    canUseNegativePrompt,
  } = useUserPermissions();

  const { allowed, remaining } = checkGenerationLimits(settings.batchCount);
  const plan = getCurrentPlan();

  const canUseBulk = canUseBulkGeneration();
  const canUseCustomSizes = plan === "pro"; // Only Pro plan has access to image size selection
  const canUseLoras = canUseLoRAModels();
  const canUseNegativePrompts = canUseNegativePrompt();

  const updateSettings = (key: keyof GenerationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLora = (loraId: string) => {
    setSettings((prev) => ({
      ...prev,
      selectedLoras: prev.selectedLoras.includes(loraId)
        ? prev.selectedLoras.filter((id) => id !== loraId)
        : [...prev.selectedLoras, loraId],
    }));
  };

  // Convert image URLs to Media objects for the Lightbox component
  const createMediaFromUrl = (url: string, index: number) => ({
    id: `generated-${Date.now()}-${index}`,
    filename: `generated-image-${index + 1}.jpg`,
    originalName: `Generated Image ${index + 1}`,
    url: url,
    mimeType: "image/jpeg",
    size: 0,
    albumId: "generated",
    userId: "current-user",
    uploadedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
  });

  // Open lightbox for current generated images
  const openLightbox = (imageUrl: string) => {
    const allImages = generatedImages.length > 0 ? generatedImages : allGeneratedImages;
    const index = allImages.findIndex(url => url === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Open lightbox for thumbnail (from all generated images)
  const openThumbnailLightbox = (imageUrl: string) => {
    const index = allGeneratedImages.findIndex(url => url === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerateImages() || !allowed || !settings.prompt.trim()) return;

    setIsGenerating(true);

    // Simulate generation process
    const promises = Array(settings.batchCount)
      .fill(null)
      .map(
        (_, i) =>
          new Promise<string>((resolve) => {
            setTimeout(() => {
              resolve(
                `https://picsum.photos/${settings.customWidth}/${
                  settings.customHeight
                }?random=${Date.now()}_${i}`
              );
            }, 2000 + Math.random() * 1000);
          })
      );

    try {
      const images = await Promise.all(promises);
      setGeneratedImages(images);
      setAllGeneratedImages((prev) => [...images, ...prev]);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        {!isGenerating && generatedImages.length === 0 && (
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
              <Zap className="h-10 w-10 text-blue-600" />
              AI Image Generator
            </h1>
            <p className="text-gray-600">Create stunning AI-generated images</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge
                variant={plan === "pro" ? "default" : "secondary"}
                className="capitalize"
              >
                {plan} Plan
              </Badge>
              {remaining !== "unlimited" && (
                <span className="text-sm text-gray-500">
                  {remaining} generations remaining
                </span>
              )}
            </div>
          </div>
        )}

        {/* Generation Placeholder / Generated Images */}
        {(isGenerating || generatedImages.length > 0) && (
          <div className="text-center space-y-4">
            {isGenerating ? (
              // Loading placeholder - Dark themed
              <div className="w-full max-w-sm sm:max-w-md mx-auto aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400 mb-4"></div>
                <div className="text-lg font-semibold text-white mb-2">
                  Generating Your Image
                </div>
                <div className="text-sm text-gray-300">
                  This may take a few moments...
                </div>
              </div>
            ) : settings.batchCount === 1 ? (
              // Single image - replace the placeholder
              <div className="w-full max-w-sm sm:max-w-md mx-auto relative group">
                <Image
                  src={generatedImages[0]}
                  alt="Generated image"
                  width={settings.customWidth}
                  height={settings.customHeight}
                  className="w-full aspect-square object-cover rounded-xl shadow-lg cursor-pointer"
                  onClick={() => openLightbox(generatedImages[0])}
                />
                {/* Left column - Like and Bookmark */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Heart className="h-4 w-4" />
                  </button>
                  <button className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
                {/* Right column - Download, Plus, and Trash */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              // Multiple images - grid layout
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
                  <ImageIcon className="h-5 w-5" />
                  Generated Images
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={image}
                        alt={`Generated ${index + 1}`}
                        width={settings.customWidth}
                        height={settings.customHeight}
                        className="w-full aspect-square object-cover rounded-lg shadow-lg cursor-pointer"
                        onClick={() => openLightbox(image)}
                      />
                      {/* Left column - Like and Bookmark */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                          <Heart className="h-3 w-3" />
                        </button>
                        <button className="bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                          <Bookmark className="h-3 w-3" />
                        </button>
                      </div>
                      {/* Right column - Download, Plus, and Trash */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                          <Download className="h-3 w-3" />
                        </button>
                        <button className="bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button className="bg-white/90 hover:bg-white text-red-600 p-1.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Prompt Input */}
        <div className="space-y-3">
          <Textarea
            placeholder="Describe what you want to generate..."
            value={settings.prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              updateSettings("prompt", e.target.value)
            }
            className="w-full h-32 text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-none"
          />
        </div>

        {/* Generate Button - Always Visible */}
        <Button
          onClick={handleGenerate}
          disabled={!allowed || !settings.prompt.trim() || isGenerating}
          className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Generate{" "}
              {settings.batchCount > 1
                ? `${settings.batchCount} Images`
                : "Image"}
            </div>
          )}
        </Button>

        {/* Previously Generated Images Thumbnails */}
        {allGeneratedImages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 text-center">Previously Generated</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allGeneratedImages.slice(0, 10).map((image, index) => (
                <div key={index} className="flex-shrink-0">
                  <Image
                    src={image}
                    alt={`Previous ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openThumbnailLightbox(image)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to maintain consistent spacing */}
        <div></div>

        {/* Pro Features */}
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Image Size */}
          <div
            className={`space-y-3 ${!canUseCustomSizes ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              <label className="text-sm font-semibold">Image Size</label>
              {!canUseCustomSizes && (
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Pro Only
                  </span>
                </div>
              )}
            </div>
            <Select
              value={settings.imageSize}
              disabled={!canUseCustomSizes}
              onValueChange={(value: string) => {
                if (!canUseCustomSizes) return;
                updateSettings("imageSize", value);
                const size = IMAGE_SIZES.find((s) => s.value === value);
                if (size) {
                  updateSettings("customWidth", size.width);
                  updateSettings("customHeight", size.height);
                }
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {settings.imageSize === "custom" && canUseCustomSizes && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Width</label>
                  <Input
                    type="number"
                    min="512"
                    max="2048"
                    step="64"
                    value={settings.customWidth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateSettings(
                        "customWidth",
                        parseInt(e.target.value) || 1024
                      )
                    }
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Height
                  </label>
                  <Input
                    type="number"
                    min="512"
                    max="2048"
                    step="64"
                    value={settings.customHeight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateSettings(
                        "customHeight",
                        parseInt(e.target.value) || 1024
                      )
                    }
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bulk Generation */}
          <div className={`space-y-3 ${!canUseBulk ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <label className="text-sm font-semibold">Batch Count</label>
              {!canUseBulk && (
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Pro Only
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map((count) => (
                <Button
                  key={count}
                  variant={
                    settings.batchCount === count ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    canUseBulk && updateSettings("batchCount", count)
                  }
                  disabled={
                    !canUseBulk || !checkGenerationLimits(count).allowed
                  }
                  className="flex-1 h-12"
                >
                  {count}
                </Button>
              ))}
            </div>
            {settings.batchCount > 1 && (
              <p className="text-xs text-gray-500">
                Uses {settings.batchCount} of your generation quota
              </p>
            )}
          </div>

          {/* LoRA Models */}
          <div className={`space-y-3 ${!canUseLoras ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <label className="text-sm font-semibold">LoRA Models</label>
              {!canUseLoras && (
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Pro Only
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {LORA_MODELS.map((lora) => (
                <div
                  key={lora.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    settings.selectedLoras.includes(lora.id) && canUseLoras
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!canUseLoras ? "cursor-not-allowed" : ""}`}
                  onClick={() => canUseLoras && toggleLora(lora.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{lora.name}</div>
                      <div className="text-xs text-gray-500">
                        {lora.description}
                      </div>
                    </div>
                    {settings.selectedLoras.includes(lora.id) &&
                      canUseLoras && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    {!canUseLoras && <Lock className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
            {settings.selectedLoras.length > 0 && canUseLoras && (
              <p className="text-xs text-blue-600">
                {settings.selectedLoras.length} LoRA
                {settings.selectedLoras.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Negative Prompt Input - Pro Only */}
          <div
            className={`space-y-3 ${
              !canUseNegativePrompts ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5" />
              <label className="text-sm font-semibold">Negative Prompt</label>
              {!canUseNegativePrompts && (
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Pro Only
                  </span>
                </div>
              )}
            </div>
            <Textarea
              placeholder="Describe what you don't want to see in your images..."
              value={settings.negativePrompt}
              disabled={!canUseNegativePrompts}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (!canUseNegativePrompts) return;
                updateSettings("negativePrompt", e.target.value);
              }}
              className={`w-full h-24 text-base p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 resize-none ${
                !canUseNegativePrompts ? "cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>

        {/* Lightbox */}
        <Lightbox
          media={allGeneratedImages.map(createMediaFromUrl)}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex(prev => Math.min(prev + 1, allGeneratedImages.length - 1))}
          onPrevious={() => setLightboxIndex(prev => Math.max(prev - 1, 0))}
        />
      </div>
    </div>
  );
}
