/**
 * DuctNode Model
 * Represents a point in the ductwork system with shape, size, and material metadata
 */

import { DuctShapeType } from './fitting-registry';

export interface DuctDimensions {
  // For round ducts
  diameter?: number;
  
  // For rectangular ducts
  width?: number;
  height?: number;
  
  // For oval ducts (future)
  majorAxis?: number;
  minorAxis?: number;
}

import { GaugeType, MaterialType } from './smacna-gauge-tables';

export interface DuctMaterial {
  type: MaterialType;
  gauge: GaugeType;
  finish?: 'standard' | 'painted' | 'weathered';
}

export interface DuctSystemProperties {
  pressure?: number; // inches of water column
  velocity?: number; // feet per minute
  temperature?: number; // degrees Fahrenheit
  application?: 'supply' | 'return' | 'exhaust' | 'fresh_air';
}

export class DuctNode {
  public readonly id: string;
  public readonly shapeType: DuctShapeType;
  public readonly dimensions: DuctDimensions;
  public readonly material: DuctMaterial;
  public readonly systemProperties?: DuctSystemProperties;
  public readonly position?: { x: number; y: number; z: number };
  public readonly metadata?: Record<string, any>;

  constructor(config: {
    id: string;
    shapeType: DuctShapeType;
    dimensions: DuctDimensions;
    material: DuctMaterial;
    systemProperties?: DuctSystemProperties;
    position?: { x: number; y: number; z: number };
    metadata?: Record<string, any>;
  }) {
    this.id = config.id;
    this.shapeType = config.shapeType;
    this.dimensions = config.dimensions;
    this.material = config.material;
    this.systemProperties = config.systemProperties;
    this.position = config.position;
    this.metadata = config.metadata;

    this.validate();
  }

  /**
   * Validate the duct node configuration
   */
  private validate(): void {
    switch (this.shapeType) {
      case 'round':
        if (!this.dimensions.diameter || this.dimensions.diameter <= 0) {
          throw new Error(`Round duct node ${this.id} requires valid diameter`);
        }
        break;
      
      case 'rectangular':
        if (!this.dimensions.width || !this.dimensions.height || 
            this.dimensions.width <= 0 || this.dimensions.height <= 0) {
          throw new Error(`Rectangular duct node ${this.id} requires valid width and height`);
        }
        break;
      
      case 'oval':
        if (!this.dimensions.majorAxis || !this.dimensions.minorAxis ||
            this.dimensions.majorAxis <= 0 || this.dimensions.minorAxis <= 0) {
          throw new Error(`Oval duct node ${this.id} requires valid major and minor axes`);
        }
        break;
      
      default:
        throw new Error(`Unsupported duct shape: ${this.shapeType}`);
    }
  }

  /**
   * Get the equivalent diameter for non-round ducts
   */
  getEquivalentDiameter(): number {
    switch (this.shapeType) {
      case 'round':
        return this.dimensions.diameter!;
      
      case 'rectangular':
        // Equivalent diameter for rectangular duct
        const { width, height } = this.dimensions;
        return 1.3 * Math.pow((width! * height!), 0.625) / Math.pow((width! + height!), 0.25);
      
      case 'oval':
        // Equivalent diameter for oval duct
        const { majorAxis, minorAxis } = this.dimensions;
        return Math.sqrt(majorAxis! * minorAxis!);
      
      default:
        throw new Error(`Cannot calculate equivalent diameter for shape: ${this.shapeType}`);
    }
  }

  /**
   * Get the cross-sectional area
   */
  getCrossSectionalArea(): number {
    switch (this.shapeType) {
      case 'round':
        const radius = this.dimensions.diameter! / 2;
        return Math.PI * radius * radius;
      
      case 'rectangular':
        return this.dimensions.width! * this.dimensions.height!;
      
      case 'oval':
        const a = this.dimensions.majorAxis! / 2;
        const b = this.dimensions.minorAxis! / 2;
        return Math.PI * a * b;
      
      default:
        throw new Error(`Cannot calculate area for shape: ${this.shapeType}`);
    }
  }

  /**
   * Get the perimeter
   */
  getPerimeter(): number {
    switch (this.shapeType) {
      case 'round':
        return Math.PI * this.dimensions.diameter!;
      
      case 'rectangular':
        return 2 * (this.dimensions.width! + this.dimensions.height!);
      
      case 'oval':
        // Approximation for oval perimeter
        const a = this.dimensions.majorAxis! / 2;
        const b = this.dimensions.minorAxis! / 2;
        return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      
      default:
        throw new Error(`Cannot calculate perimeter for shape: ${this.shapeType}`);
    }
  }

  /**
   * Check if this node is compatible with another node for fitting connections
   */
  isCompatibleWith(other: DuctNode): boolean {
    // Same shape type
    if (this.shapeType !== other.shapeType) return false;
    
    // Same material type (gauge can differ)
    if (this.material.type !== other.material.type) return false;
    
    // Dimensions must match within tolerance
    const tolerance = 0.1; // inches
    
    switch (this.shapeType) {
      case 'round':
        return Math.abs(this.dimensions.diameter! - other.dimensions.diameter!) <= tolerance;
      
      case 'rectangular':
        return Math.abs(this.dimensions.width! - other.dimensions.width!) <= tolerance &&
               Math.abs(this.dimensions.height! - other.dimensions.height!) <= tolerance;
      
      case 'oval':
        return Math.abs(this.dimensions.majorAxis! - other.dimensions.majorAxis!) <= tolerance &&
               Math.abs(this.dimensions.minorAxis! - other.dimensions.minorAxis!) <= tolerance;
      
      default:
        return false;
    }
  }

  /**
   * Create a copy of this node with modified properties
   */
  clone(overrides?: Partial<{
    id: string;
    shapeType: DuctShapeType;
    dimensions: Partial<DuctDimensions>;
    material: Partial<DuctMaterial>;
    systemProperties: Partial<DuctSystemProperties>;
    position: { x: number; y: number; z: number };
    metadata: Record<string, any>;
  }>): DuctNode {
    return new DuctNode({
      id: overrides?.id || this.id,
      shapeType: overrides?.shapeType || this.shapeType,
      dimensions: { ...this.dimensions, ...overrides?.dimensions },
      material: { ...this.material, ...overrides?.material },
      systemProperties: { ...this.systemProperties, ...overrides?.systemProperties },
      position: overrides?.position || this.position,
      metadata: { ...this.metadata, ...overrides?.metadata }
    });
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      shapeType: this.shapeType,
      dimensions: this.dimensions,
      material: this.material,
      systemProperties: this.systemProperties,
      position: this.position,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON representation
   */
  static fromJSON(json: Record<string, any>): DuctNode {
    return new DuctNode({
      id: json.id,
      shapeType: json.shapeType,
      dimensions: json.dimensions,
      material: json.material,
      systemProperties: json.systemProperties,
      position: json.position,
      metadata: json.metadata
    });
  }
}
