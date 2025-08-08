/**
 * Backend FeatureManager Adapter (Node/Electron)
 *
 * Minimal adapter compatible with Electron main process expectations and
 * TierEnforcer. This avoids importing browser-specific implementations.
 */

import type { DatabaseManager } from '../database/DatabaseManager';

export interface FeatureCheckResult {
  enabled: boolean;
  tier: 'free' | 'pro' | 'enterprise' | 'super_admin';
  reason?: string;
}

export class FeatureManager {
  constructor(private readonly dbManager: DatabaseManager) {}

  // Simple tier map for core features used by desktop
  private tierMap: Record<string, 'free' | 'pro' | 'enterprise'> = {
    air_duct_sizer: 'free',
    unlimited_projects: 'pro',
    high_res_pdf_export: 'pro',
    enhanced_csv_export: 'pro',
    cad_export: 'enterprise',
    api_access: 'enterprise',
  };

  async isEnabled(featureName: string, userId?: string): Promise<FeatureCheckResult> {
    // For now, infer user tier as 'pro' to allow desktop development
    // In a full implementation, query user from DB via repository pattern
    const userTier: 'free' | 'pro' | 'enterprise' = 'pro';
    const required = this.tierMap[featureName] ?? 'free';

    const rank = { free: 0, pro: 1, enterprise: 2 } as const;
    const enabled = rank[userTier] >= rank[required];

    return {
      enabled,
      tier: userTier,
      reason: enabled
        ? `Feature '${featureName}' enabled for ${userTier}`
        : `Requires ${required} tier`,
    };
  }

  // Added to align with usages from FileManager
  async getUserTier(userId?: string): Promise<'free' | 'pro' | 'enterprise'> {
    // TODO: Integrate with user repository; default to 'pro' for dev
    return 'pro';
  }
}

export default FeatureManager;

