import { useCallback } from 'react';
import { EquipmentFactory, Equipment } from '@/utils/EquipmentFactory';

/**
 * Custom hook for equipment placement functionality
 * Provides consistent equipment creation with automatic connection points
 */
export function useEquipmentPlacement(
  setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>>
) {
  const handleEquipmentPlace = useCallback((position: { x: number; y: number; z: number }) => {
    // Create new equipment using the factory with automatic connection points
    const newEquipment = EquipmentFactory.createEquipment(position, 'Fan');
    
    // Add equipment to the state
    setEquipment(prev => [...prev, newEquipment]);
    
    // Log for debugging and development
    console.log('Equipment placed with connection points:', newEquipment);
  }, [setEquipment]);

  return {
    handleEquipmentPlace
  };
}
