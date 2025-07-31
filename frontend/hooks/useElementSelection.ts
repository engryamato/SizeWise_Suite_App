import { useCallback } from 'react';
import { createMockElementProperties, ElementProperties } from '@/constants/MockDataConstants';

/**
 * Custom hook for element selection and context panel management
 * Provides consistent element selection behavior across pages
 */
export function useElementSelection(
  setSelectedElement: React.Dispatch<React.SetStateAction<ElementProperties | null>>,
  setContextPanelPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
  setShowContextPanel: React.Dispatch<React.SetStateAction<boolean>>
) {
  const handleElementSelect = useCallback((elementId: string, position: { x: number; y: number }) => {
    // Create mock element data for demonstration using shared utility
    const mockElement = createMockElementProperties(elementId, position);
    
    // Update state to show context panel
    setSelectedElement(mockElement);
    setContextPanelPosition(position);
    setShowContextPanel(true);
  }, [setSelectedElement, setContextPanelPosition, setShowContextPanel]);

  return {
    handleElementSelect
  };
}
