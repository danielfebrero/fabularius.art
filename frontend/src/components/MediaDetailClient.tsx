"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Media } from "@/types";
import { useUserInteractionStatus } from "@/hooks/useUserInteractionStatus";
import { LikeButton } from "@/components/user/LikeButton";
import { BookmarkButton } from "@/components/user/BookmarkButton";
import { ShareDropdown } from "@/components/ui/ShareDropdown";
import { Lightbox } from "@/components/ui/Lightbox";
import { ViewTracker } from "@/components/ui/ViewTracker";
import { composeMediaUrl } from "@/lib/urlUtils";
import { Share2, ArrowLeft, Maximize2 } from "lucide-react";
import Image from "next/image";

interface MediaDetailClientProps {
  media: Media;
}

export function MediaDetailClient({ media }: MediaDetailClientProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useUserInteractionStatus();

  const handleBack = () => {
    router.back();
  };

  const handleFullscreen = () => {
    setLightboxOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isVideo = media.mimeType.startsWith("video/");
  const isImage = media.mimeType.startsWith("image/");

  // Extract metadata fields
  const creator =
    media.metadata?.creator || media.metadata?.artist || "Unknown";
  const prompt = media.metadata?.prompt || media.metadata?.description;
  const negativePrompt = media.metadata?.negativePrompt;
  const loraModels = media.metadata?.loraModels || media.metadata?.loras || [];
  const loraStrengths = media.metadata?.loraStrengths || {};
  const bulkSiblings = media.metadata?.bulkSiblings || [];
  const imageSize =
    media.width && media.height ? `${media.width} × ${media.height}` : null;

  return (
    <div className="min-h-screen bg-background">
      <ViewTracker targetType="media" targetId={media.id} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

                    <div className="flex items-center gap-2">
            <LikeButton
              targetType="media"
              targetId={media.id}
              size="sm"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            />
            <BookmarkButton
              targetType="media"
              targetId={media.id}
              size="sm"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            />
            <ShareDropdown
              trigger={({ toggle }: { toggle: () => void }) => (
                <button
                  onClick={toggle}
                  className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}
            >
              {({ close }: { close: () => void }) => (
                <>
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      close();
                    }}
                  >
                    Copy link
                  </button>
                  <a
                    className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    href={`https://www.reddit.com/submit?url=${encodeURIComponent(
                      window.location.href
                    )}&title=${encodeURIComponent(
                      media.originalFilename || media.filename
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                  >
                    Reddit
                  </a>
                  <a
                    className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    href={`https://x.com/intent/tweet?url=${encodeURIComponent(
                      window.location.href
                    )}&text=${encodeURIComponent(
                      media.originalFilename || media.filename
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                  >
                    X (Twitter)
                  </a>
                </>
              )}
            </ShareDropdown>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Media Display */}
          <div className="lg:col-span-2">
            <div className="relative bg-card rounded-xl overflow-hidden shadow-lg">
              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreen}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                aria-label="View fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>

              {isImage ? (
                <Image
                  src={composeMediaUrl(media.url)}
                  alt={media.originalFilename || media.filename}
                  width={media.width || 1024}
                  height={media.height || 1024}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  priority
                />
              ) : isVideo ? (
                <video
                  src={composeMediaUrl(media.url)}
                  controls
                  className="w-full h-auto max-h-[70vh]"
                  poster={
                    media.thumbnailUrl
                      ? composeMediaUrl(media.thumbnailUrl)
                      : undefined
                  }
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-lg">Unsupported file type</p>
                  <a
                    href={composeMediaUrl(media.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Media Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h1 className="text-2xl font-bold mb-4">
                {media.originalFilename || media.filename}
              </h1>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="font-medium">{creator}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {formatDate(media.createdAt)}
                  </span>
                </div>

                {imageSize && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium">{imageSize}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">
                    {formatFileSize(media.size)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium font-mono text-sm">
                    {media.mimeType}
                  </span>
                </div>
              </div>
            </div>

            {/* Generation Parameters */}
            {prompt && (
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4">
                  Generation Parameters
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Prompt
                    </label>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {prompt}
                    </div>
                  </div>

                  {negativePrompt && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Negative Prompt
                      </label>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {negativePrompt}
                      </div>
                    </div>
                  )}

                  {loraModels.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        LoRA Models
                      </label>
                      <div className="space-y-2">
                        {loraModels.map((lora: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <span className="text-sm font-medium">
                              {typeof lora === "string"
                                ? lora
                                : lora.name || lora}
                            </span>
                            {loraStrengths[lora] && (
                              <span className="text-xs text-muted-foreground">
                                Strength: {loraStrengths[lora]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bulk Generation Siblings */}
            {bulkSiblings.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4">
                  Other Generated Images
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {bulkSiblings.map((siblingId: string, index: number) => (
                    <button
                      key={siblingId}
                      onClick={() => router.push(`/media/${siblingId}`)}
                      className="aspect-square bg-muted/50 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                    >
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Image {index + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for fullscreen view */}
      {lightboxOpen && (
        <Lightbox
          media={[media]}
          currentIndex={0}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNext={() => {}}
          onPrevious={() => {}}
        />
      )}
    </div>
  );
}
