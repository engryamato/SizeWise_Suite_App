/**
 * Accessibility Service Implementation
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * WCAG 2.1 AA compliance service implementing keyboard navigation,
 * screen reader support, color contrast validation, and focus management.
 * 
 * @fileoverview Accessibility service implementation
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  IAccessibilityService,
  IKeyboardNavigationHandler,
  IFocusManager,
  IScreenReader,
  AccessibilityConfig,
  AccessibilityAuditResult,
  AccessibilityViolation,
  AccessibilityViolationSeverity,
  AccessibilityReport,
  AccessibilityPreferences,
  ColorContrastResult,
  ColorContrastRequirement,
  WCAGComplianceLevel,
  KeyboardNavigationConfig,
  FocusManagementConfig,
  FocusStrategy,
  ScreenReaderConfig,
  AnnouncementType,
  NavigationDirection,
  SkipLink,
  AccessibleComponentProps,
  FocusTrapOptions
} from '../core/interfaces/IAccessibilityService';

import { ILogger, IConfigurationService } from '../core/interfaces';

/**
 * Color contrast utility functions
 */
class ColorContrastUtils {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Suggest accessible color alternatives
   */
  static suggestAccessibleColors(
    foreground: string,
    background: string,
    targetRatio: number
  ): string[] {
    const suggestions: string[] = [];
    
    // Try darkening foreground
    const darkerForeground = this.adjustBrightness(foreground, -0.2);
    if (this.getContrastRatio(darkerForeground, background) >= targetRatio) {
      suggestions.push(darkerForeground);
    }

    // Try lightening background
    const lighterBackground = this.adjustBrightness(background, 0.2);
    if (this.getContrastRatio(foreground, lighterBackground) >= targetRatio) {
      suggestions.push(lighterBackground);
    }

    return suggestions;
  }

  /**
   * Adjust color brightness
   */
  static adjustBrightness(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjust = (c: number) => Math.max(0, Math.min(255, c + (amount * 255)));
    
    const newR = Math.round(adjust(rgb.r));
    const newG = Math.round(adjust(rgb.g));
    const newB = Math.round(adjust(rgb.b));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Keyboard Navigation Handler Implementation
 */
export class KeyboardNavigationHandler implements IKeyboardNavigationHandler {
  private config: KeyboardNavigationConfig;

  constructor(config: KeyboardNavigationConfig, private logger: ILogger) {
    this.config = config;
  }

  async handleKeyDown(event: KeyboardEvent): Promise<boolean> {
    const { key, ctrlKey, altKey, shiftKey } = event;

    try {
      // Handle escape key
      if (key === 'Escape' && this.config.enableEscapeKey) {
        this.handleEscape(event);
        return true;
      }

      // Handle arrow keys
      if (this.config.enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return await this.handleArrowKey(event);
      }

      // Handle tab navigation
      if (key === 'Tab' && this.config.enableTabNavigation) {
        return await this.handleTabNavigation(event);
      }

      // Handle enter key
      if (key === 'Enter' && this.config.enableEnterKey) {
        return await this.handleEnterKey(event);
      }

      // Handle space key
      if (key === ' ' && this.config.enableSpaceKey) {
        return await this.handleSpaceKey(event);
      }

      // Handle custom key bindings
      const customHandler = this.config.customKeyBindings[key];
      if (customHandler) {
        customHandler();
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Keyboard navigation error', error as Error);
      return false;
    }
  }

  async handleKeyUp(event: KeyboardEvent): Promise<boolean> {
    // Handle key up events if needed
    return false;
  }

  async getFocusableElements(container?: HTMLElement): Promise<HTMLElement[]> {
    const root = container || document.body;
    const selector = this.config.focusableSelectors.join(', ') || 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const elements = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
    
    return elements.filter(element => {
      return element.offsetParent !== null && // Element is visible
             !('disabled' in element && (element as any).disabled) && // Element is not disabled
             element.tabIndex !== -1; // Element is focusable
    });
  }

  async moveFocus(direction: NavigationDirection, container?: HTMLElement): Promise<boolean> {
    const focusableElements = await this.getFocusableElements(container);
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);

    let targetIndex: number;

    switch (direction) {
      case NavigationDirection.NEXT:
        targetIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case NavigationDirection.PREVIOUS:
        targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case NavigationDirection.FIRST:
        targetIndex = 0;
        break;
      case NavigationDirection.LAST:
        targetIndex = focusableElements.length - 1;
        break;
      default:
        return false;
    }

    if (focusableElements[targetIndex]) {
      focusableElements[targetIndex].focus();
      return true;
    }

    return false;
  }

  async setupTabOrder(elements: HTMLElement[]): Promise<void> {
    elements.forEach((element, index) => {
      element.tabIndex = index + 1;
    });
  }

  private handleEscape(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      (activeModal as HTMLElement).setAttribute('aria-hidden', 'true');
      event.preventDefault();
    }
  }

  private async handleArrowKey(event: KeyboardEvent): Promise<boolean> {
    const direction = this.getDirectionFromArrowKey(event.key);
    if (direction) {
      event.preventDefault();
      return await this.moveFocus(direction);
    }
    return false;
  }

  private async handleTabNavigation(event: KeyboardEvent): Promise<boolean> {
    const direction = event.shiftKey ? NavigationDirection.PREVIOUS : NavigationDirection.NEXT;
    return await this.moveFocus(direction);
  }

  private async handleEnterKey(event: KeyboardEvent): Promise<boolean> {
    const target = event.target as HTMLElement;
    if (target.role === 'button' || target.tagName === 'BUTTON') {
      target.click();
      event.preventDefault();
      return true;
    }
    return false;
  }

  private async handleSpaceKey(event: KeyboardEvent): Promise<boolean> {
    const target = event.target as HTMLElement;
    if (target.role === 'button' || target.tagName === 'BUTTON') {
      target.click();
      event.preventDefault();
      return true;
    }
    return false;
  }

  private getDirectionFromArrowKey(key: string): NavigationDirection | null {
    switch (key) {
      case 'ArrowUp': return NavigationDirection.UP;
      case 'ArrowDown': return NavigationDirection.DOWN;
      case 'ArrowLeft': return NavigationDirection.LEFT;
      case 'ArrowRight': return NavigationDirection.RIGHT;
      default: return null;
    }
  }
}

/**
 * Focus Manager Implementation
 */
export class FocusManager implements IFocusManager {
  private focusHistory: HTMLElement[] = [];
  private activeFocusTraps: (() => void)[] = [];

  constructor(private logger: ILogger) {}

  async trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): Promise<() => void> {
    const focusableElements = await this.getFocusableElementsInContainer(container);
    
    if (focusableElements.length === 0) {
      this.logger.warn('No focusable elements found in focus trap container');
      return () => {};
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    const initialFocus = this.resolveElement(options.initialFocus) || firstElement;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (event.key === 'Escape' && options.escapeDeactivates) {
        deactivate();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (options.clickOutsideDeactivates && !container.contains(event.target as Node)) {
        deactivate();
      }
    };

    const deactivate = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      
      if (options.returnFocusOnDeactivate) {
        this.restoreFocus();
      }

      const index = this.activeFocusTraps.indexOf(deactivate);
      if (index > -1) {
        this.activeFocusTraps.splice(index, 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (options.clickOutsideDeactivates) {
      document.addEventListener('click', handleClickOutside);
    }

    this.activeFocusTraps.push(deactivate);
    return deactivate;
  }

  async restoreFocus(): Promise<void> {
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }

  async saveFocus(): Promise<void> {
    const currentElement = document.activeElement as HTMLElement;
    if (currentElement && currentElement !== document.body) {
      this.focusHistory.push(currentElement);
    }
  }

  async moveFocusTo(element: HTMLElement | string): Promise<void> {
    const targetElement = this.resolveElement(element);
    if (targetElement) {
      await this.saveFocus();
      targetElement.focus();
    }
  }

  async clearFocus(): Promise<void> {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  }

  async getCurrentFocus(): Promise<HTMLElement | null> {
    return document.activeElement as HTMLElement || null;
  }

  private async getFocusableElementsInContainer(container: HTMLElement): Promise<HTMLElement[]> {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    
    return elements.filter(element => {
      return element.offsetParent !== null &&
             !('disabled' in element && (element as any).disabled) &&
             element.tabIndex !== -1;
    });
  }

  private resolveElement(element: HTMLElement | string | undefined): HTMLElement | null {
    if (!element) return null;
    if (typeof element === 'string') {
      return document.getElementById(element) || document.querySelector(element);
    }
    return element;
  }
}

/**
 * Screen Reader Implementation
 */
export class ScreenReader implements IScreenReader {
  private liveRegion: HTMLElement | null = null;
  private config: ScreenReaderConfig;

  constructor(config: ScreenReaderConfig, private logger: ILogger) {
    this.config = config;
  }

  async announce(message: string, type: AnnouncementType = AnnouncementType.POLITE): Promise<void> {
    if (!this.liveRegion) {
      await this.setupLiveRegion(this.config);
    }

    if (this.liveRegion) {
      if (this.config.clearPreviousAnnouncements) {
        this.liveRegion.textContent = '';
        // Small delay to ensure screen reader notices the change
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      this.liveRegion.setAttribute('aria-live', type);
      this.liveRegion.textContent = message;
      
      this.logger.info(`Screen reader announcement: ${message} (${type})`);
    }
  }

  async setupLiveRegion(config: ScreenReaderConfig): Promise<void> {
    this.config = config;
    
    // Remove existing live region
    const existing = document.getElementById(config.liveRegionId);
    if (existing) {
      existing.remove();
    }

    // Create new live region
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = config.liveRegionId;
    this.liveRegion.setAttribute('aria-live', config.announcementType);
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'additions text');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  async clearAnnouncements(): Promise<void> {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
    }
  }

  async isScreenReaderActive(): Promise<boolean> {
    // Check for common screen reader indicators
    return !!(
      window.navigator.userAgent.includes('NVDA') ||
      window.navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis ||
      (window as any).speechSynthesis
    );
  }
}

/**
 * Main Accessibility Service Implementation
 */
export class AccessibilityService implements IAccessibilityService {
  private config: AccessibilityConfig;
  private keyboardHandler: IKeyboardNavigationHandler;
  private focusManager: IFocusManager;
  private screenReader: IScreenReader;
  private preferences: AccessibilityPreferences;

  constructor(
    private logger: ILogger,
    private configService: IConfigurationService
  ) {
    this.preferences = this.getDefaultPreferences();
    this.focusManager = new FocusManager(logger);
  }

  async initialize(config?: AccessibilityConfig): Promise<void> {
    try {
      // Load configuration
      this.config = config || await this.loadDefaultConfig();

      // Initialize keyboard navigation
      this.keyboardHandler = new KeyboardNavigationHandler(
        this.config.keyboardNavigation,
        this.logger
      );

      // Initialize screen reader
      this.screenReader = new ScreenReader(this.config.screenReader, this.logger);
      await this.screenReader.setupLiveRegion(this.config.screenReader);

      // Load user preferences
      await this.loadUserPreferences();

      // Setup global keyboard listeners
      await this.setupGlobalKeyboardListeners();

      // Setup skip links
      if (this.config.skipLinksEnabled) {
        await this.setupSkipLinks(this.config.keyboardNavigation.skipLinks);
      }

      // Apply user preferences
      await this.applyUserPreferences();

      this.logger.info('Accessibility service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize accessibility service', error as Error);
      throw error;
    }
  }

  async validateColorContrast(
    foregroundColor: string,
    backgroundColor: string,
    level: WCAGComplianceLevel,
    isLargeText: boolean = false
  ): Promise<ColorContrastResult> {
    const actualRatio = ColorContrastUtils.getContrastRatio(foregroundColor, backgroundColor);
    const requirement = this.getColorContrastRequirement(level);
    const requiredRatio = isLargeText ? requirement.largeTextRatio : requirement.normalTextRatio;

    const isCompliant = actualRatio >= requiredRatio;

    const result: ColorContrastResult = {
      isCompliant,
      actualRatio: Math.round(actualRatio * 100) / 100,
      requiredRatio,
      level,
      foregroundColor,
      backgroundColor
    };

    if (!isCompliant) {
      result.suggestions = ColorContrastUtils.suggestAccessibleColors(
        foregroundColor,
        backgroundColor,
        requiredRatio
      );
    }

    return result;
  }

  async setupKeyboardNavigation(
    element: HTMLElement,
    config: KeyboardNavigationConfig
  ): Promise<void> {
    const handler = new KeyboardNavigationHandler(config, this.logger);

    element.addEventListener('keydown', async (event) => {
      await handler.handleKeyDown(event);
    });

    element.addEventListener('keyup', async (event) => {
      await handler.handleKeyUp(event);
    });

    // Make element focusable if not already
    if (element.tabIndex < 0) {
      element.tabIndex = 0;
    }

    // Add ARIA attributes if missing
    if (!element.getAttribute('role')) {
      element.setAttribute('role', 'application');
    }
  }

  async manageFocus(config: FocusManagementConfig): Promise<void> {
    switch (config.strategy) {
      case FocusStrategy.TRAP:
        if (config.containerId) {
          const container = document.getElementById(config.containerId);
          if (container) {
            await this.focusManager.trapFocus(container, config.trapOptions);
          }
        }
        break;

      case FocusStrategy.RESTORE:
        await this.focusManager.restoreFocus();
        break;

      case FocusStrategy.MOVE:
        if (config.targetElementId) {
          await this.focusManager.moveFocusTo(config.targetElementId);
        }
        break;

      case FocusStrategy.CLEAR:
        await this.focusManager.clearFocus();
        break;
    }
  }

  async announceToScreenReader(
    message: string,
    type: AnnouncementType = AnnouncementType.POLITE,
    clearPrevious: boolean = false
  ): Promise<void> {
    if (clearPrevious) {
      await this.screenReader.clearAnnouncements();
    }
    await this.screenReader.announce(message, type);
  }

  async runAccessibilityAudit(element?: HTMLElement): Promise<AccessibilityAuditResult> {
    const target = element || document.body;
    const violations: AccessibilityViolation[] = [];
    let passes = 0;

    try {
      // Check color contrast
      const colorViolations = await this.auditColorContrast(target);
      violations.push(...colorViolations);

      // Check ARIA attributes
      const ariaViolations = await this.auditARIAAttributes(target);
      violations.push(...ariaViolations);

      // Check keyboard accessibility
      const keyboardViolations = await this.auditKeyboardAccessibility(target);
      violations.push(...keyboardViolations);

      // Check focus management
      const focusViolations = await this.auditFocusManagement(target);
      violations.push(...focusViolations);

      // Check semantic structure
      const semanticViolations = await this.auditSemanticStructure(target);
      violations.push(...semanticViolations);

      // Calculate passes
      const totalChecks = violations.length + passes;
      passes = Math.max(0, totalChecks - violations.length);

      // Determine compliance level
      const criticalViolations = violations.filter(v => v.severity === AccessibilityViolationSeverity.CRITICAL);
      const seriousViolations = violations.filter(v => v.severity === AccessibilityViolationSeverity.SERIOUS);

      let complianceLevel = WCAGComplianceLevel.AAA;
      if (criticalViolations.length > 0) {
        complianceLevel = WCAGComplianceLevel.A;
      } else if (seriousViolations.length > 0) {
        complianceLevel = WCAGComplianceLevel.AA;
      }

      const score = totalChecks > 0 ? Math.round((passes / totalChecks) * 100) : 100;

      return {
        isCompliant: violations.length === 0,
        complianceLevel,
        score,
        violations,
        warnings: violations.filter(v => v.severity === AccessibilityViolationSeverity.MODERATE),
        passes,
        timestamp: new Date(),
        elementCount: target.querySelectorAll('*').length
      };

    } catch (error) {
      this.logger.error('Accessibility audit failed', error as Error);
      throw error;
    }
  }

  async getAccessibleProps(
    componentType: string,
    options: any = {}
  ): Promise<AccessibleComponentProps> {
    const baseProps: AccessibleComponentProps = {
      role: this.getDefaultRole(componentType),
      tabIndex: 0
    };

    switch (componentType) {
      case 'button':
        return {
          ...baseProps,
          role: 'button',
          'aria-pressed': options.pressed,
          'aria-expanded': options.expanded,
          'aria-haspopup': options.hasPopup
        };

      case 'input':
        return {
          ...baseProps,
          'aria-label': options.label,
          'aria-required': options.required,
          'aria-invalid': options.invalid,
          'aria-describedby': options.describedBy
        };

      case 'modal':
        return {
          ...baseProps,
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': options.titleId,
          'aria-describedby': options.descriptionId
        };

      case 'menu':
        return {
          ...baseProps,
          role: 'menu',
          'aria-orientation': options.orientation || 'vertical'
        };

      default:
        return baseProps;
    }
  }

  async validateARIAAttributes(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // Check for invalid ARIA attributes
    const ariaAttributes = Array.from(element.attributes).filter(attr =>
      attr.name.startsWith('aria-')
    );

    for (const attr of ariaAttributes) {
      if (!this.isValidARIAAttribute(attr.name)) {
        violations.push({
          id: `invalid-aria-${Date.now()}`,
          rule: 'valid-aria-attribute',
          severity: AccessibilityViolationSeverity.SERIOUS,
          element: element.tagName.toLowerCase(),
          description: `Invalid ARIA attribute: ${attr.name}`,
          impact: 'Screen readers may not understand this attribute',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
          suggestions: ['Remove invalid ARIA attribute', 'Use valid ARIA attribute'],
          wcagCriteria: ['4.1.2']
        });
      }
    }

    // Check for required ARIA attributes
    const role = element.getAttribute('role');
    if (role) {
      const requiredAttributes = this.getRequiredARIAAttributes(role);
      for (const required of requiredAttributes) {
        if (!element.hasAttribute(required)) {
          violations.push({
            id: `missing-aria-${Date.now()}`,
            rule: 'required-aria-attribute',
            severity: AccessibilityViolationSeverity.SERIOUS,
            element: element.tagName.toLowerCase(),
            description: `Missing required ARIA attribute: ${required}`,
            impact: 'Screen readers may not provide complete information',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
            suggestions: [`Add ${required} attribute`],
            wcagCriteria: ['4.1.2']
          });
        }
      }
    }

    return violations;
  }

  async setupSkipLinks(skipLinks: SkipLink[]): Promise<void> {
    // Remove existing skip links
    const existingSkipLinks = document.querySelectorAll('.skip-link');
    existingSkipLinks.forEach(link => link.remove());

    // Create skip links container
    const container = document.createElement('div');
    container.className = 'skip-links';
    container.style.position = 'absolute';
    container.style.top = '-40px';
    container.style.left = '6px';
    container.style.zIndex = '1000';

    for (const skipLink of skipLinks) {
      const link = document.createElement('a');
      link.href = `#${skipLink.targetId}`;
      link.textContent = skipLink.label;
      link.className = 'skip-link';
      link.style.position = 'absolute';
      link.style.padding = '8px';
      link.style.backgroundColor = '#000';
      link.style.color = '#fff';
      link.style.textDecoration = 'none';
      link.style.borderRadius = '4px';
      link.style.fontSize = '14px';
      link.style.fontWeight = 'bold';

      // Show on focus
      link.addEventListener('focus', () => {
        link.style.top = '6px';
      });

      link.addEventListener('blur', () => {
        link.style.top = '-40px';
      });

      // Handle keyboard shortcut
      if (skipLink.shortcut) {
        document.addEventListener('keydown', (event) => {
          if (event.altKey && event.key === skipLink.shortcut) {
            event.preventDefault();
            const target = document.getElementById(skipLink.targetId);
            if (target) {
              target.focus();
              target.scrollIntoView();
            }
          }
        });
      }

      container.appendChild(link);
    }

    document.body.insertBefore(container, document.body.firstChild);
  }

  async enableHighContrastMode(): Promise<void> {
    document.body.classList.add('high-contrast');
    this.preferences.highContrastMode = true;
    await this.saveUserPreferences();
    await this.announceToScreenReader('High contrast mode enabled');
  }

  async disableHighContrastMode(): Promise<void> {
    document.body.classList.remove('high-contrast');
    this.preferences.highContrastMode = false;
    await this.saveUserPreferences();
    await this.announceToScreenReader('High contrast mode disabled');
  }

  async isHighContrastModeEnabled(): Promise<boolean> {
    return this.preferences.highContrastMode;
  }

  async getAccessibilityPreferences(): Promise<AccessibilityPreferences> {
    return { ...this.preferences };
  }

  async updateAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.saveUserPreferences();
    await this.applyUserPreferences();
  }

  async generateAccessibilityReport(element?: HTMLElement): Promise<AccessibilityReport> {
    const auditResult = await this.runAccessibilityAudit(element);

    const criticalViolations = auditResult.violations.filter(v => v.severity === AccessibilityViolationSeverity.CRITICAL);
    const seriousViolations = auditResult.violations.filter(v => v.severity === AccessibilityViolationSeverity.SERIOUS);
    const moderateViolations = auditResult.violations.filter(v => v.severity === AccessibilityViolationSeverity.MODERATE);
    const minorViolations = auditResult.violations.filter(v => v.severity === AccessibilityViolationSeverity.MINOR);

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical accessibility violations immediately');
    }
    if (seriousViolations.length > 0) {
      recommendations.push('Fix serious accessibility issues to improve compliance');
    }
    if (moderateViolations.length > 0) {
      recommendations.push('Consider addressing moderate accessibility issues');
    }

    // Group violations by WCAG criteria
    const wcagCriteria: { [criterion: string]: { passed: boolean; violations: AccessibilityViolation[] } } = {};

    auditResult.violations.forEach(violation => {
      violation.wcagCriteria.forEach(criterion => {
        if (!wcagCriteria[criterion]) {
          wcagCriteria[criterion] = { passed: false, violations: [] };
        }
        wcagCriteria[criterion].violations.push(violation);
      });
    });

    return {
      summary: {
        complianceLevel: auditResult.complianceLevel,
        overallScore: auditResult.score,
        totalViolations: auditResult.violations.length,
        criticalViolations: criticalViolations.length,
        seriousViolations: seriousViolations.length,
        moderateViolations: moderateViolations.length,
        minorViolations: minorViolations.length
      },
      violations: auditResult.violations,
      recommendations,
      wcagCriteria,
      generatedAt: new Date(),
      elementCount: auditResult.elementCount
    };
  }

  // Private helper methods
  private async loadDefaultConfig(): Promise<AccessibilityConfig> {
    try {
      const config = await this.configService.get<AccessibilityConfig>('accessibility');
      return config || this.getDefaultConfig();
    } catch {
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): AccessibilityConfig {
    return {
      complianceLevel: WCAGComplianceLevel.AA,
      keyboardNavigation: {
        enableArrowKeys: true,
        enableTabNavigation: true,
        enableEscapeKey: true,
        enableEnterKey: true,
        enableSpaceKey: true,
        customKeyBindings: {},
        focusableSelectors: ['button', '[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'],
        skipLinks: [
          { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
          { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' }
        ]
      },
      screenReader: {
        liveRegionId: 'sr-live-region',
        announcementType: AnnouncementType.POLITE,
        clearPreviousAnnouncements: true,
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true
      },
      colorContrast: {
        level: WCAGComplianceLevel.AA,
        normalTextRatio: 4.5,
        largeTextRatio: 3.0,
        nonTextRatio: 3.0,
        focusIndicatorRatio: 3.0
      },
      focusManagement: {
        strategy: FocusStrategy.RESTORE
      },
      enableHighContrast: false,
      enableReducedMotion: false,
      enableLargeText: false,
      announcePageChanges: true,
      skipLinksEnabled: true
    };
  }

  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      highContrastMode: false,
      reducedMotion: false,
      largeText: false,
      screenReaderEnabled: false,
      keyboardNavigationOnly: false,
      announceChanges: true,
      focusIndicatorStyle: 'default',
      fontSize: 'medium',
      colorScheme: 'auto'
    };
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const saved = await this.configService.get<AccessibilityPreferences>('accessibility.preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...saved };
      }
    } catch {
      // Use defaults
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      await this.configService.set('accessibility.preferences', this.preferences);
    } catch (error) {
      this.logger.error('Failed to save accessibility preferences', error as Error);
    }
  }

  private async applyUserPreferences(): Promise<void> {
    if (this.preferences.highContrastMode) {
      document.body.classList.add('high-contrast');
    }

    if (this.preferences.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    if (this.preferences.largeText) {
      document.body.classList.add('large-text');
    }

    document.body.setAttribute('data-font-size', this.preferences.fontSize);
    document.body.setAttribute('data-color-scheme', this.preferences.colorScheme);
  }

  private async setupGlobalKeyboardListeners(): Promise<void> {
    document.addEventListener('keydown', async (event) => {
      await this.keyboardHandler.handleKeyDown(event);
    });
  }

  private getColorContrastRequirement(level: WCAGComplianceLevel): ColorContrastRequirement {
    switch (level) {
      case WCAGComplianceLevel.AA:
        return {
          level,
          normalTextRatio: 4.5,
          largeTextRatio: 3.0,
          nonTextRatio: 3.0,
          focusIndicatorRatio: 3.0
        };
      case WCAGComplianceLevel.AAA:
        return {
          level,
          normalTextRatio: 7.0,
          largeTextRatio: 4.5,
          nonTextRatio: 3.0,
          focusIndicatorRatio: 3.0
        };
      default:
        return {
          level,
          normalTextRatio: 3.0,
          largeTextRatio: 2.25,
          nonTextRatio: 2.0,
          focusIndicatorRatio: 2.0
        };
    }
  }

  private getDefaultRole(componentType: string): string {
    const roleMap: Record<string, string> = {
      'button': 'button',
      'input': 'textbox',
      'select': 'combobox',
      'textarea': 'textbox',
      'modal': 'dialog',
      'menu': 'menu',
      'menuitem': 'menuitem',
      'tab': 'tab',
      'tabpanel': 'tabpanel',
      'alert': 'alert',
      'status': 'status'
    };
    return roleMap[componentType] || 'generic';
  }

  private isValidARIAAttribute(attributeName: string): boolean {
    const validAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
      'aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
      'aria-disabled', 'aria-invalid', 'aria-required', 'aria-readonly',
      'aria-multiline', 'aria-autocomplete', 'aria-haspopup', 'aria-controls',
      'aria-owns', 'aria-activedescendant', 'aria-selected', 'aria-checked',
      'aria-pressed', 'aria-current', 'aria-level', 'aria-setsize',
      'aria-posinset', 'aria-rowcount', 'aria-colcount', 'aria-rowindex',
      'aria-colindex', 'aria-rowspan', 'aria-colspan'
    ];
    return validAttributes.includes(attributeName);
  }

  private getRequiredARIAAttributes(role: string): string[] {
    const requirements: Record<string, string[]> = {
      'button': [],
      'textbox': [],
      'combobox': ['aria-expanded'],
      'dialog': ['aria-labelledby'],
      'menu': [],
      'menuitem': [],
      'tab': ['aria-controls'],
      'tabpanel': ['aria-labelledby'],
      'alert': [],
      'status': []
    };
    return requirements[role] || [];
  }

  private async auditColorContrast(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    const textElements = element.querySelectorAll('*');

    for (const el of Array.from(textElements)) {
      const htmlEl = el as HTMLElement;
      const styles = window.getComputedStyle(htmlEl);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const result = await this.validateColorContrast(color, backgroundColor, WCAGComplianceLevel.AA);

        if (!result.isCompliant) {
          violations.push({
            id: `color-contrast-${Date.now()}`,
            rule: 'color-contrast',
            severity: AccessibilityViolationSeverity.SERIOUS,
            element: htmlEl.tagName.toLowerCase(),
            description: `Insufficient color contrast ratio: ${result.actualRatio}:1`,
            impact: 'Text may be difficult to read for users with visual impairments',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
            suggestions: result.suggestions || ['Increase color contrast'],
            wcagCriteria: ['1.4.3']
          });
        }
      }
    }

    return violations;
  }

  private async auditARIAAttributes(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    const elements = element.querySelectorAll('*');

    for (const el of Array.from(elements)) {
      const htmlEl = el as HTMLElement;
      const elementViolations = await this.validateARIAAttributes(htmlEl);
      violations.push(...elementViolations);
    }

    return violations;
  }

  private async auditKeyboardAccessibility(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [tabindex]');

    for (const el of Array.from(interactiveElements)) {
      const htmlEl = el as HTMLElement;

      // Check if element is keyboard accessible
      if (htmlEl.tabIndex < 0 && !('disabled' in htmlEl && (htmlEl as any).disabled)) {
        violations.push({
          id: `keyboard-access-${Date.now()}`,
          rule: 'keyboard-accessible',
          severity: AccessibilityViolationSeverity.CRITICAL,
          element: htmlEl.tagName.toLowerCase(),
          description: 'Interactive element is not keyboard accessible',
          impact: 'Users cannot access this element using keyboard navigation',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
          suggestions: ['Add tabindex="0" or make element focusable'],
          wcagCriteria: ['2.1.1']
        });
      }
    }

    return violations;
  }

  private async auditFocusManagement(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // Check for focus indicators
    const focusableElements = await this.keyboardHandler.getFocusableElements(element);

    for (const el of focusableElements) {
      const styles = window.getComputedStyle(el, ':focus');
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;

      if (outline === 'none' || outlineWidth === '0px') {
        violations.push({
          id: `focus-indicator-${Date.now()}`,
          rule: 'focus-indicator',
          severity: AccessibilityViolationSeverity.SERIOUS,
          element: el.tagName.toLowerCase(),
          description: 'Element lacks visible focus indicator',
          impact: 'Keyboard users cannot see which element has focus',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
          suggestions: ['Add visible focus indicator with CSS :focus styles'],
          wcagCriteria: ['2.4.7']
        });
      }
    }

    return violations;
  }

  private async auditSemanticStructure(element: HTMLElement): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // Check heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    for (const heading of Array.from(headings)) {
      const level = parseInt(heading.tagName.charAt(1));

      if (level > previousLevel + 1) {
        violations.push({
          id: `heading-structure-${Date.now()}`,
          rule: 'heading-structure',
          severity: AccessibilityViolationSeverity.MODERATE,
          element: heading.tagName.toLowerCase(),
          description: `Heading level skipped from h${previousLevel} to h${level}`,
          impact: 'Screen reader users may miss content organization',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html',
          suggestions: ['Use sequential heading levels'],
          wcagCriteria: ['1.3.1']
        });
      }

      previousLevel = level;
    }

    return violations;
  }
}
