/**
 * Units Display Hook
 * 
 * Custom hook for handling unit conversion and formatting for display components.
 * Integrates with the UI store to get current units preference and provides
 * conversion utilities for HVAC measurements.
 */

import { useUIStore } from '@/stores/ui-store';
import { useMemo } from 'react';

// Unit conversion factors (to base SI units)
const CONVERSIONS = {
  // Length conversions (to meters)
  length: {
    'ft': 0.3048,
    'in': 0.0254,
    'm': 1.0,
    'mm': 0.001,
    'cm': 0.01
  },
  
  // Area conversions (to square meters)
  area: {
    'sq_ft': 0.092903,
    'sq_in': 0.00064516,
    'sq_m': 1.0,
    'sq_mm': 1e-6,
    'sq_cm': 1e-4
  },
  
  // Flow rate conversions (to cubic meters per second)
  flow: {
    'cfm': 0.000471947,  // cubic feet per minute
    'lps': 0.001,        // liters per second
    'cms': 1.0,          // cubic meters per second
    'cmh': 0.000277778   // cubic meters per hour
  },
  
  // Pressure conversions (to Pascals)
  pressure: {
    'in_wg': 248.84,     // inches water gauge
    'pa': 1.0,           // Pascals
    'kpa': 1000.0,       // kiloPascals
    'mmhg': 133.322      // millimeters mercury
  },
  
  // Velocity conversions (to meters per second)
  velocity: {
    'fpm': 0.00508,      // feet per minute
    'mps': 1.0,          // meters per second
    'kmh': 0.277778      // kilometers per hour
  },
  
  // Power conversions (to Watts)
  power: {
    'hp': 745.7,         // horsepower
    'w': 1.0,            // Watts
    'kw': 1000.0         // kiloWatts
  }
};

// Default units for each system
const DEFAULT_UNITS = {
  imperial: {
    length: 'ft',
    length_small: 'in',
    area: 'sq_ft',
    flow: 'cfm',
    pressure: 'in_wg',
    velocity: 'fpm',
    power: 'hp'
  },
  metric: {
    length: 'm',
    length_small: 'mm',
    area: 'sq_m',
    flow: 'lps',
    pressure: 'pa',
    velocity: 'mps',
    power: 'kw'
  }
};

// Unit labels for display
const UNIT_LABELS = {
  // Length
  'ft': 'ft',
  'in': 'in',
  'm': 'm',
  'mm': 'mm',
  'cm': 'cm',
  
  // Area
  'sq_ft': 'sq ft',
  'sq_in': 'sq in',
  'sq_m': 'm²',
  'sq_mm': 'mm²',
  'sq_cm': 'cm²',
  
  // Flow
  'cfm': 'CFM',
  'lps': 'L/s',
  'cms': 'm³/s',
  'cmh': 'm³/h',
  
  // Pressure
  'in_wg': 'in. w.g.',
  'pa': 'Pa',
  'kpa': 'kPa',
  'mmhg': 'mmHg',
  
  // Velocity
  'fpm': 'FPM',
  'mps': 'm/s',
  'kmh': 'km/h',
  
  // Power
  'hp': 'HP',
  'w': 'W',
  'kw': 'kW'
};

export interface UnitsDisplayHook {
  // Current units system
  currentUnits: 'imperial' | 'metric';
  
  // Conversion functions
  convertValue: (value: number, category: keyof typeof CONVERSIONS, fromSystem?: 'imperial' | 'metric') => number;
  formatValue: (value: number, category: keyof typeof CONVERSIONS, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  getUnitLabel: (category: keyof typeof CONVERSIONS, small?: boolean) => string;
  
  // Specific formatters for common HVAC measurements
  formatLength: (value: number, small?: boolean, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  formatArea: (value: number, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  formatFlow: (value: number, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  formatPressure: (value: number, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  formatVelocity: (value: number, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
  formatPower: (value: number, precision?: number, fromSystem?: 'imperial' | 'metric') => string;
}

/**
 * Custom hook for units display and conversion
 */
export const useUnitsDisplay = (): UnitsDisplayHook => {
  const { units: currentUnits } = useUIStore();

  // Memoized conversion functions
  const convertValue = useMemo(() => {
    return (value: number, category: keyof typeof CONVERSIONS, fromSystem: 'imperial' | 'metric' = 'imperial'): number => {
      if (currentUnits === fromSystem) {
        return value; // No conversion needed
      }

      const categoryConversions = CONVERSIONS[category];
      if (!categoryConversions) {
        return value;
      }

      // Get source and target units
      const sourceUnit = DEFAULT_UNITS[fromSystem][category === 'length' ? 'length' : category];
      const targetUnit = DEFAULT_UNITS[currentUnits][category === 'length' ? 'length' : category];

      if (!sourceUnit || !targetUnit || !(sourceUnit in categoryConversions) || !(targetUnit in categoryConversions)) {
        return value;
      }

      // Convert through base unit
      const baseValue = value * (categoryConversions as any)[sourceUnit];
      const convertedValue = baseValue / (categoryConversions as any)[targetUnit];

      return convertedValue;
    };
  }, [currentUnits]);

  const formatValue = useMemo(() => {
    return (value: number, category: keyof typeof CONVERSIONS, precision: number = 1, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      const convertedValue = convertValue(value, category, fromSystem);
      const unit = getUnitLabel(category);
      return `${convertedValue.toFixed(precision)} ${unit}`;
    };
  }, [convertValue, currentUnits]);

  const getUnitLabel = useMemo(() => {
    return (category: keyof typeof CONVERSIONS, small: boolean = false): string => {
      const unitKey = small && category === 'length' ? 'length_small' : category;
      const unit = (DEFAULT_UNITS[currentUnits] as any)[unitKey] || (DEFAULT_UNITS[currentUnits] as any)[category];
      return (UNIT_LABELS as any)[unit] || unit;
    };
  }, [currentUnits]);

  // Specific formatters
  const formatLength = useMemo(() => {
    return (value: number, small: boolean = false, precision: number = 1, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      const convertedValue = convertValue(value, 'length', fromSystem);
      const unit = getUnitLabel('length', small);
      return `${convertedValue.toFixed(precision)} ${unit}`;
    };
  }, [convertValue, getUnitLabel]);

  const formatArea = useMemo(() => {
    return (value: number, precision: number = 1, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      return formatValue(value, 'area', precision, fromSystem);
    };
  }, [formatValue]);

  const formatFlow = useMemo(() => {
    return (value: number, precision: number = 0, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      return formatValue(value, 'flow', precision, fromSystem);
    };
  }, [formatValue]);

  const formatPressure = useMemo(() => {
    return (value: number, precision: number = 2, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      return formatValue(value, 'pressure', precision, fromSystem);
    };
  }, [formatValue]);

  const formatVelocity = useMemo(() => {
    return (value: number, precision: number = 0, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      return formatValue(value, 'velocity', precision, fromSystem);
    };
  }, [formatValue]);

  const formatPower = useMemo(() => {
    return (value: number, precision: number = 1, fromSystem: 'imperial' | 'metric' = 'imperial'): string => {
      return formatValue(value, 'power', precision, fromSystem);
    };
  }, [formatValue]);

  return {
    currentUnits,
    convertValue,
    formatValue,
    getUnitLabel,
    formatLength,
    formatArea,
    formatFlow,
    formatPressure,
    formatVelocity,
    formatPower
  };
};
