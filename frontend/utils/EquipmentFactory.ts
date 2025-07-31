import { Vector3, Euler } from 'three';

// Equipment interfaces (imported from Canvas3D)
export interface Equipment {
  id: string;
  type: 'Fan' | 'AHU' | 'VAV Box' | 'Damper' | 'Filter' | 'Coil' | 'Custom';
  position: Vector3;
  rotation: Euler;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  properties: {
    cfmCapacity: number;
    staticPressureCapacity: number;
    model?: string;
    manufacturer?: string;
    powerConsumption?: number;
  };
  material: string;
  connectionPoints: ConnectionPoint[];
}

export interface ConnectionPoint {
  id: string;
  position: Vector3;
  direction: Vector3;
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  status: 'available' | 'connected' | 'blocked';
  connectedTo?: string;
}

/**
 * Factory class for creating equipment with automatic connection point generation
 * Follows HVAC industry standards for equipment connectivity
 */
export class EquipmentFactory {
  /**
   * Creates a new equipment instance with automatic connection points
   * @param position - 3D position for equipment placement
   * @param equipmentType - Type of equipment to create
   * @returns Complete equipment object with connection points
   */
  static createEquipment(
    position: { x: number; y: number; z: number },
    equipmentType: Equipment['type'] = 'Fan'
  ): Equipment {
    const baseEquipment: Omit<Equipment, 'connectionPoints'> = {
      id: `equipment-${Date.now()}`,
      type: equipmentType,
      position: new Vector3(position.x, position.y, position.z),
      rotation: new Euler(0, 0, 0),
      dimensions: this.getEquipmentDimensions(equipmentType),
      properties: this.getEquipmentProperties(equipmentType),
      material: 'Steel'
    };

    // Generate connection points based on equipment type
    const connectionPoints = this.generateConnectionPoints(baseEquipment);

    return {
      ...baseEquipment,
      connectionPoints
    };
  }

  /**
   * Gets standard dimensions for equipment type
   */
  private static getEquipmentDimensions(type: Equipment['type']) {
    const dimensionMap = {
      'Fan': { width: 2, height: 2, depth: 2 },
      'AHU': { width: 4, height: 3, depth: 2 },
      'VAV Box': { width: 1.5, height: 1.5, depth: 1 },
      'Damper': { width: 1, height: 1, depth: 0.5 },
      'Filter': { width: 2, height: 2, depth: 0.5 },
      'Coil': { width: 2, height: 2, depth: 1 },
      'Custom': { width: 2, height: 2, depth: 2 }
    };
    return dimensionMap[type];
  }

  /**
   * Gets standard properties for equipment type
   */
  private static getEquipmentProperties(type: Equipment['type']) {
    const propertiesMap = {
      'Fan': {
        cfmCapacity: 1000,
        staticPressureCapacity: 2.0,
        model: 'Standard Fan',
        manufacturer: 'Generic',
        powerConsumption: 5.0
      },
      'AHU': {
        cfmCapacity: 5000,
        staticPressureCapacity: 4.0,
        model: 'Standard AHU',
        manufacturer: 'Generic',
        powerConsumption: 25.0
      },
      'VAV Box': {
        cfmCapacity: 500,
        staticPressureCapacity: 1.0,
        model: 'Standard VAV',
        manufacturer: 'Generic',
        powerConsumption: 2.0
      },
      'Damper': {
        cfmCapacity: 1000,
        staticPressureCapacity: 0.5,
        model: 'Standard Damper',
        manufacturer: 'Generic',
        powerConsumption: 0.1
      },
      'Filter': {
        cfmCapacity: 2000,
        staticPressureCapacity: 1.5,
        model: 'Standard Filter',
        manufacturer: 'Generic',
        powerConsumption: 0.0
      },
      'Coil': {
        cfmCapacity: 2000,
        staticPressureCapacity: 2.5,
        model: 'Standard Coil',
        manufacturer: 'Generic',
        powerConsumption: 15.0
      },
      'Custom': {
        cfmCapacity: 1000,
        staticPressureCapacity: 1.0,
        model: 'Custom Equipment',
        manufacturer: 'Generic',
        powerConsumption: 5.0
      }
    };
    return propertiesMap[type];
  }

  /**
   * Generates connection points based on equipment type and dimensions
   */
  private static generateConnectionPoints(equipment: Omit<Equipment, 'connectionPoints'>): ConnectionPoint[] {
    const connectionPoints: ConnectionPoint[] = [];
    const { position, dimensions, id } = equipment;

    // Calculate connection point diameter based on equipment size
    const connectionDiameter = Math.min(dimensions.width, dimensions.height) * 0.8;

    switch (equipment.type) {
      case 'Fan':
        // Fan has inlet and outlet
        connectionPoints.push(
          {
            id: `${id}-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: connectionDiameter,
            status: 'available'
          },
          {
            id: `${id}-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: connectionDiameter,
            status: 'available'
          }
        );
        break;

      case 'AHU':
        // AHU has return air inlet, outside air inlet, and supply air outlet
        connectionPoints.push(
          {
            id: `${id}-return-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.8,
            height: dimensions.height * 0.6,
            status: 'available'
          },
          {
            id: `${id}-outside-inlet`,
            position: new Vector3(position.x, position.y, position.z - dimensions.depth / 2),
            direction: new Vector3(0, 0, 1),
            shape: 'rectangular',
            width: dimensions.width * 0.4,
            height: dimensions.height * 0.4,
            status: 'available'
          },
          {
            id: `${id}-supply-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.8,
            height: dimensions.height * 0.6,
            status: 'available'
          }
        );
        break;

      case 'VAV Box':
        // VAV Box has inlet and outlet
        connectionPoints.push(
          {
            id: `${id}-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: connectionDiameter,
            status: 'available'
          },
          {
            id: `${id}-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'round',
            diameter: connectionDiameter,
            status: 'available'
          }
        );
        break;

      case 'Damper':
        // Damper has inlet and outlet (inline)
        connectionPoints.push(
          {
            id: `${id}-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width,
            height: dimensions.height,
            status: 'available'
          },
          {
            id: `${id}-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width,
            height: dimensions.height,
            status: 'available'
          }
        );
        break;

      case 'Filter':
      case 'Coil':
        // Filter and Coil have inlet and outlet (inline)
        connectionPoints.push(
          {
            id: `${id}-inlet`,
            position: new Vector3(position.x - dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.9,
            height: dimensions.height * 0.9,
            status: 'available'
          },
          {
            id: `${id}-outlet`,
            position: new Vector3(position.x + dimensions.width / 2, position.y, position.z),
            direction: new Vector3(1, 0, 0),
            shape: 'rectangular',
            width: dimensions.width * 0.9,
            height: dimensions.height * 0.9,
            status: 'available'
          }
        );
        break;

      case 'Custom':
        // Custom equipment with single connection point
        connectionPoints.push({
          id: `${id}-connection`,
          position: new Vector3(position.x, position.y, position.z + dimensions.depth / 2),
          direction: new Vector3(0, 0, 1),
          shape: 'rectangular',
          width: dimensions.width * 0.5,
          height: dimensions.height * 0.5,
          status: 'available'
        });
        break;
    }

    return connectionPoints;
  }
}
