"use client";

import { useState, useMemo, FC, ReactNode } from "react";
import { useLocaleRouter } from "@/lib/navigation";
import {
  Share2,
  ArrowLeft,
  FolderOpen,
  MessageCircle,
  Calendar,
  FileText,
  Eye,
  Download,
  User,
  ChevronDown,
  Info,
  Layers,
  Palette,
  Bot,
  Hash,
} from "lucide-react";
import { Media } from "@/types";
import { useUserInteractionStatus } from "@/hooks/useUserInteractionStatus";
import { useUser } from "@/hooks/useUser";
import { ShareDropdown } from "@/components/ui/ShareDropdown";
import { Tooltip } from "@/components/ui/Tooltip";
import { Lightbox } from "@/components/ui/Lightbox";
import { ViewTracker } from "@/components/ui/ViewTracker";
import { ContentCard } from "@/components/ui/ContentCard";
import { HorizontalScroll } from "@/components/ui/HorizontalScroll";
import { Comments } from "@/components/ui/Comments";
import { MediaPlayer } from "@/components/ui/MediaPlayer";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { formatFileSize, isVideo } from "@/lib/utils";
import { formatDateTime } from "@/lib/dateUtils";

// --- PROPS INTERFACES ---

interface MediaDetailClientProps {
  media: Media;
}

interface MetaSectionProps {
  icon: ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

interface InfoPillProps {
  icon: ReactNode;
  label: string;
  value: string | ReactNode;
  isTag?: boolean;
}

interface GenerationPromptProps {
  title: string;
  prompt: string;
}

// --- HELPER FUNCTIONS ---

// --- DATA EXTRACTORS ---

const useMediaMetadata = (media: Media) => {
  return useMemo(() => {
    const metadata = media.metadata || {};

    // Determine creator from multiple sources
    let creator = "Unknown";
    let creatorUsername: string | null = null;
    let isCreatorClickable = false;

    // Priority order:
    // 1. creatorUsername from metadata (fetched from backend)
    // 2. creator/artist from metadata (fallback for older entries)
    // 3. Check if we have createdBy info
    if (metadata.creatorUsername) {
      creator = metadata.creatorUsername;
      creatorUsername = metadata.creatorUsername;
      isCreatorClickable = true;
    } else if (metadata.creator || metadata.artist) {
      creator = metadata.creator || metadata.artist;
    } else if (media.createdBy && media.createdByType === "user") {
      creator = `User ${media.createdBy.slice(-8)}`; // Show last 8 chars of userId as fallback
    } else if (media.createdBy && media.createdByType === "admin") {
      creator = "Admin";
    }

    return {
      creator,
      creatorUsername,
      isCreatorClickable,
      prompt: metadata.prompt || metadata.description,
      negativePrompt: metadata.negativePrompt,
      loraModels: metadata.loraModels || metadata.loras || [],
      loraStrengths: metadata.loraStrengths || {},
      bulkSiblings: metadata.bulkSiblings || [],
      imageSize:
        media.width && media.height ? `${media.width} × ${media.height}` : null,
    };
  }, [media]);
};

// --- UI COMPONENTS ---

const MetaSection: FC<MetaSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/10 rounded-lg bg-background/20 backdrop-blur-sm">
      <button
        className="flex items-center justify-between w-full md:p-4 py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="md:p-4 py-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
};

const InfoPill: FC<InfoPillProps> = ({ icon, label, value, isTag = false }) => (
  <div
    className={cn(
      "flex items-center justify-between py-2 px-3 rounded-md",
      isTag ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
    )}
  >
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span>{label}</span>
    </div>
    <span className={cn("font-medium text-sm", !isTag && "text-foreground")}>
      {value}
    </span>
  </div>
);

const GenerationPrompt: FC<GenerationPromptProps> = ({ title, prompt }) => (
  <div>
    <h4 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h4>
    <div className="p-3 text-sm rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
      {prompt}
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export function MediaDetailClient({ media }: MediaDetailClientProps) {
  const router = useLocaleRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const metadata = useMediaMetadata(media);
  const { user } = useUser();

  // Determine if media is video
  const isVideoMedia = isVideo(media);
  const shouldShowPlayer = isVideoMedia;

  useUserInteractionStatus();

  // Handle media click - for videos, toggle playback mode instead of lightbox
  const handleMediaClick = () => {
    if (shouldShowPlayer) {
      setIsPlayingVideo(!isPlayingVideo);
    } else {
      setLightboxOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ViewTracker targetType="media" targetId={media.id} />

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center h-16 gap-4 md:px-4 border-b bg-background/80 backdrop-blur-sm border-border">
        <Tooltip content="Go Back" side="bottom">
          <button
            onClick={() => router.back()}
            className="p-2 transition-colors rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Tooltip>
        <h1 className="text-lg font-semibold truncate">
          {media.originalFilename || media.filename}
        </h1>
        <div className="flex-grow" />
        <ShareDropdown
          trigger={({ toggle }: { toggle: () => void }) => (
            <Tooltip content="Share" side="bottom">
              <button
                onClick={toggle}
                className="p-2 transition-colors rounded-full hover:bg-muted"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </Tooltip>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media Display */}
          <div className="lg:col-span-2">
            <MediaPlayer
              media={media}
              isPlaying={isPlayingVideo}
              onTogglePlay={handleMediaClick}
              onFullscreen={() => setLightboxOpen(true)}
              className="bg-card shadow-lg w-full"
              imageClassName="w-full h-auto max-h-[80vh]"
            />
          </div>

          {/* Right Column: Information & Details */}
          <aside className="space-y-6">
            <MetaSection
              icon={<Info className="w-5 h-5" />}
              title="Media Details"
              defaultOpen
            >
              <div className="space-y-3">
                {metadata.isCreatorClickable && metadata.creatorUsername ? (
                  <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 text-muted-foreground">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>Creator</span>
                    </div>
                    <LocaleLink
                      href={`/profile/${metadata.creatorUsername}`}
                      className="font-medium text-sm text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      {metadata.creator}
                    </LocaleLink>
                  </div>
                ) : (
                  <InfoPill
                    icon={<User className="w-4 h-4" />}
                    label="Creator"
                    value={metadata.creator}
                  />
                )}
                <InfoPill
                  icon={<Calendar className="w-4 h-4" />}
                  label="Created"
                  value={formatDateTime(media.createdAt)}
                />
                {metadata.imageSize && (
                  <InfoPill
                    icon={<Eye className="w-4 h-4" />}
                    label="Dimensions"
                    value={metadata.imageSize}
                  />
                )}
                <InfoPill
                  icon={<Download className="w-4 h-4" />}
                  label="File Size"
                  value={formatFileSize(media.size)}
                />
                <InfoPill
                  icon={<FileText className="w-4 h-4" />}
                  label="File Type"
                  value={
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {media.mimeType}
                    </span>
                  }
                />
              </div>
            </MetaSection>

            {metadata.prompt && (
              <MetaSection
                icon={<Bot className="w-5 h-5" />}
                title="Generation Parameters"
              >
                <GenerationPrompt title="Prompt" prompt={metadata.prompt} />
                {metadata.negativePrompt && (
                  <GenerationPrompt
                    title="Negative Prompt"
                    prompt={metadata.negativePrompt}
                  />
                )}
              </MetaSection>
            )}

            {metadata.loraModels.length > 0 && (
              <MetaSection
                icon={<Palette className="w-5 h-5" />}
                title="LoRA Models"
              >
                <div className="space-y-2">
                  {metadata.loraModels.map((lora: any, index: number) => (
                    <InfoPill
                      key={index}
                      icon={<Hash className="w-4 h-4" />}
                      label={
                        typeof lora === "string" ? lora : lora.name || lora
                      }
                      value={metadata.loraStrengths[lora] || "N/A"}
                      isTag
                    />
                  ))}
                </div>
              </MetaSection>
            )}

            {metadata.bulkSiblings.length > 0 && (
              <MetaSection
                icon={<Layers className="w-5 h-5" />}
                title="Related Images"
              >
                <HorizontalScroll
                  itemWidth="150px"
                  gap="small"
                  showArrows={true}
                  className="w-full"
                >
                  {metadata.bulkSiblings.map(
                    (siblingId: string, index: number) => (
                      <button
                        key={siblingId}
                        onClick={() => router.push(`/media/${siblingId}`)}
                        className="aspect-square bg-muted/50 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:scale-[1.02] w-full"
                      >
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Image {index + 1}
                        </div>
                      </button>
                    )
                  )}
                </HorizontalScroll>
              </MetaSection>
            )}

            <MetaSection
              icon={<FolderOpen className="w-5 h-5" />}
              title="In Albums"
              defaultOpen
            >
              {media.albums && media.albums.length > 0 ? (
                <HorizontalScroll
                  itemWidth="200px"
                  gap="medium"
                  showArrows={true}
                  className="w-full"
                >
                  {media.albums.map((album) => (
                    <ContentCard
                      key={album.id}
                      item={album}
                      type="album"
                      aspectRatio="square"
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      canDownload={false}
                      canDelete={false}
                      showTags={false}
                      context="albums"
                      columns={1}
                      className="w-full"
                    />
                  ))}
                </HorizontalScroll>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Not in any albums yet.</p>
                </div>
              )}
            </MetaSection>

            <MetaSection
              icon={<MessageCircle className="w-5 h-5" />}
              title="Comments"
              defaultOpen
            >
              <Comments
                targetType="media"
                targetId={media.id}
                initialComments={media.comments}
                currentUserId={user?.userId}
              />
            </MetaSection>
          </aside>
        </div>
      </main>

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
