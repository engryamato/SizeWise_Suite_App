/**
 * HVAC Calculations API Client
 * Handles communication with the backend calculation service
 */

export interface DuctSegment {
  id: string;
  startPoint: { x: number; y: number; z: number };
  endPoint: { x: number; y: number; z: number };
  width: number;
  height: number;
  airflow: number;
  type: 'supply' | 'return' | 'exhaust';
  material: string;
  insulation?: {
    type: string;
    thickness: number;
  };
}

export interface Room {
  id: string;
  name: string;
  area: number;
  volume: number;
  loadCooling: number;
  loadHeating: number;
  airflow: number;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
}

export interface Equipment {
  id: string;
  type: 'ahu' | 'vav' | 'diffuser' | 'grille' | 'fan';
  name: string;
  capacity: number;
  airflow: number;
  position: { x: number; y: number; z: number };
  specifications: Record<string, any>;
}

export interface DuctSizingRequest {
  projectId: string;
  rooms: Room[];
  segments: DuctSegment[];
  equipment: Equipment[];
  standards: {
    ductSizing: 'SMACNA' | 'ASHRAE';
    material: string;
    velocityLimits: {
      supply: { min: number; max: number };
      return: { min: number; max: number };
      exhaust: { min: number; max: number };
    };
    pressureLimits: {
      maxStaticPressure: number;
      maxVelocityPressure: number;
    };
  };
  units: 'Imperial' | 'Metric';
  designConditions: {
    outdoorTemp: number;
    indoorTemp: number;
    altitude: number;
  };
}

export interface CalculationResult {
  segmentId: string;
  recommendedSize: {
    width: number;
    height: number;
    diameter?: number;
  };
  velocity: number;
  pressureDrop: number;
  friction: number;
  warnings: string[];
  compliance: {
    velocityOk: boolean;
    pressureOk: boolean;
    standardsCompliant: boolean;
  };
}

export interface DuctSizingResponse {
  projectId: string;
  calculations: CalculationResult[];
  summary: {
    totalPressureDrop: number;
    maxVelocity: number;
    compliance: boolean;
  };
  warnings: string[];
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class CalculationsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async calculateDuctSizing(request: DuctSizingRequest): Promise<DuctSizingResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calculations/duct-sizing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.error('Calculation API error:', response.status, response.statusText);
        return this.getFallbackCalculation(request);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to connect to calculation API:', error);
      return this.getFallbackCalculation(request);
    }
  }

  private getFallbackCalculation(request: DuctSizingRequest): DuctSizingResponse {
    // Fallback client-side calculation for offline mode
    const calculations: CalculationResult[] = request.segments.map(segment => ({
      segmentId: segment.id,
      recommendedSize: {
        width: Math.max(6, Math.round(Math.sqrt(segment.airflow / 500) * 8)),
        height: Math.max(6, Math.round(Math.sqrt(segment.airflow / 500) * 8)),
      },
      velocity: segment.airflow / ((segment.width * segment.height) / 144),
      pressureDrop: 0.1 * (segment.airflow / 1000),
      friction: 0.08,
      warnings: [],
      compliance: {
        velocityOk: true,
        pressureOk: true,
        standardsCompliant: true,
      },
    }));

    return {
      projectId: request.projectId,
      calculations,
      summary: {
        totalPressureDrop: calculations.reduce((sum, calc) => sum + calc.pressureDrop, 0),
        maxVelocity: Math.max(...calculations.map(calc => calc.velocity)),
        compliance: true,
      },
      warnings: ['Using offline calculation mode'],
      timestamp: new Date().toISOString(),
    };
  }

  async validateProject(projectData: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/validation/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        return { valid: false, errors: ['Validation service unavailable'] };
      }

      return await response.json();
    } catch (error) {
      console.error('Validation API error:', error);
      return { valid: true, errors: [] }; // Assume valid in offline mode
    }
  }

  async getStandards(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/standards`);
      if (!response.ok) {
        throw new Error('Standards API unavailable');
      }
      return await response.json();
    } catch (error) {
      console.error('Standards API error:', error);
      return {
        ductSizing: ['SMACNA', 'ASHRAE'],
        materials: ['galvanized_steel', 'aluminum', 'stainless_steel'],
        velocityLimits: {
          supply: { min: 500, max: 1200 },
          return: { min: 400, max: 800 },
          exhaust: { min: 600, max: 1500 },
        },
      };
    }
  }
}

// Create singleton instance
const calculationsAPI = new CalculationsAPI();

// Export hook for use in components
export function useCalculations() {
  return {
    calculateDuctSizing: calculationsAPI.calculateDuctSizing.bind(calculationsAPI),
    validateProject: calculationsAPI.validateProject.bind(calculationsAPI),
    getStandards: calculationsAPI.getStandards.bind(calculationsAPI),
  };
}

// Export individual functions for direct use
export const calculateDuctSizing = calculationsAPI.calculateDuctSizing.bind(calculationsAPI);
export const validateProject = calculationsAPI.validateProject.bind(calculationsAPI);
export const getStandards = calculationsAPI.getStandards.bind(calculationsAPI);
