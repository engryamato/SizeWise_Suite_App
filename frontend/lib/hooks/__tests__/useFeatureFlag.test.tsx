/**
 * useFeatureFlag Hook Test Suite
 * 
 * CRITICAL: Validates React hook for feature flag management
 * Tests performance requirements, tier enforcement, and error handling
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.1
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeatureFlag, useBatchFeatureFlag, useUserTier, cleanupFeatureHooks } from '../useFeatureFlag';
import { FeatureManager } from '../../features/FeatureManager';
import { DatabaseManager } from '../../../__mocks__/backend/database/DatabaseManager';

// Mock dependencies - FIXED: Use correct mock paths
jest.mock('../../features/FeatureManager');
jest.mock('../../../__mocks__/backend/database/DatabaseManager');

describe('useFeatureFlag Hook', () => {
  let mockFeatureManager: jest.Mocked<FeatureManager>;
  let mockDbManager: jest.Mocked<DatabaseManager>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    tier: 'pro' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DatabaseManager
    mockDbManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      getConnection: jest.fn()
    } as any;

    // Mock FeatureManager
    mockFeatureManager = {
      isEnabled: jest.fn(),
      checkFeatures: jest.fn(),
      userRepository: {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        getUser: jest.fn().mockResolvedValue(mockUser)
      }
    } as any;

    // Mock constructors
    (DatabaseManager as jest.Mock).mockImplementation(() => mockDbManager);
    (FeatureManager as jest.Mock).mockImplementation(() => mockFeatureManager);
  });

  afterEach(async () => {
    await cleanupFeatureHooks();
  });

  describe('useFeatureFlag - Single Feature', () => {
    test('should return enabled feature for valid tier', async () => {
      // Mock feature manager response
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 25,
        cached: false
      });

      const { result } = renderHook(() => useFeatureFlag('unlimited_projects'));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.enabled).toBe(false);

      // Wait for async operation
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify final state
      expect(result.current.enabled).toBe(true);
      expect(result.current.tier).toBe('pro');
      expect(result.current.responseTime).toBe(25);
      expect(result.current.cached).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should return disabled feature for insufficient tier', async () => {
      // Mock feature manager response for disabled feature
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: false,
        tier: 'free',
        reason: 'Requires Pro tier',
        responseTime: 15,
        cached: true
      });

      const { result } = renderHook(() => useFeatureFlag('unlimited_projects'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);
      expect(result.current.tier).toBe('free');
      expect(result.current.error).toContain('Requires Pro tier');
    });

    test('should meet performance requirement (<50ms)', async () => {
      // Mock fast response
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 30,
        cached: true
      });

      const { result } = renderHook(() => useFeatureFlag('air_duct_sizer'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responseTime).toBeLessThan(50);
      expect(result.current.responseTime).toBe(30);
    });

    test('should handle performance warnings', async () => {
      const onPerformanceWarning = jest.fn();
      
      // Mock slow response
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 75, // Exceeds 50ms threshold
        cached: false
      });

      renderHook(() => useFeatureFlag('slow_feature', { onPerformanceWarning }));

      await waitFor(() => {
        expect(onPerformanceWarning).toHaveBeenCalledWith(75);
      });
    });

    test('should handle errors gracefully', async () => {
      const onError = jest.fn();
      
      // Mock error
      mockFeatureManager.isEnabled.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useFeatureFlag('test_feature', { onError }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);
      expect(result.current.error).toContain('Database connection failed');
      expect(onError).toHaveBeenCalled();
    });

    test('should refresh feature flag manually', async () => {
      // Initial response
      mockFeatureManager.isEnabled.mockResolvedValueOnce({
        enabled: false,
        tier: 'free',
        responseTime: 20,
        cached: false
      });

      // Response after refresh
      mockFeatureManager.isEnabled.mockResolvedValueOnce({
        enabled: true,
        tier: 'pro',
        responseTime: 25,
        cached: false
      });

      const { result } = renderHook(() => useFeatureFlag('test_feature'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);

      // Refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.enabled).toBe(true);
      expect(mockFeatureManager.isEnabled).toHaveBeenCalledTimes(2);
    });

    test('should use custom userId when provided', async () => {
      const customUserId = '550e8400-e29b-41d4-a716-446655440001';
      
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'enterprise',
        responseTime: 20,
        cached: false
      });

      renderHook(() => useFeatureFlag('test_feature', { userId: customUserId }));

      await waitFor(() => {
        expect(mockFeatureManager.isEnabled).toHaveBeenCalledWith('test_feature', customUserId);
      });
    });
  });

  describe('useBatchFeatureFlag - Multiple Features', () => {
    test('should check multiple features efficiently', async () => {
      const features = ['air_duct_sizer', 'unlimited_projects', 'high_res_export'];
      
      // Mock batch response
      const mockBatchResult = {
        features: new Map([
          ['air_duct_sizer', { enabled: true, tier: 'free', responseTime: 10, cached: true }],
          ['unlimited_projects', { enabled: true, tier: 'pro', responseTime: 15, cached: false }],
          ['high_res_export', { enabled: false, tier: 'free', responseTime: 12, cached: true }]
        ]),
        totalResponseTime: 37,
        cacheHitRate: 66.7
      };

      mockFeatureManager.checkFeatures.mockResolvedValue(mockBatchResult);

      const { result } = renderHook(() => useBatchFeatureFlag(features));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.features).toEqual({
        'air_duct_sizer': true,
        'unlimited_projects': true,
        'high_res_export': false
      });
      expect(result.current.responseTime).toBe(37);
      expect(result.current.cacheHitRate).toBe(66.7);
    });

    test('should handle batch performance requirements', async () => {
      const features = ['feature1', 'feature2', 'feature3'];
      
      mockFeatureManager.checkFeatures.mockResolvedValue({
        features: new Map(),
        totalResponseTime: 85, // Under 100ms batch threshold
        cacheHitRate: 50
      });

      const { result } = renderHook(() => useBatchFeatureFlag(features));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.responseTime).toBeLessThan(100);
    });

    test('should handle empty feature list', async () => {
      const { result } = renderHook(() => useBatchFeatureFlag([]));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.features).toEqual({});
      expect(mockFeatureManager.checkFeatures).not.toHaveBeenCalled();
    });
  });

  describe('useUserTier - Tier Management', () => {
    test('should return user tier correctly', async () => {
      const { result } = renderHook(() => useUserTier());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tier).toBe('pro');
      expect(result.current.error).toBeNull();
    });

    test('should check tier access correctly', async () => {
      const { result } = renderHook(() => useUserTier());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Pro tier should have access to free and pro features
      expect(result.current.hasAccess('free')).toBe(true);
      expect(result.current.hasAccess('pro')).toBe(true);
      expect(result.current.hasAccess('enterprise')).toBe(false);
    });

    test('should handle enterprise tier access', async () => {
      const enterpriseUser = { ...mockUser, tier: 'enterprise' as const };
      mockFeatureManager.userRepository.getCurrentUser.mockResolvedValue(enterpriseUser);

      const { result } = renderHook(() => useUserTier());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tier).toBe('enterprise');
      expect(result.current.hasAccess('free')).toBe(true);
      expect(result.current.hasAccess('pro')).toBe(true);
      expect(result.current.hasAccess('enterprise')).toBe(true);
    });

    test('should handle free tier limitations', async () => {
      const freeUser = { ...mockUser, tier: 'free' as const };
      mockFeatureManager.userRepository.getCurrentUser.mockResolvedValue(freeUser);

      const { result } = renderHook(() => useUserTier());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tier).toBe('free');
      expect(result.current.hasAccess('free')).toBe(true);
      expect(result.current.hasAccess('pro')).toBe(false);
      expect(result.current.hasAccess('enterprise')).toBe(false);
    });
  });

  describe('Hook Lifecycle and Cleanup', () => {
    test('should cleanup on unmount', async () => {
      const { unmount } = renderHook(() => useFeatureFlag('test_feature'));

      // Unmount should not cause errors
      unmount();
      
      // Verify cleanup function works
      await expect(cleanupFeatureHooks()).resolves.not.toThrow();
    });

    test('should handle component unmount during async operation', async () => {
      // Mock slow response
      mockFeatureManager.isEnabled.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          enabled: true,
          tier: 'pro',
          responseTime: 100,
          cached: false
        }), 100))
      );

      const { unmount } = renderHook(() => useFeatureFlag('test_feature'));

      // Unmount before async operation completes
      unmount();

      // Should not cause errors or memory leaks
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    test('should handle auto-refresh interval', async () => {
      jest.useFakeTimers();

      try {
        mockFeatureManager.isEnabled.mockResolvedValue({
          enabled: true,
          tier: 'pro',
          responseTime: 20,
          cached: false
        });

        renderHook(() => useFeatureFlag('test_feature', { refreshInterval: 1000 }));

        // Initial call
        await waitFor(() => {
          expect(mockFeatureManager.isEnabled).toHaveBeenCalledTimes(1);
        }, { timeout: 3000 });

        // Advance timer
        act(() => {
          jest.advanceTimersByTime(1000);
        });

        // Should trigger refresh
        await waitFor(() => {
          expect(mockFeatureManager.isEnabled).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });
      } finally {
        jest.useRealTimers();
      }
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle no authenticated user', async () => {
      mockFeatureManager.userRepository.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useFeatureFlag('test_feature'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);
      expect(result.current.error).toContain('No authenticated user found');
    });

    test('should handle database initialization failure', async () => {
      mockDbManager.initialize.mockRejectedValue(new Error('Database initialization failed'));

      const { result } = renderHook(() => useFeatureFlag('test_feature'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enabled).toBe(false);
      expect(result.current.error).toContain('Database initialization failed');
    });

    test('should handle rapid successive calls efficiently', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue({
        enabled: true,
        tier: 'pro',
        responseTime: 20,
        cached: true
      });

      const { result, rerender } = renderHook(() => useFeatureFlag('test_feature'));

      // Trigger multiple rapid re-renders
      rerender();
      rerender();
      rerender();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not make excessive API calls due to performance optimization
      expect(mockFeatureManager.isEnabled).toHaveBeenCalledTimes(1);
    });
  });
});
