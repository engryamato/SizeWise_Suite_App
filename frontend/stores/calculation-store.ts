import { create } from 'zustand';
import { useCallback } from 'react';
import { CalculationResult } from '@/types/air-duct-sizer';

interface CalculationHistory {
  id: string;
  projectId: string;
  segmentId?: string;
  roomId?: string;
  calculationType: string;
  inputData: any;
  result: CalculationResult;
  timestamp: Date;
}

interface CalculationState {
  currentCalculation: CalculationResult | null;
  calculationHistory: CalculationHistory[];
  isCalculating: boolean;
  lastError: string | null;
  materials: string[];
  
  // Calculation actions
  setCurrentCalculation: (calculation: CalculationResult | null) => void;
  addCalculationToHistory: (calculation: CalculationHistory) => void;
  clearCalculationHistory: () => void;
  
  // State management
  setCalculating: (calculating: boolean) => void;
  setError: (error: string | null) => void;
  
  // Calculation methods
  performCalculation: (type: string, inputData: any) => Promise<CalculationResult>;
  calculateArea: (length: number, width: number) => number;
  calculateVelocity: (airflow: number, ductSize: { width: number; height: number }) => number;
  calculateEquivalentDiameter: (width: number, height: number) => number;
}

export const useCalculationStore = create<CalculationState>((set, get) => ({
  currentCalculation: null,
  calculationHistory: [],
  isCalculating: false,
  lastError: null,
  materials: ['Galvanized Steel', 'Aluminum', 'Stainless Steel', 'PVC', 'Fiberglass'],
  
  setCurrentCalculation: (calculation: CalculationResult | null) => {
    set({ currentCalculation: calculation });
  },
  
  addCalculationToHistory: (calculation: CalculationHistory) => {
    set((state) => ({
      calculationHistory: [calculation, ...state.calculationHistory]
    }));
  },
  
  clearCalculationHistory: () => {
    set({ calculationHistory: [] });
  },
  
  setCalculating: (calculating: boolean) => {
    set({ isCalculating: calculating });
  },
  
  setError: (error: string | null) => {
    set({ lastError: error });
  },
  
  performCalculation: async (type: string, inputData: any): Promise<CalculationResult> => {
    set({ isCalculating: true, lastError: null });

    try {
      // Validate input data
      if (!inputData || typeof inputData !== 'object') {
        throw new Error('Invalid input data provided');
      }

      // Perform actual calculation based on type and input data
      let calculationResults: any = {};
      const warnings: string[] = [];
      const errors: string[] = [];

      if (type === 'air_duct_sizing' && inputData.airflow && inputData.velocity) {
        // Calculate actual duct dimensions using engineering formulas
        const airflow = parseFloat(inputData.airflow);
        const targetVelocity = parseFloat(inputData.velocity) || 1200; // Default to 1200 FPM

        if (airflow <= 0) {
          errors.push('Airflow must be greater than 0 CFM');
        } else {
          // Calculate area needed: Area (sq ft) = CFM / Velocity (FPM)
          const areaNeeded = airflow / targetVelocity; // sq ft
          const areaNeededInches = areaNeeded * 144; // sq in

          // For rectangular duct, assume optimal aspect ratio of 1.4:1 (SMACNA recommendation)
          const height = Math.sqrt(areaNeededInches / 1.4);
          const width = height * 1.4;

          // Round to standard duct sizes (nearest inch)
          const standardWidth = Math.round(width);
          const standardHeight = Math.round(height);
          const actualArea = (standardWidth * standardHeight) / 144; // sq ft
          const actualVelocity = actualArea > 0 ? airflow / actualArea : 0;

          // Calculate equivalent diameter for round duct comparison
          const equivalentDiameter = 1.3 * Math.pow((standardWidth * standardHeight), 0.625) / Math.pow((standardWidth + standardHeight), 0.25);

          // Basic pressure loss calculation (simplified Darcy-Weisbach)
          const frictionFactor = 0.02; // Typical for galvanized steel
          const velocityPressure = Math.pow(actualVelocity / 4005, 2); // in. w.g.
          const pressureLoss = frictionFactor * velocityPressure; // per 100 ft

          calculationResults = {
            width: standardWidth,
            height: standardHeight,
            area: actualArea,
            velocity: Math.round(actualVelocity),
            pressure_loss: Math.round(pressureLoss * 1000) / 1000, // Round to 3 decimal places
            equivalent_diameter: Math.round(equivalentDiameter * 10) / 10
          };

          // Add warnings for non-optimal conditions
          if (actualVelocity > 2500) {
            warnings.push('Velocity exceeds SMACNA recommended maximum of 2500 FPM');
          }
          if (actualVelocity < 500) {
            warnings.push('Velocity below SMACNA recommended minimum of 500 FPM');
          }
          if (standardWidth / standardHeight > 4 || standardHeight / standardWidth > 4) {
            warnings.push('Aspect ratio exceeds recommended 4:1 maximum');
          }
        }
      } else {
        errors.push(`Calculation type '${type}' requires valid airflow and velocity parameters`);
      }

      const result: CalculationResult = {
        success: errors.length === 0,
        input_data: inputData,
        results: calculationResults,
        warnings,
        errors,
        metadata: {
          calculationType: type,
          timestamp: new Date(),
          inputParameters: inputData
        }
      };

      set({
        currentCalculation: result,
        isCalculating: false
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      set({
        lastError: errorMessage,
        isCalculating: false
      });
      throw error;
    }
  },

  calculateArea: (length: number, width: number): number => {
    return length * width;
  },

  calculateVelocity: (airflow: number, ductSize: { width: number; height: number }): number => {
    // Velocity = CFM / (Area in sq ft)
    // Area = width * height / 144 (convert sq inches to sq feet)
    const areaInSqFt = (ductSize.width * ductSize.height) / 144;
    return areaInSqFt > 0 ? airflow / areaInSqFt : 0;
  },

  calculateEquivalentDiameter: (width: number, height: number): number => {
    // Equivalent diameter for rectangular duct = 1.3 * (a * b)^0.625 / (a + b)^0.25
    // where a and b are the duct dimensions
    if (width <= 0 || height <= 0) return 0;
    const numerator = Math.pow(width * height, 0.625);
    const denominator = Math.pow(width + height, 0.25);
    return 1.3 * (numerator / denominator);
  }
}));

// Debounced calculation hook
export const useDebouncedCalculation = () => {
  const { performCalculation, isCalculating } = useCalculationStore();

  const debouncedCalculate = useCallback(
    async (type: string, inputData: any) => {
      if (isCalculating) return null;

      try {
        return await performCalculation(type, inputData);
      } catch (error) {
        console.error('Debounced calculation failed:', error);
        return null;
      }
    },
    [performCalculation, isCalculating]
  );

  return {
    calculate: debouncedCalculate,
    isCalculating
  };
};
