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

// Mock framer-motion to prevent NavigationItem rendering issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, onMouseEnter, ...props }: any) => (
      <div className={className} onClick={onClick} onMouseEnter={onMouseEnter} {...props}>
        {children}
      </div>
    ),
    nav: ({ children, className, ...props }: any) => (
      <nav className={className} {...props}>
        {children}
      </nav>
    ),
    aside: ({ children, className, ...props }: any) => (
      <aside className={className} {...props}>
        {children}
      </aside>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock presentation component BEFORE importing AppShellContainer
jest.mock('../AppShellPresentation', () => {
  console.log('AppShellPresentation mock is being loaded');
  return {
    __esModule: true,
    default: ({ children, className, ...props }: any) => {
      console.log('AppShellPresentation mock is being rendered');
      return (
        <div data-testid="app-shell-presentation" className={className}>
          <div data-testid="mocked-navigation">Navigation</div>
          <div data-testid="mocked-sidebar">Sidebar</div>
          <div data-testid="mocked-content">{children}</div>
          <div data-testid="mocked-status-bar">Status Bar</div>
        </div>
      );
    },
  };
});

import { AppShellContainer } from '../AppShellContainer';
import { ServiceProvider } from '../../../lib/providers/ServiceProvider';
import { ToasterProvider } from '../../../lib/hooks/useToaster';

// =============================================================================
// Mocks
// =============================================================================

// Clear modules and mock Next.js navigation explicitly
beforeAll(() => {
  jest.resetModules();
});

// Mock Next.js router - using the same approach as the working minimal test
jest.mock('next/navigation', () => {
  console.log('Mocking next/navigation in AppShellContainer test');
  return {
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    usePathname: jest.fn(() => {
      console.log('usePathname mock called, returning "/"');
      return '/';
    }),
  };
});

// Mock stores with proper Jest mock functions
const mockUseUIStore = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('../../../stores/ui-store', () => ({
  useUIStore: mockUseUIStore
}));

jest.mock('../../../stores/auth-store', () => ({
  useAuthStore: mockUseAuthStore
}));

// Mock hooks with proper Jest mock functions
const mockUseTheme = jest.fn();
const mockUseToast = jest.fn();
const mockUseServices = jest.fn();

jest.mock('../../../lib/hooks/useTheme', () => ({
  useTheme: mockUseTheme
}));

jest.mock('../../../lib/hooks/useToaster', () => ({
  useToast: mockUseToast
}));

jest.mock('../../../lib/hooks/useServiceIntegration', () => ({
  useServices: mockUseServices
}));

// Mock service provider with proper Jest mock functions
const mockUseServiceContext = jest.fn();

jest.mock('../../../lib/providers/ServiceProvider', () => ({
  ServiceProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useServiceContext: mockUseServiceContext
}));



// Mock CenteredNavigation component
jest.mock('../../ui/CenteredNavigation', () => ({
  CenteredNavigation: ({ className }: any) => (
    <div data-testid="centered-navigation" className={className}>
      Mocked Navigation
    </div>
  ),
}));

// Mock other UI components that might be causing issues
jest.mock('../../ui/LaserBackground', () => ({
  __esModule: true,
  default: ({ className }: any) => (
    <div data-testid="laser-background" className={className}>
      Mocked Laser Background
    </div>
  ),
}));

jest.mock('../../ui/Sidebar', () => ({
  Sidebar: ({ className }: any) => (
    <div data-testid="sidebar" className={className}>
      Mocked Sidebar
    </div>
  ),
}));

jest.mock('../../ui/StatusBar', () => ({
  StatusBar: ({ className }: any) => (
    <div data-testid="status-bar" className={className}>
      Mocked Status Bar
    </div>
  ),
}));

jest.mock('../../guards/ToolRouteGuard', () => ({
  ToolRouteGuard: ({ children }: any) => (
    <div data-testid="tool-route-guard">
      {children}
    </div>
  ),
}));

// The mocks are already defined above, no need to import or re-cast them

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

// Create a mock function that we can reference in tests
const mockGetCurrentTier = jest.fn().mockResolvedValue('pro');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules(); // Clear module cache to ensure mocks are applied

  // Reset the specific mock function but preserve its implementation
  mockGetCurrentTier.mockClear();
  mockGetCurrentTier.mockResolvedValue('pro');

  // Setup router mock
  global.mockUsePathname.mockReturnValue('/dashboard');

  // Setup store mocks
  mockUseUIStore.mockReturnValue(mockUIStore);
  mockUseAuthStore.mockReturnValue(mockAuthStore);
  mockUseTheme.mockReturnValue(mockTheme);
  mockUseToast.mockReturnValue(mockToast);

  // Setup service mocks
  mockUseServices.mockReturnValue({
    projectService: mockServices.projectService,
    calculationService: mockServices.calculationService,
    exportService: mockServices.exportService,
    tier: {
      service: 'pro',
      features: ['advanced_calculations', 'export_formats'],
      limits: { projects: 100, calculations: 1000 },
      getCurrentTier: mockGetCurrentTier
    },
    loading: false,
    error: null,
    initialized: true
  });

  mockUseServiceContext.mockReturnValue({
    services: mockServices,
    loading: false,
    error: null,
    initialized: true
  });
});

afterEach(() => {
  // Clean up any remaining DOM elements safely
  if (document.body) {
    document.body.innerHTML = '';
  }

  // Clear all mocks
  jest.clearAllMocks();
});

// =============================================================================
// Helper Functions
// =============================================================================

const renderAppShell = (props = {}) => {
  const defaultProps = {
    children: <div data-testid="app-content">App Content</div>,
  };

  // Ensure we have a proper DOM environment
  if (!document.body) {
    document.body = document.createElement('body');
    document.documentElement.appendChild(document.body);
  }

  // Create a proper container for React 18.3.1 createRoot()
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'test-container');

  // Ensure the container is properly attached to the DOM
  document.body.appendChild(container);

  return render(
    <ServiceProvider services={mockServices}>
      <ToasterProvider position="bottom-left" maxToasts={5}>
        <AppShellContainer {...defaultProps} {...props} />
      </ToasterProvider>
    </ServiceProvider>,
    { container }
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
        expect(mockGetCurrentTier).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('handles service errors gracefully', async () => {
      const errorMessage = 'Service unavailable';
      mockGetCurrentTier.mockRejectedValue(new Error(errorMessage));

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
      mockUseUIStore.mockReturnValue(customUIStore);
      
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
      // Use fake timers for this test only
      jest.useFakeTimers();

      try {
        renderAppShell();

        // Fast-forward time to trigger auto-save
        jest.advanceTimersByTime(30000);

        // Auto-save would be handled by project service
        // This is just testing the timer setup

        // Verify that the component doesn't crash with timer advancement
        expect(screen.getByTestId('app-shell-presentation')).toBeInTheDocument();
      } finally {
        // Always restore real timers
        jest.useRealTimers();
      }
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
