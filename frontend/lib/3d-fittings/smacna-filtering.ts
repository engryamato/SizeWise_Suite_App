/**
 * SMACNA-Compliant Filtering Logic
 * Provides intelligent filtering for gauge/material combinations based on SMACNA standards
 */

import { 
  MaterialType, 
  GaugeType, 
  AVAILABLE_MATERIALS, 
  AVAILABLE_GAUGES,
  getAvailableGaugesForMaterial,
  getRecommendedGauge,
  isValidGaugeForMaterial,
  SMACNA_GAUGE_RECOMMENDATIONS
} from './smacna-gauge-tables';

export interface FilterOptions {
  diameter?: number;
  application?: 'standard' | 'high_pressure' | 'corrosive' | 'cost_effective';
  environment?: 'indoor' | 'outdoor' | 'marine' | 'industrial';
  pressureClass?: 'low' | 'medium' | 'high';
  includeNonStandard?: boolean;
}

export interface FilteredMaterial {
  material: MaterialType;
  displayName: string;
  recommended: boolean;
  reason?: string;
  warning?: string;
}

export interface FilteredGauge {
  gauge: GaugeType;
  displayName: string;
  recommended: boolean;
  minimum: boolean;
  reason?: string;
  thickness: number;
}

/**
 * Filter materials based on application requirements and SMACNA standards
 */
export function filterMaterialsForApplication(options: FilterOptions = {}): FilteredMaterial[] {
  const results: FilteredMaterial[] = [];
  
  for (const material of AVAILABLE_MATERIALS) {
    const result: FilteredMaterial = {
      material,
      displayName: getMaterialDisplayName(material),
      recommended: true
    };
    
    // Apply application-specific filtering
    if (options.application) {
      switch (options.application) {
        case 'corrosive':
          if (material === 'galvanized_steel') {
            result.recommended = false;
            result.reason = 'Not suitable for corrosive environments';
          } else if (material === 'stainless_steel') {
            result.reason = 'Excellent corrosion resistance';
          }
          break;
          
        case 'cost_effective':
          if (material === 'galvanized_steel') {
            result.reason = 'Most cost-effective option';
          } else {
            result.recommended = false;
            result.reason = 'Higher cost than galvanized steel';
          }
          break;
          
        case 'high_pressure':
          if (material === 'aluminum') {
            result.warning = 'Verify pressure rating for aluminum';
          }
          break;
      }
    }
    
    // Apply environment-specific filtering
    if (options.environment) {
      switch (options.environment) {
        case 'marine':
          if (material !== 'stainless_steel') {
            result.recommended = false;
            result.reason = 'Marine environment requires stainless steel';
          }
          break;
          
        case 'outdoor':
          if (material === 'galvanized_steel') {
            result.warning = 'Consider coating for outdoor use';
          }
          break;
      }
    }
    
    // Apply diameter-specific recommendations
    if (options.diameter) {
      if (material === 'stainless_steel' && options.diameter > 48) {
        result.warning = 'Stainless steel may not be cost-effective for large diameters';
      }
      
      if (material === 'aluminum' && options.diameter < 8) {
        result.warning = 'Aluminum typically not used for small diameters';
      }
    }
    
    results.push(result);
  }
  
  // Sort by recommendation status and then alphabetically
  return results.sort((a, b) => {
    if (a.recommended !== b.recommended) {
      return a.recommended ? -1 : 1;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Filter gauges for a specific material and diameter based on SMACNA standards
 */
export function filterGaugesForMaterial(
  material: MaterialType, 
  options: FilterOptions = {}
): FilteredGauge[] {
  const availableGauges = getAvailableGaugesForMaterial(material);
  const results: FilteredGauge[] = [];
  
  // Get SMACNA recommendations if diameter is provided
  let recommendation: { recommended: GaugeType; minimum: GaugeType } | null = null;
  if (options.diameter) {
    recommendation = getRecommendedGauge(options.diameter, material);
  }
  
  for (const gauge of availableGauges) {
    const gaugeNum = parseInt(gauge);
    const result: FilteredGauge = {
      gauge,
      displayName: `${gauge} ga`,
      recommended: false,
      minimum: false,
      thickness: getGaugeThickness(material, gauge)
    };
    
    // Apply SMACNA recommendations
    if (recommendation) {
      const recGaugeNum = parseInt(recommendation.recommended);
      const minGaugeNum = parseInt(recommendation.minimum);
      
      if (gauge === recommendation.recommended) {
        result.recommended = true;
        result.reason = 'SMACNA recommended gauge';
      }
      
      if (gaugeNum <= minGaugeNum) {
        result.minimum = true;
        if (gaugeNum < minGaugeNum) {
          result.reason = 'Exceeds SMACNA minimum requirements';
        } else {
          result.reason = 'Meets SMACNA minimum requirements';
        }
      } else {
        result.reason = 'Below SMACNA minimum - not recommended';
      }
    }
    
    // Apply pressure class filtering
    if (options.pressureClass) {
      switch (options.pressureClass) {
        case 'high':
          if (gaugeNum > 20) {
            result.reason = 'Too thin for high-pressure applications';
          }
          break;
          
        case 'low':
          if (gaugeNum < 24) {
            result.reason = 'Thicker than necessary for low-pressure';
          }
          break;
      }
    }
    
    results.push(result);
  }
  
  // Sort by gauge number (thickest first)
  return results.sort((a, b) => parseInt(a.gauge) - parseInt(b.gauge));
}

/**
 * Get recommended gauge and material combination for specific requirements
 */
export function getRecommendedCombination(options: FilterOptions): {
  material: MaterialType;
  gauge: GaugeType;
  reason: string;
} | null {
  const materials = filterMaterialsForApplication(options);
  const recommendedMaterial = materials.find(m => m.recommended);
  
  if (!recommendedMaterial) {
    return null;
  }
  
  const gauges = filterGaugesForMaterial(recommendedMaterial.material, options);
  const recommendedGauge = gauges.find(g => g.recommended) || gauges.find(g => g.minimum);
  
  if (!recommendedGauge) {
    return null;
  }
  
  return {
    material: recommendedMaterial.material,
    gauge: recommendedGauge.gauge,
    reason: `${recommendedMaterial.reason || 'Standard choice'} with ${recommendedGauge.reason || 'appropriate gauge'}`
  };
}

/**
 * Validate a material/gauge combination against SMACNA standards
 */
export function validateMaterialGaugeCombination(
  material: MaterialType,
  gauge: GaugeType,
  options: FilterOptions = {}
): {
  isValid: boolean;
  isRecommended: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check basic compatibility
  if (!isValidGaugeForMaterial(material, gauge)) {
    errors.push(`Gauge ${gauge} is not available for ${material}`);
    return { isValid: false, isRecommended: false, warnings, errors, suggestions };
  }
  
  let isRecommended = true;
  
  // Check SMACNA recommendations
  if (options.diameter) {
    const recommendation = getRecommendedGauge(options.diameter, material);
    if (recommendation) {
      const gaugeNum = parseInt(gauge);
      const recGaugeNum = parseInt(recommendation.recommended);
      const minGaugeNum = parseInt(recommendation.minimum);
      
      if (gaugeNum > minGaugeNum) {
        errors.push(`Gauge ${gauge} is thinner than SMACNA minimum ${recommendation.minimum} for ${options.diameter}" diameter`);
        suggestions.push(`Use gauge ${recommendation.minimum} or thicker`);
      }
      
      if (gauge !== recommendation.recommended) {
        isRecommended = false;
        suggestions.push(`SMACNA recommends gauge ${recommendation.recommended} for optimal performance`);
      }
    }
  }
  
  // Application-specific validation
  if (options.application === 'high_pressure' && parseInt(gauge) > 20) {
    warnings.push('Thin gauge may not be suitable for high-pressure applications');
    suggestions.push('Consider gauge 20 or thicker for high-pressure systems');
  }
  
  if (options.environment === 'marine' && material !== 'stainless_steel') {
    warnings.push('Non-stainless materials may corrode in marine environments');
    suggestions.push('Consider stainless steel for marine applications');
  }
  
  return {
    isValid: errors.length === 0,
    isRecommended,
    warnings,
    errors,
    suggestions
  };
}

// Helper functions
function getMaterialDisplayName(material: MaterialType): string {
  const names: Record<MaterialType, string> = {
    'galvanized_steel': 'Galvanized Steel',
    'aluminum': 'Aluminum',
    'stainless_steel': 'Stainless Steel'
  };
  return names[material];
}

function getGaugeThickness(material: MaterialType, gauge: GaugeType): number {
  // This would normally import from smacna-gauge-tables, but to avoid circular imports
  // we'll implement a simple lookup here
  const thicknesses: Record<MaterialType, Record<GaugeType, number>> = {
    'galvanized_steel': {
      '30': 0.0120, '28': 0.0149, '26': 0.0187, '24': 0.0239,
      '22': 0.0299, '20': 0.0359, '18': 0.0478, '16': 0.0598, '14': 0.0747
    },
    'aluminum': {
      '30': 0.0120, '28': 0.0149, '26': 0.0187, '24': 0.0239,
      '22': 0.0299, '20': 0.0359, '18': 0.0478, '16': 0.0598, '14': 0.0747
    },
    'stainless_steel': {
      '30': 0.0120, '28': 0.0149, '26': 0.0187, '24': 0.0239,
      '22': 0.0299, '20': 0.0359, '18': 0.0478, '16': 0.0598, '14': 0.0747
    }
  };
  
  return thicknesses[material]?.[gauge] || 0;
}
