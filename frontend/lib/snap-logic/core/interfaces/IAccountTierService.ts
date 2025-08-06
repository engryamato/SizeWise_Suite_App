/**
 * Account Tier Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Tier-based feature gating and subscription management interfaces
 * for Free vs Pro feature restrictions, usage limits, and upgrade prompts.
 * 
 * @fileoverview Account tier service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Account subscription tiers
 */
export enum AccountTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

/**
 * Feature access levels
 */
export enum FeatureAccessLevel {
  NONE = 'none',           // Feature completely blocked
  LIMITED = 'limited',     // Feature available with restrictions
  FULL = 'full'           // Full feature access
}

/**
 * Feature categories for tier gating
 */
export enum FeatureCategory {
  SNAP_DETECTION = 'snap_detection',
  DRAWING = 'drawing',
  VISUALIZATION_3D = 'visualization_3d',
  EXPORT = 'export',
  REPORTS = 'reports',
  SMACNA_VALIDATION = 'smacna_validation',
  BATCH_OPERATIONS = 'batch_operations',
  ADVANCED_CALCULATIONS = 'advanced_calculations',
  COLLABORATION = 'collaboration',
  API_ACCESS = 'api_access'
}

/**
 * Usage limits for different resources
 */
export interface UsageLimits {
  maxSnapPoints: number;
  maxCenterlines: number;
  maxProjects: number;
  maxExportsPerMonth: number;
  maxReportsPerMonth: number;
  maxFileSize: number; // in MB
  maxStorageSpace: number; // in MB
  maxCollaborators: number;
  maxAPICallsPerDay: number;
}

/**
 * Feature restrictions configuration
 */
export interface FeatureRestrictions {
  [FeatureCategory.SNAP_DETECTION]: {
    accessLevel: FeatureAccessLevel;
    maxSnapPoints: number;
    advancedAlgorithms: boolean;
  };
  [FeatureCategory.DRAWING]: {
    accessLevel: FeatureAccessLevel;
    maxCenterlines: number;
    undoRedoLevels: number;
    advancedTools: boolean;
  };
  [FeatureCategory.VISUALIZATION_3D]: {
    accessLevel: FeatureAccessLevel;
    maxObjects: number;
    advancedRendering: boolean;
    realTimeUpdates: boolean;
  };
  [FeatureCategory.EXPORT]: {
    accessLevel: FeatureAccessLevel;
    formats: string[];
    batchExport: boolean;
    customTemplates: boolean;
  };
  [FeatureCategory.REPORTS]: {
    accessLevel: FeatureAccessLevel;
    reportTypes: string[];
    customReports: boolean;
    scheduledReports: boolean;
  };
  [FeatureCategory.SMACNA_VALIDATION]: {
    accessLevel: FeatureAccessLevel;
    realTimeValidation: boolean;
    detailedReports: boolean;
    customStandards: boolean;
  };
}

/**
 * Tier configuration defining limits and restrictions
 */
export interface TierConfiguration {
  tier: AccountTier;
  displayName: string;
  description: string;
  usageLimits: UsageLimits;
  featureRestrictions: FeatureRestrictions;
  pricing: {
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
  };
  features: string[];
  restrictions: string[];
}

/**
 * User subscription information
 */
export interface UserSubscription {
  userId: string;
  tier: AccountTier;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod?: string;
  billingCycle: 'monthly' | 'yearly';
}

/**
 * Current usage tracking
 */
export interface CurrentUsage {
  userId: string;
  period: 'current_month' | 'current_day';
  snapPointsUsed: number;
  centerlinesUsed: number;
  projectsUsed: number;
  exportsUsed: number;
  reportsUsed: number;
  storageUsed: number; // in MB
  apiCallsUsed: number;
  lastUpdated: Date;
}

/**
 * Feature access check result
 */
export interface FeatureAccessResult {
  hasAccess: boolean;
  accessLevel: FeatureAccessLevel;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: number;
  limit?: number;
  remainingUsage?: number;
}

/**
 * Upgrade prompt configuration
 */
export interface UpgradePromptConfig {
  feature: FeatureCategory;
  title: string;
  description: string;
  benefits: string[];
  ctaText: string;
  ctaUrl: string;
  showFreeTrial?: boolean;
  trialDuration?: number; // days
}

/**
 * Tier comparison data
 */
export interface TierComparison {
  features: {
    name: string;
    free: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  }[];
  pricing: {
    free: { price: number; features: string[] };
    pro: { price: number; features: string[] };
    enterprise: { price: number; features: string[] };
  };
}

/**
 * Main Account Tier Service interface
 */
export interface IAccountTierService {
  /**
   * Get user's current subscription tier
   */
  getUserTier(userId: string): Promise<AccountTier>;

  /**
   * Get user's subscription details
   */
  getUserSubscription(userId: string): Promise<UserSubscription>;

  /**
   * Check if user can access a specific feature
   */
  canAccessFeature(userId: string, feature: FeatureCategory): Promise<FeatureAccessResult>;

  /**
   * Check if user can access a specific feature with parameters
   */
  canAccessFeatureWithUsage(
    userId: string,
    feature: FeatureCategory,
    requestedUsage: number
  ): Promise<FeatureAccessResult>;

  /**
   * Get usage limits for user's tier
   */
  getUsageLimits(userId: string): Promise<UsageLimits>;

  /**
   * Get current usage for user
   */
  getCurrentUsage(userId: string): Promise<CurrentUsage>;

  /**
   * Get remaining usage for user
   */
  getRemainingUsage(userId: string): Promise<Partial<UsageLimits>>;

  /**
   * Record usage for a specific feature
   */
  recordUsage(
    userId: string,
    feature: FeatureCategory,
    amount: number
  ): Promise<void>;

  /**
   * Get tier configuration
   */
  getTierConfiguration(tier: AccountTier): Promise<TierConfiguration>;

  /**
   * Get all available tier configurations
   */
  getAllTierConfigurations(): Promise<TierConfiguration[]>;

  /**
   * Get upgrade prompt configuration for a feature
   */
  getUpgradePrompt(feature: FeatureCategory): Promise<UpgradePromptConfig>;

  /**
   * Get tier comparison data
   */
  getTierComparison(): Promise<TierComparison>;

  /**
   * Upgrade user to a higher tier
   */
  upgradeUserTier(userId: string, newTier: AccountTier): Promise<boolean>;

  /**
   * Start free trial for user
   */
  startFreeTrial(userId: string, tier: AccountTier): Promise<boolean>;

  /**
   * Check if user is eligible for free trial
   */
  isEligibleForFreeTrial(userId: string, tier: AccountTier): Promise<boolean>;

  /**
   * Get feature restrictions for user's tier
   */
  getFeatureRestrictions(userId: string): Promise<FeatureRestrictions>;

  /**
   * Validate tier-specific operation
   */
  validateTierOperation(
    userId: string,
    operation: string,
    parameters: any
  ): Promise<FeatureAccessResult>;
}

/**
 * Tier gating middleware interface
 */
export interface ITierGatingMiddleware {
  /**
   * Check tier access before operation
   */
  checkTierAccess(
    userId: string,
    feature: FeatureCategory,
    operation: string
  ): Promise<boolean>;

  /**
   * Enforce tier limits
   */
  enforceTierLimits(
    userId: string,
    feature: FeatureCategory,
    requestedAmount: number
  ): Promise<boolean>;

  /**
   * Log tier violation
   */
  logTierViolation(
    userId: string,
    feature: FeatureCategory,
    violation: string
  ): Promise<void>;
}

/**
 * Usage tracking service interface
 */
export interface IUsageTrackingService {
  /**
   * Track feature usage
   */
  trackUsage(
    userId: string,
    feature: FeatureCategory,
    amount: number,
    metadata?: any
  ): Promise<void>;

  /**
   * Get usage analytics
   */
  getUsageAnalytics(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<any>;

  /**
   * Reset usage counters
   */
  resetUsageCounters(userId: string, period: 'monthly' | 'daily'): Promise<void>;

  /**
   * Get usage trends
   */
  getUsageTrends(userId: string): Promise<any>;
}

/**
 * Billing service interface
 */
export interface IBillingService {
  /**
   * Create subscription
   */
  createSubscription(
    userId: string,
    tier: AccountTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<string>; // Returns subscription ID

  /**
   * Cancel subscription
   */
  cancelSubscription(userId: string): Promise<boolean>;

  /**
   * Update payment method
   */
  updatePaymentMethod(userId: string, paymentMethodId: string): Promise<boolean>;

  /**
   * Get billing history
   */
  getBillingHistory(userId: string): Promise<any[]>;

  /**
   * Generate invoice
   */
  generateInvoice(userId: string, period: string): Promise<any>;
}

/**
 * Tier notification service interface
 */
export interface ITierNotificationService {
  /**
   * Send upgrade notification
   */
  sendUpgradeNotification(
    userId: string,
    feature: FeatureCategory,
    reason: string
  ): Promise<void>;

  /**
   * Send usage warning
   */
  sendUsageWarning(
    userId: string,
    feature: FeatureCategory,
    usagePercentage: number
  ): Promise<void>;

  /**
   * Send tier change notification
   */
  sendTierChangeNotification(
    userId: string,
    oldTier: AccountTier,
    newTier: AccountTier
  ): Promise<void>;
}
