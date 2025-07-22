"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { UserPlan, UserWithPlan } from "@/types/permissions";
import { createMockUser } from "@/lib/userUtils";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import {
  PermissionGate,
  UsageLimitsDisplay,
  FeatureAvailability,
  GenerationLimitWarning,
} from "@/components/PermissionComponents";
import { useUserPermissions } from "@/hooks/useUserPermissions";

// Demo component to show permission system in action
function PermissionDemo() {
  const {
    canGenerateImages,
    canUseBulkGeneration,
    canUseLoRAModels,
    canUseNegativePrompt,
    canCreatePrivateContent,
    getCurrentPlan,
    checkGenerationLimits,
    getPlanFeatures,
    canUpgradeToUnlimited,
    canUpgradeToPro,
  } = useUserPermissions();

  const currentPlan = getCurrentPlan();
  const { allowed, remaining } = checkGenerationLimits(1);
  const planFeatures = getPlanFeatures(currentPlan);

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Permission System Demo</h2>
          <p className="text-muted-foreground">
            Current Plan:{" "}
            <span className="font-semibold capitalize">{currentPlan}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {planFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <UsageLimitsDisplay />

      {/* Generation Limit Warning */}
      <GenerationLimitWarning />

      {/* Feature Availability */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Feature Availability</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeatureAvailability feature="bulk-generation" />
          <FeatureAvailability feature="lora-models" />
          <FeatureAvailability feature="negative-prompt" />
          <FeatureAvailability feature="private-content" />
          <FeatureAvailability feature="custom-parameters" />
        </CardContent>
      </Card>

      {/* Permission Gates Demo */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Permission-Gated Features</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Generation */}
          <PermissionGate feature="generation" action="create">
            <Button className="w-full" disabled={!allowed}>
              Generate Image {!allowed && "(Limit Reached)"}
            </Button>
          </PermissionGate>

          {/* Bulk Generation */}
          <PermissionGate
            feature="generation"
            action="bulk"
            showUpgrade={true}
            fallback={
              <Button variant="outline" disabled className="w-full">
                Bulk Generation (Upgrade Required)
              </Button>
            }
          >
            <Button variant="secondary" className="w-full">
              Bulk Generate (5 images)
            </Button>
          </PermissionGate>

          {/* LoRA Models */}
          <PermissionGate feature="generation" action="lora" showUpgrade={true}>
            <Button variant="secondary" className="w-full">
              Use LoRA Models
            </Button>
          </PermissionGate>

          {/* Negative Prompt */}
          <PermissionGate
            feature="generation"
            action="negative-prompt"
            showUpgrade={true}
          >
            <Button variant="secondary" className="w-full">
              Use Negative Prompts
            </Button>
          </PermissionGate>

          {/* Private Content */}
          <PermissionGate
            feature="generation"
            action="private"
            showUpgrade={true}
          >
            <Button variant="secondary" className="w-full">
              Create Private Content
            </Button>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* Upgrade Suggestions */}
      {(canUpgradeToUnlimited() || canUpgradeToPro()) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Upgrade Options</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {canUpgradeToUnlimited() && (
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div>
                  <h4 className="font-medium">Unlimited Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlimited generations + custom parameters
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            )}

            {canUpgradeToPro() && (
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div>
                  <h4 className="font-medium">Pro Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    All features + LoRA + private content + bulk generation
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Debug Info</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <div>Can Generate: {canGenerateImages().toString()}</div>
          <div>Can Bulk Generate: {canUseBulkGeneration().toString()}</div>
          <div>Can Use LoRA: {canUseLoRAModels().toString()}</div>
          <div>
            Can Use Negative Prompt: {canUseNegativePrompt().toString()}
          </div>
          <div>Can Create Private: {canCreatePrivateContent().toString()}</div>
          <div>Remaining Generations: {remaining.toString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main demo page with plan switching
export default function PermissionSystemDemo() {
  const [currentPlan, setCurrentPlan] = useState<UserPlan>("free");
  const [mockUser, setMockUser] = useState<UserWithPlan | null>(null);

  // Load mock user when plan changes
  useEffect(() => {
    createMockUser(currentPlan).then(setMockUser);
  }, [currentPlan]);

  // Show loading state while user is being created
  if (!mockUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="text-lg">Loading permissions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionsProvider user={mockUser}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Permission System Demo</h1>
          <p className="text-muted-foreground mb-6">
            This page demonstrates how the permission system works with
            different user plans. Switch between plans to see how features and
            limits change.
          </p>

          {/* Plan Switcher */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Switch User Plan</h3>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {(["free", "starter", "unlimited", "pro"] as UserPlan[]).map(
                  (plan) => (
                    <Button
                      key={plan}
                      variant={currentPlan === plan ? "default" : "outline"}
                      onClick={() => setCurrentPlan(plan)}
                      className="capitalize"
                    >
                      {plan}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <PermissionDemo />
      </div>
    </PermissionsProvider>
  );
}
