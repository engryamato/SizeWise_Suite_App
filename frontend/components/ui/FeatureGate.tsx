/**
 * FeatureGate - Conditional Rendering Component for Tier-Based Features
 * 
 * MISSION-CRITICAL: React component for tier-based feature gating with upgrade prompts
 * Integrates with useFeatureFlag hook from Phase 2.1 for seamless tier enforcement
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.2
 */

import React, { ReactNode, useState, useCallback } from 'react';
import { useFeatureFlag, useUserTier, UserTier } from '../../lib/hooks/useFeatureFlag';

/**
 * Feature gate props for conditional rendering
 */
export interface FeatureGateProps {
  /** Feature name to check */
  feature: string;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Custom user ID (optional, uses current user if not provided) */
  userId?: string;
  /** Fallback content when feature is disabled */
  fallback?: ReactNode;
  /** Show upgrade prompt when feature is disabled */
  showUpgradePrompt?: boolean;
  /** Custom upgrade prompt component */
  upgradePrompt?: ReactNode;
  /** Required tier for this feature */
  requiredTier?: UserTier;
  /** Loading component while checking feature */
  loadingComponent?: ReactNode;
  /** Error component when feature check fails */
  errorComponent?: ReactNode;
  /** Callback when upgrade prompt is clicked */
  onUpgradeClick?: () => void;
  /** Callback when feature is accessed */
  onFeatureAccess?: (enabled: boolean, tier: UserTier | null) => void;
  /** Custom CSS classes */
  className?: string;
  /** Disable the component (always show children) */
  disabled?: boolean;
}

/**
 * Upgrade prompt props
 */
export interface UpgradePromptProps {
  currentTier: UserTier | null;
  requiredTier: UserTier;
  featureName: string;
  onUpgradeClick?: () => void;
  className?: string;
}

/**
 * Default upgrade prompt component
 */
const DefaultUpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentTier,
  requiredTier,
  featureName,
  onUpgradeClick,
  className = ''
}) => {
  const tierDisplayNames = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
    super_admin: 'Super Admin'
  };

  const tierColors = {
    free: 'bg-gray-500 hover:bg-gray-600',
    pro: 'bg-blue-500 hover:bg-blue-600',
    enterprise: 'bg-purple-500 hover:bg-purple-600',
    super_admin: 'bg-red-500 hover:bg-red-600'
  };

  const handleUpgradeClick = useCallback(() => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default behavior: log upgrade intent
      console.log(`Upgrade requested: ${currentTier} → ${requiredTier} for feature: ${featureName}`);
    }
  }, [onUpgradeClick, currentTier, requiredTier, featureName]);

  return (
    <div className={`feature-gate-upgrade-prompt border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 ${className}`}>
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {tierDisplayNames[requiredTier]} Feature
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        This feature requires a {tierDisplayNames[requiredTier]} subscription.
        {currentTier && ` You currently have ${tierDisplayNames[currentTier]} access.`}
      </p>
      
      <button
        onClick={handleUpgradeClick}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${tierColors[requiredTier] || 'bg-gray-500 hover:bg-gray-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Upgrade to {tierDisplayNames[requiredTier]}
      </button>
    </div>
  );
};

/**
 * Loading component for feature checks
 */
const DefaultLoadingComponent: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`feature-gate-loading flex items-center justify-center p-4 ${className}`}>
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-sm text-gray-600">Checking access...</span>
  </div>
);

/**
 * Error component for feature check failures
 */
const DefaultErrorComponent: React.FC<{ error: string; className?: string }> = ({ error, className = '' }) => (
  <div className={`feature-gate-error border border-red-200 rounded-lg p-4 bg-red-50 ${className}`}>
    <div className="flex">
      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Feature Check Failed</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    </div>
  </div>
);

/**
 * FeatureGate - Main component for tier-based conditional rendering
 * CRITICAL: Provides seamless tier enforcement throughout the application
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  userId,
  fallback,
  showUpgradePrompt = true,
  upgradePrompt,
  requiredTier,
  loadingComponent,
  errorComponent,
  onUpgradeClick,
  onFeatureAccess,
  className = '',
  disabled = false
}) => {
  // State for tracking component interactions
  const [hasLoggedAccess, setHasLoggedAccess] = useState(false);

  // Get feature flag status
  const {
    enabled,
    loading,
    error,
    tier,
    responseTime
  } = useFeatureFlag(feature, {
    userId,
    onError: (err) => console.error(`FeatureGate error for ${feature}:`, err),
    onPerformanceWarning: (time) => console.warn(`FeatureGate slow response for ${feature}: ${time}ms`)
  });

  // Get user tier information
  const { tier: userTier, hasAccess } = useUserTier({ userId });

  // Log feature access for analytics
  React.useEffect(() => {
    if (!loading && !hasLoggedAccess && onFeatureAccess) {
      onFeatureAccess(enabled, tier);
      setHasLoggedAccess(true);
    }
  }, [enabled, tier, loading, hasLoggedAccess, onFeatureAccess]);

  // If disabled, always show children
  if (disabled) {
    return <div className={`feature-gate-disabled ${className}`}>{children}</div>;
  }

  // Show loading state
  if (loading) {
    return loadingComponent || <DefaultLoadingComponent className={className} />;
  }

  // Show error state
  if (error) {
    return errorComponent || <DefaultErrorComponent error={error} className={className} />;
  }

  // Feature is enabled - render children
  if (enabled) {
    return (
      <div className={`feature-gate-enabled ${className}`} data-feature={feature} data-tier={tier}>
        {children}
      </div>
    );
  }

  // Feature is disabled - show upgrade prompt or fallback
  if (showUpgradePrompt && requiredTier) {
    const prompt = upgradePrompt || (
      <DefaultUpgradePrompt
        currentTier={userTier}
        requiredTier={requiredTier}
        featureName={feature}
        onUpgradeClick={onUpgradeClick}
        className={className}
      />
    );
    return <div className="feature-gate-upgrade">{prompt}</div>;
  }

  // Show fallback content if provided
  if (fallback) {
    return <div className={`feature-gate-fallback ${className}`}>{fallback}</div>;
  }

  // Default: render nothing when feature is disabled
  return null;
};

/**
 * Higher-order component for feature gating
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  options: Omit<FeatureGateProps, 'feature' | 'children'> = {}
) {
  const FeatureGatedComponent: React.FC<P> = (props) => (
    <FeatureGate feature={feature} {...options}>
      <WrappedComponent {...props} />
    </FeatureGate>
  );

  FeatureGatedComponent.displayName = `withFeatureGate(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return FeatureGatedComponent;
}

/**
 * Hook for programmatic feature gating
 */
export function useFeatureGate(feature: string, options: { userId?: string } = {}) {
  const { enabled, loading, error, tier } = useFeatureFlag(feature, options);
  const { hasAccess } = useUserTier(options);

  return {
    enabled,
    loading,
    error,
    tier,
    hasAccess,
    canRender: enabled,
    shouldShowUpgrade: !enabled && !loading && !error
  };
}

/**
 * Utility component for multiple feature requirements
 */
export interface MultiFeatureGateProps {
  features: string[];
  mode: 'all' | 'any'; // 'all' requires all features, 'any' requires at least one
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const MultiFeatureGate: React.FC<MultiFeatureGateProps> = ({
  features,
  mode,
  children,
  fallback,
  className = ''
}) => {
  // Note: This is a simplified implementation. In a real scenario, you would need
  // to handle multiple features differently, possibly with a custom hook
  const firstFeature = features[0];
  const { enabled, loading, error } = useFeatureFlag(firstFeature || '');

  // For now, we'll just check the first feature as an example
  const featureStates = [{ enabled, loading, error }];
  
  if (loading) {
    return <DefaultLoadingComponent className={className} />;
  }
  
  const errors = featureStates.filter(state => state.error).map(state => state.error);
  if (errors.length > 0) {
    return <DefaultErrorComponent error={errors.join(', ')} className={className} />;
  }
  
  const enabledFeatures = featureStates.filter(state => state.enabled);
  const shouldRender = mode === 'all' 
    ? enabledFeatures.length === features.length
    : enabledFeatures.length > 0;
  
  if (shouldRender) {
    return <div className={`multi-feature-gate-enabled ${className}`}>{children}</div>;
  }
  
  return fallback ? <div className={`multi-feature-gate-fallback ${className}`}>{fallback}</div> : null;
};

export default FeatureGate;
