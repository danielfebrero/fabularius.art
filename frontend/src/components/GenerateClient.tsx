"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Lightbox } from "@/components/ui/Lightbox";
import { ContentCard } from "@/components/ui/ContentCard";
import { GradientTextarea } from "@/components/ui/GradientTextarea";
import { MagicText, MagicTextHandle } from "@/components/ui/MagicText";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { FrontendMedia } from "@/types/user";
import {
  ImageIcon,
  Crown,
  Zap,
  Grid3X3,
  Lock,
  MinusCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleRouter } from "@/lib/navigation";

interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  imageSize: string;
  customWidth: number;
  customHeight: number;
  batchCount: number;
  selectedLoras: string[];
  loraStrengths: Record<string, { mode: "auto" | "manual"; value: number }>;
  loraSelectionMode: "auto" | "manual";
  optimizePrompt: boolean;
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
    id: "leaked-amateur",
    name: "Leaked amateur",
    description: "Generate amateur-style images",
  },
  {
    id: "anal-pov",
    name: "Anal POV",
    description: "As if you are in the scene",
  },
  {
    id: "add-details",
    name: "Add details",
    description: "Increases fine details",
  },
];

export function GenerateClient() {
  const magicTextRef = useRef<MagicTextHandle>(null);

  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: "",
    negativePrompt: "",
    imageSize: "1024x1024",
    customWidth: 1024,
    customHeight: 1024,
    batchCount: 1,
    selectedLoras: [],
    loraStrengths: {},
    loraSelectionMode: "auto",
    optimizePrompt: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [allGeneratedImages, setAllGeneratedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showMagicText, setShowMagicText] = useState(false);

  // Track optimization state to prevent re-optimizing the same prompt
  const [lastOptimizedPrompt, setLastOptimizedPrompt] = useState<string>("");
  const [optimizedPromptCache, setOptimizedPromptCache] = useState<string>("");
  const [
    originalPromptBeforeOptimization,
    setOriginalPromptBeforeOptimization,
  ] = useState<string>("");

  const {
    canGenerateImages,
    checkGenerationLimits,
    getCurrentPlan,
    canUseBulkGeneration,
    canUseLoRAModels,
    canUseNegativePrompt,
    canUseCustomSizes,
  } = useUserPermissions();

  const router = useLocaleRouter();

  const { allowed, remaining } = checkGenerationLimits(settings.batchCount);
  const plan = getCurrentPlan();

  const canUseBulk = canUseBulkGeneration();
  const canUseLoras = canUseLoRAModels();
  const canUseNegativePrompts = canUseNegativePrompt();

  const updateSettings = (key: keyof GenerationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // If the prompt is being changed manually, clear the optimization cache
    // This ensures a new/modified prompt can be optimized again
    if (key === "prompt") {
      // Only clear cache if the new prompt is different from both the original and optimized versions
      if (value !== lastOptimizedPrompt && value !== optimizedPromptCache) {
        setLastOptimizedPrompt("");
        setOptimizedPromptCache("");
        setOriginalPromptBeforeOptimization("");
      }
    }
  };

  const toggleLora = (loraId: string) => {
    // Only allow toggling in manual mode
    if (settings.loraSelectionMode === "auto") {
      return;
    }

    setSettings((prev) => {
      const isCurrentlySelected = prev.selectedLoras.includes(loraId);

      if (isCurrentlySelected) {
        // Remove LoRA and its strength settings
        const newLoraStrengths = { ...prev.loraStrengths };
        delete newLoraStrengths[loraId];

        return {
          ...prev,
          selectedLoras: prev.selectedLoras.filter((id) => id !== loraId),
          loraStrengths: newLoraStrengths,
        };
      } else {
        // Add LoRA with default strength settings
        return {
          ...prev,
          selectedLoras: [...prev.selectedLoras, loraId],
          loraStrengths: {
            ...prev.loraStrengths,
            [loraId]: { mode: "auto", value: 1.0 },
          },
        };
      }
    });
  };

  const handleLoraClickInAutoMode = (loraId: string) => {
    // Only Pro users can switch to manual mode and select LoRAs
    if (!canUseLoras) {
      return;
    }

    // Switch to manual mode and select the clicked LoRA
    setSettings((prev) => ({
      ...prev,
      loraSelectionMode: "manual",
      selectedLoras: [loraId],
      loraStrengths: {
        ...prev.loraStrengths,
        [loraId]: { mode: "auto", value: 1.0 },
      },
    }));
  };

  const updateLoraStrength = (
    loraId: string,
    mode: "auto" | "manual",
    value?: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      loraStrengths: {
        ...prev.loraStrengths,
        [loraId]: {
          mode,
          value:
            value !== undefined
              ? value
              : prev.loraStrengths[loraId]?.value || 1.0,
        },
      },
    }));
  };

  const updateLoraSelectionMode = (mode: "auto" | "manual") => {
    if (mode === "manual" && !canUseLoras) {
      // Non-Pro users cannot use manual mode
      return;
    }
    setSettings((prev) => ({ ...prev, loraSelectionMode: mode }));
  };

  // Revert to original prompt before optimization
  const revertToOriginalPrompt = () => {
    if (originalPromptBeforeOptimization) {
      setSettings((prev) => ({
        ...prev,
        prompt: originalPromptBeforeOptimization,
      }));
      // Clear the optimization cache since we're reverting
      setLastOptimizedPrompt("");
      setOptimizedPromptCache("");
      setOriginalPromptBeforeOptimization("");
    }
  };

  // Optimize prompt function with magical animation
  const optimizePrompt = async (originalPrompt: string): Promise<string> => {
    setIsOptimizing(true);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // PLACEHOLDER: Replace with actual SDXL prompt optimization logic
    const optimizedPrompt = `${originalPrompt}, (masterpiece:1.2), (best quality:1.2), (ultra-detailed:1.2), (realistic:1.2), (photorealistic:1.2), sharp focus, cinematic lighting, detailed textures, high resolution, professional photography, depth of field, bokeh effect, vibrant colors, perfect composition`;

    setIsOptimizing(false);
    return optimizedPrompt;
  };

  // Convert image URLs to Media objects for the Lightbox component
  const createMediaFromUrl = (url: string, index: number): FrontendMedia => ({
    id: `generated-${Date.now()}-${index}`,
    filename: `generated-image-${index + 1}.jpg`,
    originalFilename: `generated-image-${index + 1}.jpg`, // Required by Media interface
    type: "media",
    originalName: `Generated Image ${index + 1}`, // Frontend convenience field
    url: url,
    mimeType: "image/jpeg",
    size: 0,
    albumId: "generated", // Frontend-specific field
    userId: "current-user", // Frontend-specific field
    uploadedAt: new Date().toISOString(), // Frontend-specific field
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false, // Frontend-specific field
  });

  // Open lightbox for thumbnail (from all generated images)
  const openThumbnailLightbox = (imageUrl: string) => {
    console.log("Opening lightbox for image:", imageUrl);
    const index = allGeneratedImages.findIndex((url) => url === imageUrl);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerateImages() || !allowed || !settings.prompt.trim()) return;

    let finalPrompt = settings.prompt;

    // Optimize prompt if enabled
    if (settings.optimizePrompt) {
      try {
        handleResetMagicText();
        setShowMagicText(true);
        // Check if we already have an optimized version of this exact prompt
        // Case 1: Current prompt is the original that was optimized before
        // Case 2: Current prompt is already the optimized version from a previous optimization
        if (
          (originalPromptBeforeOptimization &&
            settings.prompt === originalPromptBeforeOptimization &&
            optimizedPromptCache) ||
          (settings.prompt === optimizedPromptCache && optimizedPromptCache)
        ) {
          // Use cached optimized prompt instead of re-optimizing
          finalPrompt = optimizedPromptCache;
        } else {
          // This is a new/different prompt, optimize it
          const originalPrompt = settings.prompt;
          finalPrompt = await optimizePrompt(settings.prompt);
          // Cache the optimization result
          setOriginalPromptBeforeOptimization(originalPrompt);
          setLastOptimizedPrompt(originalPrompt);
          setOptimizedPromptCache(finalPrompt);
          // Update the settings with the optimized prompt (but avoid triggering cache clearing)
          setSettings((prev) => ({ ...prev, prompt: finalPrompt }));

          handleCastSpell(finalPrompt);
        }
      } catch (error) {
        console.error("Prompt optimization failed:", error);
        // Continue with original prompt if optimization fails
      }
    }

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

  const handleCastSpell = (newText: string) => {
    if (magicTextRef.current) {
      magicTextRef.current.castSpell(newText); // Pass the new text here
    }
  };

  const handleResetMagicText = () => {
    if (magicTextRef.current) {
      magicTextRef.current.reset();
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      onClick={() => showMagicText && !isOptimizing && setShowMagicText(false)}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Header */}
          {!isGenerating && generatedImages.length === 0 && (
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full blur opacity-30 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                  AI Image Generator
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Transform your imagination into stunning AI-generated artwork
                  with advanced customization and professional quality
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="bg-card border border-border rounded-full px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        plan === "pro"
                          ? "bg-green-500"
                          : plan === "unlimited"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      )}
                    ></div>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {plan} Plan
                    </span>
                  </div>
                </div>

                {remaining !== "unlimited" && (
                  <div className="bg-muted/50 rounded-full px-4 py-2">
                    <span className="text-sm text-muted-foreground">
                      {remaining} generations remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generation Results / Loading */}
          {(isGenerating || generatedImages.length > 0) && (
            <div className="text-center space-y-6">
              {isGenerating ? (
                <div className="relative">
                  <div className="w-full max-w-md mx-auto aspect-square bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center shadow-lg">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        Generating Your Masterpiece
                      </h3>
                      <p className="text-muted-foreground">
                        Creating magic with AI... This may take a few moments
                      </p>
                    </div>
                  </div>
                </div>
              ) : settings.batchCount === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">
                      Generation Complete
                    </span>
                  </div>
                  <div className="w-full max-w-md mx-auto">
                    <ContentCard
                      item={createMediaFromUrl(generatedImages[0], 0)}
                      aspectRatio="square"
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={true}
                      canAddToAlbum={true}
                      canDownload={true}
                      canDelete={true}
                      mediaList={generatedImages.map((url, index) =>
                        createMediaFromUrl(url, index)
                      )}
                      currentIndex={0}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">
                      {generatedImages.length} Images Generated
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {generatedImages.map((image, index) => (
                      <ContentCard
                        key={index}
                        item={createMediaFromUrl(image, index)}
                        aspectRatio="square"
                        canLike={false}
                        canBookmark={false}
                        canFullscreen={true}
                        canAddToAlbum={true}
                        canDownload={true}
                        canDelete={true}
                        mediaList={generatedImages.map((url, idx) =>
                          createMediaFromUrl(url, idx)
                        )}
                        currentIndex={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Prompt Input */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Describe Your Vision
              </h2>
              <p className="text-muted-foreground">
                The more detailed your description, the better your results
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <GradientTextarea
                  placeholder="Amateur photo, woman, 21, laying on the balcony, parisian building, lace thong..."
                  value={settings.prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateSettings("prompt", e.target.value)
                  }
                  className="w-full h-40 md:h-32 text-lg p-6 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 resize-none transition-all"
                />

                {/* Magical overlay during optimization */}
                {showMagicText && (
                  <MagicText
                    originalText={
                      originalPromptBeforeOptimization || settings.prompt
                    }
                    ref={magicTextRef}
                  />
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Be descriptive for better results
                </div>
                <div
                  className={cn(
                    "text-xs font-medium",
                    settings.prompt.length > 800
                      ? "text-amber-600 dark:text-amber-400"
                      : settings.prompt.length > 900
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {settings.prompt.length}/1000
                </div>
              </div>

              {/* Optimize Prompt Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Optimize prompt
                    </h4>
                  </div>
                </div>
                <Switch
                  checked={settings.optimizePrompt}
                  onCheckedChange={(checked) =>
                    updateSettings("optimizePrompt", checked)
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Revert to Original Prompt Button */}
              {originalPromptBeforeOptimization && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3 w-3" />
                    <span>
                      {settings.prompt === originalPromptBeforeOptimization
                        ? "Viewing original prompt"
                        : "Prompt optimized"}
                    </span>
                  </div>
                  {settings.prompt !== originalPromptBeforeOptimization && (
                    <button
                      onClick={revertToOriginalPrompt}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      Revert to original
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="relative">
            <Button
              onClick={handleGenerate}
              disabled={
                !allowed ||
                !settings.prompt.trim() ||
                isGenerating ||
                isOptimizing
              }
              className={cn(
                "w-full h-16 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]",
                isGenerating || isOptimizing
                  ? "bg-gradient-to-r from-primary/80 to-purple-600/80"
                  : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              )}
              size="lg"
            >
              {isOptimizing ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                  </div>
                  <span>Optimizing Prompt...</span>
                </div>
              ) : isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Magic...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span>
                    Generate{" "}
                    {settings.batchCount > 1
                      ? `${settings.batchCount} Images`
                      : "Image"}
                  </span>
                </div>
              )}
            </Button>

            {/* Status indicator */}
            {!allowed && (
              <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full">
                  Generation limit reached
                </div>
              </div>
            )}
          </div>

          {/* Previously Generated Images */}
          {allGeneratedImages.length > 0 && (
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Generations
                </h3>
                <div className="text-sm text-muted-foreground">
                  {allGeneratedImages.length} images
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allGeneratedImages.slice(0, 10).map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 group"
                    onClick={() => openThumbnailLightbox(image)}
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border group-hover:border-primary transition-colors cursor-pointer shadow-md hover:shadow-lg">
                      <img
                        src={image}
                        alt={`Previous ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/0 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                          <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Features */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Advanced Controls
              </h2>
              <p className="text-muted-foreground">
                Fine-tune your generation with professional parameters
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Size */}
              <div
                className={cn(
                  "bg-card border border-border rounded-2xl shadow-lg p-6 transition-all",
                  !canUseCustomSizes() && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      canUseCustomSizes()
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      Image Size
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose dimensions
                    </p>
                  </div>
                  {!canUseCustomSizes() && (
                    <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                      <Crown className="h-3 w-3" />
                      <span className="text-xs font-medium">Pro</span>
                    </div>
                  )}
                </div>

                <Select
                  value={settings.imageSize}
                  disabled={!canUseCustomSizes()}
                  onValueChange={(value: string) => {
                    if (!canUseCustomSizes()) return;
                    updateSettings("imageSize", value);
                    const size = IMAGE_SIZES.find((s) => s.value === value);
                    if (size) {
                      updateSettings("customWidth", size.width);
                      updateSettings("customHeight", size.height);
                    }
                  }}
                >
                  <SelectTrigger className="h-12 border-2">
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

                {settings.imageSize === "custom" && canUseCustomSizes() && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Width
                      </label>
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
                        className="h-10 border-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
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
                        className="h-10 border-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Count */}
              <div
                className={cn(
                  "bg-card border border-border rounded-2xl shadow-lg p-6 transition-all",
                  !canUseBulk && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      canUseBulk
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      Batch Count
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generate multiple
                    </p>
                  </div>
                  {!canUseBulk && (
                    <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                      <Crown className="h-3 w-3" />
                      <span className="text-xs font-medium">Pro</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
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
                      className="h-12 font-semibold"
                    >
                      {count}
                    </Button>
                  ))}
                </div>

                {/* {settings.batchCount > 1 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Uses {settings.batchCount} of your generation quota
                  </p>
                )} */}
              </div>
            </div>

            {/* LoRA Models */}
            <div
              className={cn(
                "bg-card border border-border rounded-2xl shadow-lg p-6 transition-all",
                !canUseLoras && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">LoRA Models</h3>
                  <p className="text-sm text-muted-foreground">
                    Enhance your style
                  </p>
                </div>
                {!canUseLoras && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                    <Crown className="h-3 w-3" />
                    <span className="text-xs font-medium">Pro</span>
                  </div>
                )}
              </div>

              {/* Global LoRA Selection Mode Toggle */}
              <div className="mb-6 p-4 bg-muted/30 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      LoRA Selection
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {settings.loraSelectionMode === "auto"
                        ? "We will automatically choose the best LoRA models and settings for your image"
                        : "Manually select and configure LoRA models"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateLoraSelectionMode("auto")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors font-medium",
                      settings.loraSelectionMode === "auto"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-background/80 border border-border"
                    )}
                  >
                    Automatic
                  </button>
                  <button
                    onClick={() => updateLoraSelectionMode("manual")}
                    disabled={!canUseLoras}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors font-medium",
                      settings.loraSelectionMode === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-background/80 border border-border",
                      !canUseLoras &&
                        "opacity-50 cursor-not-allowed hover:bg-background"
                    )}
                  >
                    Manual
                    {!canUseLoras && <Crown className="h-3 w-3 ml-1 inline" />}
                  </button>
                </div>
              </div>

              {settings.loraSelectionMode === "manual" ? (
                <div className="grid gap-3">
                  {LORA_MODELS.map((lora) => {
                    const isSelected = settings.selectedLoras.includes(lora.id);
                    const strengthSettings = settings.loraStrengths[lora.id];

                    return (
                      <div
                        key={lora.id}
                        className={cn(
                          "border-2 rounded-xl transition-all",
                          isSelected && canUseLoras
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80",
                          !canUseLoras && "opacity-50"
                        )}
                      >
                        {/* LoRA Header - Clickable to toggle selection */}
                        <div
                          className="p-4 cursor-pointer transition-all"
                          onClick={() => toggleLora(lora.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-foreground">
                                {lora.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {lora.description}
                              </div>
                            </div>
                            <div className="ml-3 relative">
                              {isSelected ? (
                                <div
                                  className={cn(
                                    "w-5 h-5 bg-primary rounded-full flex items-center justify-center",
                                    !canUseLoras && "opacity-50"
                                  )}
                                >
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              ) : (
                                <div
                                  className={cn(
                                    "w-5 h-5 border-2 border-border rounded-full",
                                    !canUseLoras && "opacity-50"
                                  )}
                                ></div>
                              )}
                              {!canUseLoras && (
                                <div className="absolute -top-1 -right-1 bg-card rounded-full p-0.5">
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Strength Controls - Show when selected, disable when no permissions */}
                        {isSelected && strengthSettings && (
                          <div className="px-4 pb-4 border-t border-border/30">
                            <div className="pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">
                                  Strength
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canUseLoras) {
                                        updateLoraStrength(lora.id, "auto");
                                      }
                                    }}
                                    disabled={!canUseLoras}
                                    className={cn(
                                      "px-2 py-1 text-xs rounded-md transition-colors",
                                      strengthSettings.mode === "auto"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                                      !canUseLoras &&
                                        "opacity-50 cursor-not-allowed hover:bg-muted"
                                    )}
                                  >
                                    Auto
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canUseLoras) {
                                        updateLoraStrength(lora.id, "manual");
                                      }
                                    }}
                                    disabled={!canUseLoras}
                                    className={cn(
                                      "px-2 py-1 text-xs rounded-md transition-colors",
                                      strengthSettings.mode === "manual"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                                      !canUseLoras &&
                                        "opacity-50 cursor-not-allowed hover:bg-muted"
                                    )}
                                  >
                                    Manual
                                  </button>
                                </div>
                              </div>

                              {strengthSettings.mode === "manual" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      Value: {strengthSettings.value.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      0.0 - 1.5
                                    </span>
                                  </div>
                                  <div
                                    className={cn(
                                      !canUseLoras &&
                                        "opacity-50 pointer-events-none"
                                    )}
                                  >
                                    <Slider
                                      value={[strengthSettings.value]}
                                      onValueChange={(values) => {
                                        if (canUseLoras) {
                                          updateLoraStrength(
                                            lora.id,
                                            "manual",
                                            values[0]
                                          );
                                        }
                                      }}
                                      min={0}
                                      max={1.5}
                                      step={0.05}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              )}

                              {strengthSettings.mode === "auto" && (
                                <div className="text-xs text-muted-foreground text-center py-1">
                                  Strength will be set automatically based on
                                  the prompt
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Available LoRA Models Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-foreground">
                        Available LoRA Models
                      </h5>
                      {!canUseLoras && (
                        <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                          <Crown className="h-3 w-3" />
                          <span className="text-xs font-medium">Pro</span>
                        </div>
                      )}
                    </div>
                    {canUseLoras && (
                      <p className="text-xs text-muted-foreground mb-2">
                        💡 Click on any LoRA model to switch to manual selection
                        and configure it
                      </p>
                    )}
                    <div className="grid gap-2">
                      {LORA_MODELS.map((lora) => (
                        <div
                          key={lora.id}
                          className={cn(
                            "p-3 border border-border rounded-lg transition-all",
                            !canUseLoras
                              ? "bg-muted/30 cursor-not-allowed"
                              : "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                          )}
                          onClick={() => handleLoraClickInAutoMode(lora.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-sm text-foreground">
                                  {lora.name}
                                </div>
                                {!canUseLoras && (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {lora.description}
                              </div>
                            </div>
                            <div className="ml-3">
                              <div
                                className={cn(
                                  "w-4 h-4 border-2 border-border rounded-full",
                                  !canUseLoras && "opacity-50"
                                )}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!canUseLoras && (
                      <div className="text-center pt-3">
                        <p className="text-xs text-muted-foreground mb-3">
                          Upgrade to Pro to manually select and configure LoRA
                          models strengths
                        </p>
                        <Button
                          onClick={() => router.push("/pricing")}
                          size="sm"
                          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {settings.loraSelectionMode === "manual" &&
                settings.selectedLoras.length > 0 && (
                  <div
                    className={cn(
                      "mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2",
                      !canUseLoras && "opacity-50"
                    )}
                  >
                    <p className="text-xs text-primary font-medium text-center">
                      {settings.selectedLoras.length} LoRA
                      {settings.selectedLoras.length !== 1 ? "s" : ""} selected
                      {!canUseLoras && " (Pro feature)"}
                    </p>
                    <div className="grid gap-1">
                      {settings.selectedLoras.map((loraId) => {
                        const lora = LORA_MODELS.find((l) => l.id === loraId);
                        const strength = settings.loraStrengths[loraId];
                        if (!lora || !strength) return null;

                        return (
                          <div
                            key={loraId}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-primary/80">{lora.name}</span>
                            <span className="text-primary/60">
                              {strength.mode === "auto"
                                ? "Auto"
                                : `${strength.value.toFixed(2)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Negative Prompt */}
            <div
              className={cn(
                "bg-card border border-border rounded-2xl shadow-lg p-6 transition-all",
                !canUseNegativePrompts && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    canUseNegativePrompts
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <MinusCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    Negative Prompt
                  </h3>
                  <p className="text-sm text-muted-foreground">What to avoid</p>
                </div>
                {!canUseNegativePrompts && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                    <Crown className="h-3 w-3" />
                    <span className="text-xs font-medium">Pro</span>
                  </div>
                )}
              </div>

              <Textarea
                placeholder="blurry, low quality, distorted, bad anatomy..."
                value={settings.negativePrompt}
                disabled={!canUseNegativePrompts}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (!canUseNegativePrompts) return;
                  updateSettings("negativePrompt", e.target.value);
                }}
                className={cn(
                  "w-full h-24 text-base p-4 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 resize-none transition-all bg-background",
                  !canUseNegativePrompts && "cursor-not-allowed"
                )}
              />
            </div>
          </div>

          {/* Lightbox */}
          <Lightbox
            media={allGeneratedImages.map((url, index) =>
              createMediaFromUrl(url, index)
            )}
            currentIndex={lightboxIndex}
            isOpen={lightboxOpen}
            canDelete={true}
            onClose={() => setLightboxOpen(false)}
            onNext={() =>
              setLightboxIndex((prev) =>
                Math.min(prev + 1, allGeneratedImages.length - 1)
              )
            }
            onPrevious={() => setLightboxIndex((prev) => Math.max(prev - 1, 0))}
          />
        </div>
      </div>
    </div>
  );
}
