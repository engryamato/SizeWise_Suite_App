import { useCallback } from 'react';
import { 
  simulateCalculationDelay,
  getFreshMockCalculationResults,
  getFreshMockValidationWarnings,
  CalculationResult,
  ValidationWarning
} from '@/constants/MockDataConstants';

/**
 * Custom hook for mock calculations and validation warnings
 * Provides consistent calculation simulation across pages
 */
export function useMockCalculations(
  setCalculationResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>,
  setWarnings: React.Dispatch<React.SetStateAction<ValidationWarning[]>>,
  setIsCalculating: React.Dispatch<React.SetStateAction<boolean>>,
  toast?: {
    success: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
  }
) {
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      // Simulate calculation delay for realistic user experience
      await simulateCalculationDelay();
      
      // Get fresh mock data with current timestamps
      const mockResults = getFreshMockCalculationResults();
      const mockWarnings = getFreshMockValidationWarnings();
      
      // Update state with results
      setCalculationResults(mockResults);
      setWarnings(mockWarnings);
      
      // Show success notification if toast is available
      toast?.success('Calculation complete', 'System analysis completed successfully');
    } catch (error) {
      console.error('Calculation error:', error);
      
      // Show error notification if toast is available
      toast?.error('Calculation failed', 'Please check your inputs and try again');
    } finally {
      setIsCalculating(false);
    }
  }, [setCalculationResults, setWarnings, setIsCalculating, toast]);

  return {
    handleCalculate
  };
}
