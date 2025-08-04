/**
 * System Topology Manager
 * Manages the complete HVAC ductwork system topology with real-time connectivity tracking
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import { Vector3 } from 'three';
import { DuctSegment, Equipment, DuctFitting, ConnectionPoint } from '@/components/3d/types/Canvas3DTypes';

// Enhanced interfaces for system topology
export interface SystemNode {
  id: string;
  type: 'segment' | 'equipment' | 'fitting';
  element: DuctSegment | Equipment | DuctFitting;
  connections: Map<string, SystemConnection>; // connectionPointId -> SystemConnection
  flowProperties: FlowProperties;
  calculationState: CalculationState;
}

export interface SystemConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromConnectionPointId: string;
  toConnectionPointId: string;
  connectionType: 'direct' | 'fitting_required' | 'invalid';
  distance: number;
  requiredFitting?: DuctFitting;
  flowDirection: 'forward' | 'reverse' | 'bidirectional';
}

export interface FlowProperties {
  airflow: number; // CFM
  velocity: number; // FPM
  pressureDrop: number; // inches w.g.
  temperature: number; // °F
  density: number; // lb/ft³
  isCalculated: boolean;
  lastUpdated: Date;
}

export interface CalculationState {
  needsRecalculation: boolean;
  isCalculating: boolean;
  lastCalculated: Date | null;
  calculationDependencies: string[]; // Node IDs that affect this node's calculations
  calculationOrder: number; // Order in which this node should be calculated
}

export interface SystemPath {
  id: string;
  nodeIds: string[];
  totalLength: number;
  totalPressureDrop: number;
  pathType: 'supply' | 'return' | 'exhaust';
  sourceEquipmentId?: string;
  terminalEquipmentIds: string[];
}

export interface TopologyValidationResult {
  isValid: boolean;
  errors: TopologyError[];
  warnings: TopologyWarning[];
  isolatedNodes: string[];
  disconnectedPaths: SystemPath[];
}

export interface TopologyError {
  id: string;
  type: 'missing_connection' | 'invalid_connection' | 'flow_imbalance' | 'pressure_violation';
  nodeId: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
}

export interface TopologyWarning {
  id: string;
  type: 'suboptimal_connection' | 'efficiency_concern' | 'maintenance_access';
  nodeId: string;
  message: string;
  recommendation?: string;
}

/**
 * SystemTopologyManager - Core class for managing HVAC system topology
 */
export class SystemTopologyManager {
  private nodes: Map<string, SystemNode> = new Map();
  private connections: Map<string, SystemConnection> = new Map();
  private systemPaths: Map<string, SystemPath> = new Map();
  private calculationQueue: string[] = [];
  private isCalculating: boolean = false;
  
  // Event callbacks
  private onTopologyChange?: (changeType: string, nodeId: string) => void;
  private onCalculationComplete?: (nodeId: string, results: FlowProperties) => void;
  private onValidationUpdate?: (results: TopologyValidationResult) => void;

  constructor(
    onTopologyChange?: (changeType: string, nodeId: string) => void,
    onCalculationComplete?: (nodeId: string, results: FlowProperties) => void,
    onValidationUpdate?: (results: TopologyValidationResult) => void
  ) {
    this.onTopologyChange = onTopologyChange;
    this.onCalculationComplete = onCalculationComplete;
    this.onValidationUpdate = onValidationUpdate;
  }

  /**
   * Add a node to the system topology
   */
  addNode(element: DuctSegment | Equipment | DuctFitting): SystemNode {
    const nodeType = this.determineNodeType(element);
    const node: SystemNode = {
      id: element.id,
      type: nodeType,
      element,
      connections: new Map(),
      flowProperties: this.initializeFlowProperties(element),
      calculationState: {
        needsRecalculation: true,
        isCalculating: false,
        lastCalculated: null,
        calculationDependencies: [],
        calculationOrder: 0
      }
    };

    this.nodes.set(element.id, node);
    this.updateCalculationOrder();
    this.onTopologyChange?.('node_added', element.id);
    
    return node;
  }

  /**
   * Remove a node from the system topology
   */
  removeNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all connections involving this node
    const connectionsToRemove: string[] = [];
    this.connections.forEach((connection, connectionId) => {
      if (connection.fromNodeId === nodeId || connection.toNodeId === nodeId) {
        connectionsToRemove.push(connectionId);
      }
    });

    connectionsToRemove.forEach(connectionId => {
      this.connections.delete(connectionId);
    });

    // Remove from calculation dependencies
    this.nodes.forEach(otherNode => {
      otherNode.calculationState.calculationDependencies = 
        otherNode.calculationState.calculationDependencies.filter(id => id !== nodeId);
    });

    this.nodes.delete(nodeId);
    this.updateCalculationOrder();
    this.onTopologyChange?.('node_removed', nodeId);
    
    return true;
  }

  /**
   * Update a node's element data
   */
  updateNode(nodeId: string, element: DuctSegment | Equipment | DuctFitting): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const oldElement = node.element;
    node.element = element;
    
    // Check if update affects connections
    const connectionsChanged = this.checkConnectionsAfterUpdate(oldElement, element);
    
    if (connectionsChanged) {
      this.rebuildConnections(nodeId);
    }

    // Mark for recalculation
    this.markForRecalculation(nodeId);
    this.onTopologyChange?.('node_updated', nodeId);
    
    return true;
  }

  /**
   * Create a connection between two nodes
   */
  createConnection(
    fromNodeId: string,
    toNodeId: string,
    fromConnectionPointId: string,
    toConnectionPointId: string
  ): SystemConnection | null {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    
    if (!fromNode || !toNode) return null;

    const fromPoint = this.getConnectionPoint(fromNode.element, fromConnectionPointId);
    const toPoint = this.getConnectionPoint(toNode.element, toConnectionPointId);
    
    if (!fromPoint || !toPoint) return null;

    const distance = fromPoint.position.distanceTo(toPoint.position);
    const connectionType = this.determineConnectionType(fromPoint, toPoint, distance);
    
    const connection: SystemConnection = {
      id: `${fromNodeId}_${toNodeId}_${Date.now()}`,
      fromNodeId,
      toNodeId,
      fromConnectionPointId,
      toConnectionPointId,
      connectionType,
      distance,
      flowDirection: this.determineFlowDirection(fromNode, toNode)
    };

    // Add fitting if required
    if (connectionType === 'fitting_required') {
      connection.requiredFitting = this.generateRequiredFitting(fromPoint, toPoint);
    }

    this.connections.set(connection.id, connection);
    fromNode.connections.set(fromConnectionPointId, connection);
    toNode.connections.set(toConnectionPointId, connection);

    // Update calculation dependencies
    this.updateCalculationDependencies(fromNodeId, toNodeId);
    this.markForRecalculation(fromNodeId);
    this.markForRecalculation(toNodeId);
    
    this.onTopologyChange?.('connection_created', fromNodeId);
    
    return connection;
  }

  /**
   * Remove a connection between nodes
   */
  removeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    const fromNode = this.nodes.get(connection.fromNodeId);
    const toNode = this.nodes.get(connection.toNodeId);

    if (fromNode) {
      fromNode.connections.delete(connection.fromConnectionPointId);
    }
    if (toNode) {
      toNode.connections.delete(connection.toConnectionPointId);
    }

    this.connections.delete(connectionId);
    
    // Update calculation dependencies
    this.updateCalculationDependencies(connection.fromNodeId, connection.toNodeId);
    this.markForRecalculation(connection.fromNodeId);
    this.markForRecalculation(connection.toNodeId);
    
    this.onTopologyChange?.('connection_removed', connection.fromNodeId);
    
    return true;
  }

  /**
   * Get all nodes in the system
   */
  getNodes(): Map<string, SystemNode> {
    return new Map(this.nodes);
  }

  /**
   * Get all connections in the system
   */
  getConnections(): Map<string, SystemConnection> {
    return new Map(this.connections);
  }

  /**
   * Get nodes that need recalculation
   */
  getNodesNeedingRecalculation(): SystemNode[] {
    return Array.from(this.nodes.values())
      .filter(node => node.calculationState.needsRecalculation)
      .sort((a, b) => a.calculationState.calculationOrder - b.calculationState.calculationOrder);
  }

  /**
   * Mark a node for recalculation
   */
  markForRecalculation(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.calculationState.needsRecalculation = true;
    node.flowProperties.isCalculated = false;

    // Mark dependent nodes for recalculation
    this.nodes.forEach(otherNode => {
      if (otherNode.calculationState.calculationDependencies.includes(nodeId)) {
        this.markForRecalculation(otherNode.id);
      }
    });
  }

  /**
   * Validate the current system topology
   */
  validateTopology(): TopologyValidationResult {
    const errors: TopologyError[] = [];
    const warnings: TopologyWarning[] = [];
    const isolatedNodes: string[] = [];
    const disconnectedPaths: SystemPath[] = [];

    // Check for isolated nodes
    this.nodes.forEach(node => {
      if (node.connections.size === 0) {
        isolatedNodes.push(node.id);
      }
    });

    // Check for invalid connections
    this.connections.forEach(connection => {
      if (connection.connectionType === 'invalid') {
        errors.push({
          id: `invalid_connection_${connection.id}`,
          type: 'invalid_connection',
          nodeId: connection.fromNodeId,
          message: `Invalid connection between ${connection.fromNodeId} and ${connection.toNodeId}`,
          severity: 'error'
        });
      }
    });

    // Check for flow balance issues
    this.validateFlowBalance(errors, warnings);

    // Check for pressure violations
    this.validatePressureLimits(errors, warnings);

    const result: TopologyValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      isolatedNodes,
      disconnectedPaths
    };

    this.onValidationUpdate?.(result);
    return result;
  }

  // Private helper methods
  private determineNodeType(element: any): 'segment' | 'equipment' | 'fitting' {
    if ('start' in element && 'end' in element) return 'segment';
    if ('properties' in element && 'cfmCapacity' in element.properties) return 'equipment';
    return 'fitting';
  }

  private initializeFlowProperties(element: any): FlowProperties {
    return {
      airflow: 0,
      velocity: 0,
      pressureDrop: 0,
      temperature: 70, // Standard temperature
      density: 0.075, // Standard air density lb/ft³
      isCalculated: false,
      lastUpdated: new Date()
    };
  }

  private updateCalculationOrder(): void {
    // Implement topological sort for calculation order
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) return; // Circular dependency
      if (visited.has(nodeId)) return;

      temp.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        node.calculationState.calculationDependencies.forEach(depId => {
          visit(depId);
        });
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    this.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });

    // Assign calculation order
    order.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.calculationState.calculationOrder = index;
      }
    });
  }

  private checkConnectionsAfterUpdate(oldElement: any, newElement: any): boolean {
    // Check if connection points have changed
    return JSON.stringify(oldElement.inlet) !== JSON.stringify(newElement.inlet) ||
           JSON.stringify(oldElement.outlet) !== JSON.stringify(newElement.outlet);
  }

  private rebuildConnections(nodeId: string): void {
    // Implementation for rebuilding connections after node update
    // This would check all existing connections and validate they're still valid
  }

  private getConnectionPoint(element: any, pointId: string): ConnectionPoint | null {
    if ('inlet' in element && element.inlet?.id === pointId) return element.inlet;
    if ('outlet' in element && element.outlet?.id === pointId) return element.outlet;
    if ('connectionPoints' in element) {
      return element.connectionPoints.find((cp: ConnectionPoint) => cp.id === pointId) || null;
    }
    return null;
  }

  private determineConnectionType(
    fromPoint: ConnectionPoint,
    toPoint: ConnectionPoint,
    distance: number
  ): 'direct' | 'fitting_required' | 'invalid' {
    const tolerance = 0.5; // inches
    
    if (distance <= tolerance) {
      // Check shape compatibility
      if (fromPoint.shape === toPoint.shape) {
        return 'direct';
      } else {
        return 'fitting_required'; // Transition fitting needed
      }
    } else if (distance <= 12) { // Within 12 inches
      return 'fitting_required'; // Extension or elbow needed
    } else {
      return 'invalid'; // Too far apart
    }
  }

  private determineFlowDirection(fromNode: SystemNode, toNode: SystemNode): 'forward' | 'reverse' | 'bidirectional' {
    // Determine flow direction based on node types and system logic
    if (fromNode.type === 'equipment' && toNode.type === 'segment') return 'forward';
    if (fromNode.type === 'segment' && toNode.type === 'equipment') return 'reverse';
    return 'forward'; // Default for segment-to-segment connections
  }

  private generateRequiredFitting(fromPoint: ConnectionPoint, toPoint: ConnectionPoint): DuctFitting {
    // Generate appropriate fitting based on connection requirements
    const fittingId = `fitting_${Date.now()}`;
    const midpoint = new Vector3().addVectors(fromPoint.position, toPoint.position).multiplyScalar(0.5);
    
    return {
      id: fittingId,
      type: fromPoint.shape !== toPoint.shape ? 'transition' : 'elbow',
      position: midpoint,
      rotation: new Vector3(0, 0, 0) as any,
      inlet: { ...fromPoint, id: `${fittingId}_inlet` },
      outlet: { ...toPoint, id: `${fittingId}_outlet` },
      material: 'galvanized_steel',
      flowProperties: this.initializeFlowProperties('fitting'),
      connectionRelationships: {
        upstreamSegments: [],
        downstreamSegments: [],
        connectedEquipment: [],
        connectedFittings: [],
        flowPath: [],
        branchLevel: 0
      },
      calculationState: {
        needsRecalculation: false,
        isCalculating: false,
        lastCalculated: null,
        calculationDependencies: [],
        calculationOrder: 0,
        validationWarnings: [],
        calculationErrors: []
      },
      pressureLossCoefficient: 0.1,
      fittingCategory: 'standard',
      installationNotes: '',
      isValidated: false
    };
  }

  private updateCalculationDependencies(fromNodeId: string, toNodeId: string): void {
    const toNode = this.nodes.get(toNodeId);
    if (toNode && !toNode.calculationState.calculationDependencies.includes(fromNodeId)) {
      toNode.calculationState.calculationDependencies.push(fromNodeId);
    }
  }

  private validateFlowBalance(errors: TopologyError[], warnings: TopologyWarning[]): void {
    // Implementation for flow balance validation
    // Check that airflow in = airflow out for each node
  }

  private validatePressureLimits(errors: TopologyError[], warnings: TopologyWarning[]): void {
    // Implementation for pressure limit validation
    // Check SMACNA pressure limits and system constraints
  }
}
