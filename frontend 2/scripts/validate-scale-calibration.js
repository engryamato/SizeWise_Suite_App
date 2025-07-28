#!/usr/bin/env node

/**
 * Manual validation script for scale calibration functionality
 * This script validates the mathematical calculations and unit conversions
 */

// Unit conversion functions (copied from ScaleCalibrationPanel)
const convertToFeet = (value, unit) => {
  switch (unit) {
    case 'in': return value / 12
    case 'ft': return value
    case 'm': return value * 3.28084
    case 'cm': return value * 0.0328084
    case 'mm': return value * 0.00328084
    default: return value
  }
}

// Test cases for scale calculation
const testCases = [
  {
    name: 'Basic feet to feet conversion',
    pixelDistance: 100,
    measuredValue: 1,
    measuredUnit: 'ft',
    actualValue: 10,
    actualUnit: 'ft',
    expectedScale: 0.1, // 10 ft / 100 px = 0.1 ft/px
  },
  {
    name: 'Inches to feet conversion',
    pixelDistance: 100,
    measuredValue: 12,
    measuredUnit: 'in',
    actualValue: 10,
    actualUnit: 'ft',
    expectedScale: 0.1, // 12 in = 1 ft, so 10 ft / 100 px = 0.1 ft/px
  },
  {
    name: 'Meters to feet conversion',
    pixelDistance: 200,
    measuredValue: 1,
    measuredUnit: 'm',
    actualValue: 6.56168,
    actualUnit: 'ft',
    expectedScale: 0.0328084, // 1 m = 3.28084 ft, so 6.56168 ft / 200 px = 0.0328084 ft/px
  },
  {
    name: 'Mixed units - cm to inches',
    pixelDistance: 50,
    measuredValue: 30.48,
    measuredUnit: 'cm',
    actualValue: 12,
    actualUnit: 'in',
    expectedScale: 0.02, // 30.48 cm = 1 ft, 12 in = 1 ft, so 1 ft / 50 px = 0.02 ft/px
  },
  {
    name: 'Large scale - building plan',
    pixelDistance: 500,
    measuredValue: 1,
    measuredUnit: 'ft',
    actualValue: 50,
    actualUnit: 'ft',
    expectedScale: 0.1, // 50 ft / 500 px = 0.1 ft/px
  }
]

console.log('🔧 Scale Calibration Validation Tests')
console.log('=====================================\n')

let passedTests = 0
let totalTests = testCases.length

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`)
  console.log(`  Input: ${testCase.measuredValue} ${testCase.measuredUnit} measured, ${testCase.actualValue} ${testCase.actualUnit} actual`)
  console.log(`  Pixel distance: ${testCase.pixelDistance} px`)
  
  // Calculate scale using the same logic as ScaleCalibrationPanel
  const measuredInFeet = convertToFeet(testCase.measuredValue, testCase.measuredUnit)
  const actualInFeet = convertToFeet(testCase.actualValue, testCase.actualUnit)
  const calculatedScale = actualInFeet / testCase.pixelDistance
  
  console.log(`  Measured in feet: ${measuredInFeet.toFixed(6)} ft`)
  console.log(`  Actual in feet: ${actualInFeet.toFixed(6)} ft`)
  console.log(`  Calculated scale: ${calculatedScale.toFixed(6)} ft/px`)
  console.log(`  Expected scale: ${testCase.expectedScale.toFixed(6)} ft/px`)
  
  // Check if the calculated scale matches expected (with small tolerance for floating point)
  const tolerance = 0.000001
  const isCorrect = Math.abs(calculatedScale - testCase.expectedScale) < tolerance
  
  if (isCorrect) {
    console.log(`  ✅ PASS\n`)
    passedTests++
  } else {
    console.log(`  ❌ FAIL - Difference: ${Math.abs(calculatedScale - testCase.expectedScale).toFixed(8)}\n`)
  }
})

console.log(`Results: ${passedTests}/${totalTests} tests passed`)

if (passedTests === totalTests) {
  console.log('🎉 All scale calibration tests passed!')
  process.exit(0)
} else {
  console.log('❌ Some tests failed. Please check the calculations.')
  process.exit(1)
}
