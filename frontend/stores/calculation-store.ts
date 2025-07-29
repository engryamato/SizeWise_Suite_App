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
  
  // Calculation actions
  setCurrentCalculation: (calculation: CalculationResult | null) => void;
  addCalculationToHistory: (calculation: CalculationHistory) => void;
  clearCalculationHistory: () => void;
  
  // State management
  setCalculating: (calculating: boolean) => void;
  setError: (error: string | null) => void;
  
  // Calculation methods
  performCalculation: (type: string, inputData: any) => Promise<CalculationResult>;
}

export const useCalculationStore = create<CalculationState>((set, get) => ({
  currentCalculation: null,
  calculationHistory: [],
  isCalculating: false,
  lastError: null,
  
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
        ductSize: { width: 12, height: 8 },
        velocity: 1200,
        pressureDrop: 0.08,
        reynoldsNumber: 85000,
        frictionFactor: 0.018,
        equivalentDiameter: 9.6,
        isValid: true,
        warnings: [],
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
