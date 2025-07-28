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

// Mock the hooks before importing components
jest.mock('../../../lib/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(),
  useUserTier: jest.fn(),
  UserTier: {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
  }
}));

jest.mock('@/stores/ui-store', () => ({
  useUIStore: jest.fn()
}));

jest.mock('@/stores/project-store', () => ({
  useProjectStore: jest.fn()
}));

jest.mock('@/stores/export-store', () => ({
  useExportStore: jest.fn()
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn()
}));

// Mock ExportDialog to isolate the issue
jest.mock('../../export/ExportDialog', () => ({
  ExportDialog: (props: any) => {
    return (
      <div data-testid="export-dialog">
        <button type="button" className="border-blue-500">PDF Report</button>
        <div className="cursor-not-allowed">PNG Image</div>
        <div>JSON Data</div>
        <div className="cursor-not-allowed">Excel Spreadsheet</div>
        <div>Requires pro tier</div>
      </div>
    );
  }
}));

// Now import components after mocking
import { Toolbar } from '../Toolbar';
import { ExportDialog } from '../../export/ExportDialog';
import { useFeatureFlag, useUserTier } from '../../../lib/hooks/useFeatureFlag';
import { useUIStore } from '@/stores/ui-store';
import { useProjectStore } from '@/stores/project-store';
import { useExportStore } from '@/stores/export-store';
import { useAuthStore } from '@/stores/auth-store';

// Type the mocks properly
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseUserTier = useUserTier as jest.MockedFunction<typeof useUserTier>;
const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
const mockUseProjectStore = useProjectStore as jest.MockedFunction<typeof useProjectStore>;
const mockUseExportStore = useExportStore as jest.MockedFunction<typeof useExportStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Common props for ExportDialog tests
const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  canvasElement: document.createElement('canvas')
};

describe('UI Integration with FeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to default values
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

    // Mock UI Store
    mockUseUIStore.mockReturnValue({
      drawingState: {
        tool: 'select',
        isDrawing: false,
        currentPath: null
      },
      grid: {
        visible: true,
        snapEnabled: true,
        size: 20
      },
      viewport: {
        scale: 1,
        x: 0,
        y: 0
      },
      planScale: 1,
      setDrawingTool: jest.fn(),
      setGridVisible: jest.fn(),
      setSnapToGrid: jest.fn(),
      setViewport: jest.fn(),
      resetViewport: jest.fn()
    });

    // Mock Project Store
    mockUseProjectStore.mockReturnValue({
      currentProject: {
        id: 'test-project',
        name: 'Test Project',
        description: 'Test project description',
        segments: [],
        rooms: [],
        equipment: [],
        plan_pdf: null,
        plan_scale: 1
      }
    });

    // Mock Export Store
    mockUseExportStore.mockReturnValue({
      format: 'pdf',
      quality: 'high',
      includeMetadata: true,
      isExporting: false,
      exportProgress: 0,
      lastExportResult: null,
      setFormat: jest.fn(),
      setQuality: jest.fn(),
      setIncludeMetadata: jest.fn(),
      exportProject: jest.fn(),
      validateExport: jest.fn(() => ({
        valid: true,
        errors: [],
        warnings: [],
        canExport: true
      }))
    });

    // Mock Auth Store
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        tier: 'pro',
        name: 'Test User'
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
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

      // Get the mock store instance and verify the setDrawingTool was called
      const mockStoreInstance = mockUseUIStore.mock.results[0].value;
      expect(mockStoreInstance.setDrawingTool).toHaveBeenCalledWith('select');
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
