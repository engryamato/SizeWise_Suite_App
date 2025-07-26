/**
 * AirPropertiesCalculator - Advanced air property calculations with interpolation
 * 
 * Provides utility functions for:
 * - Air property interpolation from enhanced data files
 * - Temperature, pressure, and humidity corrections
 * - Elevation effects calculation
 * - Non-standard condition adjustments
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Air condition parameters
 */
export interface AirConditions {
  temperature: number;      // °F
  pressure?: number;        // in Hg
  altitude?: number;        // feet above sea level
  humidity?: number;        // % RH
}

/**
 * Air properties result
 */
export interface AirProperties {
  density: number;          // lb/ft³
  viscosity: number;        // lb/(ft·s)
  specificHeat: number;     // Btu/(lb·°F)
  thermalConductivity: number; // Btu/(hr·ft·°F)
  correctionFactors: {
    temperature: number;
    pressure: number;
    humidity: number;
    combined: number;
  };
  warnings: string[];
  notes: string[];
}

/**
 * Velocity pressure calculation parameters
 */
export interface VelocityPressureParams {
  velocity: number;         // FPM
  airConditions?: AirConditions;
  useTable?: boolean;       // Use lookup table vs formula
}

/**
 * Velocity pressure result
 */
export interface VelocityPressureResult {
  velocityPressure: number; // in wg
  correctedDensity: number; // lb/ft³
  correctionFactors: {
    temperature: number;
    altitude: number;
    humidity: number;
    combined: number;
  };
  calculationMethod: string;
  warnings: string[];
}

/**
 * Enhanced air properties calculator
 */
export class AirPropertiesCalculator {
  private static airPropertiesData: any = null;
  private static velocityPressureData: any = null;
  private static ductRoughnessData: any = null;

  /**
   * Load air properties data
   */
  private static loadAirPropertiesData() {
    if (!this.airPropertiesData) {
      try {
        const dataPath = join(__dirname, '../../data/air_properties.json');
        const rawData = readFileSync(dataPath, 'utf8');
        this.airPropertiesData = JSON.parse(rawData);
      } catch (error) {
        console.warn('Could not load air properties data, using fallback');
        this.airPropertiesData = this.getFallbackAirProperties();
      }
    }
    return this.airPropertiesData;
  }

  /**
   * Load velocity pressure data
   */
  private static loadVelocityPressureData() {
    if (!this.velocityPressureData) {
      try {
        const dataPath = join(__dirname, '../../data/velocity_pressure.json');
        const rawData = readFileSync(dataPath, 'utf8');
        this.velocityPressureData = JSON.parse(rawData);
      } catch (error) {
        console.warn('Could not load velocity pressure data, using fallback');
        this.velocityPressureData = this.getFallbackVelocityPressure();
      }
    }
    return this.velocityPressureData;
  }

  /**
   * Load duct roughness data
   */
  private static loadDuctRoughnessData() {
    if (!this.ductRoughnessData) {
      try {
        const dataPath = join(__dirname, '../../data/duct_roughness.json');
        const rawData = readFileSync(dataPath, 'utf8');
        this.ductRoughnessData = JSON.parse(rawData);
      } catch (error) {
        console.warn('Could not load duct roughness data, using fallback');
        this.ductRoughnessData = this.getFallbackDuctRoughness();
      }
    }
    return this.ductRoughnessData;
  }

  /**
   * Calculate air properties for given conditions
   */
  public static calculateAirProperties(conditions: AirConditions): AirProperties {
    const data = this.loadAirPropertiesData();
    const warnings: string[] = [];
    const notes: string[] = [];

    // Validate input conditions
    this.validateAirConditions(conditions, warnings);

    // Get base properties at temperature
    const baseProps = this.interpolateTemperatureProperties(conditions.temperature, data);

    // Calculate correction factors
    const tempFactor = this.calculateTemperatureFactor(conditions.temperature);
    const pressureFactor = this.calculatePressureFactor(conditions.pressure, conditions.altitude);
    const humidityFactor = this.calculateHumidityFactor(conditions.humidity || 50);

    // Apply corrections
    const correctedDensity = baseProps.density * pressureFactor * humidityFactor;
    const correctedViscosity = baseProps.viscosity * tempFactor;

    // Add condition-specific warnings
    this.addConditionWarnings(conditions, warnings, notes);

    return {
      density: correctedDensity,
      viscosity: correctedViscosity,
      specificHeat: baseProps.specific_heat * (conditions.humidity ? 1 + (conditions.humidity / 100) * 0.026 : 1),
      thermalConductivity: baseProps.thermal_conductivity,
      correctionFactors: {
        temperature: tempFactor,
        pressure: pressureFactor,
        humidity: humidityFactor,
        combined: tempFactor * pressureFactor * humidityFactor
      },
      warnings,
      notes
    };
  }

  /**
   * Calculate velocity pressure with corrections
   */
  public static calculateVelocityPressure(params: VelocityPressureParams): VelocityPressureResult {
    const { velocity, airConditions, useTable = true } = params;
    const warnings: string[] = [];

    // Default conditions if not provided
    const conditions: AirConditions = {
      temperature: 70,
      altitude: 0,
      humidity: 50,
      ...airConditions
    };

    let velocityPressure: number;
    let calculationMethod: string;

    if (useTable && velocity >= 100 && velocity <= 5000) {
      // Use lookup table with interpolation
      const vpData = this.loadVelocityPressureData();
      velocityPressure = this.interpolateVelocityPressure(velocity, vpData);
      calculationMethod = 'Table lookup with interpolation';
    } else {
      // Use formula calculation
      velocityPressure = Math.pow(velocity / 4005, 2);
      calculationMethod = 'Formula: VP = (V/4005)²';
      
      if (velocity < 100 || velocity > 5000) {
        warnings.push(`Velocity ${velocity} FPM is outside recommended range (100-5000 FPM)`);
      }
    }

    // Calculate correction factors
    const tempCorrection = this.getTemperatureCorrection(conditions.temperature);
    const altitudeCorrection = this.getAltitudeCorrection(conditions.altitude || 0);
    const humidityCorrection = this.getHumidityCorrection(conditions.humidity || 50);

    // Apply corrections
    const combinedCorrection = tempCorrection * altitudeCorrection * humidityCorrection;
    const correctedVP = velocityPressure * combinedCorrection;

    // Calculate corrected air density
    const airProps = this.calculateAirProperties(conditions);
    
    // Add warnings for extreme conditions
    if (Math.abs(combinedCorrection - 1.0) > 0.1) {
      warnings.push(`Significant air density correction applied: ${(combinedCorrection * 100).toFixed(1)}%`);
    }

    return {
      velocityPressure: correctedVP,
      correctedDensity: airProps.density,
      correctionFactors: {
        temperature: tempCorrection,
        altitude: altitudeCorrection,
        humidity: humidityCorrection,
        combined: combinedCorrection
      },
      calculationMethod,
      warnings
    };
  }

  /**
   * Get enhanced material roughness with aging and condition factors
   */
  public static getEnhancedMaterialRoughness(
    material: string, 
    age?: number, 
    surfaceCondition?: string
  ): { roughness: number; warnings: string[]; notes: string[] } {
    const data = this.loadDuctRoughnessData();
    const warnings: string[] = [];
    const notes: string[] = [];

    const materialData = data.materials[material];
    if (!materialData) {
      warnings.push(`Material '${material}' not found, using galvanized steel default`);
      return this.getEnhancedMaterialRoughness('galvanized_steel', age, surfaceCondition);
    }

    let roughness = materialData.base_roughness;

    // Apply aging factor
    if (age !== undefined) {
      const agingFactor = this.getAgingFactor(materialData.aging_factors, age);
      roughness *= agingFactor;
      
      if (agingFactor > 1.5) {
        warnings.push(`Significant roughness increase due to age (${age} years): ${(agingFactor * 100).toFixed(0)}%`);
      }
      
      notes.push(`Aging factor applied: ${agingFactor.toFixed(2)}`);
    }

    // Apply surface condition factor
    if (surfaceCondition && materialData.surface_conditions[surfaceCondition]) {
      const conditionFactor = materialData.surface_conditions[surfaceCondition];
      roughness *= conditionFactor;
      
      if (conditionFactor !== 1.0) {
        notes.push(`Surface condition factor (${surfaceCondition}): ${conditionFactor.toFixed(2)}`);
      }
    }

    // Add material-specific notes
    if (materialData.notes) {
      notes.push(materialData.notes);
    }

    return { roughness, warnings, notes };
  }

  /**
   * Calculate elevation effects on air properties
   */
  public static calculateElevationEffects(altitude: number): {
    pressureRatio: number;
    densityRatio: number;
    temperatureEffect: number;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Standard atmosphere calculations
    const seaLevelPressure = 29.92; // in Hg
    const temperatureLapseRate = 0.00356; // °F per foot
    const standardTemp = 59; // °F at sea level

    // Calculate pressure ratio (simplified barometric formula)
    const pressureRatio = Math.pow(1 - (altitude * 6.87535e-6), 5.2561);
    
    // Calculate density ratio (proportional to pressure for constant temperature)
    const densityRatio = pressureRatio;
    
    // Calculate temperature effect
    const temperatureAtAltitude = standardTemp - (altitude * temperatureLapseRate);
    const temperatureEffect = (standardTemp + 459.67) / (temperatureAtAltitude + 459.67);

    // Add warnings for high altitudes
    if (altitude > 5000) {
      warnings.push(`High altitude (${altitude} ft) requires significant density corrections`);
    }
    if (altitude > 8000) {
      warnings.push(`Very high altitude - verify equipment ratings and performance`);
    }
    if (altitude > 10000) {
      warnings.push(`Altitude exceeds typical HVAC design limits`);
    }

    return {
      pressureRatio,
      densityRatio,
      temperatureEffect,
      warnings
    };
  }

  /**
   * Linear interpolation utility
   */
  private static linearInterpolate(x: number, x1: number, y1: number, x2: number, y2: number): number {
    if (x1 === x2) return y1;
    return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
  }

  /**
   * Interpolate temperature properties
   */
  private static interpolateTemperatureProperties(temperature: number, data: any): any {
    const tempProps = data.temperature_properties;
    const temps = Object.keys(tempProps).map(Number).sort((a, b) => a - b);

    // Find bounding temperatures
    let lowerTemp = temps[0];
    let upperTemp = temps[temps.length - 1];

    for (let i = 0; i < temps.length - 1; i++) {
      if (temperature >= temps[i] && temperature <= temps[i + 1]) {
        lowerTemp = temps[i];
        upperTemp = temps[i + 1];
        break;
      }
    }

    // If exact match, return directly
    if (tempProps[temperature.toString()]) {
      return tempProps[temperature.toString()];
    }

    // Interpolate between bounds
    const lowerProps = tempProps[lowerTemp.toString()];
    const upperProps = tempProps[upperTemp.toString()];

    return {
      density: this.linearInterpolate(temperature, lowerTemp, lowerProps.density, upperTemp, upperProps.density),
      viscosity: this.linearInterpolate(temperature, lowerTemp, lowerProps.viscosity, upperTemp, upperProps.viscosity),
      specific_heat: this.linearInterpolate(temperature, lowerTemp, lowerProps.specific_heat, upperTemp, upperProps.specific_heat),
      thermal_conductivity: this.linearInterpolate(temperature, lowerTemp, lowerProps.thermal_conductivity, upperTemp, upperProps.thermal_conductivity)
    };
  }

  /**
   * Interpolate velocity pressure from table
   */
  private static interpolateVelocityPressure(velocity: number, data: any): number {
    const vpTable = data.velocity_pressure_table;
    const velocities = Object.keys(vpTable).map(Number).sort((a, b) => a - b);

    // Find bounding velocities
    let lowerVel = velocities[0];
    let upperVel = velocities[velocities.length - 1];

    for (let i = 0; i < velocities.length - 1; i++) {
      if (velocity >= velocities[i] && velocity <= velocities[i + 1]) {
        lowerVel = velocities[i];
        upperVel = velocities[i + 1];
        break;
      }
    }

    // If exact match, return directly
    if (vpTable[velocity.toString()]) {
      return vpTable[velocity.toString()];
    }

    // Interpolate between bounds
    const lowerVP = vpTable[lowerVel.toString()];
    const upperVP = vpTable[upperVel.toString()];

    return this.linearInterpolate(velocity, lowerVel, lowerVP, upperVel, upperVP);
  }

  // Additional helper methods would continue here...
  // (Temperature factor, pressure factor, humidity factor calculations, etc.)

  /**
   * Fallback data methods
   */
  private static getFallbackAirProperties(): any {
    return {
      standard_conditions: { temperature: 70, density: 0.075, viscosity: 1.204e-5 },
      temperature_properties: {
        "70": { density: 0.075, viscosity: 1.204e-5, specific_heat: 0.240, thermal_conductivity: 0.0148 }
      }
    };
  }

  private static getFallbackVelocityPressure(): any {
    return {
      velocity_pressure_table: { "1000": 0.0623, "1500": 0.1406, "2000": 0.2501 }
    };
  }

  private static getFallbackDuctRoughness(): any {
    return {
      materials: {
        galvanized_steel: { base_roughness: 0.0003, aging_factors: { new: 1.0 }, surface_conditions: { good: 1.0 } }
      }
    };
  }

  // Placeholder methods for additional calculations
  private static validateAirConditions(conditions: AirConditions, warnings: string[]): void {
    if (conditions.temperature < 32 || conditions.temperature > 200) {
      warnings.push(`Temperature ${conditions.temperature}°F is outside normal HVAC range (32-200°F)`);
    }
  }

  private static calculateTemperatureFactor(temperature: number): number {
    return Math.pow((temperature + 459.67) / (70 + 459.67), 0.7);
  }

  private static calculatePressureFactor(pressure?: number, altitude?: number): number {
    if (altitude !== undefined) {
      return Math.pow(1 - (altitude * 6.87535e-6), 5.2561);
    }
    if (pressure !== undefined) {
      return pressure / 29.92;
    }
    return 1.0;
  }

  private static calculateHumidityFactor(humidity: number): number {
    return 1.0 - (humidity / 100) * 0.016;
  }

  private static getTemperatureCorrection(temperature: number): number {
    const data = this.loadVelocityPressureData();
    const tempCorrections = data.temperature_corrections;
    
    // Find closest temperature or interpolate
    const temps = Object.keys(tempCorrections).map(Number).sort((a, b) => a - b);
    
    for (const temp of temps) {
      if (tempCorrections[temp.toString()]) {
        if (Math.abs(temperature - temp) < 5) {
          return tempCorrections[temp.toString()].correction_factor;
        }
      }
    }
    
    return 1.0; // Default if not found
  }

  private static getAltitudeCorrection(altitude: number): number {
    const data = this.loadVelocityPressureData();
    const altCorrections = data.altitude_corrections;
    
    // Find closest altitude or interpolate
    const altitudes = Object.keys(altCorrections).map(Number).sort((a, b) => a - b);
    
    for (const alt of altitudes) {
      if (altCorrections[alt.toString()]) {
        if (Math.abs(altitude - alt) < 500) {
          return altCorrections[alt.toString()].correction_factor;
        }
      }
    }
    
    return 1.0; // Default if not found
  }

  private static getHumidityCorrection(humidity: number): number {
    const data = this.loadVelocityPressureData();
    const humidityCorrections = data.humidity_corrections;
    
    // Find closest humidity or interpolate
    const humidities = Object.keys(humidityCorrections).map(Number).sort((a, b) => a - b);
    
    for (const hum of humidities) {
      if (humidityCorrections[hum.toString()]) {
        if (Math.abs(humidity - hum) < 5) {
          return humidityCorrections[hum.toString()].correction_factor;
        }
      }
    }
    
    return 1.0; // Default if not found
  }

  private static getAgingFactor(agingFactors: any, age: number): number {
    const ages = Object.keys(agingFactors);
    
    // Find appropriate aging factor
    if (age <= 5) return agingFactors.new || 1.0;
    if (age <= 10) return agingFactors['5_years'] || 1.2;
    if (age <= 15) return agingFactors['10_years'] || 1.5;
    if (age <= 20) return agingFactors['15_years'] || 2.0;
    
    return agingFactors['20_years'] || 2.5;
  }

  private static addConditionWarnings(conditions: AirConditions, warnings: string[], notes: string[]): void {
    if (conditions.altitude && conditions.altitude > 5000) {
      warnings.push(`High altitude (${conditions.altitude} ft) affects air density significantly`);
    }
    
    if (conditions.humidity && conditions.humidity > 80) {
      warnings.push(`High humidity (${conditions.humidity}% RH) may cause condensation in ducts`);
    }
    
    if (conditions.temperature > 180) {
      warnings.push(`High temperature (${conditions.temperature}°F) requires special material considerations`);
    }
  }
}
