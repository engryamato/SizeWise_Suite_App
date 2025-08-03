/**
 * System Flow Calculator
 * Handles airflow distribution, pressure accumulation, and equipment capacity constraints
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import { SystemTopologyManager, SystemNode, SystemConnection, SystemPath } from './SystemTopologyManager';
import { DuctSegment, Equipment, DuctFitting, FlowProperties } from '@/components/3d/types/Canvas3DTypes';
import { getElementDimensions } from './SystemDataUtils';

export interface FlowDistributionResult {
  nodeId: string;
  inletFlow: number; // CFM
  outletFlow: number; // CFM
  flowSplit: Map<string, number>; // connectionId -> CFM
  pressureAtInlet: number; // inches w.g.
  pressureAtOutlet: number; // inches w.g.
  isBalanced: boolean;
  warnings: string[];
}

export interface SystemFlowAnalysis {
  totalSystemFlow: number; // CFM
  systemPressureDrop: number; // inches w.g.
  flowPaths: SystemPath[];
  flowDistribution: Map<string, FlowDistributionResult>;
  equipmentLoading: Map<string, number>; // equipmentId -> load percentage
  systemEfficiency: number; // 0-1
  balanceErrors: string[];
  capacityViolations: string[];
}

export interface BranchFlowData {
  branchId: string;
  parentNodeId: string;
  childNodeIds: string[];
  totalDemand: number; // CFM
  availableFlow: number; // CFM
  flowSplit: Map<string, number>; // childNodeId -> CFM
  pressureLoss: number; // inches w.g.
}

/**
 * System Flow Calculator
 * Manages airflow distribution and pressure calculations across the entire HVAC system
 */
export class SystemFlowCalculator {
  private topologyManager: SystemTopologyManager;
  private flowPaths: Map<string, SystemPath> = new Map();
  private branchData: Map<string, BranchFlowData> = new Map();

  constructor(topologyManager: SystemTopologyManager) {
    this.topologyManager = topologyManager;
  }

  /**
   * Perform complete system flow analysis
   */
  analyzeSystemFlow(): SystemFlowAnalysis {
    // Build flow paths from sources to terminals
    this.buildFlowPaths();
    
    // Calculate flow distribution
    const flowDistribution = this.calculateFlowDistribution();
    
    // Analyze equipment loading
    const equipmentLoading = this.analyzeEquipmentLoading();
    
    // Calculate system metrics
    const systemMetrics = this.calculateSystemMetrics(flowDistribution, equipmentLoading);
    
    return {
      totalSystemFlow: systemMetrics.totalFlow,
      systemPressureDrop: systemMetrics.totalPressureDrop,
      flowPaths: Array.from(this.flowPaths.values()),
      flowDistribution,
      equipmentLoading,
      systemEfficiency: systemMetrics.efficiency,
      balanceErrors: systemMetrics.balanceErrors,
      capacityViolations: systemMetrics.capacityViolations
    };
  }

  /**
   * Calculate airflow distribution for branch connections
   */
  calculateBranchFlow(parentNodeId: string, childNodeIds: string[]): BranchFlowData {
    const parentNode = this.topologyManager.getNodes().get(parentNodeId);
    if (!parentNode) {
      throw new Error(`Parent node ${parentNodeId} not found`);
    }

    // Get available flow from parent
    const availableFlow = parentNode.element.flowProperties.airflow;
    
    // Calculate demand from each child branch
    const childDemands = new Map<string, number>();
    let totalDemand = 0;

    childNodeIds.forEach(childId => {
      const demand = this.calculateBranchDemand(childId);
      childDemands.set(childId, demand);
      totalDemand += demand;
    });

    // Distribute flow based on demand ratios
    const flowSplit = new Map<string, number>();
    if (totalDemand > 0) {
      childNodeIds.forEach(childId => {
        const demand = childDemands.get(childId) || 0;
        const flowRatio = demand / totalDemand;
        const allocatedFlow = availableFlow * flowRatio;
        flowSplit.set(childId, allocatedFlow);
      });
    }

    // Calculate pressure loss through branch
    const pressureLoss = this.calculateBranchPressureLoss(parentNode, childNodeIds, flowSplit);

    const branchData: BranchFlowData = {
      branchId: `branch_${parentNodeId}`,
      parentNodeId,
      childNodeIds,
      totalDemand,
      availableFlow,
      flowSplit,
      pressureLoss
    };

    this.branchData.set(branchData.branchId, branchData);
    return branchData;
  }

  /**
   * Calculate pressure accumulation along a flow path
   */
  calculatePathPressure(pathNodeIds: string[]): number {
    let totalPressureDrop = 0;
    
    for (let i = 0; i < pathNodeIds.length; i++) {
      const nodeId = pathNodeIds[i];
      const node = this.topologyManager.getNodes().get(nodeId);
      
      if (!node) continue;
      
      // Add pressure drop from this element
      totalPressureDrop += node.element.flowProperties.pressureDrop;
      
      // Add pressure loss from connection to next element
      if (i < pathNodeIds.length - 1) {
        const nextNodeId = pathNodeIds[i + 1];
        const connection = this.findConnection(nodeId, nextNodeId);
        if (connection) {
          totalPressureDrop += this.calculateConnectionPressureLoss(connection);
        }
      }
    }
    
    return totalPressureDrop;
  }

  /**
   * Validate equipment capacity constraints
   */
  validateEquipmentCapacity(): string[] {
    const violations: string[] = [];
    const nodes = this.topologyManager.getNodes();
    
    nodes.forEach(node => {
      if (node.type === 'equipment') {
        const equipment = node.element as Equipment;
        const currentFlow = equipment.flowProperties.airflow;
        const capacity = equipment.properties.cfmCapacity;
        
        if (currentFlow > capacity * 1.1) { // 10% tolerance
          violations.push(
            `Equipment ${equipment.id} (${equipment.type}) is overloaded: ` +
            `${currentFlow.toFixed(0)} CFM exceeds capacity of ${capacity} CFM`
          );
        }
        
        // Check pressure capacity for source equipment
        if (equipment.isSource) {
          const systemPressure = this.calculateDownstreamPressure(node.id);
          const pressureCapacity = equipment.properties.staticPressureCapacity;
          
          if (systemPressure > pressureCapacity * 1.05) { // 5% tolerance
            violations.push(
              `Equipment ${equipment.id} pressure capacity exceeded: ` +
              `${systemPressure.toFixed(3)} in. w.g. exceeds capacity of ${pressureCapacity} in. w.g.`
            );
          }
        }
      }
    });
    
    return violations;
  }

  /**
   * Balance system airflow
   */
  balanceSystemFlow(): Map<string, number> {
    const adjustments = new Map<string, number>();
    const nodes = this.topologyManager.getNodes();
    
    // Find source equipment
    const sourceNodes = Array.from(nodes.values()).filter(node => 
      node.type === 'equipment' && (node.element as Equipment).isSource
    );
    
    // Calculate total system demand
    const totalDemand = this.calculateTotalSystemDemand();
    
    // Distribute load among source equipment
    sourceNodes.forEach(sourceNode => {
      const equipment = sourceNode.element as Equipment;
      const capacity = equipment.properties.cfmCapacity;
      const currentFlow = equipment.flowProperties.airflow;
      
      // Calculate required flow based on capacity ratio
      const capacityRatio = capacity / sourceNodes.reduce((sum, node) => 
        sum + (node.element as Equipment).properties.cfmCapacity, 0
      );
      const requiredFlow = totalDemand * capacityRatio;
      
      if (Math.abs(currentFlow - requiredFlow) > 10) { // 10 CFM tolerance
        adjustments.set(sourceNode.id, requiredFlow - currentFlow);
      }
    });
    
    return adjustments;
  }

  // Private helper methods
  private buildFlowPaths(): void {
    this.flowPaths.clear();
    const nodes = this.topologyManager.getNodes();
    
    // Find source equipment (fans, AHUs)
    const sourceNodes = Array.from(nodes.values()).filter(node => 
      node.type === 'equipment' && (node.element as Equipment).isSource
    );
    
    // Build paths from each source to all terminals
    sourceNodes.forEach(sourceNode => {
      const paths = this.findPathsFromSource(sourceNode.id);
      paths.forEach((path, index) => {
        const pathId = `${sourceNode.id}_path_${index}`;
        this.flowPaths.set(pathId, {
          id: pathId,
          nodeIds: path,
          totalLength: this.calculatePathLength(path),
          totalPressureDrop: this.calculatePathPressure(path),
          pathType: this.determinePathType(path),
          sourceEquipmentId: sourceNode.id,
          terminalEquipmentIds: this.findTerminalEquipment(path)
        });
      });
    });
  }

  private calculateFlowDistribution(): Map<string, FlowDistributionResult> {
    const distribution = new Map<string, FlowDistributionResult>();
    const nodes = this.topologyManager.getNodes();
    
    nodes.forEach(node => {
      const inletConnections = this.getInletConnections(node.id);
      const outletConnections = this.getOutletConnections(node.id);
      
      const inletFlow = inletConnections.reduce((sum, conn) => {
        const upstreamNode = nodes.get(conn.fromNodeId);
        return sum + (upstreamNode?.element.flowProperties.airflow || 0);
      }, 0);
      
      const outletFlow = node.element.flowProperties.airflow;
      const flowSplit = new Map<string, number>();
      
      // Calculate flow split for outlets
      if (outletConnections.length > 1) {
        const totalOutletDemand = outletConnections.reduce((sum, conn) => {
          return sum + this.calculateBranchDemand(conn.toNodeId);
        }, 0);
        
        outletConnections.forEach(conn => {
          const demand = this.calculateBranchDemand(conn.toNodeId);
          const flowRatio = totalOutletDemand > 0 ? demand / totalOutletDemand : 1 / outletConnections.length;
          flowSplit.set(conn.id, outletFlow * flowRatio);
        });
      } else if (outletConnections.length === 1) {
        flowSplit.set(outletConnections[0].id, outletFlow);
      }
      
      const isBalanced = Math.abs(inletFlow - outletFlow) < 10; // 10 CFM tolerance
      const warnings: string[] = [];
      
      if (!isBalanced) {
        warnings.push(`Flow imbalance: inlet ${inletFlow.toFixed(0)} CFM, outlet ${outletFlow.toFixed(0)} CFM`);
      }
      
      distribution.set(node.id, {
        nodeId: node.id,
        inletFlow,
        outletFlow,
        flowSplit,
        pressureAtInlet: this.calculateNodeInletPressure(node.id),
        pressureAtOutlet: this.calculateNodeOutletPressure(node.id),
        isBalanced,
        warnings
      });
    });
    
    return distribution;
  }

  private analyzeEquipmentLoading(): Map<string, number> {
    const loading = new Map<string, number>();
    const nodes = this.topologyManager.getNodes();
    
    nodes.forEach(node => {
      if (node.type === 'equipment') {
        const equipment = node.element as Equipment;
        const currentFlow = equipment.flowProperties.airflow;
        const capacity = equipment.properties.cfmCapacity;
        const loadPercentage = capacity > 0 ? (currentFlow / capacity) * 100 : 0;
        loading.set(node.id, loadPercentage);
      }
    });
    
    return loading;
  }

  private calculateSystemMetrics(
    flowDistribution: Map<string, FlowDistributionResult>,
    equipmentLoading: Map<string, number>
  ): {
    totalFlow: number;
    totalPressureDrop: number;
    efficiency: number;
    balanceErrors: string[];
    capacityViolations: string[];
  } {
    // Calculate total system flow (sum of source equipment flows)
    const totalFlow = Array.from(this.topologyManager.getNodes().values())
      .filter(node => node.type === 'equipment' && (node.element as Equipment).isSource)
      .reduce((sum, node) => sum + node.element.flowProperties.airflow, 0);
    
    // Calculate maximum pressure drop across all paths
    const totalPressureDrop = Math.max(...Array.from(this.flowPaths.values())
      .map(path => path.totalPressureDrop));
    
    // Calculate system efficiency (simplified)
    const averageLoading = Array.from(equipmentLoading.values())
      .reduce((sum, loading) => sum + loading, 0) / equipmentLoading.size;
    const efficiency = Math.max(0, Math.min(1, averageLoading / 100));
    
    // Collect balance errors
    const balanceErrors: string[] = [];
    flowDistribution.forEach(result => {
      balanceErrors.push(...result.warnings);
    });
    
    // Check capacity violations
    const capacityViolations = this.validateEquipmentCapacity();
    
    return {
      totalFlow,
      totalPressureDrop,
      efficiency,
      balanceErrors,
      capacityViolations
    };
  }

  private calculateBranchDemand(nodeId: string): number {
    // Recursively calculate demand for a branch
    const node = this.topologyManager.getNodes().get(nodeId);
    if (!node) return 0;
    
    if (node.type === 'equipment') {
      const equipment = node.element as Equipment;
      if (equipment.isTerminal) {
        return equipment.properties.cfmCapacity;
      }
    }
    
    // For segments and fittings, sum downstream demand
    const downstreamConnections = this.getOutletConnections(nodeId);
    return downstreamConnections.reduce((sum, conn) => {
      return sum + this.calculateBranchDemand(conn.toNodeId);
    }, 0);
  }

  private calculateBranchPressureLoss(
    parentNode: SystemNode,
    childNodeIds: string[],
    flowSplit: Map<string, number>
  ): number {
    // Calculate pressure loss through branch junction
    const parentFlow = parentNode.element.flowProperties.airflow;
    const parentVelocity = parentNode.element.flowProperties.velocity;
    
    // Use simplified branch loss calculation
    const velocityPressure = Math.pow(parentVelocity / 4005, 2); // inches w.g.
    const branchLossCoefficient = this.getBranchLossCoefficient(childNodeIds.length);
    
    return branchLossCoefficient * velocityPressure;
  }

  private getBranchLossCoefficient(branchCount: number): number {
    // Simplified branch loss coefficients
    const coefficients: Record<number, number> = {
      1: 0.0,  // No branch
      2: 0.2,  // Tee
      3: 0.4,  // Three-way
      4: 0.6   // Four-way
    };
    return coefficients[branchCount] || 0.8;
  }

  private findPathsFromSource(sourceId: string): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    
    const traverse = (currentId: string, currentPath: string[]) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const newPath = [...currentPath, currentId];
      const outletConnections = this.getOutletConnections(currentId);
      
      if (outletConnections.length === 0) {
        // Terminal node - complete path
        paths.push(newPath);
      } else {
        // Continue traversing
        outletConnections.forEach(conn => {
          traverse(conn.toNodeId, newPath);
        });
      }
      
      visited.delete(currentId);
    };
    
    traverse(sourceId, []);
    return paths;
  }

  private calculatePathLength(nodeIds: string[]): number {
    let totalLength = 0;
    
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const currentNode = this.topologyManager.getNodes().get(nodeIds[i]);
      const nextNode = this.topologyManager.getNodes().get(nodeIds[i + 1]);
      
      if (currentNode && nextNode) {
        if (currentNode.type === 'segment') {
          const segment = currentNode.element as DuctSegment;
          totalLength += segment.start.distanceTo(segment.end);
        }
      }
    }
    
    return totalLength / 12; // Convert to feet
  }

  private determinePathType(nodeIds: string[]): 'supply' | 'return' | 'exhaust' {
    // Determine path type based on first segment
    const firstSegmentNode = this.topologyManager.getNodes().get(nodeIds[1]); // Skip source equipment
    if (firstSegmentNode && firstSegmentNode.type === 'segment') {
      return (firstSegmentNode.element as DuctSegment).type;
    }
    return 'supply';
  }

  private findTerminalEquipment(nodeIds: string[]): string[] {
    return nodeIds.filter(nodeId => {
      const node = this.topologyManager.getNodes().get(nodeId);
      return node?.type === 'equipment' && (node.element as Equipment).isTerminal;
    });
  }

  private getInletConnections(nodeId: string): SystemConnection[] {
    return Array.from(this.topologyManager.getConnections().values())
      .filter(conn => conn.toNodeId === nodeId);
  }

  private getOutletConnections(nodeId: string): SystemConnection[] {
    return Array.from(this.topologyManager.getConnections().values())
      .filter(conn => conn.fromNodeId === nodeId);
  }

  private findConnection(fromNodeId: string, toNodeId: string): SystemConnection | null {
    return Array.from(this.topologyManager.getConnections().values())
      .find(conn => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId) || null;
  }

  private calculateConnectionPressureLoss(connection: SystemConnection): number {
    // Calculate pressure loss through connection (fittings, transitions)
    if (connection.requiredFitting) {
      return connection.requiredFitting.pressureLossCoefficient * 0.1; // Simplified calculation
    }
    return 0;
  }

  private calculateDownstreamPressure(sourceNodeId: string): number {
    // Calculate total pressure drop downstream from source
    const paths = this.findPathsFromSource(sourceNodeId);
    return Math.max(...paths.map(path => this.calculatePathPressure(path)));
  }

  private calculateTotalSystemDemand(): number {
    // Calculate total system demand from terminal equipment
    const nodes = this.topologyManager.getNodes();
    return Array.from(nodes.values())
      .filter(node => node.type === 'equipment' && (node.element as Equipment).isTerminal)
      .reduce((sum, node) => sum + (node.element as Equipment).properties.cfmCapacity, 0);
  }

  private calculateNodeInletPressure(nodeId: string): number {
    // Calculate pressure at node inlet based on upstream path
    const inletConnections = this.getInletConnections(nodeId);
    if (inletConnections.length === 0) return 0;
    
    // Use pressure from first upstream connection
    const upstreamNode = this.topologyManager.getNodes().get(inletConnections[0].fromNodeId);
    if (!upstreamNode) return 0;
    
    return upstreamNode.element.flowProperties.pressureDrop;
  }

  private calculateNodeOutletPressure(nodeId: string): number {
    // Calculate pressure at node outlet
    const node = this.topologyManager.getNodes().get(nodeId);
    if (!node) return 0;
    
    const inletPressure = this.calculateNodeInletPressure(nodeId);
    return inletPressure + node.element.flowProperties.pressureDrop;
  }
}
