import { useCallback } from 'react';
import { ElementProperties } from '@/components/ui/ContextPropertyPanel';

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
    // Create element properties based on actual element data (not mock data)
    const elementProperties: ElementProperties = {
      id: elementId,
      type: 'duct', // Default type - should be determined from actual element data
      name: `Element ${elementId.slice(0, 8)}`,
      position: { x: position.x, y: position.y, z: 0 },
      dimensions: { width: 12, height: 8 }, // Default dimensions - should come from actual element
      ductType: 'supply',
      material: 'galvanized_steel',
      velocity: 0, // Will be calculated when user runs calculations
      pressureDrop: 0 // Will be calculated when user runs calculations
    };

    // Update state to show context panel
    setSelectedElement(elementProperties);
    setContextPanelPosition(position);
    setShowContextPanel(true);
  }, [setSelectedElement, setContextPanelPosition, setShowContextPanel]);

  return {
    handleElementSelect
  };
}
