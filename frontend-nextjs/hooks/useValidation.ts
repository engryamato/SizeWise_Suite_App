import { useMemo } from 'react'
import { useCalculationStore } from '@/stores/calculation-store'
import { useAuthStore } from '@/stores/auth-store'

interface ValidationResult {
  compliant: boolean
  errors: string[]
  warnings: string[]
  recommendations?: string[]
  standardReference?: string
}

interface DuctValidationInput {
  airflow: number
  width?: number
  height?: number
  diameter?: number
  roomType?: string
  ductType?: string
  material?: string
}

export const useValidation = () => {
  const { 
    calculateVelocity, 
    calculateArea, 
    calculateEquivalentDiameter,
    calculateAspectRatio,
    validateAspectRatio,
    validateVelocity 
  } = useCalculationStore()
  
  const { user } = useAuthStore()
  const isProUser = user?.tier === 'pro'

  const validateDuct = useMemo(() => {
    return (input: DuctValidationInput): ValidationResult => {
      const {
        airflow,
        width,
        height,
        diameter,
        roomType = 'office',
        ductType = 'supply',
        material = 'galvanized_steel'
      } = input

      let allErrors: string[] = []
      let allWarnings: string[] = []
      let allRecommendations: string[] = []

      // Calculate area and velocity
      let area: number
      let velocity: number

      if (diameter) {
        // Round duct
        area = Math.PI * Math.pow(diameter / 12 / 2, 2) // Convert to sq ft
        velocity = calculateVelocity(airflow, area)
      } else if (width && height) {
        // Rectangular duct
        area = calculateArea(width, height) / 144 // Convert to sq ft
        velocity = calculateVelocity(airflow, area)

        // Validate aspect ratio
        const aspectValidation = validateAspectRatio(width, height)
        if (!aspectValidation.compliant) {
          allErrors.push(...aspectValidation.warnings.filter(w => w.includes('exceeds')))
        }
        allWarnings.push(...aspectValidation.warnings.filter(w => !w.includes('exceeds')))
        allRecommendations.push(...aspectValidation.recommendations)
      } else {
        return {
          compliant: false,
          errors: ['Invalid duct dimensions provided'],
          warnings: [],
          recommendations: ['Provide either diameter for round duct or width/height for rectangular duct']
        }
      }

      // Validate velocity
      const velocityValidation = validateVelocity(velocity, roomType, ductType)
      allErrors.push(...velocityValidation.errors)
      allWarnings.push(...velocityValidation.warnings)

      // Add Pro-only validations
      if (!isProUser) {
        // For Free tier, show limited validation
        if (allErrors.length === 0 && allWarnings.length > 0) {
          allWarnings.push('Upgrade to Pro for comprehensive SMACNA/ASHRAE validation')
        }
      } else {
        // Pro tier gets full validation
        // Add material-specific validations
        if (material === 'fiberglass' && velocity > 1500) {
          allWarnings.push('High velocity in fiberglass duct may cause erosion')
        }
        
        // Add pressure class validations
        if (velocity > 2000) {
          allWarnings.push('Consider higher pressure class ductwork for velocities above 2000 FPM')
        }
      }

      return {
        compliant: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        recommendations: allRecommendations,
        standardReference: velocityValidation.standardReference
      }
    }
  }, [calculateVelocity, calculateArea, validateAspectRatio, validateVelocity, isProUser])

  const validateRoom = useMemo(() => {
    return (airflow: number, area: number, roomType: string = 'office'): ValidationResult => {
      const errors: string[] = []
      const warnings: string[] = []
      const recommendations: string[] = []

      // Calculate air changes per hour (assuming 10 ft ceiling)
      const volume = area * 10 // cubic feet
      const ach = (airflow * 60) / volume // air changes per hour

      // ASHRAE ventilation requirements by room type
      const ventilationRequirements: Record<string, { minACH: number; maxACH: number; minCFMPerSqFt: number }> = {
        office: { minACH: 4, maxACH: 12, minCFMPerSqFt: 1.0 },
        conference: { minACH: 6, maxACH: 15, minCFMPerSqFt: 1.5 },
        classroom: { minACH: 6, maxACH: 15, minCFMPerSqFt: 1.5 },
        retail: { minACH: 4, maxACH: 10, minCFMPerSqFt: 0.8 },
        warehouse: { minACH: 2, maxACH: 8, minCFMPerSqFt: 0.5 },
        kitchen: { minACH: 15, maxACH: 30, minCFMPerSqFt: 3.0 },
        bathroom: { minACH: 8, maxACH: 20, minCFMPerSqFt: 2.0 }
      }

      const requirements = ventilationRequirements[roomType] || ventilationRequirements.office
      const cfmPerSqFt = airflow / area

      // Validate air changes per hour
      if (ach < requirements.minACH) {
        errors.push(`Air changes per hour (${ach.toFixed(1)}) below minimum ${requirements.minACH} for ${roomType}`)
      } else if (ach > requirements.maxACH) {
        warnings.push(`Air changes per hour (${ach.toFixed(1)}) exceeds typical maximum ${requirements.maxACH} for ${roomType}`)
      }

      // Validate CFM per square foot
      if (cfmPerSqFt < requirements.minCFMPerSqFt) {
        errors.push(`Airflow rate (${cfmPerSqFt.toFixed(2)} CFM/sq ft) below minimum ${requirements.minCFMPerSqFt} for ${roomType}`)
      }

      // Add recommendations
      if (ach < requirements.minACH * 1.2) {
        recommendations.push(`Consider increasing airflow for better ventilation (target: ${requirements.minACH * 1.2} ACH)`)
      }

      return {
        compliant: errors.length === 0,
        errors,
        warnings,
        recommendations,
        standardReference: 'ASHRAE 62.1 Ventilation Standards'
      }
    }
  }, [])

  const validateProject = useMemo(() => {
    return (roomCount: number, segmentCount: number, equipmentCount: number): ValidationResult => {
      const errors: string[] = []
      const warnings: string[] = []
      const recommendations: string[] = []

      if (!isProUser) {
        // Free tier limits
        if (roomCount > 3) {
          errors.push(`Free tier limited to 3 rooms (current: ${roomCount}). Upgrade to Pro for unlimited rooms.`)
        }
        if (segmentCount > 25) {
          errors.push(`Free tier limited to 25 segments (current: ${segmentCount}). Upgrade to Pro for unlimited segments.`)
        }
        if (equipmentCount > 2) {
          errors.push(`Free tier limited to 2 equipment units (current: ${equipmentCount}). Upgrade to Pro for unlimited equipment.`)
        }

        // Warnings when approaching limits
        if (roomCount === 3) {
          warnings.push('You have reached the Free tier room limit')
        }
        if (segmentCount >= 20) {
          warnings.push(`Approaching Free tier segment limit (${segmentCount}/25)`)
        }
        if (equipmentCount === 2) {
          warnings.push('You have reached the Free tier equipment limit')
        }
      }

      // General project validation
      if (roomCount === 0) {
        recommendations.push('Add rooms to begin duct design')
      }
      if (segmentCount === 0 && roomCount > 0) {
        recommendations.push('Add duct segments to connect rooms and equipment')
      }
      if (equipmentCount === 0 && roomCount > 0) {
        recommendations.push('Add HVAC equipment to complete the system design')
      }

      return {
        compliant: errors.length === 0,
        errors,
        warnings,
        recommendations,
        standardReference: isProUser ? 'Full SMACNA/ASHRAE Compliance' : 'Free Tier Limitations'
      }
    }
  }, [isProUser])

  return {
    validateDuct,
    validateRoom,
    validateProject,
    isProUser
  }
}
