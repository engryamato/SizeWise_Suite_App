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
      // Mock calculation for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result: CalculationResult = {
        success: true,
        input_data: inputData,
        results: {
          width: 12,
          height: 8,
          area: 12 * 8,
          velocity: 1200,
          pressure_loss: 0.08,
          equivalent_diameter: 9.6
        },
        warnings: [],
        errors: [],
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
