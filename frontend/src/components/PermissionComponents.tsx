"use client";

import React from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { AlertTriangle, Crown, Zap, Lock } from 'lucide-react';

interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature: string;
  action: string;
  showUpgrade?: boolean;
}

// Component that conditionally renders content based on permissions
export function PermissionGate({ 
  children, 
  fallback, 
  feature, 
  action, 
  showUpgrade = false 
}: PermissionGateProps) {
  const { hasPermission, getCurrentPlan } = usePermissions();
  
  const hasAccess = hasPermission({ feature, action });
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgrade) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardContent className="flex items-center gap-4 p-4">
          <Crown className="h-8 w-8 text-amber-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Upgrade Required
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-200">
              This feature requires a {feature === 'generation' ? 'Pro' : 'higher'} plan. 
              You&apos;re currently on {getCurrentPlan()}.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}

// Usage limit display component
export function UsageLimitsDisplay() {
  const { 
    user, 
    canGenerateImagesCount, 
    getPlanLimits, 
    getCurrentPlan 
  } = usePermissions();
  
  if (!user) return null;
  
  const limits = getPlanLimits();
  const planName = getCurrentPlan();
  const { remaining } = canGenerateImagesCount(1);
  
  if (!limits) return null;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your Plan: {planName.charAt(0).toUpperCase() + planName.slice(1)}</h3>
          {planName !== 'pro' && (
            <Button variant="outline" size="sm">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Monthly Images */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Images this month</span>
          <div className="text-right">
            <div className="font-medium">
              {user.usageStats.imagesGeneratedThisMonth}
              {limits.imagesPerMonth === 'unlimited' ? '' : ` / ${limits.imagesPerMonth}`}
            </div>
            {limits.imagesPerMonth !== 'unlimited' && (
              <div className="text-xs text-muted-foreground">
                {typeof remaining === 'number' ? remaining : 'unlimited'} remaining
              </div>
            )}
          </div>
        </div>
        
        {/* Daily Images */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Images today</span>
          <div className="text-right">
            <div className="font-medium">
              {user.usageStats.imagesGeneratedToday}
              {limits.imagesPerDay === 'unlimited' ? '' : ` / ${limits.imagesPerDay}`}
            </div>
          </div>
        </div>
        
        {/* Storage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Storage used</span>
          <div className="text-right">
            <div className="font-medium">
              {user.usageStats.storageUsedGB.toFixed(1)} GB
              {limits.maxStorageGB === 'unlimited' ? '' : ` / ${limits.maxStorageGB} GB`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Feature availability indicator
export function FeatureAvailability({ feature }: { feature: string }) {
  const { getPlanLimits, getCurrentPlan } = usePermissions();
  
  const limits = getPlanLimits();
  const plan = getCurrentPlan();
  
  if (!limits) return null;
  
  const getFeatureStatus = () => {
    switch (feature) {
      case 'bulk-generation':
        return limits.canUseBulkGeneration;
      case 'lora-models':
        return limits.canUseLoRAModels;
      case 'private-content':
        return limits.canCreatePrivateContent;
      case 'custom-parameters':
        return limits.canUseCustomParameters;
      default:
        return false;
    }
  };
  
  const available = getFeatureStatus();
  
  return (
    <div className="flex items-center gap-2">
      {available ? (
        <Zap className="h-4 w-4 text-green-500" />
      ) : (
        <Lock className="h-4 w-4 text-gray-400" />
      )}
      <span className={`text-sm ${available ? 'text-foreground' : 'text-muted-foreground'}`}>
        {feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
      {!available && (
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
          {plan === 'free' ? 'Paid Plan' : 'Pro Plan'}
        </span>
      )}
    </div>
  );
}

// Generation limit warning
export function GenerationLimitWarning() {
  const { canGenerateImagesCount, getCurrentPlan } = usePermissions();
  
  const { allowed, remaining } = canGenerateImagesCount(1);
  
  if (allowed && (remaining === 'unlimited' || remaining > 5)) {
    return null;
  }
  
  if (!allowed) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardContent className="flex items-center gap-4 p-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Generation Limit Reached
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200">
              You&apos;ve reached your generation limit for today. 
              {getCurrentPlan() !== 'unlimited' && getCurrentPlan() !== 'pro' && ' Upgrade for unlimited generations.'}
            </p>
          </div>
          {getCurrentPlan() !== 'unlimited' && getCurrentPlan() !== 'pro' && (
            <Button variant="outline" size="sm">
              Upgrade Now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (typeof remaining === 'number' && remaining <= 5) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardContent className="flex items-center gap-4 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm text-amber-700 dark:text-amber-200">
              You have {remaining} generation{remaining !== 1 ? 's' : ''} remaining today.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}
