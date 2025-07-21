"use client";

import { usePermissions } from "@/contexts/PermissionsContext";
import { UserPlan } from "@/types/permissions";

export function useUserPermissions() {
  const permissions = usePermissions();

  // Convenience methods for common permission checks
  const checkGenerationLimits = (count = 1) => {
    return permissions.canGenerateImagesCount(count);
  };

  const canUpgradeToUnlimited = () => {
    const plan = permissions.getCurrentPlan();
    return plan === "free" || plan === "starter";
  };

  const canUpgradeToPro = () => {
    const plan = permissions.getCurrentPlan();
    return plan !== "pro";
  };

  const getUpgradeRecommendation = (
    requestedFeature: string
  ): UserPlan | null => {
    const currentPlan = permissions.getCurrentPlan();

    switch (requestedFeature) {
      case "unlimited-images":
        return currentPlan === "free" || currentPlan === "starter"
          ? "unlimited"
          : null;

      case "bulk-generation":
      case "lora-models":
      case "private-content":
        return currentPlan !== "pro" ? "pro" : null;

      case "custom-image-size":
        return currentPlan === "free" || currentPlan === "starter"
          ? "unlimited"
          : null;

      default:
        return null;
    }
  };

  const getPlanFeatures = (plan: UserPlan) => {
    const features = [];

    switch (plan) {
      case "free":
        features.push("1 image per day", "5 bonus images on signup");
        break;

      case "starter":
        features.push("300 images/month");
        break;

      case "unlimited":
        features.push("Unlimited images");
        break;

      case "pro":
        features.push(
          "Unlimited images",
          "Private content",
          "LoRA models",
          "Bulk generation",
          "Custom image size"
        );
        break;
    }

    return features;
  };

  const formatUsageText = (
    used: number,
    limit: number | "unlimited",
    unit: string
  ) => {
    if (limit === "unlimited") {
      return `${used} ${unit} used`;
    }
    return `${used} / ${limit} ${unit} used`;
  };

  const getUsagePercentage = (used: number, limit: number | "unlimited") => {
    if (limit === "unlimited") return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isApproachingLimit = (
    used: number,
    limit: number | "unlimited",
    threshold = 0.8
  ) => {
    if (limit === "unlimited") return false;
    return used / limit >= threshold;
  };

  return {
    ...permissions,
    checkGenerationLimits,
    canUpgradeToUnlimited,
    canUpgradeToPro,
    getUpgradeRecommendation,
    getPlanFeatures,
    formatUsageText,
    getUsagePercentage,
    isApproachingLimit,
  };
}
