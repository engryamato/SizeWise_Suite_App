/**
 * System Data Utilities
 * Helper functions for initializing and managing enhanced HVAC system data structures
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import { Vector3, Euler } from 'three';
import { 
  DuctSegment, 
  Equipment, 
  DuctFitting, 
  FlowProperties, 
  ConnectionRelationships, 
  CalculationState,
  ConnectionPoint
} from '@/components/3d/types/Canvas3DTypes';

/**
 * Initialize default flow properties for a new element
 */
export function initializeFlowProperties(elementType: 'segment' | 'equipment' | 'fitting'): FlowProperties {
  return {
    airflow: 0,
    velocity: 0,
    pressureDrop: 0,
    frictionRate: 0.08, // Default SMACNA friction rate
    reynoldsNumber: 0,
    temperature: 70, // Standard room temperature
    density: 0.075, // Standard air density at sea level (lb/ft³)
    isCalculated: false,
    lastUpdated: new Date()
  };
}

/**
 * Initialize default connection relationships for a new element
 */
export function initializeConnectionRelationships(): ConnectionRelationships {
  return {
    upstreamSegments: [],
    downstreamSegments: [],
    connectedEquipment: [],
    connectedFittings: [],
    flowPath: [],
    branchLevel: 0
  };
}

/**
 * Initialize default calculation state for a new element
 */
export function initializeCalculationState(): CalculationState {
  return {
    needsRecalculation: true,
    isCalculating: false,
    lastCalculated: null,
    calculationDependencies: [],
    calculationOrder: 0,
    validationWarnings: [],
    calculationErrors: []
  };
}

/**
 * Create an enhanced DuctSegment with all required properties
 */
export function createEnhancedDuctSegment(
  id: string,
  start: Vector3,
  end: Vector3,
  shape: 'rectangular' | 'round',
  type: 'supply' | 'return' | 'exhaust',
  material: string = 'galvanized_steel',
  dimensions?: { width?: number; height?: number; diameter?: number }
): DuctSegment {
  const segment: DuctSegment = {
    id,
    start,
    end,
    shape,
    type,
    material,
    flowProperties: initializeFlowProperties('segment'),
    connectionRelationships: initializeConnectionRelationships(),
    calculationState: initializeCalculationState()
  };

  // Set dimensions based on shape
  if (shape === 'round') {
    segment.diameter = dimensions?.diameter || 12;
  } else {
    segment.width = dimensions?.width || 12;
    segment.height = dimensions?.height || 8;
  }

  // Create connection points
  const direction = new Vector3().subVectors(end, start).normalize();
  const inletDirection = direction.clone().negate();
  const outletDirection = direction.clone();

  segment.inlet = createConnectionPoint(
    `${id}_inlet`,
    start.clone(),
    inletDirection,
    shape,
    dimensions
  );

  segment.outlet = createConnectionPoint(
    `${id}_outlet`,
    end.clone(),
    outletDirection,
    shape,
    dimensions
  );

  return segment;
}

/**
 * Create an enhanced Equipment with all required properties
 */
export function createEnhancedEquipment(
  id: string,
  type: 'Fan' | 'AHU' | 'VAV Box' | 'Damper' | 'Filter' | 'Coil' | 'Custom',
  position: Vector3,
  cfmCapacity: number,
  staticPressureCapacity: number,
  dimensions?: { width: number; height: number; depth: number }
): Equipment {
  const defaultDimensions = { width: 24, height: 24, depth: 12 };
  const equipmentDimensions = dimensions || defaultDimensions;

  const equipment: Equipment = {
    id,
    type,
    position,
    rotation: new Euler(0, 0, 0),
    dimensions: equipmentDimensions,
    properties: {
      cfmCapacity,
      staticPressureCapacity,
      efficiency: 0.85, // Default efficiency
      pressureLossCoefficient: 0.1 // Default pressure loss coefficient
    },
    material: 'steel',
    flowProperties: initializeFlowProperties('equipment'),
    connectionRelationships: initializeConnectionRelationships(),
    calculationState: initializeCalculationState(),
    connectionPoints: [],
    operatingConditions: {
      currentAirflow: 0,
      currentPressure: 0,
      currentEfficiency: 0.85,
      loadPercentage: 0
    },
    isSource: ['Fan', 'AHU'].includes(type),
    isTerminal: ['VAV Box', 'Damper'].includes(type)
  };

  // Create connection points based on equipment type
  equipment.connectionPoints = createEquipmentConnectionPoints(equipment);

  return equipment;
}

/**
 * Create an enhanced DuctFitting with all required properties
 */
export function createEnhancedDuctFitting(
  id: string,
  type: 'transition' | 'elbow' | 'tee' | 'wye' | 'reducer' | 'cap',
  position: Vector3,
  inlet: ConnectionPoint,
  outlet: ConnectionPoint,
  material: string = 'galvanized_steel'
): DuctFitting {
  const fitting: DuctFitting = {
    id,
    type,
    position,
    rotation: new Euler(0, 0, 0),
    inlet,
    outlet,
    material,
    flowProperties: initializeFlowProperties('fitting'),
    connectionRelationships: initializeConnectionRelationships(),
    calculationState: initializeCalculationState(),
    pressureLossCoefficient: getPressureLossCoefficient(type),
    fittingGeometry: initializeFittingGeometry(type),
    smacnaCompliant: true,
    isAutoGenerated: false
  };

  return fitting;
}

/**
 * Create a connection point
 */
export function createConnectionPoint(
  id: string,
  position: Vector3,
  direction: Vector3,
  shape: 'rectangular' | 'round',
  dimensions?: { width?: number; height?: number; diameter?: number }
): ConnectionPoint {
  const connectionPoint: ConnectionPoint = {
    id,
    position,
    direction,
    shape,
    status: 'available'
  };

  if (shape === 'round') {
    connectionPoint.diameter = dimensions?.diameter || 12;
  } else {
    connectionPoint.width = dimensions?.width || 12;
    connectionPoint.height = dimensions?.height || 8;
  }

  return connectionPoint;
}

/**
 * Create connection points for equipment based on type
 */
function createEquipmentConnectionPoints(equipment: Equipment): ConnectionPoint[] {
  const points: ConnectionPoint[] = [];
  const { position, dimensions, type } = equipment;

  switch (type) {
    case 'Fan':
    case 'AHU':
      // Inlet on one side, outlet on the other
      points.push(
        createConnectionPoint(
          `${equipment.id}_inlet`,
          new Vector3(position.x - dimensions.depth / 2, position.y, position.z),
          new Vector3(-1, 0, 0),
          'rectangular',
          { width: 24, height: 24 }
        ),
        createConnectionPoint(
          `${equipment.id}_outlet`,
          new Vector3(position.x + dimensions.depth / 2, position.y, position.z),
          new Vector3(1, 0, 0),
          'rectangular',
          { width: 24, height: 24 }
        )
      );
      break;

    case 'VAV Box':
      // Inlet from main duct, outlet to zone
      points.push(
        createConnectionPoint(
          `${equipment.id}_inlet`,
          new Vector3(position.x, position.y, position.z + dimensions.depth / 2),
          new Vector3(0, 0, 1),
          'rectangular',
          { width: 12, height: 8 }
        ),
        createConnectionPoint(
          `${equipment.id}_outlet`,
          new Vector3(position.x, position.y, position.z - dimensions.depth / 2),
          new Vector3(0, 0, -1),
          'rectangular',
          { width: 12, height: 8 }
        )
      );
      break;

    case 'Damper':
      // Inline connection
      points.push(
        createConnectionPoint(
          `${equipment.id}_inlet`,
          new Vector3(position.x - dimensions.width / 2, position.y, position.z),
          new Vector3(-1, 0, 0),
          'rectangular',
          { width: 12, height: 8 }
        ),
        createConnectionPoint(
          `${equipment.id}_outlet`,
          new Vector3(position.x + dimensions.width / 2, position.y, position.z),
          new Vector3(1, 0, 0),
          'rectangular',
          { width: 12, height: 8 }
        )
      );
      break;

    default:
      // Generic equipment with single inlet/outlet
      points.push(
        createConnectionPoint(
          `${equipment.id}_connection`,
          position.clone(),
          new Vector3(0, 0, 1),
          'rectangular',
          { width: 12, height: 8 }
        )
      );
  }

  return points;
}

/**
 * Get pressure loss coefficient for fitting type
 */
function getPressureLossCoefficient(type: string): number {
  const coefficients: Record<string, number> = {
    'elbow': 0.25,      // 90-degree elbow
    'transition': 0.15,  // Gradual transition
    'tee': 0.75,        // Tee junction
    'wye': 0.5,         // Wye junction
    'reducer': 0.1,     // Gradual reducer
    'cap': 1.0          // End cap
  };

  return coefficients[type] || 0.2;
}

/**
 * Initialize fitting geometry based on type
 */
function initializeFittingGeometry(type: string): any {
  switch (type) {
    case 'elbow':
      return {
        bendRadius: 6, // inches
        angle: 90      // degrees
      };
    case 'tee':
    case 'wye':
      return {
        branchAngle: type === 'tee' ? 90 : 45 // degrees
      };
    case 'reducer':
      return {
        reductionRatio: 0.75 // Outlet/inlet ratio
      };
    default:
      return {};
  }
}

/**
 * Update element flow properties
 */
export function updateFlowProperties(
  element: DuctSegment | Equipment | DuctFitting,
  newProperties: Partial<FlowProperties>
): void {
  Object.assign(element.flowProperties, {
    ...newProperties,
    lastUpdated: new Date(),
    isCalculated: true
  });
}

/**
 * Mark element for recalculation
 */
export function markForRecalculation(element: DuctSegment | Equipment | DuctFitting): void {
  element.calculationState.needsRecalculation = true;
  element.calculationState.isCalculating = false;
  element.flowProperties.isCalculated = false;
}

/**
 * Check if element needs recalculation
 */
export function needsRecalculation(element: DuctSegment | Equipment | DuctFitting): boolean {
  return element.calculationState.needsRecalculation || !element.flowProperties.isCalculated;
}

/**
 * Get element dimensions for calculations
 */
export function getElementDimensions(element: DuctSegment | Equipment | DuctFitting): {
  area: number; // sq ft
  perimeter: number; // ft
  hydraulicDiameter: number; // ft
} {
  if ('shape' in element) {
    // DuctSegment
    if (element.shape === 'round') {
      const diameter = (element.diameter || 12) / 12; // Convert to feet
      const area = Math.PI * Math.pow(diameter / 2, 2);
      const perimeter = Math.PI * diameter;
      return {
        area,
        perimeter,
        hydraulicDiameter: diameter
      };
    } else {
      const width = (element.width || 12) / 12; // Convert to feet
      const height = (element.height || 8) / 12; // Convert to feet
      const area = width * height;
      const perimeter = 2 * (width + height);
      const hydraulicDiameter = (4 * area) / perimeter;
      return {
        area,
        perimeter,
        hydraulicDiameter
      };
    }
  } else {
    // Equipment or Fitting - use default rectangular dimensions
    const width = 12 / 12; // 1 ft
    const height = 8 / 12; // 0.67 ft
    const area = width * height;
    const perimeter = 2 * (width + height);
    const hydraulicDiameter = (4 * area) / perimeter;
    return {
      area,
      perimeter,
      hydraulicDiameter
    };
  }
}
