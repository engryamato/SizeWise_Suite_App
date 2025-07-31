/**
 * Shared mock data constants for air duct sizer pages
 * Provides consistent mock calculation results and validation warnings
 */

export interface CalculationResult {
  id: string;
  elementId: string;
  elementName: string;
  type: 'duct' | 'fitting' | 'equipment';
  status: 'pass' | 'warning' | 'fail';
  value: number;
  unit: string;
  target: number;
  tolerance: number;
}

export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'SMACNA' | 'ASHRAE' | 'Performance' | 'Safety';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  suggestion: string;
  standard: string;
  timestamp: Date;
  codeReference: string;
  resolved: boolean;
}

export interface ElementProperties {
  id: string;
  type: 'room' | 'duct' | 'equipment' | 'annotation' | 'group';
  name: string;
  position: { x: number; y: number; z?: number };
  dimensions: { width: number; height: number };
  ductType?: 'supply' | 'return' | 'exhaust';
  velocity?: number;
  pressureDrop?: number;
}

/**
 * Mock calculation results for demonstration purposes
 */
export const MOCK_CALCULATION_RESULTS: CalculationResult[] = [
  {
    id: '1',
    elementId: 'duct-1',
    elementName: 'Main Supply Duct',
    type: 'duct',
    status: 'pass',
    value: 1150,
    unit: 'FPM',
    target: 1200,
    tolerance: 50
  },
  {
    id: '2',
    elementId: 'duct-2',
    elementName: 'Branch Duct A',
    type: 'duct',
    status: 'warning',
    value: 1350,
    unit: 'FPM',
    target: 1200,
    tolerance: 50
  },
  {
    id: '3',
    elementId: 'duct-3',
    elementName: 'Return Duct',
    type: 'duct',
    status: 'pass',
    value: 800,
    unit: 'FPM',
    target: 800,
    tolerance: 50
  },
  {
    id: '4',
    elementId: 'fitting-1',
    elementName: 'Main Transition',
    type: 'fitting',
    status: 'pass',
    value: 0.08,
    unit: 'in. w.g.',
    target: 0.1,
    tolerance: 0.02
  }
];

/**
 * Mock validation warnings for demonstration purposes
 */
export const MOCK_VALIDATION_WARNINGS: ValidationWarning[] = [
  {
    id: 'w1',
    type: 'warning',
    category: 'SMACNA',
    severity: 'medium',
    title: 'Duct Velocity Exceeds Recommended Limits',
    message: 'Branch duct A velocity (1350 FPM) exceeds SMACNA recommended maximum of 1200 FPM for supply ducts.',
    suggestion: 'Consider increasing duct size to reduce velocity and noise levels.',
    standard: 'SMACNA',
    timestamp: new Date(),
    codeReference: 'SMACNA HVAC Duct Construction Standards - Table 6-1',
    resolved: false
  },
  {
    id: 'w2',
    type: 'error',
    category: 'ASHRAE',
    severity: 'high',
    title: 'Pressure Drop Calculation Required',
    message: 'System pressure drop analysis is incomplete. ASHRAE 90.1 requires pressure drop calculations for energy compliance.',
    suggestion: 'Complete pressure drop analysis for all duct segments and fittings.',
    standard: 'ASHRAE',
    timestamp: new Date(),
    codeReference: 'ASHRAE 90.1-2019 Section 6.5.2.1',
    resolved: false
  },
  {
    id: 'w3',
    type: 'info',
    category: 'Performance',
    severity: 'low',
    title: 'Energy Efficiency Opportunity',
    message: 'Current system design has potential for 15% energy savings with optimized duct sizing.',
    suggestion: 'Consider implementing variable air volume (VAV) system.',
    standard: 'ASHRAE',
    timestamp: new Date(),
    codeReference: 'ASHRAE 90.1-2019 Section 6.4',
    resolved: false
  }
];

/**
 * Creates a mock element properties object for demonstration
 */
export function createMockElementProperties(
  elementId: string,
  position: { x: number; y: number }
): ElementProperties {
  return {
    id: elementId,
    type: 'duct',
    name: `Duct ${elementId.slice(0, 8)}`,
    position: { x: position.x, y: position.y, z: 0 },
    dimensions: { width: 8, height: 8 },
    ductType: 'supply',
    velocity: 1200,
    pressureDrop: 0.1
  };
}

/**
 * Simulates calculation delay for realistic user experience
 */
export function simulateCalculationDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Gets fresh mock calculation results with current timestamp
 */
export function getFreshMockCalculationResults(): CalculationResult[] {
  return MOCK_CALCULATION_RESULTS.map(result => ({ ...result }));
}

/**
 * Gets fresh mock validation warnings with current timestamp
 */
export function getFreshMockValidationWarnings(): ValidationWarning[] {
  return MOCK_VALIDATION_WARNINGS.map(warning => ({
    ...warning,
    timestamp: new Date()
  }));
}
