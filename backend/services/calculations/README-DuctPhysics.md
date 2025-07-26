# Comprehensive Duct Physics Implementation - Phase 2 Enhanced

## Overview

This document describes the comprehensive duct physics implementation for the SizeWise Suite HVAC application. Phase 2 provides enhanced modular calculation services with environmental corrections, material aging effects, and advanced air property calculations using ASHRAE/SMACNA standards.

## Architecture

The implementation follows a modular, service-oriented architecture:

```
backend/
├── data/
│   ├── fitting_coefficients.json          # K-factor database
│   ├── air_properties.json                # Enhanced air properties database
│   ├── duct_roughness.json                # Enhanced material roughness database
│   └── velocity_pressure.json             # Pre-calculated velocity pressure tables
├── services/calculations/
│   ├── FittingLossCalculator.ts           # Fitting loss calculations
│   ├── SystemPressureCalculator.ts        # Enhanced system-level analysis
│   ├── AirPropertiesCalculator.ts         # Environmental corrections and air properties
│   ├── AirDuctCalculator.ts               # Enhanced existing calculator
│   ├── examples/
│   │   └── duct-physics-integration-example.ts
│   ├── __tests__/
│   │   ├── FittingLossCalculator.test.ts
│   │   └── SystemPressureCalculator.test.ts
│   └── test-integration.js               # Working integration tests
```

## Key Features

### 1. Fitting Loss Calculator (`FittingLossCalculator.ts`)

**Purpose**: Calculate pressure losses for HVAC fittings using K-factor methodology.

**Key Methods**:
- `calculateFittingLoss(config, velocity, airDensity?)`: Main calculation method
- `calculateVelocityPressure(params)`: Velocity pressure calculation
- `getAvailableFittings(ductShape)`: List available fitting types
- `getFittingMetadata()`: Get database metadata

**Example Usage**:
```typescript
import { FittingLossCalculator, FittingConfiguration } from './FittingLossCalculator';

// 90° smooth elbow with R/D = 1.5
const elbowConfig: FittingConfiguration = {
  type: '90deg_round_smooth',
  ductShape: 'round',
  diameter: 10,
  parameter: '1.5'
};

const result = FittingLossCalculator.calculateFittingLoss(elbowConfig, 1833);
// Result: { kFactor: 0.15, pressureLoss: 0.0314, velocityPressure: 0.2095, ... }
```

### 2. System Pressure Calculator (`SystemPressureCalculator.ts`)

**Purpose**: Complete system pressure drop analysis combining friction and fitting losses.

**Key Methods**:
- `calculateSystemPressure(inputs)`: Main system calculation
- `validateSystemInputs(inputs)`: Input validation
- `generateSystemReport(result)`: Detailed reporting

**Example Usage**:
```typescript
import { SystemPressureCalculator, DuctSegment } from './SystemPressureCalculator';

const segments: DuctSegment[] = [
  {
    id: 'straight-run-1',
    type: 'straight',
    ductShape: 'round',
    length: 10,
    diameter: 10,
    airflow: 1000,
    material: 'galvanized_steel'
  },
  {
    id: 'elbow-90deg',
    type: 'fitting',
    ductShape: 'round',
    diameter: 10,
    airflow: 1000,
    material: 'galvanized_steel',
    fittingConfig: {
      type: '90deg_round_smooth',
      ductShape: 'round',
      diameter: 10,
      parameter: '1.5'
    }
  }
];

const inputs = {
  segments,
  systemType: 'supply',
  designConditions: { temperature: 70, barometricPressure: 29.92, altitude: 0 }
};

const result = SystemPressureCalculator.calculateSystemPressure(inputs);
// Result: Complete system analysis with pressure losses, compliance, warnings
```

### 3. Air Properties Calculator (`AirPropertiesCalculator.ts`) - NEW

**Purpose**: Advanced air property calculations with environmental corrections and interpolation.

**Key Methods**:
- `calculateAirProperties(conditions)`: Get corrected air properties for given conditions
- `calculateVelocityPressure(params)`: Enhanced velocity pressure with environmental corrections
- `getEnhancedMaterialRoughness(material, age?, condition?)`: Material roughness with aging effects
- `calculateElevationEffects(altitude)`: Elevation effects on air properties

**Example Usage**:
```typescript
import { AirPropertiesCalculator, AirConditions } from './AirPropertiesCalculator';

// Calculate air properties for Denver conditions
const conditions: AirConditions = {
  temperature: 100,  // °F
  altitude: 5000,    // feet
  humidity: 30       // % RH
};

const airProps = AirPropertiesCalculator.calculateAirProperties(conditions);
console.log(`Corrected air density: ${airProps.density} lb/ft³`);
console.log(`Combined correction factor: ${airProps.correctionFactors.combined}`);

// Enhanced velocity pressure calculation
const vpResult = AirPropertiesCalculator.calculateVelocityPressure({
  velocity: 1500,
  airConditions: conditions,
  useTable: true
});
console.log(`Corrected velocity pressure: ${vpResult.velocityPressure} in wg`);
```

### 4. Enhanced Air Duct Calculator (`AirDuctCalculator.ts`)

**Enhanced Methods** (now public for integration):
- `calculatePressureLoss(velocity, length, diameter, material)`: Friction loss calculation
- `calculateReynoldsNumber(velocity, diameter)`: Reynolds number calculation
- `calculateFrictionFactor(reynolds, material, diameter)`: Friction factor calculation

## Enhanced Data Structure

### 1. Fitting Coefficients Database (`fitting_coefficients.json`)

The database contains K-factors for various HVAC fittings organized by:
- **Duct Shape**: Round, rectangular
- **Fitting Type**: Elbows, tees, transitions, dampers, diffusers
- **Configuration Parameters**: R/D ratios, area ratios, angles, etc.

### 2. Air Properties Database (`air_properties.json`) - NEW

Comprehensive air properties database covering:
- **Temperature Range**: 32°F to 200°F with interpolation support
- **Altitude Effects**: Sea level to 10,000 ft with pressure corrections
- **Humidity Effects**: 0% to 100% RH with density corrections
- **Properties**: Density, viscosity, specific heat, thermal conductivity

### 3. Enhanced Duct Roughness Database (`duct_roughness.json`) - NEW

Enhanced material database with:
- **10 Material Types**: Including galvanized steel, aluminum, stainless steel, PVC, fiberglass, flexible duct
- **Aging Factors**: Roughness degradation over 5, 10, 15, 20+ years
- **Surface Conditions**: Excellent, good, fair, poor installation quality
- **Material Properties**: Density, thermal conductivity, temperature ranges

### 4. Velocity Pressure Tables (`velocity_pressure.json`) - NEW

Pre-calculated lookup tables for:
- **Velocity Range**: 100-5000 FPM with 50 FPM increments
- **Environmental Corrections**: Temperature, altitude, humidity factors
- **Performance Optimization**: Fast lookup vs. formula calculation

**Structure Example**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "standard": "ASHRAE/SMACNA",
    "sources": ["ASHRAE Fundamentals", "SMACNA HVAC Duct Design"]
  },
  "round_fittings": {
    "elbows": {
      "90deg_round_smooth": {
        "description": "90° smooth radius elbow",
        "radius_to_diameter_ratios": {
          "1.5": { "K": 0.15, "notes": "Long radius - recommended" }
        }
      }
    }
  }
}
```

## Calculation Methodology

### 1. Velocity Pressure Calculation
```
VP = (V/4005)² × (ρ/ρ_std)
```
Where:
- V = velocity (FPM)
- ρ = air density (lb/ft³)
- ρ_std = 0.075 lb/ft³ (standard air density)

### 2. Fitting Loss Calculation
```
ΔP_fitting = K × VP
```
Where:
- K = fitting loss coefficient
- VP = velocity pressure (in wg)

### 3. Friction Loss Calculation (Darcy-Weisbach)
```
ΔP_friction = f × (L/D) × (ρV²)/(2gc × 5.2)
```
Where:
- f = friction factor (Colebrook-White equation)
- L = duct length (ft)
- D = duct diameter (ft)
- ρ = air density (lb/ft³)
- V = velocity (fps)
- gc = gravitational constant

## Validation and Testing

### Integration Test Results

**User Example**: 10″ round duct → 10′ run → 90° elbow → 10′ run

**Results**:
- Airflow: 1000 CFM
- Velocity: 1833 FPM
- Friction Loss: 0.0995 in wg (76.0% of total)
- Fitting Loss: 0.0314 in wg (24.0% of total)
- **Total System Pressure Loss: 0.1309 in wg**

**SMACNA Compliance**:
- Velocity: Compliant (1833 FPM within 400-2500 FPM range)
- Pressure: Compliant (0.1309 in wg well below 6.0 in wg limit)

### Test Coverage

1. **Fitting Coefficients Data**: ✓ Complete database with proper structure
2. **Velocity Pressure Calculations**: ✓ Accurate with air density adjustments
3. **Fitting Loss Calculations**: ✓ ASHRAE/SMACNA compliant
4. **System Calculations**: ✓ Working for user example scenario
5. **SMACNA Compliance**: ✓ Velocity and pressure limit checking

## API Reference

### FittingConfiguration Interface
```typescript
interface FittingConfiguration {
  type: string;                    // Fitting type (e.g., '90deg_round_smooth')
  ductShape: 'round' | 'rectangular';
  diameter?: number;               // Round duct diameter (inches)
  width?: number;                  // Rectangular duct width (inches)
  height?: number;                 // Rectangular duct height (inches)
  parameter?: string;              // Configuration parameter (R/D ratio, etc.)
  subtype?: string;                // Subtype for complex fittings (e.g., 'straight_through')
}
```

### FittingLossResult Interface
```typescript
interface FittingLossResult {
  kFactor: number;                 // K-factor used
  velocityPressure: number;        // Velocity pressure (in wg)
  pressureLoss: number;            // Total pressure loss (in wg)
  fittingType: string;             // Fitting type
  configuration: string;           // Configuration description
  warnings: string[];              // Engineering warnings
  recommendations: string[];       // Engineering recommendations
}
```

### SystemCalculationResult Interface
```typescript
interface SystemCalculationResult {
  totalPressureLoss: number;       // Total system pressure loss (in wg)
  totalFrictionLoss: number;       // Total friction losses (in wg)
  totalMinorLoss: number;          // Total fitting losses (in wg)
  totalLength: number;             // Total duct length (ft)
  averageVelocity: number;         // Average system velocity (FPM)
  maxVelocity: number;             // Maximum velocity in system (FPM)
  minVelocity: number;             // Minimum velocity in system (FPM)
  segmentResults: SegmentResult[]; // Individual segment results
  complianceStatus: ComplianceStatus; // SMACNA compliance
  systemWarnings: string[];        // System-level warnings
  systemRecommendations: string[]; // System-level recommendations
}
```

## Phase 1 Completion Status

✅ **PHASE 1 COMPLETE**

**Achievements**:
1. ✅ FittingLossCalculator implementation with comprehensive K-factor database
2. ✅ SystemPressureCalculator for complete system analysis
3. ✅ Integration with existing AirDuctCalculator
4. ✅ Comprehensive test suite with 100% pass rate
5. ✅ Working integration examples demonstrating user scenario
6. ✅ SMACNA compliance validation
7. ✅ API documentation and usage examples

**Ready for Phase 2**: Enhanced data layer implementation (air_properties.json, enhanced duct_roughness.json, velocity_pressure.json)

## Next Steps (Phase 2)

1. **Enhanced Air Properties Database**: Temperature, pressure, humidity effects
2. **Enhanced Duct Roughness Database**: Expanded material properties
3. **Velocity Pressure Tables**: Pre-calculated lookup tables for performance
4. **Advanced Calculation Options**: Elevation effects, non-standard conditions
5. **Performance Optimization**: Caching and lookup table strategies
