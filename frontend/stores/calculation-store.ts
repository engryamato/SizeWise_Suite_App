import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useDebouncedCallback } from 'use-debounce'
import { HVACTracing } from '@/lib/monitoring/HVACTracing'
import { CalculationInput, CalculationResult, Warning, Material, Standard } from '@/types/air-duct-sizer'

interface CalculationState {
  // Calculation results cache
  results: Record<string, CalculationResult>
  
  // Reference data
  materials: Record<string, Material>
  standards: Standard[]
  
  // Loading states
  isCalculating: boolean
  isLoadingMaterials: boolean
  isLoadingStandards: boolean
  
  // Actions
  calculate: (input: CalculationInput, objectId?: string) => Promise<CalculationResult>
  getResult: (objectId: string) => CalculationResult | undefined
  clearResults: () => void
  
  // Reference data actions
  loadMaterials: () => Promise<void>
  loadStandards: () => Promise<void>
  getMaterial: (materialId: string) => Material | undefined
  getStandard: (code: string) => Standard | undefined
  
  // Validation
  validateProject: (projectData: any) => Promise<Warning[]>
  
  // Utility functions
  calculateVelocity: (airflow: number, area: number) => number
  calculateArea: (width: number, height: number) => number
  calculateEquivalentDiameter: (width: number, height: number) => number
  calculateHydraulicDiameter: (width: number, height: number) => number
  calculateAspectRatio: (width: number, height: number) => number
  validateAspectRatio: (width: number, height: number) => {
    aspectRatio: number
    compliant: boolean
    warnings: string[]
    recommendations: string[]
  }
  validateVelocity: (velocity: number, roomType: string, ductType: string) => {
    velocity: number
    roomType: string
    ductType: string
    compliant: boolean
    warnings: string[]
    errors: string[]
    standardReference: string
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

// Client-side calculation functions (for immediate feedback)
const calculateVelocityClient = (airflow: number, area: number): number => {
  if (area <= 0) return 0
  return airflow / area
}

const calculateAreaClient = (width: number, height: number): number => {
  return (width * height) / 144 // Convert square inches to square feet
}

const calculateEquivalentDiameterClient = (width: number, height: number): number => {
  // SMACNA equivalent diameter formula
  return 1.3 * Math.pow((width * height), 0.625) / Math.pow((width + height), 0.25)
}

const calculateHydraulicDiameterClient = (width: number, height: number): number => {
  // Hydraulic diameter formula: Dh = 4*A/P
  if (width <= 0 || height <= 0) return 0
  const area = width * height
  const perimeter = 2 * (width + height)
  return 4 * area / perimeter
}

const calculateAspectRatioClient = (width: number, height: number): number => {
  // Aspect ratio: larger dimension / smaller dimension
  if (width <= 0 || height <= 0) return 0
  return Math.max(width, height) / Math.min(width, height)
}

const validateAspectRatioClient = (width: number, height: number) => {
  const aspectRatio = calculateAspectRatioClient(width, height)
  const warnings: string[] = []
  const recommendations: string[] = []

  if (aspectRatio > 4.0) {
    warnings.push(`Aspect ratio ${aspectRatio.toFixed(1)}:1 exceeds SMACNA maximum of 4:1`)
    recommendations.push('Consider using round duct or reducing aspect ratio for better performance')
  } else if (aspectRatio > 3.0) {
    warnings.push(`Aspect ratio ${aspectRatio.toFixed(1)}:1 is high - consider optimization`)
    recommendations.push('Aspect ratios between 2:1 and 3:1 are optimal for fabrication and performance')
  } else if (aspectRatio < 1.5) {
    warnings.push(`Aspect ratio ${aspectRatio.toFixed(1)}:1 is very low - may be inefficient`)
    recommendations.push('Consider increasing aspect ratio for better material utilization')
  }

  return {
    aspectRatio,
    compliant: aspectRatio <= 4.0,
    warnings,
    recommendations
  }
}

const validateVelocityClient = (velocity: number, roomType: string = 'office', ductType: string = 'supply') => {
  const warnings: string[] = []
  const errors: string[] = []

  // ASHRAE velocity limits by room type and duct type (simplified client-side version)
  const velocityLimits: Record<string, Record<string, { min: number; max: number; recommendedMax: number; optimal: number }>> = {
    supply: {
      office: { min: 400, max: 1500, recommendedMax: 1200, optimal: 1000 },
      conference: { min: 300, max: 1200, recommendedMax: 1000, optimal: 800 },
      classroom: { min: 300, max: 1200, recommendedMax: 1000, optimal: 800 },
      retail: { min: 400, max: 1800, recommendedMax: 1500, optimal: 1200 },
      warehouse: { min: 600, max: 2500, recommendedMax: 2000, optimal: 1500 },
      kitchen: { min: 800, max: 2000, recommendedMax: 1800, optimal: 1500 },
      mechanical: { min: 1000, max: 3000, recommendedMax: 2500, optimal: 2000 },
      hospital: { min: 300, max: 1000, recommendedMax: 800, optimal: 600 },
      laboratory: { min: 1000, max: 2500, recommendedMax: 2000, optimal: 1500 }
    },
    return: {
      office: { min: 300, max: 1200, recommendedMax: 1000, optimal: 800 },
      conference: { min: 300, max: 1000, recommendedMax: 800, optimal: 600 },
      classroom: { min: 300, max: 1000, recommendedMax: 800, optimal: 600 },
      retail: { min: 400, max: 1500, recommendedMax: 1200, optimal: 1000 },
      warehouse: { min: 500, max: 2000, recommendedMax: 1500, optimal: 1200 },
      kitchen: { min: 600, max: 1500, recommendedMax: 1200, optimal: 1000 },
      mechanical: { min: 800, max: 2500, recommendedMax: 2000, optimal: 1500 }
    },
    exhaust: {
      office: { min: 500, max: 2000, recommendedMax: 1500, optimal: 1200 },
      kitchen: { min: 1200, max: 3000, recommendedMax: 2500, optimal: 2000 },
      laboratory: { min: 1500, max: 3500, recommendedMax: 3000, optimal: 2500 },
      bathroom: { min: 800, max: 2000, recommendedMax: 1500, optimal: 1200 }
    }
  }

  // Get limits for the specific duct type and room type
  const ductLimits = velocityLimits[ductType] || velocityLimits.supply
  const limits = ductLimits[roomType] || ductLimits.office

  // Validate velocity
  if (velocity < limits.min) {
    errors.push(
      `Velocity ${velocity.toFixed(0)} FPM is below minimum ${limits.min} FPM for ${roomType} ${ductType} duct (ASHRAE 2021)`
    )
  } else if (velocity > limits.max) {
    errors.push(
      `Velocity ${velocity.toFixed(0)} FPM exceeds maximum ${limits.max} FPM for ${roomType} ${ductType} duct (ASHRAE 2021)`
    )
  } else if (velocity > limits.recommendedMax) {
    warnings.push(
      `Velocity ${velocity.toFixed(0)} FPM exceeds recommended maximum ${limits.recommendedMax} FPM for ${roomType} ${ductType} duct`
    )
  } else if (velocity < limits.optimal * 0.8) {
    warnings.push(
      `Velocity ${velocity.toFixed(0)} FPM is below optimal range (${limits.optimal} FPM ±20%) for ${roomType} ${ductType} duct`
    )
  } else if (velocity > limits.optimal * 1.2) {
    warnings.push(
      `Velocity ${velocity.toFixed(0)} FPM is above optimal range (${limits.optimal} FPM ±20%) for ${roomType} ${ductType} duct`
    )
  }

  return {
    velocity,
    roomType,
    ductType,
    compliant: errors.length === 0,
    warnings,
    errors,
    standardReference: 'ASHRAE 2021 Fundamentals Chapter 21'
  }
}

export const useCalculationStore = create<CalculationState>()(
  devtools(
    (set, get) => ({
      results: {},
      materials: {},
      standards: [],
      isCalculating: false,
      isLoadingMaterials: false,
      isLoadingStandards: false,

      calculate: async (input, objectId) => {
        return HVACTracing.traceDuctCalculation(
          input.duct_type || 'rectangular',
          async () => {
            set({ isCalculating: true }, false, 'calculate:start')

            try {
              // Try client-side calculation first for immediate feedback
              const clientResult = performClientSideCalculation(input)

              // Cache the result if objectId is provided
              if (objectId) {
                const { results } = get()
                set({
                  results: { ...results, [objectId]: clientResult }
                }, false, 'calculate:cache')
              }

              // Try backend calculation first, fallback to client-side if unavailable
              if (shouldUseBackendCalculation(input)) {
                try {
                  const backendResult = await HVACTracing.traceAPICall(
                    '/api/v1/calculations/duct-sizing',
                    'POST',
                    () => performBackendCalculation(input),
                    input
                  )

                  if (objectId) {
                    const { results } = get()
                    set({
                      results: { ...results, [objectId]: backendResult }
                    }, false, 'calculate:backend')
                  }

                  set({ isCalculating: false }, false, 'calculate:complete')
                  return backendResult
                } catch (error) {
                  console.warn('Backend calculation failed, using client-side fallback:', error)
                  // Continue with client-side calculation below
                }
              }

              set({ isCalculating: false }, false, 'calculate:complete')
              return clientResult
            } catch (error) {
              set({ isCalculating: false }, false, 'calculate:error')
              throw error
            }
          },
          {
            calculationType: input.duct_type || 'rectangular',
            inputComplexity: determineInputComplexity(input),
            standardsUsed: ['SMACNA', 'ASHRAE'],
            userTier: 'free', // TODO: Get from auth store
            fallbackUsed: !shouldUseBackendCalculation(input)
          }
        );
      },

      getResult: (objectId) => {
        return get().results[objectId]
      },

      clearResults: () => {
        set({ results: {} }, false, 'clearResults')
      },

      loadMaterials: async () => {
        set({ isLoadingMaterials: true }, false, 'loadMaterials:start')
        
        try {
          const response = await fetch(`${API_BASE_URL}/reference/materials`)
          
          if (!response.ok) {
            throw new Error('Failed to load materials')
          }

          const data = await response.json()
          
          if (data.success) {
            set({
              materials: data.materials,
              isLoadingMaterials: false,
            }, false, 'loadMaterials:success')
          } else {
            throw new Error('Failed to load materials')
          }
        } catch (error) {
          console.error('Load materials error:', error)
          set({ isLoadingMaterials: false }, false, 'loadMaterials:error')
          
          // Fallback to default materials
          const defaultMaterials: Record<string, Material> = {
            galvanized_steel: {
              id: 'galvanized_steel',
              name: 'Galvanized Steel',
              roughness: 0.0003,
              description: 'Standard galvanized steel ductwork',
            },
            aluminum: {
              id: 'aluminum',
              name: 'Aluminum',
              roughness: 0.0002,
              description: 'Lightweight aluminum ductwork',
            },
          }
          
          set({ materials: defaultMaterials }, false, 'loadMaterials:fallback')
        }
      },

      loadStandards: async () => {
        set({ isLoadingStandards: true }, false, 'loadStandards:start')
        
        try {
          const response = await fetch(`${API_BASE_URL}/reference/standards`)
          
          if (!response.ok) {
            throw new Error('Failed to load standards')
          }

          const data = await response.json()
          
          if (data.success) {
            set({
              standards: data.standards,
              isLoadingStandards: false,
            }, false, 'loadStandards:success')
          } else {
            throw new Error('Failed to load standards')
          }
        } catch (error) {
          console.error('Load standards error:', error)
          set({ isLoadingStandards: false }, false, 'loadStandards:error')
          
          // Fallback to default standards
          const defaultStandards: Standard[] = [
            {
              code: 'SMACNA',
              name: 'SMACNA HVAC Duct Construction Standards',
              version: '4th Edition',
              description: 'Industry standard for duct construction',
            },
            {
              code: 'ASHRAE',
              name: 'ASHRAE Fundamentals',
              version: '2025',
              description: 'HVAC design fundamentals',
            },
          ]
          
          set({ standards: defaultStandards }, false, 'loadStandards:fallback')
        }
      },

      getMaterial: (materialId) => {
        return get().materials[materialId]
      },

      getStandard: (code) => {
        return get().standards.find(standard => standard.code === code)
      },

      validateProject: async (projectData) => {
        try {
          const response = await fetch(`${API_BASE_URL}/calculations/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
          })

          if (!response.ok) {
            throw new Error('Validation failed')
          }

          const data = await response.json()
          
          if (data.success) {
            // Flatten warnings from all objects
            const allWarnings: Warning[] = []
            data.validation_results.forEach((result: any) => {
              allWarnings.push(...result.warnings)
            })
            return allWarnings
          } else {
            throw new Error('Validation failed')
          }
        } catch (error) {
          console.error('Validation error:', error)
          return []
        }
      },

      calculateVelocity: calculateVelocityClient,
      calculateArea: calculateAreaClient,
      calculateEquivalentDiameter: calculateEquivalentDiameterClient,
      calculateHydraulicDiameter: calculateHydraulicDiameterClient,
      calculateAspectRatio: calculateAspectRatioClient,
      validateAspectRatio: validateAspectRatioClient,
      validateVelocity: validateVelocityClient,
    }),
    { name: 'CalculationStore' }
  )
)

// Helper functions
function performClientSideCalculation(input: CalculationInput): CalculationResult {
  const { airflow, duct_type, friction_rate } = input
  
  let results: any = {}
  
  if (duct_type === 'round') {
    // Simple round duct calculation
    const velocity = 1500 // Assume target velocity
    const area = airflow / velocity
    const diameter = Math.sqrt((4 * area) / Math.PI) * 12 // Convert to inches
    
    results = {
      diameter: Math.round(diameter),
      area: area,
      velocity: velocity,
      pressure_loss: friction_rate * 100, // Simplified
    }
  } else {
    // Enhanced rectangular duct calculation
    const velocity = 1200 // Assume target velocity
    const area = airflow / velocity
    const aspectRatio = 2.5 // Assume 2.5:1 aspect ratio (optimal range)
    const height = Math.sqrt(area / aspectRatio) * 12 // Convert to inches
    const width = aspectRatio * height

    // Round to standard sizes
    const standardSizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 42, 48]
    const widthStd = standardSizes.reduce((prev, curr) =>
      Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
    )
    const heightStd = standardSizes.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    )

    // Recalculate with standard sizes
    const actualArea = (widthStd * heightStd) / 144
    const actualVelocity = airflow / actualArea

    // Calculate enhanced properties
    const equivalentDiameter = calculateEquivalentDiameterClient(widthStd, heightStd)
    const hydraulicDiameter = calculateHydraulicDiameterClient(widthStd, heightStd)
    const actualAspectRatio = calculateAspectRatioClient(widthStd, heightStd)

    results = {
      width: widthStd,
      height: heightStd,
      area: actualArea,
      velocity: actualVelocity,
      pressure_loss: friction_rate * 100, // Simplified - backend will provide accurate calculation
      equivalent_diameter: equivalentDiameter,
      hydraulic_diameter: hydraulicDiameter,
      aspect_ratio: actualAspectRatio,
    }
  }
  
  return {
    success: true,
    input_data: input,
    results,
    warnings: [],
    errors: [],
  }
}

function shouldUseBackendCalculation(input: CalculationInput): boolean {
  // Use backend for complex calculations or when high precision is needed
  // Always try backend first, fallback to client-side if unavailable
  return true
}

async function performBackendCalculation(input: CalculationInput): Promise<CalculationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error(`Backend calculation failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.errors?.join(', ') || 'Backend calculation failed')
    }

    // Transform backend response to match frontend CalculationResult interface
    return {
      success: data.success,
      input_data: data.input_data,
      results: data.results,
      compliance: data.compliance,
      warnings: data.warnings || [],
      errors: data.errors || [],
      metadata: data.metadata
    }
  } catch (error) {
    // If backend is unavailable, throw error to fallback to client-side calculation
    throw new Error(`Backend unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to determine input complexity for tracing
const determineInputComplexity = (input: CalculationInput): 'simple' | 'moderate' | 'complex' => {
  let complexityScore = 0

  // Basic inputs
  if (input.airflow && input.airflow > 0) complexityScore += 1

  // Duct type complexity
  if (input.duct_type === 'round') complexityScore += 1
  else if (input.duct_type === 'rectangular') complexityScore += 2

  // Material considerations
  if (input.material && input.material !== 'galvanized_steel') complexityScore += 1

  // Friction rate specified
  if (input.friction_rate && input.friction_rate !== 0.1) complexityScore += 1

  // Material considerations (already handled above)

  if (complexityScore <= 2) return 'simple'
  if (complexityScore <= 4) return 'moderate'
  return 'complex'
}

// Create debounced calculation hook
export const useDebouncedCalculation = () => {
  const calculate = useCalculationStore(state => state.calculate)
  
  return useDebouncedCallback(
    (input: CalculationInput, objectId?: string) => calculate(input, objectId),
    250 // 250ms debounce
  )
}
