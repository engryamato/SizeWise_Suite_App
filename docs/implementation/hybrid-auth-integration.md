# Hybrid Authentication Integration Guide

## Overview

This guide outlines how to integrate the hybrid authentication system with the existing SizeWise Suite architecture while maintaining offline-first principles.

## Integration Steps

### 1. Update Auth Store

Modify `frontend/stores/auth-store.ts` to use the HybridAuthManager:

```typescript
import { HybridAuthManager, HybridUser, TierStatus } from '@/lib/auth/HybridAuthManager';

interface AuthStore {
  // Existing properties
  user: HybridUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // New hybrid properties
  tierStatus: TierStatus | null;
  isOnline: boolean;
  lastSync: string | null;
  
  // Updated methods
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, company?: string) => Promise<boolean>;
  getTierStatus: () => Promise<TierStatus>;
  canPerformAction: (action: string, context?: any) => Promise<boolean>;
  syncWithServer: () => Promise<boolean>;
}

const hybridAuthManager = new HybridAuthManager();

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... existing state
        tierStatus: null,
        isOnline: navigator.onLine,
        lastSync: null,

        login: async (email, password) => {
          set({ isLoading: true });
          
          const result = await hybridAuthManager.login(email, password);
          
          if (result.success) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Update tier status
            const tierStatus = await hybridAuthManager.getTierStatus();
            set({ tierStatus, lastSync: new Date().toISOString() });
            
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        },

        getTierStatus: async () => {
          const tierStatus = await hybridAuthManager.getTierStatus();
          set({ tierStatus, lastSync: new Date().toISOString() });
          return tierStatus;
        },

        canPerformAction: async (action, context) => {
          return await hybridAuthManager.canPerformAction(action, context);
        },

        syncWithServer: async () => {
          try {
            const tierStatus = await hybridAuthManager.getTierStatus();
            set({ 
              tierStatus, 
              lastSync: new Date().toISOString(),
              isOnline: true 
            });
            return true;
          } catch (error) {
            set({ isOnline: false });
            return false;
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          tierStatus: state.tierStatus,
          lastSync: state.lastSync,
        }),
      }
    )
  )
);
```

### 2. Update Tier Enforcement

Modify the existing tier enforcement system to work with hybrid authentication:

```typescript
// frontend/lib/services/TierEnforcementService.ts
import { useAuthStore } from '@/stores/auth-store';

export class HybridTierEnforcementService {
  async checkProjectLimit(): Promise<{ allowed: boolean; message?: string }> {
    const { canPerformAction, tierStatus } = useAuthStore.getState();
    
    const allowed = await canPerformAction('create_project');
    
    if (!allowed && tierStatus) {
      const { features, usage } = tierStatus;
      return {
        allowed: false,
        message: `Project limit reached (${usage.projects_count}/${features.max_projects}). Upgrade to Premium for unlimited projects.`
      };
    }
    
    return { allowed: true };
  }

  async checkSegmentLimit(projectSegments: number): Promise<{ allowed: boolean; message?: string }> {
    const { canPerformAction, tierStatus } = useAuthStore.getState();
    
    const allowed = await canPerformAction('add_segment', { segments_count: projectSegments });
    
    if (!allowed && tierStatus) {
      const { features } = tierStatus;
      return {
        allowed: false,
        message: `Segment limit reached (${projectSegments}/${features.max_segments_per_project}). Upgrade to Premium for unlimited segments.`
      };
    }
    
    return { allowed: true };
  }

  async checkExportFeatures(): Promise<{
    highRes: boolean;
    watermarked: boolean;
    message?: string;
  }> {
    const { tierStatus } = useAuthStore.getState();
    
    if (!tierStatus) {
      return { highRes: false, watermarked: true };
    }
    
    const { features } = tierStatus;
    
    return {
      highRes: features.high_res_exports,
      watermarked: features.watermarked_exports,
      message: !features.high_res_exports ? 'Upgrade to Premium for high-resolution exports' : undefined,
    };
  }
}
```

### 3. Trial Management Component

Create a component to handle trial notifications and upgrades:

```typescript
// frontend/components/auth/TrialManager.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { AlertTriangle, Crown, Clock } from 'lucide-react';

export const TrialManager: React.FC = () => {
  const { tierStatus, user } = useAuthStore();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (tierStatus?.tier === 'trial' && tierStatus.trial_expires) {
      const expiryDate = new Date(tierStatus.trial_expires);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [tierStatus]);

  if (!tierStatus || tierStatus.tier !== 'trial') {
    return null;
  }

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className={`p-4 rounded-lg border ${
      isExpired 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : isExpiringSoon 
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <div className="flex items-center space-x-2">
        {isExpired ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Crown className="w-5 h-5" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">
            {isExpired ? 'Trial Expired' : 'Premium Trial Active'}
          </h3>
          <p className="text-sm">
            {isExpired 
              ? 'Your trial has expired. Upgrade to continue using Premium features.'
              : `${daysRemaining} days remaining in your Premium trial.`
            }
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {isExpired ? 'Upgrade Now' : 'Upgrade to Premium'}
        </button>
      </div>
    </div>
  );
};
```

### 4. Offline Indicator Component

```typescript
// frontend/components/auth/OfflineIndicator.tsx
import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Wifi, WifiOff, Clock } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, lastSync } = useAuthStore();

  if (isOnline) {
    return null;
  }

  const lastSyncDate = lastSync ? new Date(lastSync) : null;
  const timeSinceSync = lastSyncDate 
    ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60))
    : null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline Mode</span>
        {timeSinceSync && (
          <span className="text-xs">
            Last sync: {timeSinceSync}m ago
          </span>
        )}
      </div>
    </div>
  );
};
```

## Migration Strategy

### Existing Local Projects

1. **Preserve Local Data**: All existing local projects remain accessible
2. **Optional Migration**: Provide option to sync local projects to server account
3. **Dual Mode**: Support both local-only and server-synced projects
4. **Data Export**: Allow users to export local projects before migration

### Super Admin Integration

1. **Preserve Existing System**: Super admin authentication remains unchanged
2. **Bypass Server**: Super admin accounts don't require server validation
3. **Full Access**: Super admin gets unlimited tier features
4. **Local Override**: Super admin can override tier restrictions

### Graceful Degradation

1. **Extended Offline**: Use last known tier status for up to 30 days offline
2. **Trial Expiration**: Show warnings but allow continued use offline
3. **Feature Degradation**: Gradually reduce features based on offline duration
4. **Sync Recovery**: Full feature restoration when connection is restored

## Testing Strategy

### Unit Tests
- HybridAuthManager authentication flows
- Tier enforcement logic
- Offline/online mode switching

### Integration Tests
- Login/logout flows
- Tier validation with server
- Offline fallback behavior

### E2E Tests
- Complete user journey from registration to tier enforcement
- Trial expiration scenarios
- Offline/online transitions

## Security Considerations

1. **Token Security**: Use secure storage for authentication tokens
2. **Offline Validation**: Implement secure offline credential validation
3. **Tier Tampering**: Prevent client-side tier manipulation
4. **Data Encryption**: Encrypt cached user data and tier information
5. **Session Management**: Implement proper session timeout and refresh
