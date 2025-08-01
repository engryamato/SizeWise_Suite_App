/**
 * SMACNA Gauge Tables for Duct Fittings
 * Comprehensive thickness data for gauges 30-14 across all materials
 * Based on SMACNA standards for HVAC ductwork
 */

export interface GaugeThickness {
  [gauge: string]: number; // thickness in inches
}

export interface MaterialGaugeTable {
  [material: string]: GaugeThickness;
}

/**
 * SMACNA Standard Gauge Thickness Table
 * Thickness values in inches for gauges 30-14
 */
export const SMACNA_GAUGE_TABLE: MaterialGaugeTable = {
  "galvanized_steel": {
    "30": 0.0120, // 30 gauge = 0.012"
    "28": 0.0149, // 28 gauge = 0.0149"
    "26": 0.0187, // 26 gauge = 0.0187"
    "24": 0.0239, // 24 gauge = 0.0239"
    "22": 0.0299, // 22 gauge = 0.0299"
    "20": 0.0359, // 20 gauge = 0.0359"
    "18": 0.0478, // 18 gauge = 0.0478"
    "16": 0.0598, // 16 gauge = 0.0598"
    "14": 0.0747  // 14 gauge = 0.0747"
  },
  "aluminum": {
    "30": 0.0100, // 30 gauge = 0.010"
    "28": 0.0125, // 28 gauge = 0.0125"
    "26": 0.0160, // 26 gauge = 0.016"
    "24": 0.0201, // 24 gauge = 0.0201"
    "22": 0.0253, // 22 gauge = 0.0253"
    "20": 0.0320, // 20 gauge = 0.032"
    "18": 0.0403, // 18 gauge = 0.0403"
    "16": 0.0508, // 16 gauge = 0.0508"
    "14": 0.0641  // 14 gauge = 0.0641"
  },
  "stainless_steel": {
    "30": 0.0120, // 30 gauge = 0.012"
    "28": 0.0140, // 28 gauge = 0.014"
    "26": 0.0180, // 26 gauge = 0.018"
    "24": 0.0230, // 24 gauge = 0.023"
    "22": 0.0290, // 22 gauge = 0.029"
    "20": 0.0350, // 20 gauge = 0.035"
    "18": 0.0480, // 18 gauge = 0.048"
    "16": 0.0625, // 16 gauge = 0.0625"
    "14": 0.0781  // 14 gauge = 0.0781"
  }
};

/**
 * Available gauge options (30-14 only)
 */
export const AVAILABLE_GAUGES = ["30", "28", "26", "24", "22", "20", "18", "16", "14"] as const;

/**
 * Available material types
 */
export const AVAILABLE_MATERIALS = ["galvanized_steel", "aluminum", "stainless_steel"] as const;

export type GaugeType = typeof AVAILABLE_GAUGES[number];
export type MaterialType = typeof AVAILABLE_MATERIALS[number];

/**
 * Material display names for UI
 */
export const MATERIAL_DISPLAY_NAMES: Record<MaterialType, string> = {
  "galvanized_steel": "Galvanized Steel",
  "aluminum": "Aluminum",
  "stainless_steel": "Stainless Steel"
};

/**
 * Material colors for 3D visualization
 */
export const MATERIAL_COLORS: Record<MaterialType, number> = {
  "galvanized_steel": 0xcccccc, // Light gray
  "aluminum": 0xb0c4de,         // Light steel blue
  "stainless_steel": 0xdddddd   // Very light gray
};

/**
 * Material properties for 3D rendering
 */
export const MATERIAL_PROPERTIES: Record<MaterialType, {
  metalness: number;
  roughness: number;
  color: number;
}> = {
  "galvanized_steel": {
    metalness: 0.6,
    roughness: 0.3,
    color: 0xcccccc
  },
  "aluminum": {
    metalness: 0.8,
    roughness: 0.2,
    color: 0xb0c4de
  },
  "stainless_steel": {
    metalness: 0.9,
    roughness: 0.1,
    color: 0xdddddd
  }
};

/**
 * Get wall thickness for a specific material and gauge
 */
export function getWallThickness(material: MaterialType, gauge: GaugeType): number {
  const thickness = SMACNA_GAUGE_TABLE[material]?.[gauge];
  if (!thickness) {
    throw new Error(`No thickness data for ${material} gauge ${gauge}`);
  }
  return thickness;
}

/**
 * Validate if a gauge is available for a material
 */
export function isValidGaugeForMaterial(material: MaterialType, gauge: string): gauge is GaugeType {
  return AVAILABLE_GAUGES.includes(gauge as GaugeType) && 
         SMACNA_GAUGE_TABLE[material]?.[gauge] !== undefined;
}

/**
 * Get available gauges for a specific material
 */
export function getAvailableGaugesForMaterial(material: MaterialType): GaugeType[] {
  return AVAILABLE_GAUGES.filter(gauge => 
    SMACNA_GAUGE_TABLE[material]?.[gauge] !== undefined
  );
}

/**
 * SMACNA diameter-based gauge recommendations
 * Based on SMACNA standards for minimum gauge by duct diameter
 */
export const SMACNA_GAUGE_RECOMMENDATIONS: Record<string, {
  minDiameter: number; // inches
  maxDiameter: number; // inches
  recommendedGauge: GaugeType;
  minimumGauge: GaugeType;
}[]> = {
  "galvanized_steel": [
    { minDiameter: 4, maxDiameter: 12, recommendedGauge: "26", minimumGauge: "28" },
    { minDiameter: 13, maxDiameter: 24, recommendedGauge: "24", minimumGauge: "26" },
    { minDiameter: 25, maxDiameter: 36, recommendedGauge: "22", minimumGauge: "24" },
    { minDiameter: 37, maxDiameter: 48, recommendedGauge: "20", minimumGauge: "22" },
    { minDiameter: 49, maxDiameter: 60, recommendedGauge: "18", minimumGauge: "20" },
    { minDiameter: 61, maxDiameter: 84, recommendedGauge: "16", minimumGauge: "18" },
    { minDiameter: 85, maxDiameter: 120, recommendedGauge: "14", minimumGauge: "16" }
  ],
  "aluminum": [
    { minDiameter: 4, maxDiameter: 12, recommendedGauge: "24", minimumGauge: "26" },
    { minDiameter: 13, maxDiameter: 24, recommendedGauge: "22", minimumGauge: "24" },
    { minDiameter: 25, maxDiameter: 36, recommendedGauge: "20", minimumGauge: "22" },
    { minDiameter: 37, maxDiameter: 48, recommendedGauge: "18", minimumGauge: "20" },
    { minDiameter: 49, maxDiameter: 60, recommendedGauge: "16", minimumGauge: "18" },
    { minDiameter: 61, maxDiameter: 84, recommendedGauge: "14", minimumGauge: "16" },
    { minDiameter: 85, maxDiameter: 120, recommendedGauge: "14", minimumGauge: "14" }
  ],
  "stainless_steel": [
    { minDiameter: 4, maxDiameter: 12, recommendedGauge: "26", minimumGauge: "28" },
    { minDiameter: 13, maxDiameter: 24, recommendedGauge: "24", minimumGauge: "26" },
    { minDiameter: 25, maxDiameter: 36, recommendedGauge: "22", minimumGauge: "24" },
    { minDiameter: 37, maxDiameter: 48, recommendedGauge: "20", minimumGauge: "22" },
    { minDiameter: 49, maxDiameter: 60, recommendedGauge: "18", minimumGauge: "20" },
    { minDiameter: 61, maxDiameter: 84, recommendedGauge: "16", minimumGauge: "18" },
    { minDiameter: 85, maxDiameter: 120, recommendedGauge: "14", minimumGauge: "16" }
  ]
};

/**
 * Get recommended gauge for a diameter and material
 */
export function getRecommendedGauge(diameter: number, material: MaterialType): {
  recommended: GaugeType;
  minimum: GaugeType;
} | null {
  const recommendations = SMACNA_GAUGE_RECOMMENDATIONS[material];
  const match = recommendations.find(rec => 
    diameter >= rec.minDiameter && diameter <= rec.maxDiameter
  );
  
  if (!match) return null;
  
  return {
    recommended: match.recommendedGauge,
    minimum: match.minimumGauge
  };
}
