"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  PermissionGate,
  GenerationLimitWarning,
} from "@/components/PermissionComponents";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Zap, Settings, Crown, ImageIcon } from "lucide-react";

// Example component demonstrating permission-gated AI generation features
export function AIGenerationExample() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { canGenerateImages, checkGenerationLimits, getCurrentPlan } =
    useUserPermissions();

  const { allowed, remaining } = checkGenerationLimits(1);
  const plan = getCurrentPlan();

  const handleGenerate = async () => {
    if (!canGenerateImages() || !allowed) return;

    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Generation Limit Warning */}
      <GenerationLimitWarning />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">AI Image Generation</h2>
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {plan} Plan
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Generation */}
          <div className="space-y-3">
            <Input
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <Button
              onClick={handleGenerate}
              disabled={!allowed || !prompt.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating
                ? "Generating..."
                : !allowed
                ? `Generate Image (${remaining} remaining)`
                : "Generate Image"}
            </Button>

            {typeof remaining === "number" && remaining > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                {remaining} generation{remaining !== 1 ? "s" : ""} remaining
                today
              </p>
            )}
          </div>

          {/* Advanced Features with Permission Gates */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Advanced Features</h3>
            <div className="grid gap-4">
              {/* Custom Parameters */}
              <PermissionGate
                feature="generation"
                action="custom"
                showUpgrade={true}
                fallback={
                  <div className="p-3 bg-muted rounded-lg opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Custom Parameters</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Unlimited Plan
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adjust resolution, style, and other parameters
                    </p>
                  </div>
                }
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Custom Parameters</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Available
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Adjust resolution, style, and other parameters
                  </p>
                </div>
              </PermissionGate>

              {/* LoRA Models */}
              <PermissionGate
                feature="generation"
                action="lora"
                showUpgrade={true}
                fallback={
                  <div className="p-3 bg-muted rounded-lg opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4" />
                      <span className="font-medium">LoRA Models</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Pro Plan
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use specialized models for different styles
                    </p>
                  </div>
                }
              >
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4" />
                    <span className="font-medium">LoRA Models</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Available
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use specialized models for different styles
                  </p>
                </div>
              </PermissionGate>

              {/* Bulk Generation */}
              <PermissionGate
                feature="generation"
                action="bulk"
                showUpgrade={true}
                fallback={
                  <div className="p-3 bg-muted rounded-lg opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Bulk Generation</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Pro Plan
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate multiple images at once
                    </p>
                  </div>
                }
              >
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Bulk Generation</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Available
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[2, 4, 8].map((count) => (
                      <Button
                        key={count}
                        variant="outline"
                        size="sm"
                        onClick={() => console.log(`Generate ${count} images`)}
                        disabled={!checkGenerationLimits(count).allowed}
                      >
                        {count} images
                      </Button>
                    ))}
                  </div>
                </div>
              </PermissionGate>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
