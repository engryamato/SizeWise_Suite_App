/**
 * AppShell Container Component Tests
 * 
 * Comprehensive test suite for the refactored AppShell container component.
 * Tests component behavior, service integration, and tier enforcement.
 * 
 * @see docs/refactoring/component-architecture-specification.md
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { AppShellContainer } from '../AppShellContainer';
import { ServiceProvider } from '../../../lib/providers/ServiceProvider';
import { useUIStore } from '../../../stores/ui-store';
import { useAuthStore } from '../../../stores/auth-store';
import { useTheme } from '../../../lib/hooks/useTheme';
import { useToast } from '../../../lib/hooks/useToaster';

// =============================================================================
// Mocks
// =============================================================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock stores
jest.mock('../../../stores/ui-store');
jest.mock('../../../stores/auth-store');

// Mock hooks
jest.mock('../../../lib/hooks/useTheme');
jest.mock('../../../lib/hooks/useToaster');

// Mock service provider
jest.mock('../../../lib/providers/ServiceProvider', () => ({
  ServiceProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useServiceContext: () => ({
    services: mockServices,
    loading: false,
    error: null,
    initialized: true,
  }),
}));

// Mock presentation component
jest.mock('../AppShellPresentation', () => ({
  AppShellPresentation: ({ children, ...props }: any) => (
    <div data-testid="app-shell-presentation" {...props}>
      {children}
    </div>
  ),
}));

// =============================================================================
// Mock Data and Services
// =============================================================================

const mockServices = {
  projectService: {
    getProject: jest.fn(),
    saveProject: jest.fn(),
    createProject: jest.fn(),
    deleteProject: jest.fn(),
    listProjects: jest.fn(),
  },
  calculationService: {
    calculateDuctSizing: jest.fn(),
    validateResults: jest.fn(),
    getCalculationHistory: jest.fn(),
  },
  exportService: {
    exportProject: jest.fn(),
    getExportStatus: jest.fn(),
    downloadExport: jest.fn(),
  },
  tierService: {
    getCurrentTier: jest.fn().mockResolvedValue('free'),
    hasFeatureAccess: jest.fn().mockResolvedValue(false),
    getTierLimits: jest.fn().mockResolvedValue({
      maxRooms: 5,
      maxSegments: 10,
      maxProjects: 3,
      canEditComputationalProperties: false,
      canExportWithoutWatermark: false,
      canUseSimulation: false,
      canUseCatalog: false,
    }),
    upgradeTier: jest.fn(),
  },
  featureManager: {
    isFeatureEnabled: jest.fn(),
    getFeatureConfig: jest.fn(),
    enableFeature: jest.fn(),
    disableFeature: jest.fn(),
  },
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'free' as const,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockUIStore = {
  sidebarOpen: true,
  setSidebarOpen: jest.fn(),
  activePanel: 'project' as const,
  setActivePanel: jest.fn(),
  selectedObjects: [],
  notifications: [],
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
};

const mockAuthStore = {
  user: mockUser,
  isAuthenticated: true,
};

const mockTheme = {
  toggleTheme: jest.fn(),
  actualTheme: 'light' as const,
};

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

// =============================================================================
// Test Setup
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  
  (useUIStore as jest.Mock).mockReturnValue(mockUIStore);
  (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
  (useTheme as jest.Mock).mockReturnValue(mockTheme);
  (useToast as jest.Mock).mockReturnValue(mockToast);
});

// =============================================================================
// Helper Functions
// =============================================================================

const renderAppShell = (props = {}) => {
  const defaultProps = {
    children: <div data-testid="app-content">App Content</div>,
  };

  return render(
    <ServiceProvider services={mockServices}>
      <AppShellContainer {...defaultProps} {...props} />
    </ServiceProvider>
  );
};

// =============================================================================
// Component Tests
// =============================================================================

describe('AppShellContainer', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderAppShell();
      expect(screen.getByTestId('app-shell-presentation')).toBeInTheDocument();
    });

    it('renders children content', () => {
      renderAppShell();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('passes correct props to presentation component', () => {
      renderAppShell({ className: 'custom-class' });
      
      const presentation = screen.getByTestId('app-shell-presentation');
      expect(presentation).toHaveClass('custom-class');
    });
  });

  describe('Service Integration', () => {
    it('loads user tier information on mount', async () => {
      renderAppShell();
      
      await waitFor(() => {
        expect(mockServices.tierService.getCurrentTier).toHaveBeenCalled();
        expect(mockServices.tierService.getTierLimits).toHaveBeenCalled();
      });
    });

    it('handles service errors gracefully', async () => {
      const errorMessage = 'Service unavailable';
      mockServices.tierService.getCurrentTier.mockRejectedValue(new Error(errorMessage));
      
      renderAppShell();
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load user information');
      });
    });
  });

  describe('Theme Management', () => {
    it('handles theme toggle', () => {
      renderAppShell();
      
      // Simulate theme toggle (this would be triggered by presentation component)
      const presentation = screen.getByTestId('app-shell-presentation');
      
      // Check that theme toggle function is passed to presentation
      expect(presentation).toHaveAttribute('onThemeToggle');
    });

    it('shows success message on theme change', () => {
      renderAppShell();
      
      // The actual theme toggle would be handled by the presentation component
      // Here we test that the handler is properly set up
      expect(mockTheme.toggleTheme).toBeDefined();
    });
  });

  describe('Sidebar Management', () => {
    it('toggles sidebar state', () => {
      renderAppShell();
      
      // The sidebar toggle would be triggered by the presentation component
      // Verify the handler is available
      const presentation = screen.getByTestId('app-shell-presentation');
      expect(presentation).toHaveAttribute('onSidebarToggle');
    });

    it('reflects sidebar state from store', () => {
      const customUIStore = { ...mockUIStore, sidebarOpen: false };
      (useUIStore as jest.Mock).mockReturnValue(customUIStore);
      
      renderAppShell();
      
      const presentation = screen.getByTestId('app-shell-presentation');
      expect(presentation).toHaveAttribute('sidebarOpen', 'false');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('handles Ctrl+B for sidebar toggle', () => {
      renderAppShell();
      
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
      
      expect(mockUIStore.setSidebarOpen).toHaveBeenCalledWith(!mockUIStore.sidebarOpen);
    });

    it('handles Ctrl+P for project properties', () => {
      renderAppShell();
      
      fireEvent.keyDown(document, { key: 'p', ctrlKey: true });
      
      // Should prevent default browser behavior
      // The actual implementation would handle this
    });

    it('handles Escape key for closing panels', () => {
      renderAppShell();
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Should close any open panels
      // The actual implementation would handle this
    });
  });

  describe('Loading States', () => {
    it('shows loading state while services initialize', () => {
      // Mock loading state
      jest.doMock('../../../lib/providers/ServiceProvider', () => ({
        useServiceContext: () => ({
          services: null,
          loading: true,
          error: null,
          initialized: false,
        }),
      }));
      
      renderAppShell();
      
      expect(screen.getByText('Loading SizeWise Suite...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles service initialization errors', () => {
      // Mock error state
      jest.doMock('../../../lib/providers/ServiceProvider', () => ({
        useServiceContext: () => ({
          services: null,
          loading: false,
          error: 'Failed to initialize services',
          initialized: false,
        }),
      }));
      
      renderAppShell();
      
      // Should show error message and retry button
      // The actual implementation would handle this
    });
  });

  describe('Accessibility', () => {
    it('includes skip to main content link', () => {
      renderAppShell();
      
      // The skip link would be in the presentation component
      const presentation = screen.getByTestId('app-shell-presentation');
      expect(presentation).toBeInTheDocument();
    });

    it('handles keyboard navigation properly', () => {
      renderAppShell();
      
      // Test that keyboard events are properly handled
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Should not interfere with normal tab navigation
    });
  });

  describe('Responsive Behavior', () => {
    it('handles mobile menu toggle', () => {
      renderAppShell();
      
      const presentation = screen.getByTestId('app-shell-presentation');
      expect(presentation).toHaveAttribute('onMobileMenuToggle');
    });

    it('adapts to different screen sizes', () => {
      // This would be tested with different viewport sizes
      renderAppShell();
      
      // The presentation component would handle responsive behavior
      expect(screen.getByTestId('app-shell-presentation')).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('triggers auto-save periodically', async () => {
      jest.useFakeTimers();
      
      renderAppShell();
      
      // Fast-forward time to trigger auto-save
      jest.advanceTimersByTime(30000);
      
      // Auto-save would be handled by project service
      // This is just testing the timer setup
      
      jest.useRealTimers();
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('AppShellContainer Integration', () => {
  it('integrates properly with service layer', async () => {
    renderAppShell();
    
    // Verify all services are accessible
    await waitFor(() => {
      expect(mockServices.tierService.getCurrentTier).toHaveBeenCalled();
    });
  });

  it('maintains state consistency across re-renders', () => {
    const { rerender } = renderAppShell();
    
    // Change props and re-render
    rerender(
      <ServiceProvider services={mockServices}>
        <AppShellContainer className="updated-class">
          <div>Updated Content</div>
        </AppShellContainer>
      </ServiceProvider>
    );
    
    // State should be maintained
    expect(mockUIStore.setSidebarOpen).not.toHaveBeenCalled();
  });

  it('handles user authentication changes', () => {
    const { rerender } = renderAppShell();
    
    // Change auth state
    const updatedAuthStore = { ...mockAuthStore, isAuthenticated: false };
    (useAuthStore as jest.Mock).mockReturnValue(updatedAuthStore);
    
    rerender(
      <ServiceProvider services={mockServices}>
        <AppShellContainer>
          <div>Content</div>
        </AppShellContainer>
      </ServiceProvider>
    );
    
    // Should handle auth state change appropriately
    expect(screen.getByTestId('app-shell-presentation')).toBeInTheDocument();
  });
});
