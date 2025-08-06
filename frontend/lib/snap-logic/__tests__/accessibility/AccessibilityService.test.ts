/**
 * Accessibility Service Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for WCAG 2.1 AA compliance,
 * keyboard navigation, screen reader support, and focus management.
 * 
 * @fileoverview Accessibility service tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  AccessibilityService,
  KeyboardNavigationHandler,
  FocusManager,
  ScreenReader
} from '../../services/AccessibilityService';
import {
  WCAGComplianceLevel,
  AccessibilityViolationSeverity,
  AnnouncementType,
  NavigationDirection,
  FocusStrategy
} from '../../core/interfaces/IAccessibilityService';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

// Mock configuration service
class MockConfigurationService {
  private config = new Map<string, any>();

  async get<T>(key: string): Promise<T> {
    return this.config.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.config.set(key, value);
  }
}

// Mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, string> = {}): HTMLElement => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

describe('AccessibilityService', () => {
  let accessibilityService: AccessibilityService;
  let mockLogger: MockLogger;
  let mockConfigService: MockConfigurationService;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockConfigService = new MockConfigurationService();
    accessibilityService = new AccessibilityService(
      mockLogger as any,
      mockConfigService as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await accessibilityService.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith('Accessibility service initialized successfully');
    });

    it('should initialize with custom configuration', async () => {
      const customConfig = {
        complianceLevel: WCAGComplianceLevel.AAA,
        keyboardNavigation: {
          enableArrowKeys: true,
          enableTabNavigation: true,
          enableEscapeKey: true,
          enableEnterKey: true,
          enableSpaceKey: true,
          customKeyBindings: {},
          focusableSelectors: ['button'],
          skipLinks: []
        },
        screenReader: {
          liveRegionId: 'custom-live-region',
          announcementType: AnnouncementType.ASSERTIVE,
          clearPreviousAnnouncements: false,
          announcePageChanges: false,
          announceFormErrors: true,
          announceLoadingStates: true
        },
        colorContrast: {
          level: WCAGComplianceLevel.AAA,
          normalTextRatio: 7.0,
          largeTextRatio: 4.5,
          nonTextRatio: 3.0,
          focusIndicatorRatio: 3.0
        },
        focusManagement: {
          strategy: FocusStrategy.TRAP
        },
        enableHighContrast: true,
        enableReducedMotion: true,
        enableLargeText: true,
        announcePageChanges: false,
        skipLinksEnabled: false
      };

      await accessibilityService.initialize(customConfig);
      expect(mockLogger.info).toHaveBeenCalledWith('Accessibility service initialized successfully');
    });
  });

  describe('Color Contrast Validation', () => {
    it('should validate compliant color contrast for AA level', async () => {
      const result = await accessibilityService.validateColorContrast(
        '#000000', // Black
        '#FFFFFF', // White
        WCAGComplianceLevel.AA
      );

      expect(result.isCompliant).toBe(true);
      expect(result.actualRatio).toBeGreaterThan(4.5);
      expect(result.level).toBe(WCAGComplianceLevel.AA);
    });

    it('should detect non-compliant color contrast', async () => {
      const result = await accessibilityService.validateColorContrast(
        '#CCCCCC', // Light gray
        '#FFFFFF', // White
        WCAGComplianceLevel.AA
      );

      expect(result.isCompliant).toBe(false);
      expect(result.actualRatio).toBeLessThan(4.5);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should validate large text with lower ratio requirement', async () => {
      const result = await accessibilityService.validateColorContrast(
        '#767676', // Medium gray
        '#FFFFFF', // White
        WCAGComplianceLevel.AA,
        true // Large text
      );

      expect(result.isCompliant).toBe(true);
      expect(result.requiredRatio).toBe(3.0);
    });

    it('should validate AAA level with higher requirements', async () => {
      const result = await accessibilityService.validateColorContrast(
        '#595959', // Dark gray
        '#FFFFFF', // White
        WCAGComplianceLevel.AAA
      );

      expect(result.requiredRatio).toBe(7.0);
    });
  });

  describe('Keyboard Navigation', () => {
    let keyboardHandler: KeyboardNavigationHandler;
    let container: HTMLElement;

    beforeEach(() => {
      const config = {
        enableArrowKeys: true,
        enableTabNavigation: true,
        enableEscapeKey: true,
        enableEnterKey: true,
        enableSpaceKey: true,
        customKeyBindings: {},
        focusableSelectors: ['button', 'input', '[tabindex]:not([tabindex="-1"])'],
        skipLinks: []
      };

      keyboardHandler = new KeyboardNavigationHandler(config, mockLogger as any);
      
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <input id="input1" type="text" />
        <button id="btn3" disabled>Disabled Button</button>
      `;
      document.body.appendChild(container);
    });

    it('should get focusable elements', async () => {
      const focusableElements = await keyboardHandler.getFocusableElements(container);
      
      expect(focusableElements).toHaveLength(3); // 2 buttons + 1 input (disabled button excluded)
      expect(focusableElements.map(el => el.id)).toEqual(['btn1', 'btn2', 'input1']);
    });

    it('should move focus to next element', async () => {
      const btn1 = document.getElementById('btn1')!;
      btn1.focus();

      const moved = await keyboardHandler.moveFocus(NavigationDirection.NEXT, container);
      
      expect(moved).toBe(true);
      expect(document.activeElement?.id).toBe('btn2');
    });

    it('should move focus to previous element', async () => {
      const btn2 = document.getElementById('btn2')!;
      btn2.focus();

      const moved = await keyboardHandler.moveFocus(NavigationDirection.PREVIOUS, container);
      
      expect(moved).toBe(true);
      expect(document.activeElement?.id).toBe('btn1');
    });

    it('should move focus to first element', async () => {
      const input1 = document.getElementById('input1')!;
      input1.focus();

      const moved = await keyboardHandler.moveFocus(NavigationDirection.FIRST, container);
      
      expect(moved).toBe(true);
      expect(document.activeElement?.id).toBe('btn1');
    });

    it('should move focus to last element', async () => {
      const btn1 = document.getElementById('btn1')!;
      btn1.focus();

      const moved = await keyboardHandler.moveFocus(NavigationDirection.LAST, container);
      
      expect(moved).toBe(true);
      expect(document.activeElement?.id).toBe('input1');
    });

    it('should handle arrow key navigation', async () => {
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const handled = await keyboardHandler.handleKeyDown(arrowDownEvent);
      
      expect(handled).toBe(true);
    });

    it('should handle enter key on buttons', async () => {
      const button = createMockElement('button');
      button.click = jest.fn();
      
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter',
        target: button
      } as any);
      
      const handled = await keyboardHandler.handleKeyDown(enterEvent);
      expect(handled).toBe(true);
    });

    it('should handle escape key', async () => {
      // Create a modal
      const modal = createMockElement('div', { 
        'role': 'dialog', 
        'aria-hidden': 'false' 
      });
      document.body.appendChild(modal);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      await keyboardHandler.handleKeyDown(escapeEvent);
      
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Focus Management', () => {
    let focusManager: FocusManager;
    let container: HTMLElement;

    beforeEach(() => {
      focusManager = new FocusManager(mockLogger as any);
      
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;
      document.body.appendChild(container);
    });

    it('should trap focus within container', async () => {
      const deactivate = await focusManager.trapFocus(container);
      
      expect(typeof deactivate).toBe('function');
      
      // Clean up
      deactivate();
    });

    it('should save and restore focus', async () => {
      const btn1 = document.getElementById('btn1')!;
      btn1.focus();

      await focusManager.saveFocus();
      
      const btn2 = document.getElementById('btn2')!;
      btn2.focus();

      await focusManager.restoreFocus();
      
      expect(document.activeElement).toBe(btn1);
    });

    it('should move focus to specific element', async () => {
      await focusManager.moveFocusTo('btn2');
      
      expect(document.activeElement?.id).toBe('btn2');
    });

    it('should clear focus', async () => {
      const btn1 = document.getElementById('btn1')!;
      btn1.focus();

      await focusManager.clearFocus();
      
      expect(document.activeElement).toBe(document.body);
    });

    it('should get current focus', async () => {
      const btn1 = document.getElementById('btn1')!;
      btn1.focus();

      const currentFocus = await focusManager.getCurrentFocus();
      
      expect(currentFocus).toBe(btn1);
    });
  });

  describe('Screen Reader Support', () => {
    let screenReader: ScreenReader;

    beforeEach(() => {
      const config = {
        liveRegionId: 'test-live-region',
        announcementType: AnnouncementType.POLITE,
        clearPreviousAnnouncements: true,
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true
      };

      screenReader = new ScreenReader(config, mockLogger as any);
    });

    it('should setup live region', async () => {
      await screenReader.setupLiveRegion({
        liveRegionId: 'test-live-region',
        announcementType: AnnouncementType.POLITE,
        clearPreviousAnnouncements: true,
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true
      });

      const liveRegion = document.getElementById('test-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce messages', async () => {
      await screenReader.setupLiveRegion({
        liveRegionId: 'test-live-region',
        announcementType: AnnouncementType.POLITE,
        clearPreviousAnnouncements: true,
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true
      });

      await screenReader.announce('Test message', AnnouncementType.ASSERTIVE);

      const liveRegion = document.getElementById('test-live-region');
      expect(liveRegion?.textContent).toBe('Test message');
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should clear announcements', async () => {
      await screenReader.setupLiveRegion({
        liveRegionId: 'test-live-region',
        announcementType: AnnouncementType.POLITE,
        clearPreviousAnnouncements: true,
        announcePageChanges: true,
        announceFormErrors: true,
        announceLoadingStates: true
      });

      await screenReader.announce('Test message');
      await screenReader.clearAnnouncements();

      const liveRegion = document.getElementById('test-live-region');
      expect(liveRegion?.textContent).toBe('');
    });
  });

  describe('Accessibility Auditing', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should run accessibility audit on element', async () => {
      const testElement = document.createElement('div');
      testElement.innerHTML = `
        <button>Accessible Button</button>
        <input type="text" aria-label="Test Input" />
        <h1>Main Heading</h1>
        <h3>Skipped Heading Level</h3>
      `;
      document.body.appendChild(testElement);

      const result = await accessibilityService.runAccessibilityAudit(testElement);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBeDefined();
      expect(result.complianceLevel).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.violations).toBeInstanceOf(Array);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should detect heading structure violations', async () => {
      const testElement = document.createElement('div');
      testElement.innerHTML = `
        <h1>Main Heading</h1>
        <h3>Skipped H2</h3>
      `;
      document.body.appendChild(testElement);

      const result = await accessibilityService.runAccessibilityAudit(testElement);

      const headingViolations = result.violations.filter(v => v.rule === 'heading-structure');
      expect(headingViolations.length).toBeGreaterThan(0);
    });

    it('should validate ARIA attributes', async () => {
      const testElement = createMockElement('div', {
        'aria-invalid-attribute': 'true',
        'role': 'button'
      });
      document.body.appendChild(testElement);

      const violations = await accessibilityService.validateARIAAttributes(testElement);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].rule).toBe('valid-aria-attribute');
    });
  });

  describe('Skip Links', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should setup skip links', async () => {
      const skipLinks = [
        { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
        { id: 'skip-nav', label: 'Skip to navigation', targetId: 'navigation' }
      ];

      await accessibilityService.setupSkipLinks(skipLinks);

      const skipLinksContainer = document.querySelector('.skip-links');
      expect(skipLinksContainer).toBeTruthy();

      const links = skipLinksContainer?.querySelectorAll('.skip-link');
      expect(links?.length).toBe(2);
    });
  });

  describe('High Contrast Mode', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should enable high contrast mode', async () => {
      await accessibilityService.enableHighContrastMode();

      expect(document.body.classList.contains('high-contrast')).toBe(true);
      
      const isEnabled = await accessibilityService.isHighContrastModeEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should disable high contrast mode', async () => {
      await accessibilityService.enableHighContrastMode();
      await accessibilityService.disableHighContrastMode();

      expect(document.body.classList.contains('high-contrast')).toBe(false);
      
      const isEnabled = await accessibilityService.isHighContrastModeEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  describe('Accessibility Preferences', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should get accessibility preferences', async () => {
      const preferences = await accessibilityService.getAccessibilityPreferences();

      expect(preferences).toBeDefined();
      expect(preferences.highContrastMode).toBeDefined();
      expect(preferences.reducedMotion).toBeDefined();
      expect(preferences.largeText).toBeDefined();
    });

    it('should update accessibility preferences', async () => {
      const newPreferences = {
        highContrastMode: true,
        largeText: true,
        fontSize: 'large' as const
      };

      await accessibilityService.updateAccessibilityPreferences(newPreferences);

      const preferences = await accessibilityService.getAccessibilityPreferences();
      expect(preferences.highContrastMode).toBe(true);
      expect(preferences.largeText).toBe(true);
      expect(preferences.fontSize).toBe('large');
    });
  });

  describe('Accessibility Report Generation', () => {
    beforeEach(async () => {
      await accessibilityService.initialize();
    });

    it('should generate accessibility report', async () => {
      const testElement = document.createElement('div');
      testElement.innerHTML = `
        <button>Test Button</button>
        <input type="text" aria-label="Test Input" />
      `;
      document.body.appendChild(testElement);

      const report = await accessibilityService.generateAccessibilityReport(testElement);

      expect(report.summary).toBeDefined();
      expect(report.summary.complianceLevel).toBeDefined();
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.violations).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.wcagCriteria).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });
});
