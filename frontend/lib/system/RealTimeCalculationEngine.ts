/**
 * Real-Time Calculation Engine
 * Automatically triggers and manages system-wide HVAC calculations
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import { SystemTopologyManager, SystemNode, SystemConnection } from './SystemTopologyManager';
import { DuctSegment, Equipment, DuctFitting, FlowProperties } from '@/components/3d/types/Canvas3DTypes';
import { updateFlowProperties, markForRecalculation, getElementDimensions } from './SystemDataUtils';

// Calculation event types
export type CalculationEventType = 
  | 'segment_added' 
  | 'segment_modified' 
  | 'segment_removed'
  | 'connection_created' 
  | 'connection_removed'
  | 'equipment_modified'
  | 'system_validation';

export interface CalculationEvent {
  type: CalculationEventType;
  elementId: string;
  timestamp: Date;
  triggeredBy: 'user_action' | 'system_update' | 'validation_check';
}

export interface CalculationResult {
  elementId: string;
  success: boolean;
  flowProperties: FlowProperties;
  warnings: string[];
  errors: string[];
  calculationTime: number; // milliseconds
}

export interface SystemCalculationResults {
  totalElements: number;
  calculatedElements: number;
  failedElements: number;
  totalCalculationTime: number;
  systemValid: boolean;
  results: Map<string, CalculationResult>;
  systemWarnings: string[];
  systemErrors: string[];
}

/**
 * Real-Time Calculation Engine
 * Manages automatic calculation triggering and system-wide flow analysis
 */
export class RealTimeCalculationEngine {
  private topologyManager: SystemTopologyManager;
  private calculationQueue: string[] = [];
  private isCalculating: boolean = false;
  private calculationTimeout: NodeJS.Timeout | null = null;
  private debounceDelay: number = 500; // milliseconds
  
  // Event callbacks
  private onCalculationStart?: (elementId: string) => void;
  private onCalculationComplete?: (result: CalculationResult) => void;
  private onSystemCalculationComplete?: (results: SystemCalculationResults) => void;
  private onCalculationError?: (elementId: string, error: string) => void;

  constructor(
    topologyManager: SystemTopologyManager,
    options?: {
      debounceDelay?: number;
      onCalculationStart?: (elementId: string) => void;
      onCalculationComplete?: (result: CalculationResult) => void;
      onSystemCalculationComplete?: (results: SystemCalculationResults) => void;
      onCalculationError?: (elementId: string, error: string) => void;
    }
  ) {
    this.topologyManager = topologyManager;
    this.debounceDelay = options?.debounceDelay || 500;
    this.onCalculationStart = options?.onCalculationStart;
    this.onCalculationComplete = options?.onCalculationComplete;
    this.onSystemCalculationComplete = options?.onSystemCalculationComplete;
    this.onCalculationError = options?.onCalculationError;
  }

  /**
   * Trigger calculations for a specific element
   */
  triggerCalculation(elementId: string, eventType: CalculationEventType = 'segment_modified'): void {
    // Add to calculation queue if not already present
    if (!this.calculationQueue.includes(elementId)) {
      this.calculationQueue.push(elementId);
    }

    // Mark element and dependencies for recalculation
    this.markElementAndDependenciesForRecalculation(elementId);

    // Debounce calculation execution
    this.debounceCalculation();
  }

  /**
   * Trigger system-wide recalculation
   */
  triggerSystemCalculation(): void {
    const nodes = this.topologyManager.getNodes();
    nodes.forEach((node, nodeId) => {
      markForRecalculation(node.element);
      if (!this.calculationQueue.includes(nodeId)) {
        this.calculationQueue.push(nodeId);
      }
    });

    this.debounceCalculation();
  }

  /**
   * Execute calculations for all queued elements
   */
  private async executeCalculations(): Promise<void> {
    if (this.isCalculating || this.calculationQueue.length === 0) {
      return;
    }

    this.isCalculating = true;
    const startTime = Date.now();
    const results = new Map<string, CalculationResult>();
    const systemWarnings: string[] = [];
    const systemErrors: string[] = [];

    try {
      // Get elements that need calculation in proper order
      const elementsToCalculate = this.getCalculationOrder();
      
      // Execute calculations in order
      for (const elementId of elementsToCalculate) {
        const node = this.topologyManager.getNodes().get(elementId);
        if (!node) continue;

        this.onCalculationStart?.(elementId);
        
        try {
          const result = await this.calculateElement(node);
          results.set(elementId, result);
          
          if (result.success) {
            // Update element with calculated properties
            updateFlowProperties(node.element, result.flowProperties);
            node.calculationState.needsRecalculation = false;
            node.calculationState.lastCalculated = new Date();
          } else {
            systemErrors.push(...result.errors);
          }
          
          systemWarnings.push(...result.warnings);
          this.onCalculationComplete?.(result);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
          this.onCalculationError?.(elementId, errorMessage);
          systemErrors.push(`${elementId}: ${errorMessage}`);
        }
      }

      // Validate system after calculations
      const validationResult = this.topologyManager.validateTopology();
      
      const systemResults: SystemCalculationResults = {
        totalElements: elementsToCalculate.length,
        calculatedElements: Array.from(results.values()).filter(r => r.success).length,
        failedElements: Array.from(results.values()).filter(r => !r.success).length,
        totalCalculationTime: Date.now() - startTime,
        systemValid: validationResult.isValid,
        results,
        systemWarnings: [...systemWarnings, ...validationResult.warnings.map(w => w.message)],
        systemErrors: [...systemErrors, ...validationResult.errors.map(e => e.message)]
      };

      this.onSystemCalculationComplete?.(systemResults);

    } finally {
      this.isCalculating = false;
      this.calculationQueue = [];
    }
  }

  /**
   * Calculate flow properties for a single element
   */
  private async calculateElement(node: SystemNode): Promise<CalculationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      let flowProperties: FlowProperties;

      switch (node.type) {
        case 'segment':
          flowProperties = await this.calculateSegmentFlow(node.element as DuctSegment, node);
          break;
        case 'equipment':
          flowProperties = await this.calculateEquipmentFlow(node.element as Equipment, node);
          break;
        case 'fitting':
          flowProperties = await this.calculateFittingFlow(node.element as DuctFitting, node);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Validate calculated properties
      this.validateCalculatedProperties(flowProperties, warnings, errors);

      return {
        elementId: node.id,
        success: errors.length === 0,
        flowProperties,
        warnings,
        errors,
        calculationTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      errors.push(errorMessage);

      return {
        elementId: node.id,
        success: false,
        flowProperties: node.element.flowProperties,
        warnings,
        errors,
        calculationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Calculate flow properties for a duct segment
   */
  private async calculateSegmentFlow(segment: DuctSegment, node: SystemNode): Promise<FlowProperties> {
    const dimensions = getElementDimensions(segment);
    
    // Get upstream airflow
    let airflow = 0;
    const upstreamConnections = this.getUpstreamConnections(node);
    
    if (upstreamConnections.length > 0) {
      // Sum airflow from upstream segments
      airflow = upstreamConnections.reduce((sum, connection) => {
        const upstreamNode = this.topologyManager.getNodes().get(connection.fromNodeId);
        return sum + (upstreamNode?.element.flowProperties.airflow || 0);
      }, 0);
    } else {
      // This might be a source segment, use design airflow or estimate
      airflow = segment.designConditions?.designAirflow || this.estimateSegmentAirflow(segment);
    }

    // Calculate velocity: V = Q / A (CFM / sq ft = FPM)
    const velocity = dimensions.area > 0 ? airflow / dimensions.area : 0;

    // Calculate pressure drop using Darcy-Weisbach equation
    const length = segment.start.distanceTo(segment.end) / 12; // Convert to feet
    const frictionRate = this.calculateFrictionRate(velocity, dimensions.hydraulicDiameter, segment.material);
    const pressureDrop = (frictionRate / 100) * length; // inches w.g.

    // Calculate Reynolds number
    const kinematicViscosity = 1.57e-4; // ft²/s for air at standard conditions
    const reynoldsNumber = (velocity / 60) * dimensions.hydraulicDiameter / kinematicViscosity;

    return {
      airflow,
      velocity,
      pressureDrop,
      frictionRate,
      reynoldsNumber,
      temperature: segment.flowProperties.temperature,
      density: segment.flowProperties.density,
      isCalculated: true,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate flow properties for equipment
   */
  private async calculateEquipmentFlow(equipment: Equipment, node: SystemNode): Promise<FlowProperties> {
    let airflow = 0;
    let pressureDrop = 0;

    if (equipment.isSource) {
      // Source equipment (fans, AHUs) - use capacity or current operating conditions
      airflow = equipment.operatingConditions.currentAirflow || equipment.properties.cfmCapacity;
      pressureDrop = equipment.properties.staticPressureCapacity || 0;
    } else {
      // Terminal or inline equipment - pass through upstream airflow
      const upstreamConnections = this.getUpstreamConnections(node);
      airflow = upstreamConnections.reduce((sum, connection) => {
        const upstreamNode = this.topologyManager.getNodes().get(connection.fromNodeId);
        return sum + (upstreamNode?.element.flowProperties.airflow || 0);
      }, 0);
      
      // Calculate pressure drop through equipment
      pressureDrop = (equipment.properties.pressureLossCoefficient || 0.1) * 
                    Math.pow(airflow / 1000, 2); // Simplified pressure loss calculation
    }

    const velocity = 0; // Equipment doesn't have a specific velocity
    
    return {
      airflow,
      velocity,
      pressureDrop,
      frictionRate: 0,
      reynoldsNumber: 0,
      temperature: equipment.flowProperties.temperature,
      density: equipment.flowProperties.density,
      isCalculated: true,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate flow properties for a fitting
   */
  private async calculateFittingFlow(fitting: DuctFitting, node: SystemNode): Promise<FlowProperties> {
    // Get upstream airflow
    const upstreamConnections = this.getUpstreamConnections(node);
    const airflow = upstreamConnections.reduce((sum, connection) => {
      const upstreamNode = this.topologyManager.getNodes().get(connection.fromNodeId);
      return sum + (upstreamNode?.element.flowProperties.airflow || 0);
    }, 0);

    // Estimate velocity based on fitting dimensions (use inlet dimensions)
    const inletArea = this.getConnectionPointArea(fitting.inlet);
    const velocity = inletArea > 0 ? airflow / inletArea : 0;

    // Calculate pressure drop through fitting using K-factor method
    const velocityPressure = Math.pow(velocity / 4005, 2); // inches w.g.
    const pressureDrop = fitting.pressureLossCoefficient * velocityPressure;

    return {
      airflow,
      velocity,
      pressureDrop,
      frictionRate: 0,
      reynoldsNumber: 0,
      temperature: fitting.flowProperties.temperature,
      density: fitting.flowProperties.density,
      isCalculated: true,
      lastUpdated: new Date()
    };
  }

  // Helper methods
  private debounceCalculation(): void {
    if (this.calculationTimeout) {
      clearTimeout(this.calculationTimeout);
    }
    
    this.calculationTimeout = setTimeout(() => {
      this.executeCalculations();
    }, this.debounceDelay);
  }

  private markElementAndDependenciesForRecalculation(elementId: string): void {
    const node = this.topologyManager.getNodes().get(elementId);
    if (!node) return;

    markForRecalculation(node.element);

    // Mark downstream elements for recalculation
    const downstreamConnections = this.getDownstreamConnections(node);
    downstreamConnections.forEach(connection => {
      this.markElementAndDependenciesForRecalculation(connection.toNodeId);
    });
  }

  private getCalculationOrder(): string[] {
    return this.topologyManager.getNodesNeedingRecalculation()
      .map(node => node.id);
  }

  private getUpstreamConnections(node: SystemNode): SystemConnection[] {
    const connections = this.topologyManager.getConnections();
    return Array.from(connections.values()).filter(conn => conn.toNodeId === node.id);
  }

  private getDownstreamConnections(node: SystemNode): SystemConnection[] {
    const connections = this.topologyManager.getConnections();
    return Array.from(connections.values()).filter(conn => conn.fromNodeId === node.id);
  }

  private estimateSegmentAirflow(segment: DuctSegment): number {
    // Estimate airflow based on segment size and type
    const dimensions = getElementDimensions(segment);
    const estimatedVelocity = segment.type === 'supply' ? 1200 : 800; // FPM
    return dimensions.area * estimatedVelocity;
  }

  private calculateFrictionRate(velocity: number, hydraulicDiameter: number, material: string): number {
    // Simplified friction rate calculation based on SMACNA standards
    const roughness = this.getMaterialRoughness(material);
    const reynoldsNumber = (velocity / 60) * hydraulicDiameter / 1.57e-4;
    
    // Simplified Colebrook equation approximation
    const frictionFactor = 0.25 / Math.pow(
      Math.log10(roughness / (3.7 * hydraulicDiameter) + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2
    );
    
    // Convert to friction rate (inches w.g. per 100 ft)
    return frictionFactor * Math.pow(velocity / 4005, 2) * 100;
  }

  private getMaterialRoughness(material: string): number {
    const roughnessValues: Record<string, number> = {
      'galvanized_steel': 0.0005,
      'aluminum': 0.0003,
      'stainless_steel': 0.0002,
      'pvc': 0.0001,
      'fiberglass': 0.0003
    };
    return roughnessValues[material] || 0.0005;
  }

  private getConnectionPointArea(connectionPoint: any): number {
    if (connectionPoint.shape === 'round') {
      const radius = (connectionPoint.diameter || 12) / 24; // Convert to feet
      return Math.PI * radius * radius;
    } else {
      const width = (connectionPoint.width || 12) / 12; // Convert to feet
      const height = (connectionPoint.height || 8) / 12; // Convert to feet
      return width * height;
    }
  }

  private validateCalculatedProperties(properties: FlowProperties, warnings: string[], errors: string[]): void {
    // Validate velocity limits
    if (properties.velocity > 2500) {
      warnings.push(`High velocity: ${properties.velocity.toFixed(0)} FPM exceeds recommended limit of 2500 FPM`);
    }
    if (properties.velocity < 300 && properties.airflow > 0) {
      warnings.push(`Low velocity: ${properties.velocity.toFixed(0)} FPM may cause poor air distribution`);
    }

    // Validate pressure drop
    if (properties.pressureDrop > 0.5) {
      warnings.push(`High pressure drop: ${properties.pressureDrop.toFixed(3)} in. w.g. exceeds recommended limit`);
    }

    // Validate airflow
    if (properties.airflow < 0) {
      errors.push('Negative airflow calculated - check system connections');
    }
  }
}
