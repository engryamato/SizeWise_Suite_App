/**
 * Units Manager
 * 
 * Handles unit conversion between Imperial and Metric systems.
 */

export class UnitsManager {
    constructor() {
        this.currentUnits = 'imperial'; // Default to imperial
        this.conversions = this.initializeConversions();
    }
    
    initializeConversions() {
        return {
            // Length conversions
            length: {
                'ft_to_m': 0.3048,
                'm_to_ft': 3.28084,
                'in_to_mm': 25.4,
                'mm_to_in': 0.0393701,
                'in_to_cm': 2.54,
                'cm_to_in': 0.393701
            },
            
            // Area conversions
            area: {
                'sqft_to_sqm': 0.092903,
                'sqm_to_sqft': 10.7639,
                'sqin_to_sqcm': 6.4516,
                'sqcm_to_sqin': 0.155
            },
            
            // Volume flow conversions
            flow: {
                'cfm_to_cms': 0.000471947,
                'cms_to_cfm': 2118.88,
                'cfm_to_lps': 0.471947,
                'lps_to_cfm': 2.11888
            },
            
            // Pressure conversions
            pressure: {
                'inwg_to_pa': 248.84,
                'pa_to_inwg': 0.00401463,
                'psi_to_kpa': 6.89476,
                'kpa_to_psi': 0.145038
            },
            
            // Temperature conversions (handled separately due to offset)
            temperature: {
                'f_to_c': (f) => (f - 32) * 5/9,
                'c_to_f': (c) => (c * 9/5) + 32,
                'r_to_k': (r) => r * 5/9,
                'k_to_r': (k) => k * 9/5
            },
            
            // Velocity conversions
            velocity: {
                'fpm_to_mps': 0.00508,
                'mps_to_fpm': 196.85
            }
        };
    }
    
    getCurrentUnits() {
        return this.currentUnits;
    }
    
    setUnits(units) {
        if (units === 'imperial' || units === 'metric') {
            this.currentUnits = units;
            console.log(`Units set to: ${units}`);
        } else {
            throw new Error('Invalid units. Must be "imperial" or "metric"');
        }
    }
    
    toggle() {
        this.currentUnits = this.currentUnits === 'imperial' ? 'metric' : 'imperial';
        console.log(`Units toggled to: ${this.currentUnits}`);
        return this.currentUnits;
    }
    
    convert(value, fromUnit, toUnit) {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error('Value must be a valid number');
        }
        
        // Handle temperature conversions separately
        if (fromUnit.includes('temp_') || toUnit.includes('temp_')) {
            return this.convertTemperature(value, fromUnit, toUnit);
        }
        
        // Find the conversion factor
        const conversionKey = `${fromUnit}_to_${toUnit}`;
        
        // Search through all conversion categories
        for (const category of Object.values(this.conversions)) {
            if (category[conversionKey]) {
                return value * category[conversionKey];
            }
        }
        
        // Try reverse conversion
        const reverseKey = `${toUnit}_to_${fromUnit}`;
        for (const category of Object.values(this.conversions)) {
            if (category[reverseKey]) {
                return value / category[reverseKey];
            }
        }
        
        throw new Error(`Conversion not found: ${fromUnit} to ${toUnit}`);
    }
    
    convertTemperature(value, fromUnit, toUnit) {
        const tempConversions = this.conversions.temperature;
        
        // Remove 'temp_' prefix if present
        const from = fromUnit.replace('temp_', '');
        const to = toUnit.replace('temp_', '');
        
        if (from === to) {
            return value;
        }
        
        // Direct conversions
        const conversionKey = `${from}_to_${to}`;
        if (tempConversions[conversionKey]) {
            return tempConversions[conversionKey](value);
        }
        
        throw new Error(`Temperature conversion not found: ${from} to ${to}`);
    }
    
    getUnitLabel(parameter, units = null) {
        const targetUnits = units || this.currentUnits;
        
        const labels = {
            imperial: {
                length: 'ft',
                length_small: 'in',
                area: 'sq ft',
                area_small: 'sq in',
                flow: 'CFM',
                pressure: 'in. w.g.',
                pressure_high: 'psi',
                temperature: '°F',
                velocity: 'FPM',
                volume: 'cu ft'
            },
            metric: {
                length: 'm',
                length_small: 'mm',
                area: 'sq m',
                area_small: 'sq cm',
                flow: 'L/s',
                pressure: 'Pa',
                pressure_high: 'kPa',
                temperature: '°C',
                velocity: 'm/s',
                volume: 'cu m'
            }
        };
        
        return labels[targetUnits][parameter] || parameter;
    }
    
    formatValue(value, parameter, precision = 2, units = null) {
        const targetUnits = units || this.currentUnits;
        const label = this.getUnitLabel(parameter, targetUnits);
        
        if (typeof value !== 'number' || isNaN(value)) {
            return `-- ${label}`;
        }
        
        return `${value.toFixed(precision)} ${label}`;
    }
    
    convertForDisplay(value, parameter, fromUnits = null, toUnits = null) {
        const sourceUnits = fromUnits || (this.currentUnits === 'imperial' ? 'metric' : 'imperial');
        const targetUnits = toUnits || this.currentUnits;
        
        if (sourceUnits === targetUnits) {
            return value;
        }
        
        // Map parameters to conversion units
        const unitMappings = {
            length: { imperial: 'ft', metric: 'm' },
            length_small: { imperial: 'in', metric: 'mm' },
            area: { imperial: 'sqft', metric: 'sqm' },
            flow: { imperial: 'cfm', metric: 'lps' },
            pressure: { imperial: 'inwg', metric: 'pa' },
            velocity: { imperial: 'fpm', metric: 'mps' },
            temperature: { imperial: 'temp_f', metric: 'temp_c' }
        };
        
        const mapping = unitMappings[parameter];
        if (!mapping) {
            console.warn(`No unit mapping found for parameter: ${parameter}`);
            return value;
        }
        
        const fromUnit = mapping[sourceUnits];
        const toUnit = mapping[targetUnits];
        
        try {
            return this.convert(value, fromUnit, toUnit);
        } catch (error) {
            console.error(`Conversion failed for ${parameter}:`, error);
            return value;
        }
    }
    
    getConversionFactor(fromUnit, toUnit) {
        try {
            return this.convert(1, fromUnit, toUnit);
        } catch (error) {
            console.error(`Failed to get conversion factor from ${fromUnit} to ${toUnit}:`, error);
            return 1;
        }
    }
    
    // Utility methods for common HVAC conversions
    convertAirflow(cfm, toMetric = false) {
        if (toMetric) {
            return this.convert(cfm, 'cfm', 'lps');
        } else {
            return this.convert(cfm, 'lps', 'cfm');
        }
    }
    
    convertPressure(pressure, fromUnit, toUnit) {
        return this.convert(pressure, fromUnit, toUnit);
    }
    
    convertDimensions(dimensions, toMetric = false) {
        if (Array.isArray(dimensions)) {
            return dimensions.map(dim => {
                if (toMetric) {
                    return this.convert(dim, 'in', 'mm');
                } else {
                    return this.convert(dim, 'mm', 'in');
                }
            });
        } else {
            if (toMetric) {
                return this.convert(dimensions, 'in', 'mm');
            } else {
                return this.convert(dimensions, 'mm', 'in');
            }
        }
    }
}
