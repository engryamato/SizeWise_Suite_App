# Air Duct Sizer User Guide

The Air Duct Sizer is SizeWise Suite's flagship module for calculating optimal duct sizes in HVAC systems. It provides SMACNA-compliant calculations with comprehensive validation and standards checking.

## Overview

The Air Duct Sizer helps you:

- **Calculate optimal duct dimensions** for given airflow requirements
- **Validate designs** against SMACNA standards
- **Analyze pressure losses** and system performance
- **Compare rectangular vs. round duct options**
- **Ensure velocity compliance** with industry standards

## Getting Started

### Accessing the Air Duct Sizer

1. **Open SizeWise Suite** in your browser
2. **Navigate to the Air Duct Sizer** module from the main dashboard
3. **Select your preferred units** (Imperial or Metric)

### Basic Calculation

To perform a basic duct sizing calculation:

1. **Enter the airflow rate** (CFM for Imperial, L/s for Metric)
2. **Select duct type** (Rectangular or Round)
3. **Set friction rate** (in. w.g./100 ft for Imperial, Pa/m for Metric)
4. **Click "Calculate"** to get results

## Input Parameters

### Required Fields

#### Airflow Rate
- **Imperial**: CFM (Cubic Feet per Minute)
- **Metric**: L/s (Liters per Second)
- **Range**: 25 - 50,000 CFM (12 - 24,000 L/s)
- **Validation**: Must be positive number

#### Duct Type
- **Rectangular**: Traditional rectangular ductwork
- **Round**: Circular ductwork (typically more efficient)

#### Friction Rate
- **Imperial**: in. w.g./100 ft (inches water gauge per 100 feet)
- **Metric**: Pa/m (Pascals per meter)
- **Typical Range**: 0.05 - 0.5 in. w.g./100 ft (0.4 - 4.0 Pa/m)
- **Recommended**: 0.08 - 0.15 in. w.g./100 ft for most applications

### Optional Parameters

#### Material Type
- **Galvanized Steel** (default): Standard ductwork material
- **Aluminum**: Lightweight alternative
- **Stainless Steel**: Corrosion-resistant option
- **Flexible Duct**: For short runs and connections

#### System Pressure Class
- **Low Pressure**: Up to 2 in. w.g. (500 Pa)
- **Medium Pressure**: 2-6 in. w.g. (500-1500 Pa)
- **High Pressure**: 6-10 in. w.g. (1500-2500 Pa)

## Understanding Results

### Duct Dimensions

#### Rectangular Ducts
- **Width × Height**: Optimized dimensions in inches or millimeters
- **Aspect Ratio**: Typically between 1:1 and 4:1 for efficiency
- **Standard Sizes**: Rounded to nearest standard dimensions

#### Round Ducts
- **Diameter**: Optimal diameter in inches or millimeters
- **Standard Sizes**: Rounded to nearest standard pipe size

### Performance Metrics

#### Velocity
- **Value**: Air velocity in FPM (feet per minute) or m/s (meters per second)
- **SMACNA Limits**: 
  - Supply ducts: 1000-2500 FPM (5-13 m/s)
  - Return ducts: 800-1500 FPM (4-8 m/s)
- **Status**: Pass/Fail indication for velocity compliance

#### Pressure Loss
- **Value**: Friction loss per unit length
- **Units**: in. w.g./100 ft or Pa/m
- **Calculation**: Based on Darcy-Weisbach equation with duct-specific factors

#### Cross-Sectional Area
- **Value**: Internal duct area
- **Units**: sq. ft or sq. m
- **Usage**: For airflow density calculations

#### Equivalent Diameter
- **Rectangular Ducts**: Hydraulic diameter for pressure loss calculations
- **Round Ducts**: Same as actual diameter
- **Formula**: De = 1.3 × (a × b)^0.625 / (a + b)^0.25

## Standards Compliance

### SMACNA Standards

The Air Duct Sizer validates designs against SMACNA (Sheet Metal and Air Conditioning Contractors' National Association) standards:

#### Velocity Limits
- **Supply Air**: Maximum 2500 FPM (13 m/s) for noise control
- **Return Air**: Maximum 1500 FPM (8 m/s) for energy efficiency
- **Exhaust Air**: Maximum 2000 FPM (10 m/s) depending on application

#### Pressure Classifications
- **Low Pressure**: Residential and light commercial
- **Medium Pressure**: Commercial and industrial
- **High Pressure**: Industrial and specialized applications

#### Construction Standards
- **Sealing Requirements**: Based on pressure class and leakage rates
- **Support Spacing**: Maximum distances between hangers
- **Joint Types**: Appropriate connection methods for pressure class

### Validation Warnings

The system provides warnings for:

- **Very Low Airflow**: Below 25 CFM (12 L/s) - verify requirements
- **Very High Airflow**: Above 50,000 CFM (24,000 L/s) - consider multiple ducts
- **Low Friction Rate**: Below 0.05 in. w.g./100 ft - may result in oversized ducts
- **High Friction Rate**: Above 0.5 in. w.g./100 ft - may result in undersized ducts
- **Velocity Exceedance**: Above SMACNA recommended limits

## Best Practices

### Friction Rate Selection

#### Low Friction (0.05-0.08 in. w.g./100 ft)
- **Pros**: Lower energy costs, quieter operation
- **Cons**: Larger ducts, higher material costs
- **Use**: Long duct runs, energy-efficient designs

#### Medium Friction (0.08-0.15 in. w.g./100 ft)
- **Pros**: Balanced approach, standard practice
- **Cons**: Moderate energy and material costs
- **Use**: Most commercial applications

#### High Friction (0.15-0.5 in. w.g./100 ft)
- **Pros**: Smaller ducts, lower material costs
- **Cons**: Higher energy costs, potential noise issues
- **Use**: Short runs, space-constrained applications

### Duct Type Selection

#### Rectangular Ducts
- **Advantages**: Fits in tight spaces, easier to insulate
- **Disadvantages**: Higher pressure loss, more complex fabrication
- **Best For**: Space-constrained installations, architectural integration

#### Round Ducts
- **Advantages**: Lower pressure loss, easier fabrication, better airflow
- **Disadvantages**: Requires more space, harder to conceal
- **Best For**: Exposed installations, energy efficiency priority

## Troubleshooting

### Common Issues

#### "Velocity Too High" Warning
- **Cause**: Friction rate too high or airflow too high for duct size
- **Solution**: Reduce friction rate or consider larger duct/multiple ducts

#### "Unrealistic Dimensions" Error
- **Cause**: Input parameters result in impractical duct sizes
- **Solution**: Adjust friction rate or verify airflow requirements

#### "Standards Violation" Warning
- **Cause**: Design exceeds SMACNA recommended limits
- **Solution**: Review design parameters and adjust as needed

### Validation Errors

#### Missing Required Fields
- Ensure all required inputs are provided
- Check for valid numeric values

#### Out of Range Values
- Verify airflow is within supported range
- Check friction rate is reasonable for application

#### Invalid Combinations
- Some parameter combinations may not be physically realizable
- Adjust inputs to achieve practical results

## Advanced Features

### Material Properties

Different duct materials have varying roughness factors that affect pressure loss:

- **Galvanized Steel**: Roughness factor 0.0003 ft
- **Aluminum**: Roughness factor 0.0002 ft
- **Stainless Steel**: Roughness factor 0.0002 ft
- **Flexible Duct**: Roughness factor 0.003 ft (much higher)

### Pressure Loss Calculations

The system uses the Darcy-Weisbach equation with duct-specific modifications:

```
ΔP = f × (L/D) × (ρ × V²/2)
```

Where:
- ΔP = Pressure loss
- f = Friction factor (based on Reynolds number and roughness)
- L = Duct length
- D = Hydraulic diameter
- ρ = Air density
- V = Air velocity

### Standard Sizes

The calculator rounds results to standard duct sizes:

#### Round Ducts (inches)
4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36

#### Rectangular Ducts
Standard increments based on SMACNA guidelines, typically in 2-inch increments for smaller sizes and 4-inch increments for larger sizes.

## Integration with Projects

### Saving Calculations

All calculations are automatically saved to your current project (if one is active) or as standalone calculations. Saved data includes:

- Input parameters
- Calculated results
- Compliance status
- Timestamp and metadata

### Exporting Results

Results can be exported in various formats:

- **PDF Report**: Formatted calculation summary
- **CSV Data**: Raw data for spreadsheet analysis
- **JSON**: Machine-readable format for integration

### Project Management

Organize your calculations by:

- **Creating projects** for different buildings or systems
- **Grouping calculations** by system type or zone
- **Adding notes** and descriptions for future reference
- **Comparing alternatives** side-by-side

## Next Steps

- **[Project Management Guide](project-management.md)**: Learn to organize your work
- **[Units and Standards](units-standards.md)**: Understand unit conversions and standards
- **[API Reference](../api/air-duct-calculator.md)**: Technical integration details
- **[Examples](../examples/basic-calculations.md)**: Practical calculation examples
