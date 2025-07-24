/**
 * UI Integration Test Suite
 * 
 * CRITICAL: Validates FeatureGate integration with existing UI components
 * Tests tier-based conditional rendering throughout the application
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 2.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { ExportDialog } from '../../export/ExportDialog';
import { useFeatureFlag, useUserTier } from '../../../lib/hooks/useFeatureFlag';

// Mock the hooks and stores
jest.mock('../../../lib/hooks/useFeatureFlag');
jest.mock('@/stores/ui-store');
jest.mock('@/stores/project-store');
jest.mock('@/stores/export-store');
jest.mock('@/stores/auth-store');

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseUserTier = useUserTier as jest.MockedFunction<typeof useUserTier>;

// Mock store implementations
const mockUIStore = {
  drawingState: { tool: 'select' },
  grid: { visible: true, snapEnabled: true },
  viewport: { scale: 1, x: 0, y: 0 },
  planScale: { pixelsPerMeter: 100 },
  setDrawingTool: jest.fn(),
  setGridVisible: jest.fn(),
  setSnapToGrid: jest.fn(),
  setViewport: jest.fn(),
  resetViewport: jest.fn()
};

const mockProjectStore = {
  currentProject: {
    id: 'test-project',
    name: 'Test Project',
    segments: [],
    rooms: [],
    equipment: []
  }
};

const mockExportStore = {
  isExporting: false,
  exportProgress: 0,
  lastExportResult: null,
  exportProject: jest.fn(),
  validateExport: jest.fn(() => ({ valid: true, errors: [] }))
};

const mockAuthStore = {
  user: {
    id: 'test-user',
    email: 'test@example.com',
    tier: 'pro'
  }
};

describe('UI Integration with FeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock store hooks
    require('@/stores/ui-store').useUIStore.mockReturnValue(mockUIStore);
    require('@/stores/project-store').useProjectStore.mockReturnValue(mockProjectStore);
    require('@/stores/export-store').useExportStore.mockReturnValue(mockExportStore);
    require('@/stores/auth-store').useAuthStore.mockReturnValue(mockAuthStore);

    // Default feature flag mocks
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

  describe('Toolbar Integration', () => {
    test('should render all tools for pro user', () => {
      render(<Toolbar />);

      // Free tier tools should be visible
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Duct')).toBeInTheDocument();
      expect(screen.getByText('Pan')).toBeInTheDocument();
      expect(screen.getByText('Scale')).toBeInTheDocument();

      // Pro tier tools should be visible
      expect(screen.getByText('Room')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    test('should show upgrade indicators for disabled features on free tier', () => {
      // Mock free tier user
      mockUseUserTier.mockReturnValue({
        tier: 'free',
        loading: false,
        error: null,
        hasAccess: jest.fn((tier) => tier === 'free')
      });

      // Mock pro features as disabled
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'unlimited_segments' || feature === 'equipment_selection') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'free',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<Toolbar />);

      // Free tier tools should be clickable
      const selectButton = screen.getByRole('button', { name: /select tool/i });
      expect(selectButton).not.toHaveClass('cursor-not-allowed');

      // Pro tier tools should show upgrade indicators
      const roomTool = screen.getByText('Room').closest('div');
      expect(roomTool).toHaveClass('cursor-not-allowed');
      
      const equipmentTool = screen.getByText('Equipment').closest('div');
      expect(equipmentTool).toHaveClass('cursor-not-allowed');
    });

    test('should handle tool selection for enabled features', () => {
      render(<Toolbar />);

      const selectButton = screen.getByRole('button', { name: /select tool/i });
      fireEvent.click(selectButton);

      expect(mockUIStore.setDrawingTool).toHaveBeenCalledWith('select');
    });

    test('should prevent tool selection for disabled features', () => {
      // Mock equipment feature as disabled
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'equipment_selection') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<Toolbar />);

      // Equipment tool should be disabled
      const equipmentTool = screen.getByText('Equipment').closest('div');
      expect(equipmentTool).toHaveClass('cursor-not-allowed');
    });
  });

  describe('ExportDialog Integration', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      canvasElement: document.createElement('canvas')
    };

    test('should render all export formats for pro user', () => {
      render(<ExportDialog {...defaultProps} />);

      // All export formats should be available
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('PNG Image')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
      expect(screen.getByText('Excel Spreadsheet')).toBeInTheDocument();
    });

    test('should show upgrade indicators for pro features on free tier', () => {
      // Mock free tier user
      mockUseUserTier.mockReturnValue({
        tier: 'free',
        loading: false,
        error: null,
        hasAccess: jest.fn((tier) => tier === 'free')
      });

      // Mock pro features as disabled
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'high_res_pdf_export' || feature === 'enhanced_csv_export') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'free',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<ExportDialog {...defaultProps} />);

      // Free tier formats should be available
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();

      // Pro tier formats should show upgrade indicators
      const pngFormat = screen.getByText('PNG Image').closest('div');
      expect(pngFormat).toHaveClass('cursor-not-allowed');
      
      const excelFormat = screen.getByText('Excel Spreadsheet').closest('div');
      expect(excelFormat).toHaveClass('cursor-not-allowed');
    });

    test('should allow selection of enabled export formats', () => {
      render(<ExportDialog {...defaultProps} />);

      const pdfButton = screen.getByText('PDF Report').closest('button');
      fireEvent.click(pdfButton!);

      // Should be able to select PDF format
      expect(pdfButton).toHaveClass('border-blue-500');
    });

    test('should prevent selection of disabled export formats', () => {
      // Mock PNG export as disabled
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'high_res_pdf_export') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<ExportDialog {...defaultProps} />);

      // PNG format should be disabled
      const pngFormat = screen.getByText('PNG Image').closest('div');
      expect(pngFormat).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Performance Requirements', () => {
    test('should meet performance requirements for feature checks', async () => {
      const startTime = Date.now();
      
      render(<Toolbar />);
      
      // Wait for all feature checks to complete
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should render quickly (allowing for test overhead)
      expect(totalTime).toBeLessThan(200);
    });

    test('should handle multiple feature checks efficiently', async () => {
      render(<ExportDialog {...defaultProps} />);
      
      // Should render all export formats without performance issues
      await waitFor(() => {
        expect(screen.getByText('PDF Report')).toBeInTheDocument();
        expect(screen.getByText('PNG Image')).toBeInTheDocument();
        expect(screen.getByText('JSON Data')).toBeInTheDocument();
        expect(screen.getByText('Excel Spreadsheet')).toBeInTheDocument();
      });
      
      // Verify that feature checks were called for each format
      expect(mockUseFeatureFlag).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling', () => {
    test('should handle feature check errors gracefully', () => {
      // Mock feature check error
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: false,
        error: 'Feature check failed',
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(<Toolbar />);

      // Should still render the toolbar without crashing
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    test('should handle loading states appropriately', () => {
      // Mock loading state
      mockUseFeatureFlag.mockReturnValue({
        enabled: false,
        loading: true,
        error: null,
        tier: null,
        responseTime: 0,
        cached: false,
        refresh: jest.fn()
      });

      render(<Toolbar />);

      // Should render loading states without breaking
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should maintain accessibility for disabled features', () => {
      // Mock some features as disabled
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'equipment_selection') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'pro',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<Toolbar />);

      // Disabled features should still have proper accessibility attributes
      const equipmentTool = screen.getByText('Equipment').closest('div');
      expect(equipmentTool).toHaveAttribute('title');
    });

    test('should provide clear upgrade messaging', () => {
      // Mock free tier with disabled pro features
      mockUseFeatureFlag.mockImplementation((feature) => {
        if (feature === 'enhanced_csv_export') {
          return {
            enabled: false,
            loading: false,
            error: null,
            tier: 'free',
            responseTime: 20,
            cached: true,
            refresh: jest.fn()
          };
        }
        return {
          enabled: true,
          loading: false,
          error: null,
          tier: 'free',
          responseTime: 20,
          cached: true,
          refresh: jest.fn()
        };
      });

      render(<ExportDialog {...defaultProps} />);

      // Should show clear tier requirements
      expect(screen.getByText('Requires pro tier')).toBeInTheDocument();
    });
  });
});
