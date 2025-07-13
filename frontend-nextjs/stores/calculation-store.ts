import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useDebouncedCallback } from 'use-debounce'
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

          // For complex calculations or Pro features, call the backend
          if (shouldUseBackendCalculation(input)) {
            const backendResult = await performBackendCalculation(input)
            
            if (objectId) {
              const { results } = get()
              set({
                results: { ...results, [objectId]: backendResult }
              }, false, 'calculate:backend')
            }
            
            set({ isCalculating: false }, false, 'calculate:complete')
            return backendResult
          }

          set({ isCalculating: false }, false, 'calculate:complete')
          return clientResult
        } catch (error) {
          console.error('Calculation error:', error)
          set({ isCalculating: false }, false, 'calculate:error')
          
          const errorResult: CalculationResult = {
            success: false,
            input_data: input,
            warnings: [],
            errors: [error instanceof Error ? error.message : 'Calculation failed'],
          }
          
          return errorResult
        }
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
    // Simple rectangular duct calculation
    const velocity = 1200 // Assume target velocity
    const area = airflow / velocity
    const aspectRatio = 2 // Assume 2:1 aspect ratio
    const height = Math.sqrt(area / aspectRatio) * 12 // Convert to inches
    const width = aspectRatio * height
    
    results = {
      width: Math.round(width),
      height: Math.round(height),
      area: area,
      velocity: velocity,
      pressure_loss: friction_rate * 100, // Simplified
      equivalent_diameter: calculateEquivalentDiameterClient(width, height),
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
  // For MVP, we'll primarily use client-side calculations
  return false
}

async function performBackendCalculation(input: CalculationInput): Promise<CalculationResult> {
  const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('Backend calculation failed')
  }

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Backend calculation failed')
  }
  
  return data
}

// Create debounced calculation hook
export const useDebouncedCalculation = () => {
  const calculate = useCalculationStore(state => state.calculate)
  
  return useDebouncedCallback(
    (input: CalculationInput, objectId?: string) => calculate(input, objectId),
    250 // 250ms debounce
  )
}
