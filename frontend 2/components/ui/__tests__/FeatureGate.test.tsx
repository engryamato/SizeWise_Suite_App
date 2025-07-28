/**
 * FeatureGate Component Test Suite
 * 
 * CRITICAL: Validates React component for tier-based conditional rendering
 * Tests upgrade prompts, error handling, and integration with useFeatureFlag hook
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeatureGate, withFeatureGate, useFeatureGate, MultiFeatureGate } from '../FeatureGate';
import { useFeatureFlag, useUserTier } from '../../../lib/hooks/useFeatureFlag';

// Mock the hooks
jest.mock('../../../lib/hooks/useFeatureFlag');

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseUserTier = useUserTier as jest.MockedFunction<typeof useUserTier>;

describe('FeatureGate Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseFeatureFlag.mockReturnValue({
      enabled: true,
      loading: false,
      error: null,
      tier: 'pro',
      responseTime: 25,
      cached: false,
      refresh: jest.fn()
    });

    mockUseUserTier.mockReturnValue({
      tier: 'pro',
      loading: false,
      error: null,
      hasAccess: jest.fn((tier) => tier === 'free' || tier === 'pro')
    });
  });

  describe('Basic Functionality', () => {
    test('should render children when feature is enabled', () => {
      render(
        <FeatureGate feature="unlimited_projects">
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      expect(screen.getByText('Pro Feature Content')).toBeInTheDocument();
    });

    test('should not render children when feature is disabled', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      render(
        <FeatureGate feature="unlimited_projects">
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    });

    test('should render fallback content when feature is disabled', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 15,
        cached: true,
        refresh: jest.fn()
      });

      render(
        <FeatureGate 
          feature="unlimited_projects"
          fallback={<div data-testid="fallback-content">Free Tier Content</div>}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      expect(screen.getByText('Free Tier Content')).toBeInTheDocument();
    });

    test('should always render children when disabled prop is true', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      render(
        <FeatureGate feature="unlimited_projects" disabled={true}>
          <div data-testid="feature-content">Always Visible Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      expect(screen.getByText('Always Visible Content')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading component while checking feature', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: true,
        error: null,
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(
        <FeatureGate feature="unlimited_projects">
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Checking access...')).toBeInTheDocument();
      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    });

    test('should show custom loading component', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: true,
        error: null,
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(
        <FeatureGate 
          feature="unlimited_projects"
          loadingComponent={<div data-testid="custom-loading">Custom Loading...</div>}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should show error component when feature check fails', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: 'Database connection failed',
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(
        <FeatureGate feature="unlimited_projects">
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Feature Check Failed')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    });

    test('should show custom error component', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: 'Custom error message',
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(
        <FeatureGate 
          feature="unlimited_projects"
          errorComponent={<div data-testid="custom-error">Custom Error Display</div>}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByText('Custom Error Display')).toBeInTheDocument();
    });
  });

  describe('Upgrade Prompts', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      mockUseUserTier.mockReturnValue({
        tier: 'free',
        loading: false,
        error: null,
        hasAccess: jest.fn((tier) => tier === 'free')
      });
    });

    test('should show upgrade prompt when feature is disabled and requiredTier is specified', () => {
      render(
        <FeatureGate feature="unlimited_projects" requiredTier="pro">
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Pro Feature')).toBeInTheDocument();
      expect(screen.getByText(/This feature requires a Pro subscription/)).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    test('should call onUpgradeClick when upgrade button is clicked', () => {
      const onUpgradeClick = jest.fn();

      render(
        <FeatureGate 
          feature="unlimited_projects" 
          requiredTier="pro"
          onUpgradeClick={onUpgradeClick}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      const upgradeButton = screen.getByText('Upgrade to Pro');
      fireEvent.click(upgradeButton);

      expect(onUpgradeClick).toHaveBeenCalledTimes(1);
    });

    test('should show custom upgrade prompt', () => {
      const customPrompt = <div data-testid="custom-upgrade">Custom Upgrade Message</div>;

      render(
        <FeatureGate 
          feature="unlimited_projects" 
          requiredTier="pro"
          upgradePrompt={customPrompt}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('custom-upgrade')).toBeInTheDocument();
      expect(screen.getByText('Custom Upgrade Message')).toBeInTheDocument();
    });

    test('should not show upgrade prompt when showUpgradePrompt is false', () => {
      render(
        <FeatureGate 
          feature="unlimited_projects" 
          requiredTier="pro"
          showUpgradePrompt={false}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      expect(screen.queryByText('Pro Feature')).not.toBeInTheDocument();
      expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks and Analytics', () => {
    test('should call onFeatureAccess when feature is checked', async () => {
      const onFeatureAccess = jest.fn();

      render(
        <FeatureGate 
          feature="unlimited_projects"
          onFeatureAccess={onFeatureAccess}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(onFeatureAccess).toHaveBeenCalledWith(true, 'pro');
      });
    });

    test('should call onFeatureAccess with disabled state', async () => {
      const onFeatureAccess = jest.fn();

      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      render(
        <FeatureGate 
          feature="unlimited_projects"
          onFeatureAccess={onFeatureAccess}
        >
          <div data-testid="feature-content">Pro Feature Content</div>
        </FeatureGate>
      );

      await waitFor(() => {
        expect(onFeatureAccess).toHaveBeenCalledWith(false, 'free');
      });
    });
  });

  describe('Higher-Order Component', () => {
    test('should wrap component with feature gate', () => {
      const TestComponent = () => <div data-testid="wrapped-component">Wrapped Content</div>;
      const FeatureGatedComponent = withFeatureGate(TestComponent, 'unlimited_projects');

      render(<FeatureGatedComponent />);

      expect(screen.getByTestId('wrapped-component')).toBeInTheDocument();
      expect(screen.getByText('Wrapped Content')).toBeInTheDocument();
    });

    test('should not render wrapped component when feature is disabled', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      const TestComponent = () => <div data-testid="wrapped-component">Wrapped Content</div>;
      const FeatureGatedComponent = withFeatureGate(TestComponent, 'unlimited_projects');

      render(<FeatureGatedComponent />);

      expect(screen.queryByTestId('wrapped-component')).not.toBeInTheDocument();
    });
  });

  describe('useFeatureGate Hook', () => {
    test('should return correct feature gate state', () => {
      let hookResult: any;

      const TestComponent = () => {
        hookResult = useFeatureGate('unlimited_projects');
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(hookResult.enabled).toBe(true);
      expect(hookResult.canRender).toBe(true);
      expect(hookResult.shouldShowUpgrade).toBe(false);
      expect(hookResult.tier).toBe('pro');
    });

    test('should return upgrade state when feature is disabled', () => {
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: null,
        tier: 'free',
        responseTime: 20,
        cached: true,
        refresh: jest.fn()
      });

      let hookResult: any;

      const TestComponent = () => {
        hookResult = useFeatureGate('unlimited_projects');
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(hookResult.enabled).toBe(false);
      expect(hookResult.canRender).toBe(false);
      expect(hookResult.shouldShowUpgrade).toBe(true);
      expect(hookResult.tier).toBe('free');
    });
  });

  describe('MultiFeatureGate Component', () => {
    test('should render children when all features are enabled (mode: all)', () => {
      // Mock multiple feature flags
      mockUseFeatureFlag
        .mockReturnValueOnce({
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        })
        .mockReturnValueOnce({
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 25,
          cached: false,
          refresh: jest.fn()
        });

      render(
        <MultiFeatureGate features={['feature1', 'feature2']} mode="all">
          <div data-testid="multi-feature-content">All Features Enabled</div>
        </MultiFeatureGate>
      );

      expect(screen.getByTestId('multi-feature-content')).toBeInTheDocument();
      expect(screen.getByText('All Features Enabled')).toBeInTheDocument();
    });

    test('should not render children when not all features are enabled (mode: all)', () => {
      // Mock mixed feature flags
      mockUseFeatureFlag
        .mockReturnValueOnce({
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        })
        .mockReturnValueOnce({
          enabled: false,
          loading: false,
          error: null,
          tier: 'free',
          responseTime: 25,
          cached: false,
          refresh: jest.fn()
        });

      render(
        <MultiFeatureGate features={['feature1', 'feature2']} mode="all">
          <div data-testid="multi-feature-content">All Features Enabled</div>
        </MultiFeatureGate>
      );

      expect(screen.queryByTestId('multi-feature-content')).not.toBeInTheDocument();
    });

    test('should render children when any feature is enabled (mode: any)', () => {
      // Mock mixed feature flags
      mockUseFeatureFlag
        .mockReturnValueOnce({
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        })
        .mockReturnValueOnce({
          enabled: false,
          loading: false,
          error: null,
          tier: 'free',
          responseTime: 25,
          cached: false,
          refresh: jest.fn()
        });

      render(
        <MultiFeatureGate features={['feature1', 'feature2']} mode="any">
          <div data-testid="multi-feature-content">Any Feature Enabled</div>
        </MultiFeatureGate>
      );

      expect(screen.getByTestId('multi-feature-content')).toBeInTheDocument();
      expect(screen.getByText('Any Feature Enabled')).toBeInTheDocument();
    });
  });
});
