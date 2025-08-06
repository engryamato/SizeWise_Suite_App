/**
 * SMACNA/NFPA/ASHRAE Compliance Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Professional engineering standards compliance interfaces for HVAC duct
 * construction, material specifications, and safety requirements.
 * 
 * @fileoverview SMACNA compliance interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D } from '@/types/air-duct-sizer';

/**
 * SMACNA pressure class classifications
 */
export enum SMACNAPressureClass {
  LOW_PRESSURE = 'low_pressure',      // Up to 2" w.g. (500 Pa)
  MEDIUM_PRESSURE = 'medium_pressure', // 2" to 6" w.g. (500-1500 Pa)
  HIGH_PRESSURE = 'high_pressure'      // 6" to 10" w.g. (1500-2500 Pa)
}

/**
 * SMACNA material types and specifications
 */
export enum SMACNAMaterialType {
  GALVANIZED_STEEL = 'galvanized_steel',
  ALUMINUM = 'aluminum',
  STAINLESS_STEEL = 'stainless_steel',
  CARBON_STEEL = 'carbon_steel'
}

/**
 * SMACNA gauge thickness requirements
 */
export interface SMACNAGaugeRequirement {
  material: SMACNAMaterialType;
  pressureClass: SMACNAPressureClass;
  minThickness: number; // in inches
  maxDimension: number; // maximum duct dimension in inches
  gaugeNumber: number;  // standard gauge number
}

/**
 * SMACNA reinforcement requirements
 */
export interface SMACNAReinforcementRequirement {
  pressureClass: SMACNAPressureClass;
  ductDimension: number;
  reinforcementType: 'tie_rod' | 'angle_iron' | 'channel' | 'none';
  spacing: number; // spacing in inches
  size: string;    // reinforcement size specification
}

/**
 * SMACNA sealing requirements
 */
export interface SMACNASealingRequirement {
  pressureClass: SMACNAPressureClass;
  sealingClass: 'A' | 'B' | 'C';
  leakageRate: number; // CFM per 100 sq ft at test pressure
  testPressure: number; // test pressure in inches w.g.
}

/**
 * Centerline data for SMACNA validation
 */
export interface SMACNACenterline {
  id: string;
  points: Point2D[];
  width: number;
  height: number;
  material: SMACNAMaterialType;
  pressureClass: SMACNAPressureClass;
  airflow: number; // CFM
  velocity: number; // FPM
  pressureLoss: number; // inches w.g. per 100 ft
}

/**
 * SMACNA validation result for individual checks
 */
export interface SMACNAValidationCheck {
  checkType: 'pressure_class' | 'material_thickness' | 'reinforcement' | 'sealing' | 'fabrication';
  isCompliant: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  recommendation?: string;
  standardReference: string; // Reference to SMACNA standard section
}

/**
 * Comprehensive SMACNA validation result
 */
export interface SMACNAValidationResult {
  centerlineId: string;
  isCompliant: boolean;
  overallScore: number; // 0-100 compliance score
  checks: SMACNAValidationCheck[];
  recommendations: string[];
  requiredCorrections: string[];
  estimatedCost?: number; // Cost impact of corrections
}

/**
 * SMACNA project compliance report
 */
export interface SMACNAComplianceReport {
  projectId: string;
  generatedAt: Date;
  overallCompliance: number; // 0-100 percentage
  centerlineResults: SMACNAValidationResult[];
  summary: {
    totalCenterlines: number;
    compliantCenterlines: number;
    criticalViolations: number;
    warningViolations: number;
    estimatedCorrectionCost: number;
  };
  recommendations: string[];
  standardsReferences: string[];
}

/**
 * SMACNA configuration options
 */
export interface SMACNAValidatorConfig {
  strictMode: boolean;           // Enforce all standards strictly
  allowableVariance: number;     // Percentage variance allowed (0-10%)
  includeNFPAStandards: boolean; // Include NFPA fire safety standards
  includeASHRAEStandards: boolean; // Include ASHRAE energy standards
  customStandards?: string[];    // Custom standard references
  reportFormat: 'detailed' | 'summary' | 'executive';
}

/**
 * Main SMACNA validator service interface
 */
export interface ISMACNAValidator {
  /**
   * Validate a single centerline against SMACNA standards
   */
  validateCenterline(centerline: SMACNACenterline): Promise<SMACNAValidationResult>;

  /**
   * Validate multiple centerlines
   */
  validateCenterlines(centerlines: SMACNACenterline[]): Promise<SMACNAValidationResult[]>;

  /**
   * Generate comprehensive project compliance report
   */
  generateComplianceReport(projectId: string): Promise<SMACNAComplianceReport>;

  /**
   * Validate pressure class requirements
   */
  validatePressureClass(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate material thickness requirements
   */
  validateMaterialThickness(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate reinforcement requirements
   */
  validateReinforcementRequirements(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate sealing requirements
   */
  validateSealingRequirements(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Get SMACNA gauge requirements for given parameters
   */
  getGaugeRequirements(
    material: SMACNAMaterialType,
    pressureClass: SMACNAPressureClass,
    dimension: number
  ): Promise<SMACNAGaugeRequirement>;

  /**
   * Get reinforcement requirements
   */
  getReinforcementRequirements(
    pressureClass: SMACNAPressureClass,
    ductDimension: number
  ): Promise<SMACNAReinforcementRequirement>;

  /**
   * Get sealing requirements
   */
  getSealingRequirements(pressureClass: SMACNAPressureClass): Promise<SMACNASealingRequirement>;

  /**
   * Update validator configuration
   */
  updateConfig(config: Partial<SMACNAValidatorConfig>): Promise<void>;

  /**
   * Get current configuration
   */
  getConfig(): Promise<SMACNAValidatorConfig>;

  /**
   * Get available SMACNA standards references
   */
  getStandardsReferences(): Promise<string[]>;

  /**
   * Validate against custom standards
   */
  validateCustomStandards(
    centerline: SMACNACenterline,
    standards: string[]
  ): Promise<SMACNAValidationCheck[]>;
}

/**
 * SMACNA standards data provider interface
 */
export interface ISMACNAStandardsProvider {
  /**
   * Get gauge table data
   */
  getGaugeTable(): Promise<SMACNAGaugeRequirement[]>;

  /**
   * Get reinforcement table data
   */
  getReinforcementTable(): Promise<SMACNAReinforcementRequirement[]>;

  /**
   * Get sealing requirements table
   */
  getSealingTable(): Promise<SMACNASealingRequirement[]>;

  /**
   * Get pressure class specifications
   */
  getPressureClassSpecs(): Promise<Record<SMACNAPressureClass, any>>;

  /**
   * Update standards data
   */
  updateStandardsData(data: any): Promise<void>;
}

/**
 * NFPA fire safety compliance interface
 */
export interface INFPAValidator {
  /**
   * Validate fire damper requirements
   */
  validateFireDampers(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate smoke damper requirements
   */
  validateSmokeDampers(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate fire-rated assembly requirements
   */
  validateFireRatedAssembly(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;
}

/**
 * ASHRAE energy efficiency compliance interface
 */
export interface IASHRAEValidator {
  /**
   * Validate energy efficiency requirements
   */
  validateEnergyEfficiency(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate insulation requirements
   */
  validateInsulationRequirements(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;

  /**
   * Validate air leakage requirements
   */
  validateAirLeakageRequirements(centerline: SMACNACenterline): Promise<SMACNAValidationCheck>;
}

/**
 * Compliance reporting service interface
 */
export interface IComplianceReportingService {
  /**
   * Generate PDF compliance report
   */
  generatePDFReport(report: SMACNAComplianceReport): Promise<Blob>;

  /**
   * Generate CSV compliance data
   */
  generateCSVReport(report: SMACNAComplianceReport): Promise<string>;

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(report: SMACNAComplianceReport): Promise<string>;

  /**
   * Schedule automated compliance reports
   */
  scheduleAutomatedReports(projectId: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<void>;
}

/**
 * Compliance audit trail interface
 */
export interface IComplianceAuditTrail {
  /**
   * Log compliance check
   */
  logComplianceCheck(
    projectId: string,
    centerlineId: string,
    result: SMACNAValidationResult
  ): Promise<void>;

  /**
   * Get compliance history
   */
  getComplianceHistory(projectId: string): Promise<SMACNAValidationResult[]>;

  /**
   * Export audit trail
   */
  exportAuditTrail(projectId: string, format: 'json' | 'csv' | 'pdf'): Promise<any>;
}
