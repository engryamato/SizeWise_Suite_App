/**
 * Accessibility Service Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * WCAG 2.1 AA compliance interfaces for keyboard navigation,
 * screen reader support, color contrast validation, and focus management.
 * 
 * @fileoverview Accessibility service interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * WCAG 2.1 AA compliance levels
 */
export enum WCAGComplianceLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA'
}

/**
 * Accessibility violation severity levels
 */
export enum AccessibilityViolationSeverity {
  CRITICAL = 'critical',    // Blocks user access
  SERIOUS = 'serious',      // Significantly impacts usability
  MODERATE = 'moderate',    // Some impact on usability
  MINOR = 'minor'          // Minimal impact
}

/**
 * Keyboard navigation directions
 */
export enum NavigationDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  NEXT = 'next',
  PREVIOUS = 'previous',
  FIRST = 'first',
  LAST = 'last'
}

/**
 * Focus management strategies
 */
export enum FocusStrategy {
  TRAP = 'trap',           // Trap focus within container
  RESTORE = 'restore',     // Restore focus to previous element
  MOVE = 'move',          // Move focus to specific element
  CLEAR = 'clear'         // Clear focus
}

/**
 * Screen reader announcement types
 */
export enum AnnouncementType {
  POLITE = 'polite',       // Announce when convenient
  ASSERTIVE = 'assertive', // Announce immediately
  OFF = 'off'             // Don't announce
}

/**
 * Color contrast requirements
 */
export interface ColorContrastRequirement {
  level: WCAGComplianceLevel;
  normalTextRatio: number;    // 4.5:1 for AA, 3:1 for A
  largeTextRatio: number;     // 3:1 for AA, 2.25:1 for A
  nonTextRatio: number;       // 3:1 for AA
  focusIndicatorRatio: number; // 3:1 for AA
}

/**
 * Color contrast validation result
 */
export interface ColorContrastResult {
  isCompliant: boolean;
  actualRatio: number;
  requiredRatio: number;
  level: WCAGComplianceLevel;
  foregroundColor: string;
  backgroundColor: string;
  suggestions?: string[];
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  enableArrowKeys: boolean;
  enableTabNavigation: boolean;
  enableEscapeKey: boolean;
  enableEnterKey: boolean;
  enableSpaceKey: boolean;
  customKeyBindings: Record<string, () => void>;
  focusableSelectors: string[];
  skipLinks: SkipLink[];
}

/**
 * Skip link configuration
 */
export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
  shortcut?: string;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  strategy: FocusStrategy;
  containerId?: string;
  targetElementId?: string;
  restoreElement?: HTMLElement;
  trapOptions?: FocusTrapOptions;
}

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  initialFocus?: string | HTMLElement;
  fallbackFocus?: string | HTMLElement;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

/**
 * Screen reader configuration
 */
export interface ScreenReaderConfig {
  liveRegionId: string;
  announcementType: AnnouncementType;
  clearPreviousAnnouncements: boolean;
  announcePageChanges: boolean;
  announceFormErrors: boolean;
  announceLoadingStates: boolean;
}

/**
 * Accessibility violation details
 */
export interface AccessibilityViolation {
  id: string;
  rule: string;
  severity: AccessibilityViolationSeverity;
  element: string;
  description: string;
  impact: string;
  helpUrl: string;
  suggestions: string[];
  wcagCriteria: string[];
}

/**
 * Accessibility audit result
 */
export interface AccessibilityAuditResult {
  isCompliant: boolean;
  complianceLevel: WCAGComplianceLevel;
  score: number; // 0-100
  violations: AccessibilityViolation[];
  warnings: AccessibilityViolation[];
  passes: number;
  timestamp: Date;
  url?: string;
  elementCount: number;
}

/**
 * Accessible component props
 */
export interface AccessibleComponentProps {
  // ARIA attributes
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'aria-busy'?: boolean;
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-readonly'?: boolean;
  'aria-multiline'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-activedescendant'?: string;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-pressed'?: boolean | 'mixed';
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-level'?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-rowcount'?: number;
  'aria-colcount'?: number;
  'aria-rowindex'?: number;
  'aria-colindex'?: number;
  'aria-rowspan'?: number;
  'aria-colspan'?: number;

  // Keyboard navigation
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;

  // Role
  role?: string;

  // ID for referencing
  id?: string;
}

/**
 * Main Accessibility Service interface
 */
export interface IAccessibilityService {
  /**
   * Initialize accessibility service
   */
  initialize(config?: AccessibilityConfig): Promise<void>;

  /**
   * Validate color contrast
   */
  validateColorContrast(
    foregroundColor: string,
    backgroundColor: string,
    level: WCAGComplianceLevel,
    isLargeText?: boolean
  ): Promise<ColorContrastResult>;

  /**
   * Setup keyboard navigation for element
   */
  setupKeyboardNavigation(
    element: HTMLElement,
    config: KeyboardNavigationConfig
  ): Promise<void>;

  /**
   * Manage focus
   */
  manageFocus(config: FocusManagementConfig): Promise<void>;

  /**
   * Announce to screen readers
   */
  announceToScreenReader(
    message: string,
    type?: AnnouncementType,
    clearPrevious?: boolean
  ): Promise<void>;

  /**
   * Run accessibility audit
   */
  runAccessibilityAudit(element?: HTMLElement): Promise<AccessibilityAuditResult>;

  /**
   * Get accessible component props
   */
  getAccessibleProps(
    componentType: string,
    options?: any
  ): Promise<AccessibleComponentProps>;

  /**
   * Validate ARIA attributes
   */
  validateARIAAttributes(element: HTMLElement): Promise<AccessibilityViolation[]>;

  /**
   * Setup skip links
   */
  setupSkipLinks(skipLinks: SkipLink[]): Promise<void>;

  /**
   * Enable high contrast mode
   */
  enableHighContrastMode(): Promise<void>;

  /**
   * Disable high contrast mode
   */
  disableHighContrastMode(): Promise<void>;

  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastModeEnabled(): Promise<boolean>;

  /**
   * Get accessibility preferences
   */
  getAccessibilityPreferences(): Promise<AccessibilityPreferences>;

  /**
   * Update accessibility preferences
   */
  updateAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): Promise<void>;

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport(element?: HTMLElement): Promise<AccessibilityReport>;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  complianceLevel: WCAGComplianceLevel;
  keyboardNavigation: KeyboardNavigationConfig;
  screenReader: ScreenReaderConfig;
  colorContrast: ColorContrastRequirement;
  focusManagement: FocusManagementConfig;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableLargeText: boolean;
  announcePageChanges: boolean;
  skipLinksEnabled: boolean;
}

/**
 * User accessibility preferences
 */
export interface AccessibilityPreferences {
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigationOnly: boolean;
  announceChanges: boolean;
  focusIndicatorStyle: 'default' | 'high-contrast' | 'custom';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'auto';
}

/**
 * Accessibility report
 */
export interface AccessibilityReport {
  summary: {
    complianceLevel: WCAGComplianceLevel;
    overallScore: number;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    moderateViolations: number;
    minorViolations: number;
  };
  violations: AccessibilityViolation[];
  recommendations: string[];
  wcagCriteria: {
    [criterion: string]: {
      passed: boolean;
      violations: AccessibilityViolation[];
    };
  };
  generatedAt: Date;
  testedUrl?: string;
  elementCount: number;
}

/**
 * Keyboard navigation handler interface
 */
export interface IKeyboardNavigationHandler {
  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): Promise<boolean>;

  /**
   * Handle keyboard events
   */
  handleKeyUp(event: KeyboardEvent): Promise<boolean>;

  /**
   * Get focusable elements
   */
  getFocusableElements(container?: HTMLElement): Promise<HTMLElement[]>;

  /**
   * Move focus in direction
   */
  moveFocus(direction: NavigationDirection, container?: HTMLElement): Promise<boolean>;

  /**
   * Setup tab order
   */
  setupTabOrder(elements: HTMLElement[]): Promise<void>;
}

/**
 * Focus manager interface
 */
export interface IFocusManager {
  /**
   * Trap focus within container
   */
  trapFocus(container: HTMLElement, options?: FocusTrapOptions): Promise<() => void>;

  /**
   * Restore focus to previous element
   */
  restoreFocus(): Promise<void>;

  /**
   * Save current focus
   */
  saveFocus(): Promise<void>;

  /**
   * Move focus to element
   */
  moveFocusTo(element: HTMLElement | string): Promise<void>;

  /**
   * Clear focus
   */
  clearFocus(): Promise<void>;

  /**
   * Get currently focused element
   */
  getCurrentFocus(): Promise<HTMLElement | null>;
}

/**
 * Screen reader interface
 */
export interface IScreenReader {
  /**
   * Announce message
   */
  announce(message: string, type?: AnnouncementType): Promise<void>;

  /**
   * Setup live region
   */
  setupLiveRegion(config: ScreenReaderConfig): Promise<void>;

  /**
   * Clear announcements
   */
  clearAnnouncements(): Promise<void>;

  /**
   * Check if screen reader is active
   */
  isScreenReaderActive(): Promise<boolean>;
}
