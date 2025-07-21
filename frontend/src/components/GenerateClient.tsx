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
import { useUserPermissions } from "@/hooks/useUserPermissions";
import Image from "next/image";
import {
  ImageIcon,
  Crown,
  Zap,
  Grid3X3,
  Lock,
  Sparkles,
  Download,
} from "lucide-react";

interface GenerationSettings {
  prompt: string;
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
    imageSize: "1024x1024",
    customWidth: 1024,
    customHeight: 1024,
    batchCount: 1,
    selectedLoras: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const {
    canGenerateImages,
    checkGenerationLimits,
    getCurrentPlan,
    canUseBulkGeneration,
    canUseLoRAModels,
  } = useUserPermissions();

  const { allowed, remaining } = checkGenerationLimits(settings.batchCount);
  const plan = getCurrentPlan();

  const canUseBulk = canUseBulkGeneration();
  const canUseCustomSizes = plan === 'unlimited' || plan === 'pro'; // Based on canSelectImageSizes from plan
  const canUseLoras = canUseLoRAModels();

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
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-blue-600" />
            AI Generator
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

        {/* Generate Button */}
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
                  <label className="text-xs text-gray-500">Width</label>
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
                  <label className="text-xs text-gray-500">Height</label>
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
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              Generated Images
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={image}
                    alt={`Generated ${index + 1}`}
                    width={settings.customWidth}
                    height={settings.customHeight}
                    className="w-full aspect-square object-cover rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white text-black"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
