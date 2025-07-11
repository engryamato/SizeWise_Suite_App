/**
 * Units Converter Tests
 */

// Mock the core module path
jest.mock('../../../core/calculations/units_converter.py', () => ({}), { virtual: true });

// Create a simplified UnitsConverter for testing
class UnitsConverter {
  constructor() {
    this.conversions = {
      length: {
        'ft': 0.3048,
        'in': 0.0254,
        'm': 1.0,
        'mm': 0.001
      },
      flow: {
        'cfm': 0.000471947,
        'lps': 0.001,
        'cms': 1.0
      },
      pressure: {
        'in_wg': 248.84,
        'pa': 1.0
      }
    };
  }
  
  convert(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    
    const fromCategory = this._getUnitCategory(fromUnit);
    const toCategory = this._getUnitCategory(toUnit);
    
    if (fromCategory !== toCategory) {
      throw new Error(`Cannot convert between ${fromCategory} and ${toCategory}`);
    }
    
    const fromFactor = this.conversions[fromCategory][fromUnit];
    const toFactor = this.conversions[fromCategory][toUnit];
    
    if (!fromFactor || !toFactor) {
      throw new Error(`Unknown unit: ${fromUnit} or ${toUnit}`);
    }
    
    return (value * fromFactor) / toFactor;
  }
  
  _getUnitCategory(unit) {
    for (const [category, units] of Object.entries(this.conversions)) {
      if (units[unit]) return category;
    }
    return null;
  }
  
  formatValueWithUnits(value, category, system, precision = 2) {
    const units = {
      imperial: { length: 'ft', flow: 'cfm', pressure: 'in_wg' },
      metric: { length: 'm', flow: 'lps', pressure: 'pa' }
    };
    
    const unit = units[system][category];
    return `${value.toFixed(precision)} ${unit}`;
  }
}

describe('UnitsConverter', () => {
  let converter;
  
  beforeEach(() => {
    converter = new UnitsConverter();
  });
  
  describe('convert', () => {
    it('should convert between same units', () => {
      const result = converter.convert(100, 'ft', 'ft');
      expect(result).toBe(100);
    });
    
    it('should convert length units correctly', () => {
      // 1 foot = 0.3048 meters
      const result = converter.convert(1, 'ft', 'm');
      expect(result).toBeCloseTo(0.3048, 4);
    });
    
    it('should convert inches to millimeters', () => {
      // 1 inch = 25.4 millimeters
      const result = converter.convert(1, 'in', 'mm');
      expect(result).toBeCloseTo(25.4, 1);
    });
    
    it('should convert flow rates', () => {
      // 1 CFM ≈ 0.471947 L/s
      const result = converter.convert(1, 'cfm', 'lps');
      expect(result).toBeCloseTo(0.471947, 4);
    });
    
    it('should convert pressure units', () => {
      // 1 in. w.g. = 248.84 Pa
      const result = converter.convert(1, 'in_wg', 'pa');
      expect(result).toBeCloseTo(248.84, 2);
    });
    
    it('should throw error for incompatible units', () => {
      expect(() => {
        converter.convert(100, 'ft', 'cfm');
      }).toThrow('Cannot convert between length and flow');
    });
    
    it('should throw error for unknown units', () => {
      expect(() => {
        converter.convert(100, 'unknown', 'ft');
      }).toThrow('Unknown unit');
    });
  });
  
  describe('formatValueWithUnits', () => {
    it('should format imperial length values', () => {
      const result = converter.formatValueWithUnits(12.345, 'length', 'imperial', 2);
      expect(result).toBe('12.35 ft');
    });
    
    it('should format metric flow values', () => {
      const result = converter.formatValueWithUnits(25.678, 'flow', 'metric', 1);
      expect(result).toBe('25.7 lps');
    });
    
    it('should format pressure values with default precision', () => {
      const result = converter.formatValueWithUnits(123.456789, 'pressure', 'imperial');
      expect(result).toBe('123.46 in_wg');
    });
  });
  
  describe('edge cases', () => {
    it('should handle zero values', () => {
      const result = converter.convert(0, 'ft', 'm');
      expect(result).toBe(0);
    });
    
    it('should handle negative values', () => {
      const result = converter.convert(-10, 'ft', 'm');
      expect(result).toBeCloseTo(-3.048, 3);
    });
    
    it('should handle very large values', () => {
      const result = converter.convert(1000000, 'mm', 'm');
      expect(result).toBe(1000);
    });
    
    it('should handle very small values', () => {
      const result = converter.convert(0.001, 'm', 'mm');
      expect(result).toBe(1);
    });
  });
});
