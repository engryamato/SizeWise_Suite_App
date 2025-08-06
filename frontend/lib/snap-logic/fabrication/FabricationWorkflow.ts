/**
 * Fabrication Workflow Integration
 * SizeWise Suite - VanPacker Integration
 * 
 * Comprehensive fabrication workflow integration for professional HVAC
 * manufacturing and installation processes. Provides seamless integration
 * between design and fabrication phases with quality control, scheduling,
 * and progress tracking for professional engineering workflows.
 * 
 * @fileoverview Fabrication workflow and manufacturing integration
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { 
  DuctDimensions,
  DuctShape,
  SMACNAValidationResult
} from '../standards/SMACNAValidator';
import { 
  VanPackerExporter,
  VanPackerExportResult,
  VanPackerProjectMetadata,
  VanPackerSketchElement,
  FabricationMaterial,
  FabricationConnection
} from '../export/VanPackerExporter';

/**
 * Fabrication workflow stages
 */
export enum FabricationStage {
  DESIGN_REVIEW = 'design_review',
  MATERIAL_PROCUREMENT = 'material_procurement',
  FABRICATION_PLANNING = 'fabrication_planning',
  CUTTING_FORMING = 'cutting_forming',
  ASSEMBLY = 'assembly',
  QUALITY_CONTROL = 'quality_control',
  PACKAGING_SHIPPING = 'packaging_shipping',
  INSTALLATION_READY = 'installation_ready'
}

/**
 * Fabrication priority levels
 */
export enum FabricationPriority {
  STANDARD = 'standard',
  EXPEDITED = 'expedited',
  RUSH = 'rush',
  EMERGENCY = 'emergency'
}

/**
 * Quality control status
 */
export enum QualityControlStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK_REQUIRED = 'rework_required'
}

/**
 * Fabrication work order
 */
export interface FabricationWorkOrder {
  id: string;
  projectId: string;
  orderNumber: string;
  priority: FabricationPriority;
  stage: FabricationStage;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  
  // Design information
  designData: {
    centerlines: Centerline[];
    ductDimensions: DuctDimensions[];
    ductShapes: DuctShape[];
    vanPackerExport: VanPackerExportResult;
  };
  
  // Fabrication details
  fabricationDetails: {
    estimatedStartDate: string;
    estimatedCompletionDate: string;
    actualStartDate?: string;
    actualCompletionDate?: string;
    assignedFabricator: string;
    fabricationNotes: string[];
    specialRequirements: string[];
  };
  
  // Quality control
  qualityControl: {
    status: QualityControlStatus;
    inspector: string;
    inspectionDate?: string;
    testResults: QualityTestResult[];
    certifications: string[];
    reworkItems: string[];
  };
  
  // Progress tracking
  progress: {
    overallProgress: number; // 0-100%
    stageProgress: Record<FabricationStage, number>;
    milestones: FabricationMilestone[];
    issues: FabricationIssue[];
  };
  
  // Cost tracking
  costTracking: {
    estimatedCost: number;
    actualCost: number;
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    profitMargin: number;
  };
  
  // Metadata
  metadata: {
    createdBy: string;
    createdDate: string;
    lastModified: string;
    version: string;
    approvals: FabricationApproval[];
  };
}

/**
 * Quality test result
 */
export interface QualityTestResult {
  id: string;
  testType: 'pressure_test' | 'leakage_test' | 'dimensional_check' | 'visual_inspection' | 'material_verification';
  status: 'passed' | 'failed' | 'pending';
  testDate: string;
  inspector: string;
  results: Record<string, any>;
  notes: string[];
  photos: string[]; // URLs to inspection photos
  certificates: string[]; // URLs to test certificates
}

/**
 * Fabrication milestone
 */
export interface FabricationMilestone {
  id: string;
  name: string;
  stage: FabricationStage;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'delayed' | 'cancelled';
  dependencies: string[]; // IDs of prerequisite milestones
  deliverables: string[];
  notes: string[];
}

/**
 * Fabrication issue
 */
export interface FabricationIssue {
  id: string;
  type: 'design_change' | 'material_shortage' | 'quality_issue' | 'schedule_delay' | 'equipment_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  reportedBy: string;
  reportedDate: string;
  assignedTo: string;
  resolution?: string;
  resolutionDate?: string;
  impact: {
    schedule: number; // days delay
    cost: number; // additional cost
    quality: string; // impact description
  };
}

/**
 * Fabrication approval
 */
export interface FabricationApproval {
  id: string;
  type: 'design_approval' | 'material_approval' | 'quality_approval' | 'shipping_approval';
  approver: string;
  approvalDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'conditional';
  notes: string[];
  conditions?: string[]; // For conditional approvals
}

/**
 * Fabrication workflow configuration
 */
export interface FabricationWorkflowConfig {
  defaultPriority: FabricationPriority;
  qualityControlEnabled: boolean;
  automaticProgressTracking: boolean;
  notificationsEnabled: boolean;
  integrationSettings: {
    vanPackerEnabled: boolean;
    erpIntegration: boolean;
    inventoryTracking: boolean;
    shippingIntegration: boolean;
  };
  qualityStandards: {
    pressureTestRequired: boolean;
    leakageTestRequired: boolean;
    dimensionalTolerances: Record<string, number>;
    materialCertificationRequired: boolean;
  };
  scheduling: {
    standardLeadTime: number; // days
    expeditedLeadTime: number; // days
    rushLeadTime: number; // days
    emergencyLeadTime: number; // days
  };
}

/**
 * Default fabrication workflow configuration
 */
const DEFAULT_FABRICATION_CONFIG: FabricationWorkflowConfig = {
  defaultPriority: FabricationPriority.STANDARD,
  qualityControlEnabled: true,
  automaticProgressTracking: true,
  notificationsEnabled: true,
  integrationSettings: {
    vanPackerEnabled: true,
    erpIntegration: false,
    inventoryTracking: true,
    shippingIntegration: false
  },
  qualityStandards: {
    pressureTestRequired: true,
    leakageTestRequired: true,
    dimensionalTolerances: {
      length: 0.125, // ±1/8 inch
      width: 0.0625, // ±1/16 inch
      height: 0.0625 // ±1/16 inch
    },
    materialCertificationRequired: true
  },
  scheduling: {
    standardLeadTime: 14, // 2 weeks
    expeditedLeadTime: 7, // 1 week
    rushLeadTime: 3, // 3 days
    emergencyLeadTime: 1 // 1 day
  }
};

/**
 * Fabrication workflow manager
 */
export class FabricationWorkflow {
  private config: FabricationWorkflowConfig;
  private vanPackerExporter: VanPackerExporter;
  private workOrders: Map<string, FabricationWorkOrder> = new Map();
  private progressCallbacks: Map<string, Function[]> = new Map();

  constructor(config?: Partial<FabricationWorkflowConfig>) {
    this.config = { ...DEFAULT_FABRICATION_CONFIG, ...config };
    this.vanPackerExporter = new VanPackerExporter();
  }

  /**
   * Create new fabrication work order
   */
  async createWorkOrder(
    projectId: string,
    centerlines: Centerline[],
    ductDimensions: DuctDimensions[],
    ductShapes: DuctShape[],
    metadata: Partial<VanPackerProjectMetadata>,
    options?: {
      priority?: FabricationPriority;
      specialRequirements?: string[];
      assignedFabricator?: string;
    }
  ): Promise<FabricationWorkOrder> {
    // Generate VanPacker export
    const vanPackerExport = await this.vanPackerExporter.exportCenterlines(
      centerlines,
      ductDimensions,
      ductShapes,
      metadata
    );

    if (!vanPackerExport.success) {
      throw new Error(`Failed to generate VanPacker export: ${vanPackerExport.errors.join(', ')}`);
    }

    // Create work order
    const workOrder: FabricationWorkOrder = {
      id: this.generateWorkOrderId(),
      projectId,
      orderNumber: this.generateOrderNumber(),
      priority: options?.priority || this.config.defaultPriority,
      stage: FabricationStage.DESIGN_REVIEW,
      status: 'active',
      
      designData: {
        centerlines,
        ductDimensions,
        ductShapes,
        vanPackerExport
      },
      
      fabricationDetails: {
        estimatedStartDate: this.calculateStartDate(options?.priority),
        estimatedCompletionDate: this.calculateCompletionDate(options?.priority),
        assignedFabricator: options?.assignedFabricator || 'TBD',
        fabricationNotes: [],
        specialRequirements: options?.specialRequirements || []
      },
      
      qualityControl: {
        status: QualityControlStatus.PENDING,
        inspector: 'TBD',
        testResults: [],
        certifications: [],
        reworkItems: []
      },
      
      progress: {
        overallProgress: 0,
        stageProgress: this.initializeStageProgress(),
        milestones: this.generateMilestones(options?.priority),
        issues: []
      },
      
      costTracking: {
        estimatedCost: vanPackerExport.statistics.totalCost,
        actualCost: 0,
        materialCost: vanPackerExport.statistics.totalCost * 0.6,
        laborCost: vanPackerExport.statistics.totalCost * 0.3,
        overheadCost: vanPackerExport.statistics.totalCost * 0.1,
        profitMargin: 0.15
      },
      
      metadata: {
        createdBy: 'SizeWise Suite User',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0',
        approvals: []
      }
    };

    // Store work order
    this.workOrders.set(workOrder.id, workOrder);

    // Initialize progress tracking
    if (this.config.automaticProgressTracking) {
      this.initializeProgressTracking(workOrder.id);
    }

    return workOrder;
  }

  /**
   * Update work order stage
   */
  async updateStage(
    workOrderId: string,
    newStage: FabricationStage,
    notes?: string[]
  ): Promise<void> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    const previousStage = workOrder.stage;
    workOrder.stage = newStage;
    workOrder.metadata.lastModified = new Date().toISOString();

    // Update stage progress
    workOrder.progress.stageProgress[previousStage] = 100;
    workOrder.progress.stageProgress[newStage] = 0;

    // Update overall progress
    workOrder.progress.overallProgress = this.calculateOverallProgress(workOrder);

    // Add notes if provided
    if (notes) {
      workOrder.fabricationDetails.fabricationNotes.push(...notes);
    }

    // Update milestones
    this.updateMilestones(workOrder, newStage);

    // Trigger callbacks
    this.triggerProgressCallbacks(workOrderId, workOrder);

    // Send notifications if enabled
    if (this.config.notificationsEnabled) {
      await this.sendStageUpdateNotification(workOrder, previousStage, newStage);
    }
  }

  /**
   * Add quality test result
   */
  async addQualityTestResult(
    workOrderId: string,
    testResult: Omit<QualityTestResult, 'id'>
  ): Promise<void> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    const fullTestResult: QualityTestResult = {
      id: this.generateTestResultId(),
      ...testResult
    };

    workOrder.qualityControl.testResults.push(fullTestResult);
    workOrder.metadata.lastModified = new Date().toISOString();

    // Update quality control status
    this.updateQualityControlStatus(workOrder);

    // Trigger callbacks
    this.triggerProgressCallbacks(workOrderId, workOrder);
  }

  /**
   * Report fabrication issue
   */
  async reportIssue(
    workOrderId: string,
    issue: Omit<FabricationIssue, 'id' | 'reportedDate'>
  ): Promise<void> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    const fullIssue: FabricationIssue = {
      id: this.generateIssueId(),
      reportedDate: new Date().toISOString(),
      ...issue
    };

    workOrder.progress.issues.push(fullIssue);
    workOrder.metadata.lastModified = new Date().toISOString();

    // Adjust schedule if necessary
    if (fullIssue.impact.schedule > 0) {
      this.adjustSchedule(workOrder, fullIssue.impact.schedule);
    }

    // Adjust cost if necessary
    if (fullIssue.impact.cost > 0) {
      workOrder.costTracking.actualCost += fullIssue.impact.cost;
    }

    // Send notifications for critical issues
    if (fullIssue.severity === 'critical' && this.config.notificationsEnabled) {
      await this.sendCriticalIssueNotification(workOrder, fullIssue);
    }

    // Trigger callbacks
    this.triggerProgressCallbacks(workOrderId, workOrder);
  }

  /**
   * Add fabrication approval
   */
  async addApproval(
    workOrderId: string,
    approval: Omit<FabricationApproval, 'id' | 'approvalDate'>
  ): Promise<void> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    const fullApproval: FabricationApproval = {
      id: this.generateApprovalId(),
      approvalDate: new Date().toISOString(),
      ...approval
    };

    workOrder.metadata.approvals.push(fullApproval);
    workOrder.metadata.lastModified = new Date().toISOString();

    // Check if all required approvals are complete
    if (this.areAllApprovalsComplete(workOrder)) {
      await this.processApprovalCompletion(workOrder);
    }

    // Trigger callbacks
    this.triggerProgressCallbacks(workOrderId, workOrder);
  }

  /**
   * Get work order by ID
   */
  getWorkOrder(workOrderId: string): FabricationWorkOrder | undefined {
    return this.workOrders.get(workOrderId);
  }

  /**
   * Get all work orders for a project
   */
  getProjectWorkOrders(projectId: string): FabricationWorkOrder[] {
    return Array.from(this.workOrders.values())
      .filter(wo => wo.projectId === projectId);
  }

  /**
   * Get work orders by status
   */
  getWorkOrdersByStatus(status: FabricationWorkOrder['status']): FabricationWorkOrder[] {
    return Array.from(this.workOrders.values())
      .filter(wo => wo.status === status);
  }

  /**
   * Get work orders by stage
   */
  getWorkOrdersByStage(stage: FabricationStage): FabricationWorkOrder[] {
    return Array.from(this.workOrders.values())
      .filter(wo => wo.stage === stage);
  }

  /**
   * Register progress callback
   */
  onProgressUpdate(workOrderId: string, callback: (workOrder: FabricationWorkOrder) => void): void {
    if (!this.progressCallbacks.has(workOrderId)) {
      this.progressCallbacks.set(workOrderId, []);
    }
    this.progressCallbacks.get(workOrderId)!.push(callback);
  }

  /**
   * Get fabrication statistics
   */
  getFabricationStatistics(): {
    totalWorkOrders: number;
    activeWorkOrders: number;
    completedWorkOrders: number;
    averageLeadTime: number;
    onTimeDeliveryRate: number;
    qualityPassRate: number;
    totalValue: number;
  } {
    const workOrders = Array.from(this.workOrders.values());
    const activeWorkOrders = workOrders.filter(wo => wo.status === 'active');
    const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed');
    
    // Calculate average lead time
    const completedWithDates = completedWorkOrders.filter(wo => 
      wo.fabricationDetails.actualStartDate && wo.fabricationDetails.actualCompletionDate
    );
    
    let averageLeadTime = 0;
    if (completedWithDates.length > 0) {
      const totalLeadTime = completedWithDates.reduce((sum, wo) => {
        const start = new Date(wo.fabricationDetails.actualStartDate!);
        const end = new Date(wo.fabricationDetails.actualCompletionDate!);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      averageLeadTime = totalLeadTime / completedWithDates.length;
    }

    // Calculate on-time delivery rate
    const onTimeDeliveries = completedWorkOrders.filter(wo => {
      if (!wo.fabricationDetails.actualCompletionDate) return false;
      const actual = new Date(wo.fabricationDetails.actualCompletionDate);
      const estimated = new Date(wo.fabricationDetails.estimatedCompletionDate);
      return actual <= estimated;
    });
    const onTimeDeliveryRate = completedWorkOrders.length > 0 
      ? onTimeDeliveries.length / completedWorkOrders.length 
      : 0;

    // Calculate quality pass rate
    const workOrdersWithQC = workOrders.filter(wo => wo.qualityControl.testResults.length > 0);
    const passedQC = workOrdersWithQC.filter(wo => 
      wo.qualityControl.status === QualityControlStatus.PASSED
    );
    const qualityPassRate = workOrdersWithQC.length > 0 
      ? passedQC.length / workOrdersWithQC.length 
      : 0;

    // Calculate total value
    const totalValue = workOrders.reduce((sum, wo) => sum + wo.costTracking.estimatedCost, 0);

    return {
      totalWorkOrders: workOrders.length,
      activeWorkOrders: activeWorkOrders.length,
      completedWorkOrders: completedWorkOrders.length,
      averageLeadTime,
      onTimeDeliveryRate,
      qualityPassRate,
      totalValue
    };
  }

  // Private helper methods
  private generateWorkOrderId(): string {
    return `WO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${year}${month}-${sequence}`;
  }

  private generateTestResultId(): string {
    return `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private generateIssueId(): string {
    return `ISSUE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private generateApprovalId(): string {
    return `APPR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private calculateStartDate(priority?: FabricationPriority): string {
    const now = new Date();
    const daysToAdd = priority === FabricationPriority.EMERGENCY ? 0 : 
                     priority === FabricationPriority.RUSH ? 1 :
                     priority === FabricationPriority.EXPEDITED ? 2 : 3;
    
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  private calculateCompletionDate(priority?: FabricationPriority): string {
    const now = new Date();
    const leadTime = priority === FabricationPriority.EMERGENCY ? this.config.scheduling.emergencyLeadTime :
                     priority === FabricationPriority.RUSH ? this.config.scheduling.rushLeadTime :
                     priority === FabricationPriority.EXPEDITED ? this.config.scheduling.expeditedLeadTime :
                     this.config.scheduling.standardLeadTime;
    
    now.setDate(now.getDate() + leadTime);
    return now.toISOString();
  }

  private initializeStageProgress(): Record<FabricationStage, number> {
    const progress: Record<FabricationStage, number> = {} as any;
    Object.values(FabricationStage).forEach(stage => {
      progress[stage] = 0;
    });
    return progress;
  }

  private generateMilestones(priority?: FabricationPriority): FabricationMilestone[] {
    const milestones: FabricationMilestone[] = [];
    const stages = Object.values(FabricationStage);
    const baseDate = new Date();

    stages.forEach((stage, index) => {
      const daysOffset = index * 2; // 2 days per stage
      const milestoneDate = new Date(baseDate);
      milestoneDate.setDate(milestoneDate.getDate() + daysOffset);

      milestones.push({
        id: `milestone_${stage}_${Date.now()}`,
        name: `Complete ${stage.replace('_', ' ').toUpperCase()}`,
        stage,
        plannedDate: milestoneDate.toISOString(),
        status: 'pending',
        dependencies: index > 0 ? [`milestone_${stages[index - 1]}_${Date.now()}`] : [],
        deliverables: this.getStageDeliverables(stage),
        notes: []
      });
    });

    return milestones;
  }

  private getStageDeliverables(stage: FabricationStage): string[] {
    const deliverables: Record<FabricationStage, string[]> = {
      [FabricationStage.DESIGN_REVIEW]: ['Design approval', 'Material list'],
      [FabricationStage.MATERIAL_PROCUREMENT]: ['Materials received', 'Quality certificates'],
      [FabricationStage.FABRICATION_PLANNING]: ['Work instructions', 'Schedule confirmation'],
      [FabricationStage.CUTTING_FORMING]: ['Cut pieces', 'Formed components'],
      [FabricationStage.ASSEMBLY]: ['Assembled ductwork', 'Preliminary inspection'],
      [FabricationStage.QUALITY_CONTROL]: ['Test results', 'Quality certificates'],
      [FabricationStage.PACKAGING_SHIPPING]: ['Packaged goods', 'Shipping documentation'],
      [FabricationStage.INSTALLATION_READY]: ['Delivery confirmation', 'Installation instructions']
    };
    return deliverables[stage] || [];
  }

  private calculateOverallProgress(workOrder: FabricationWorkOrder): number {
    const stages = Object.values(FabricationStage);
    const totalStages = stages.length;
    let completedStages = 0;

    stages.forEach(stage => {
      if (workOrder.progress.stageProgress[stage] === 100) {
        completedStages++;
      }
    });

    return Math.round((completedStages / totalStages) * 100);
  }

  private updateMilestones(workOrder: FabricationWorkOrder, newStage: FabricationStage): void {
    const stageMilestone = workOrder.progress.milestones.find(m => m.stage === newStage);
    if (stageMilestone && stageMilestone.status === 'pending') {
      stageMilestone.status = 'completed';
      stageMilestone.actualDate = new Date().toISOString();
    }
  }

  private updateQualityControlStatus(workOrder: FabricationWorkOrder): void {
    const testResults = workOrder.qualityControl.testResults;
    
    if (testResults.length === 0) {
      workOrder.qualityControl.status = QualityControlStatus.PENDING;
      return;
    }

    const hasFailures = testResults.some(test => test.status === 'failed');
    const hasPending = testResults.some(test => test.status === 'pending');

    if (hasFailures) {
      workOrder.qualityControl.status = QualityControlStatus.REWORK_REQUIRED;
    } else if (hasPending) {
      workOrder.qualityControl.status = QualityControlStatus.IN_PROGRESS;
    } else {
      workOrder.qualityControl.status = QualityControlStatus.PASSED;
    }
  }

  private adjustSchedule(workOrder: FabricationWorkOrder, delayDays: number): void {
    const currentCompletion = new Date(workOrder.fabricationDetails.estimatedCompletionDate);
    currentCompletion.setDate(currentCompletion.getDate() + delayDays);
    workOrder.fabricationDetails.estimatedCompletionDate = currentCompletion.toISOString();

    // Update milestone dates
    workOrder.progress.milestones.forEach(milestone => {
      if (milestone.status === 'pending') {
        const milestoneDate = new Date(milestone.plannedDate);
        milestoneDate.setDate(milestoneDate.getDate() + delayDays);
        milestone.plannedDate = milestoneDate.toISOString();
      }
    });
  }

  private areAllApprovalsComplete(workOrder: FabricationWorkOrder): boolean {
    const requiredApprovals = ['design_approval', 'quality_approval'];
    const completedApprovals = workOrder.metadata.approvals
      .filter(approval => approval.status === 'approved')
      .map(approval => approval.type);

    return requiredApprovals.every(required => completedApprovals.includes(required));
  }

  private async processApprovalCompletion(workOrder: FabricationWorkOrder): Promise<void> {
    // Move to next stage if all approvals are complete
    if (workOrder.stage === FabricationStage.DESIGN_REVIEW) {
      await this.updateStage(workOrder.id, FabricationStage.MATERIAL_PROCUREMENT, 
        ['All approvals received, proceeding to material procurement']);
    }
  }

  private initializeProgressTracking(workOrderId: string): void {
    // Set up automatic progress tracking
    // This would integrate with actual fabrication systems
    console.log(`Initialized progress tracking for work order: ${workOrderId}`);
  }

  private triggerProgressCallbacks(workOrderId: string, workOrder: FabricationWorkOrder): void {
    const callbacks = this.progressCallbacks.get(workOrderId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(workOrder);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    }
  }

  private async sendStageUpdateNotification(
    workOrder: FabricationWorkOrder,
    previousStage: FabricationStage,
    newStage: FabricationStage
  ): Promise<void> {
    // Send notification about stage update
    console.log(`Work order ${workOrder.orderNumber} moved from ${previousStage} to ${newStage}`);
  }

  private async sendCriticalIssueNotification(
    workOrder: FabricationWorkOrder,
    issue: FabricationIssue
  ): Promise<void> {
    // Send critical issue notification
    console.log(`Critical issue reported for work order ${workOrder.orderNumber}: ${issue.title}`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FabricationWorkflowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FabricationWorkflowConfig {
    return { ...this.config };
  }
}
