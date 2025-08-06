/**
 * Accessibility React Hook
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * React hook for WCAG 2.1 AA compliance, keyboard navigation,
 * screen reader support, and accessibility management.
 * 
 * @fileoverview Accessibility React hook
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { useState, useEffect, useCallback, useContext, createContext, useRef } from 'react';
import {
  IAccessibilityService,
  AccessibilityConfig,
  AccessibilityPreferences,
  AccessibilityAuditResult,
  AccessibilityReport,
  ColorContrastResult,
  WCAGComplianceLevel,
  AnnouncementType,
  FocusManagementConfig,
  KeyboardNavigationConfig,
  AccessibleComponentProps
} from '../core/interfaces/IAccessibilityService';

/**
 * Accessibility context interface
 */
interface AccessibilityContextValue {
  accessibilityService: IAccessibilityService;
}

/**
 * Accessibility context
 */
const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Accessibility provider component
 */
export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
  accessibilityService: IAccessibilityService;
  config?: AccessibilityConfig;
}> = ({ children, accessibilityService, config }) => {
  useEffect(() => {
    accessibilityService.initialize(config);
  }, [accessibilityService, config]);

  return (
    <AccessibilityContext.Provider value={{ accessibilityService }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook return type
 */
export interface UseAccessibilityReturn {
  // Service access
  service: IAccessibilityService;

  // Preferences management
  preferences: AccessibilityPreferences | null;
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => Promise<void>;

  // Color contrast validation
  validateColorContrast: (
    foreground: string,
    background: string,
    level?: WCAGComplianceLevel,
    isLargeText?: boolean
  ) => Promise<ColorContrastResult>;

  // Screen reader announcements
  announce: (message: string, type?: AnnouncementType) => Promise<void>;
  announcePolite: (message: string) => Promise<void>;
  announceAssertive: (message: string) => Promise<void>;

  // Focus management
  manageFocus: (config: FocusManagementConfig) => Promise<void>;
  trapFocus: (containerId: string) => Promise<() => void>;
  restoreFocus: () => Promise<void>;
  moveFocusTo: (elementId: string) => Promise<void>;

  // Keyboard navigation
  setupKeyboardNavigation: (element: HTMLElement, config: KeyboardNavigationConfig) => Promise<void>;

  // High contrast mode
  isHighContrastMode: boolean;
  enableHighContrast: () => Promise<void>;
  disableHighContrast: () => Promise<void>;
  toggleHighContrast: () => Promise<void>;

  // Accessibility auditing
  runAudit: (element?: HTMLElement) => Promise<AccessibilityAuditResult>;
  generateReport: (element?: HTMLElement) => Promise<AccessibilityReport>;

  // Component props generation
  getAccessibleProps: (componentType: string, options?: any) => Promise<AccessibleComponentProps>;

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Main useAccessibility hook
 */
export const useAccessibility = (): UseAccessibilityReturn => {
  const context = useContext(AccessibilityContext);
  
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }

  const { accessibilityService } = context;

  // State management
  const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadAccessibilityData();
  }, []);

  const loadAccessibilityData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [userPreferences, highContrastEnabled] = await Promise.all([
        accessibilityService.getAccessibilityPreferences(),
        accessibilityService.isHighContrastModeEnabled()
      ]);

      setPreferences(userPreferences);
      setIsHighContrastMode(highContrastEnabled);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Preferences management
  const updatePreferences = useCallback(async (
    newPreferences: Partial<AccessibilityPreferences>
  ): Promise<void> => {
    try {
      await accessibilityService.updateAccessibilityPreferences(newPreferences);
      const updatedPreferences = await accessibilityService.getAccessibilityPreferences();
      setPreferences(updatedPreferences);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [accessibilityService]);

  // Color contrast validation
  const validateColorContrast = useCallback(async (
    foreground: string,
    background: string,
    level: WCAGComplianceLevel = WCAGComplianceLevel.AA,
    isLargeText: boolean = false
  ): Promise<ColorContrastResult> => {
    return await accessibilityService.validateColorContrast(foreground, background, level, isLargeText);
  }, [accessibilityService]);

  // Screen reader announcements
  const announce = useCallback(async (
    message: string,
    type: AnnouncementType = AnnouncementType.POLITE
  ): Promise<void> => {
    await accessibilityService.announceToScreenReader(message, type);
  }, [accessibilityService]);

  const announcePolite = useCallback(async (message: string): Promise<void> => {
    await announce(message, AnnouncementType.POLITE);
  }, [announce]);

  const announceAssertive = useCallback(async (message: string): Promise<void> => {
    await announce(message, AnnouncementType.ASSERTIVE);
  }, [announce]);

  // Focus management
  const manageFocus = useCallback(async (config: FocusManagementConfig): Promise<void> => {
    await accessibilityService.manageFocus(config);
  }, [accessibilityService]);

  const trapFocus = useCallback(async (containerId: string): Promise<() => void> => {
    return await manageFocus({
      strategy: 'trap' as any,
      containerId,
      trapOptions: {
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        returnFocusOnDeactivate: true
      }
    }) as any;
  }, [manageFocus]);

  const restoreFocus = useCallback(async (): Promise<void> => {
    await manageFocus({ strategy: 'restore' as any });
  }, [manageFocus]);

  const moveFocusTo = useCallback(async (elementId: string): Promise<void> => {
    await manageFocus({ strategy: 'move' as any, targetElementId: elementId });
  }, [manageFocus]);

  // Keyboard navigation
  const setupKeyboardNavigation = useCallback(async (
    element: HTMLElement,
    config: KeyboardNavigationConfig
  ): Promise<void> => {
    await accessibilityService.setupKeyboardNavigation(element, config);
  }, [accessibilityService]);

  // High contrast mode
  const enableHighContrast = useCallback(async (): Promise<void> => {
    await accessibilityService.enableHighContrastMode();
    setIsHighContrastMode(true);
  }, [accessibilityService]);

  const disableHighContrast = useCallback(async (): Promise<void> => {
    await accessibilityService.disableHighContrastMode();
    setIsHighContrastMode(false);
  }, [accessibilityService]);

  const toggleHighContrast = useCallback(async (): Promise<void> => {
    if (isHighContrastMode) {
      await disableHighContrast();
    } else {
      await enableHighContrast();
    }
  }, [isHighContrastMode, enableHighContrast, disableHighContrast]);

  // Accessibility auditing
  const runAudit = useCallback(async (element?: HTMLElement): Promise<AccessibilityAuditResult> => {
    return await accessibilityService.runAccessibilityAudit(element);
  }, [accessibilityService]);

  const generateReport = useCallback(async (element?: HTMLElement): Promise<AccessibilityReport> => {
    return await accessibilityService.generateAccessibilityReport(element);
  }, [accessibilityService]);

  // Component props generation
  const getAccessibleProps = useCallback(async (
    componentType: string,
    options?: any
  ): Promise<AccessibleComponentProps> => {
    return await accessibilityService.getAccessibleProps(componentType, options);
  }, [accessibilityService]);

  return {
    // Service access
    service: accessibilityService,

    // Preferences management
    preferences,
    updatePreferences,

    // Color contrast validation
    validateColorContrast,

    // Screen reader announcements
    announce,
    announcePolite,
    announceAssertive,

    // Focus management
    manageFocus,
    trapFocus,
    restoreFocus,
    moveFocusTo,

    // Keyboard navigation
    setupKeyboardNavigation,

    // High contrast mode
    isHighContrastMode,
    enableHighContrast,
    disableHighContrast,
    toggleHighContrast,

    // Accessibility auditing
    runAudit,
    generateReport,

    // Component props generation
    getAccessibleProps,

    // State
    isLoading,
    error
  };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  elementRef: React.RefObject<HTMLElement>,
  config?: Partial<KeyboardNavigationConfig>
) => {
  const { setupKeyboardNavigation } = useAccessibility();

  useEffect(() => {
    if (elementRef.current && config) {
      const fullConfig: KeyboardNavigationConfig = {
        enableArrowKeys: true,
        enableTabNavigation: true,
        enableEscapeKey: true,
        enableEnterKey: true,
        enableSpaceKey: true,
        customKeyBindings: {},
        focusableSelectors: ['button', '[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'],
        skipLinks: [],
        ...config
      };

      setupKeyboardNavigation(elementRef.current, fullConfig);
    }
  }, [elementRef, config, setupKeyboardNavigation]);
};

/**
 * Hook for focus management
 */
export const useFocusManagement = () => {
  const { manageFocus, trapFocus, restoreFocus, moveFocusTo } = useAccessibility();
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement);
    }
  }, []);

  const restoreLastFocus = useCallback(async () => {
    const lastElement = focusHistoryRef.current.pop();
    if (lastElement && document.contains(lastElement)) {
      lastElement.focus();
    } else {
      await restoreFocus();
    }
  }, [restoreFocus]);

  return {
    manageFocus,
    trapFocus,
    restoreFocus,
    moveFocusTo,
    saveFocus,
    restoreLastFocus
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const { announce, announcePolite, announceAssertive } = useAccessibility();

  const announceError = useCallback(async (message: string) => {
    await announceAssertive(`Error: ${message}`);
  }, [announceAssertive]);

  const announceSuccess = useCallback(async (message: string) => {
    await announcePolite(`Success: ${message}`);
  }, [announcePolite]);

  const announceLoading = useCallback(async (message: string = 'Loading') => {
    await announcePolite(`${message}...`);
  }, [announcePolite]);

  const announceLoadingComplete = useCallback(async (message: string = 'Loading complete') => {
    await announcePolite(message);
  }, [announcePolite]);

  return {
    announce,
    announcePolite,
    announceAssertive,
    announceError,
    announceSuccess,
    announceLoading,
    announceLoadingComplete
  };
};
