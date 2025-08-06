/**
 * Mid-span Branching Manager
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Manages mid-span branching functionality for adding branches at any point
 * along centerlines with multi-way fitting suggestions and SMACNA compliance.
 */

import { 
  Centerline, 
  CenterlinePoint, 
  SnapPoint,
  Segment
} from '@/types/air-duct-sizer';
import { CenterlineUtils } from './CenterlineUtils';
import { FittingAI, FittingRecommendation, FittingAnalysisInput } from './system/FittingAI';
import { ComplexFittings, ComplexFittingSolution, ComplexIntersectionInput } from './system/ComplexFittings';

/**
 * Branch fitting types
 */
export type BranchFittingType = 'tee' | 'wye' | 'double_wye' | 'cross' | 'reducer_tee';

/**
 * Branch point information
 */
export interface BranchPoint {
  id: string;
  position: { x: number; y: number };
  parentCenterlineId: string;
  segmentIndex: number; // Which segment of the centerline
  segmentPosition: number; // 0-1 position along the segment
  angle: number; // Branch angle in degrees
  suggestedFitting: BranchFittingType;
  isValidLocation: boolean;
  validationWarnings: string[];
}

/**
 * Branch suggestion
 */
export interface BranchSuggestion {
  fittingType: BranchFittingType;
  confidence: number; // 0-1
  reason: string;
  smacnaCompliant: boolean;
  warnings: string[];
  dimensions?: {
    mainDiameter?: number;
    branchDiameter?: number;
    angle?: number;
  };
}

/**
 * Branch creation result
 */
export interface BranchCreationResult {
  success: boolean;
  branchPoint?: BranchPoint;
  newCenterlines?: Centerline[];
  suggestedFitting?: BranchSuggestion;
  errors: string[];
  warnings: string[];
}

/**
 * SMACNA standards for branching
 */
const SMACNA_BRANCH_STANDARDS = {
  MIN_BRANCH_ANGLE: 30, // degrees
  MAX_BRANCH_ANGLE: 90, // degrees
  PREFERRED_BRANCH_ANGLE: 45, // degrees
  MIN_DISTANCE_FROM_FITTING: 24, // inches
  MIN_MAIN_TO_BRANCH_RATIO: 0.5, // branch/main diameter ratio
  MAX_MAIN_TO_BRANCH_RATIO: 1.0,
  PREFERRED_WYE_ANGLE: 45, // degrees
  PREFERRED_TEE_ANGLE: 90 // degrees
};

/**
 * Mid-span branching manager
 */
export class MidSpanBranchingManager {
  private branchPoints: Map<string, BranchPoint> = new Map();
  private branchCounter = 0;
  private fittingAI: FittingAI;
  private complexFittings: ComplexFittings;

  constructor() {
    this.fittingAI = new FittingAI({
      enableAdvancedAnalysis: true,
      smacnaCompliance: true,
      customFabrication: true,
      energyOptimization: true
    });

    this.complexFittings = new ComplexFittings({
      maxBranches: 8,
      smacnaCompliance: true,
      fabricationOptimization: true,
      performanceOptimization: true,
      complexityLimit: 'complex'
    });
  }

  /**
   * Find valid branch locations along a centerline
   */
  findValidBranchLocations(
    centerline: Centerline,
    minSpacing: number = 24 // inches
  ): BranchPoint[] {
    const validLocations: BranchPoint[] = [];

    if (centerline.points.length < 2) {
      return validLocations;
    }

    // Check each segment of the centerline
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const segmentStart = centerline.points[i];
      const segmentEnd = centerline.points[i + 1];
      const segmentLength = Math.sqrt(
        Math.pow(segmentEnd.x - segmentStart.x, 2) + 
        Math.pow(segmentEnd.y - segmentStart.y, 2)
      );

      // Skip very short segments
      if (segmentLength < minSpacing * 2) {
        continue;
      }

      // Create potential branch points along the segment
      const numPoints = Math.floor(segmentLength / minSpacing);
      for (let j = 1; j < numPoints; j++) {
        const t = j / numPoints;
        const position = {
          x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
          y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t
        };

        const branchPoint = this.createBranchPoint(
          centerline.id,
          position,
          i,
          t
        );

        if (branchPoint.isValidLocation) {
          validLocations.push(branchPoint);
        }
      }
    }

    return validLocations;
  }

  /**
   * Create a branch point at a specific location
   */
  createBranchPoint(
    centerlineId: string,
    position: { x: number; y: number },
    segmentIndex: number,
    segmentPosition: number,
    angle: number = 45
  ): BranchPoint {
    const branchId = `branch_${centerlineId}_${++this.branchCounter}`;
    
    const branchPoint: BranchPoint = {
      id: branchId,
      position,
      parentCenterlineId: centerlineId,
      segmentIndex,
      segmentPosition,
      angle,
      suggestedFitting: 'wye',
      isValidLocation: true,
      validationWarnings: []
    };

    // Validate the branch location
    this.validateBranchLocation(branchPoint);

    // Suggest appropriate fitting
    branchPoint.suggestedFitting = this.suggestFittingType(branchPoint).fittingType;

    this.branchPoints.set(branchId, branchPoint);
    return branchPoint;
  }

  /**
   * Validate branch location according to SMACNA standards
   */
  private validateBranchLocation(branchPoint: BranchPoint): void {
    const warnings: string[] = [];

    // Check branch angle
    if (branchPoint.angle < SMACNA_BRANCH_STANDARDS.MIN_BRANCH_ANGLE) {
      warnings.push(`Branch angle too acute: ${branchPoint.angle}° (min: ${SMACNA_BRANCH_STANDARDS.MIN_BRANCH_ANGLE}°)`);
      branchPoint.isValidLocation = false;
    }

    if (branchPoint.angle > SMACNA_BRANCH_STANDARDS.MAX_BRANCH_ANGLE) {
      warnings.push(`Branch angle too obtuse: ${branchPoint.angle}° (max: ${SMACNA_BRANCH_STANDARDS.MAX_BRANCH_ANGLE}°)`);
    }

    // Check distance from segment ends (simulating distance from other fittings)
    if (branchPoint.segmentPosition < 0.2 || branchPoint.segmentPosition > 0.8) {
      warnings.push('Branch too close to segment end - consider minimum distance from fittings');
    }

    branchPoint.validationWarnings = warnings;
  }

  /**
   * Suggest appropriate fitting type for a branch point
   */
  suggestFittingType(branchPoint: BranchPoint): BranchSuggestion {
    const angle = branchPoint.angle;
    let fittingType: BranchFittingType;
    let confidence = 0.8;
    let reason = '';
    let smacnaCompliant = true;
    const warnings: string[] = [];

    // Determine fitting type based on angle
    if (Math.abs(angle - 90) <= 5) {
      fittingType = 'tee';
      reason = 'Perpendicular branch - standard tee fitting';
      confidence = 0.95;
    } else if (Math.abs(angle - 45) <= 10) {
      fittingType = 'wye';
      reason = '45° branch - standard wye fitting';
      confidence = 0.9;
    } else if (angle >= 30 && angle <= 60) {
      fittingType = 'wye';
      reason = 'Angled branch - wye fitting recommended';
      confidence = 0.7;
    } else {
      fittingType = 'tee';
      reason = 'Non-standard angle - tee with custom fabrication';
      confidence = 0.5;
      smacnaCompliant = false;
      warnings.push('Non-standard branch angle may require custom fabrication');
    }

    // Check for multiple branches (suggesting double wye or cross)
    const nearbyBranches = this.findNearbyBranches(branchPoint, 12); // 12 inch radius
    if (nearbyBranches.length > 0) {
      if (nearbyBranches.length === 1) {
        const otherBranch = nearbyBranches[0];
        const angleDiff = Math.abs(branchPoint.angle - otherBranch.angle);
        
        if (Math.abs(angleDiff - 180) <= 10) {
          fittingType = 'cross';
          reason = 'Opposite branches - cross fitting';
          confidence = 0.85;
        } else if (angleDiff >= 60 && angleDiff <= 120) {
          fittingType = 'double_wye';
          reason = 'Multiple branches - double wye fitting';
          confidence = 0.8;
        }
      } else {
        fittingType = 'cross';
        reason = 'Multiple branches - complex fitting required';
        confidence = 0.6;
        warnings.push('Multiple branches may require custom multi-way fitting');
      }
    }

    return {
      fittingType,
      confidence,
      reason,
      smacnaCompliant,
      warnings,
      dimensions: {
        angle: branchPoint.angle
      }
    };
  }

  /**
   * Find nearby branch points
   */
  private findNearbyBranches(
    branchPoint: BranchPoint,
    radius: number
  ): BranchPoint[] {
    return Array.from(this.branchPoints.values()).filter(other => {
      if (other.id === branchPoint.id) return false;
      
      const distance = Math.sqrt(
        Math.pow(other.position.x - branchPoint.position.x, 2) +
        Math.pow(other.position.y - branchPoint.position.y, 2)
      );
      
      return distance <= radius;
    });
  }

  /**
   * Create branch at intersection point
   */
  createBranchAtIntersection(
    centerline1: Centerline,
    centerline2: Centerline,
    intersectionPoint: { x: number; y: number }
  ): BranchCreationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Find the intersection point on both centerlines
    const branch1 = this.findBranchPointOnCenterline(centerline1, intersectionPoint);
    const branch2 = this.findBranchPointOnCenterline(centerline2, intersectionPoint);

    if (!branch1 || !branch2) {
      errors.push('Could not locate intersection point on centerlines');
      return { success: false, errors, warnings };
    }

    // Calculate intersection angle
    const angle = this.calculateIntersectionAngle(centerline1, centerline2, intersectionPoint);
    
    // Create branch point
    const branchPoint = this.createBranchPoint(
      centerline1.id,
      intersectionPoint,
      branch1.segmentIndex,
      branch1.segmentPosition,
      angle
    );

    // Suggest fitting
    const suggestion = this.suggestFittingType(branchPoint);
    warnings.push(...suggestion.warnings);

    // Split centerlines at intersection if needed
    const newCenterlines = this.splitCenterlinesAtIntersection(
      centerline1,
      centerline2,
      intersectionPoint
    );

    return {
      success: true,
      branchPoint,
      newCenterlines,
      suggestedFitting: suggestion,
      errors,
      warnings
    };
  }

  /**
   * Find branch point location on centerline
   */
  private findBranchPointOnCenterline(
    centerline: Centerline,
    point: { x: number; y: number },
    tolerance: number = 5
  ): { segmentIndex: number; segmentPosition: number } | null {
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const segmentStart = centerline.points[i];
      const segmentEnd = centerline.points[i + 1];
      
      const distance = CenterlineUtils.distanceToLineSegment(point, segmentStart, segmentEnd);
      
      if (distance <= tolerance) {
        // Calculate position along segment
        const segmentLength = Math.sqrt(
          Math.pow(segmentEnd.x - segmentStart.x, 2) + 
          Math.pow(segmentEnd.y - segmentStart.y, 2)
        );
        
        const pointToStart = Math.sqrt(
          Math.pow(point.x - segmentStart.x, 2) + 
          Math.pow(point.y - segmentStart.y, 2)
        );
        
        const segmentPosition = segmentLength > 0 ? pointToStart / segmentLength : 0;
        
        return { segmentIndex: i, segmentPosition };
      }
    }
    
    return null;
  }

  /**
   * Calculate intersection angle between two centerlines
   */
  private calculateIntersectionAngle(
    centerline1: Centerline,
    centerline2: Centerline,
    intersectionPoint: { x: number; y: number }
  ): number {
    // Find the segments containing the intersection point
    const seg1 = this.findBranchPointOnCenterline(centerline1, intersectionPoint);
    const seg2 = this.findBranchPointOnCenterline(centerline2, intersectionPoint);
    
    if (!seg1 || !seg2) return 45; // Default angle
    
    // Get direction vectors
    const point1Start = centerline1.points[seg1.segmentIndex];
    const point1End = centerline1.points[seg1.segmentIndex + 1];
    const point2Start = centerline2.points[seg2.segmentIndex];
    const point2End = centerline2.points[seg2.segmentIndex + 1];
    
    const vector1 = {
      x: point1End.x - point1Start.x,
      y: point1End.y - point1Start.y
    };
    
    const vector2 = {
      x: point2End.x - point2Start.x,
      y: point2End.y - point2Start.y
    };
    
    // Calculate angle between vectors
    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    if (mag1 === 0 || mag2 === 0) return 45;
    
    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return (angle * 180) / Math.PI;
  }

  /**
   * Split centerlines at intersection point
   */
  private splitCenterlinesAtIntersection(
    centerline1: Centerline,
    centerline2: Centerline,
    intersectionPoint: { x: number; y: number }
  ): Centerline[] {
    const newCenterlines: Centerline[] = [];
    
    // This is a simplified implementation
    // In practice, you'd need to split the centerlines and create new segments
    // For now, we'll return the original centerlines
    newCenterlines.push(centerline1, centerline2);
    
    return newCenterlines;
  }

  /**
   * Get all branch points
   */
  getAllBranchPoints(): BranchPoint[] {
    return Array.from(this.branchPoints.values());
  }

  /**
   * Get branch points for a specific centerline
   */
  getBranchPointsForCenterline(centerlineId: string): BranchPoint[] {
    return Array.from(this.branchPoints.values())
      .filter(point => point.parentCenterlineId === centerlineId);
  }

  /**
   * Remove branch point
   */
  removeBranchPoint(branchId: string): boolean {
    return this.branchPoints.delete(branchId);
  }

  /**
   * Clear all branch points
   */
  clearBranchPoints(): void {
    this.branchPoints.clear();
  }

  /**
   * Update branch point angle
   */
  updateBranchAngle(branchId: string, newAngle: number): boolean {
    const branchPoint = this.branchPoints.get(branchId);
    if (!branchPoint) return false;

    branchPoint.angle = newAngle;
    this.validateBranchLocation(branchPoint);
    branchPoint.suggestedFitting = this.suggestFittingType(branchPoint).fittingType;

    return true;
  }

  /**
   * Get AI-powered fitting recommendations for a branch configuration
   */
  getAIFittingRecommendations(
    mainCenterline: Centerline,
    branchCenterlines: Centerline[],
    intersectionPoint: Point2D,
    systemPressure: 'low' | 'medium' | 'high' = 'medium',
    airflowRates?: any[],
    ductSizing?: any[]
  ): FittingRecommendation[] {
    try {
      // Prepare analysis input
      const analysisInput: FittingAnalysisInput = {
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemPressure,
        airflowRates: airflowRates || this.generateDefaultAirflowRates(branchCenterlines.length + 1),
        ductSizing: ductSizing || this.generateDefaultDuctSizing(branchCenterlines.length + 1),
        constraints: {
          codeRequirements: {
            smacnaCompliance: true,
            localCodes: [],
            energyEfficiency: true
          }
        }
      };

      // Get AI recommendations
      return this.fittingAI.analyzeFittingRequirements(analysisInput);
    } catch (error) {
      console.error('Error getting AI fitting recommendations:', error);
      return [];
    }
  }

  /**
   * Get fitting specifications for a specific type
   */
  getFittingSpecifications(fittingType: string, sizing: any[]): any {
    try {
      return this.fittingAI.getFittingSpecifications(fittingType as any, sizing);
    } catch (error) {
      console.error('Error getting fitting specifications:', error);
      return null;
    }
  }

  /**
   * Validate custom fitting design
   */
  validateCustomFitting(design: any): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    try {
      return this.fittingAI.validateCustomFitting(design);
    } catch (error) {
      console.error('Error validating custom fitting:', error);
      return {
        isValid: false,
        warnings: ['Error validating fitting design'],
        recommendations: ['Review fitting parameters']
      };
    }
  }

  /**
   * Generate fabrication instructions for a fitting
   */
  generateFabricationInstructions(recommendation: FittingRecommendation): {
    materials: string[];
    tools: string[];
    steps: string[];
    drawings: string[];
    notes: string[];
  } {
    try {
      return this.fittingAI.generateFabricationInstructions(recommendation);
    } catch (error) {
      console.error('Error generating fabrication instructions:', error);
      return {
        materials: [],
        tools: [],
        steps: [],
        drawings: [],
        notes: ['Error generating instructions']
      };
    }
  }

  /**
   * Get best fitting recommendation for a branch point
   */
  getBestFittingRecommendation(branchPoint: BranchPoint): FittingRecommendation | null {
    try {
      // Create mock centerlines for the branch point
      const mainCenterline: Centerline = {
        id: 'main',
        points: [
          { x: branchPoint.position.x - 100, y: branchPoint.position.y },
          { x: branchPoint.position.x + 100, y: branchPoint.position.y }
        ],
        width: 24,
        height: 12
      };

      const branchCenterline: Centerline = {
        id: 'branch',
        points: [
          branchPoint.position,
          {
            x: branchPoint.position.x + Math.cos(branchPoint.angle * Math.PI / 180) * 50,
            y: branchPoint.position.y + Math.sin(branchPoint.angle * Math.PI / 180) * 50
          }
        ],
        width: 18,
        height: 10
      };

      const recommendations = this.getAIFittingRecommendations(
        mainCenterline,
        [branchCenterline],
        branchPoint.position
      );

      return recommendations.length > 0 ? recommendations[0] : null;
    } catch (error) {
      console.error('Error getting best fitting recommendation:', error);
      return null;
    }
  }

  /**
   * Generate default airflow rates for analysis
   */
  private generateDefaultAirflowRates(count: number): any[] {
    const rates = [];
    for (let i = 0; i < count; i++) {
      rates.push({
        direction: i === 0 ? 'supply' : 'supply',
        velocity: 1500, // ft/min
        volume: i === 0 ? 1000 : 300, // CFM
        pressure: 0.5, // in. w.g.
        temperature: 70 // °F
      });
    }
    return rates;
  }

  /**
   * Generate default duct sizing for analysis
   */
  private generateDefaultDuctSizing(count: number): any[] {
    const sizing = [];
    for (let i = 0; i < count; i++) {
      sizing.push({
        width: i === 0 ? 24 : 18, // inches
        height: i === 0 ? 12 : 10, // inches
        shape: 'rectangular',
        gauge: 22
      });
    }
    return sizing;
  }

  /**
   * Update AI configuration
   */
  updateAIConfig(config: any): void {
    this.fittingAI.updateConfig(config);
  }

  /**
   * Get current AI configuration
   */
  getAIConfig(): any {
    return this.fittingAI.getConfig();
  }

  /**
   * Analyze complex multi-way intersection
   */
  analyzeComplexIntersection(
    mainCenterline: Centerline,
    branchCenterlines: Centerline[],
    intersectionPoint: Point2D,
    systemRequirements?: any
  ): ComplexFittingSolution[] {
    try {
      // Prepare complex intersection input
      const input: ComplexIntersectionInput = {
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemRequirements: systemRequirements || this.getDefaultSystemRequirements(),
        designPreferences: {
          prioritizePerformance: true,
          prioritizeCost: false,
          prioritizeMaintenance: true,
          allowCustomFabrication: true
        }
      };

      // Analyze complex intersection
      return this.complexFittings.analyzeComplexIntersection(input);
    } catch (error) {
      console.error('Error analyzing complex intersection:', error);
      return [];
    }
  }

  /**
   * Get optimal complex fitting solution
   */
  getOptimalComplexFittingSolution(
    mainCenterline: Centerline,
    branchCenterlines: Centerline[],
    intersectionPoint: Point2D,
    systemRequirements?: any
  ): ComplexFittingSolution | null {
    try {
      const input: ComplexIntersectionInput = {
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemRequirements: systemRequirements || this.getDefaultSystemRequirements(),
        designPreferences: {
          prioritizePerformance: true,
          prioritizeCost: false,
          prioritizeMaintenance: true,
          allowCustomFabrication: true
        }
      };

      return this.complexFittings.getOptimalFittingSolution(input);
    } catch (error) {
      console.error('Error getting optimal complex fitting solution:', error);
      return null;
    }
  }

  /**
   * Validate complex fitting solution
   */
  validateComplexFittingSolution(solution: ComplexFittingSolution): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    try {
      return this.complexFittings.validateComplexSolution(solution);
    } catch (error) {
      console.error('Error validating complex fitting solution:', error);
      return {
        isValid: false,
        errors: ['Error validating solution'],
        warnings: [],
        recommendations: ['Review solution parameters']
      };
    }
  }

  /**
   * Generate fabrication plan for complex solution
   */
  generateComplexFabricationPlan(solution: ComplexFittingSolution): any {
    try {
      return this.complexFittings.generateFabricationPlan(solution);
    } catch (error) {
      console.error('Error generating complex fabrication plan:', error);
      return {
        phases: [],
        materials: [],
        tools: [],
        qualityChecks: [],
        safetyRequirements: []
      };
    }
  }

  /**
   * Optimize complex fitting solution
   */
  optimizeComplexFittingSolution(
    solution: ComplexFittingSolution,
    optimizationGoals: {
      minimizeCost?: boolean;
      minimizePressureLoss?: boolean;
      minimizeComplexity?: boolean;
      maximizePerformance?: boolean;
    }
  ): ComplexFittingSolution {
    try {
      return this.complexFittings.optimizeSolution(solution, optimizationGoals);
    } catch (error) {
      console.error('Error optimizing complex fitting solution:', error);
      return solution;
    }
  }

  /**
   * Get alternative complex fitting solutions
   */
  getComplexFittingAlternatives(primarySolution: ComplexFittingSolution): ComplexFittingSolution[] {
    try {
      return this.complexFittings.getSolutionAlternatives(primarySolution);
    } catch (error) {
      console.error('Error getting complex fitting alternatives:', error);
      return [];
    }
  }

  /**
   * Detect complex intersections in centerline network
   */
  detectComplexIntersections(centerlines: Centerline[]): Array<{
    intersectionPoint: Point2D;
    mainCenterline: Centerline;
    branchCenterlines: Centerline[];
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    recommendedSolution?: ComplexFittingSolution;
  }> {
    const complexIntersections: Array<{
      intersectionPoint: Point2D;
      mainCenterline: Centerline;
      branchCenterlines: Centerline[];
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      recommendedSolution?: ComplexFittingSolution;
    }> = [];

    // Find all intersection points
    const intersections = this.findAllIntersections(centerlines);

    for (const intersection of intersections) {
      // Group centerlines by intersection point
      const intersectingLines = this.getIntersectingCenterlines(centerlines, intersection);

      if (intersectingLines.length >= 3) { // Complex intersection (3+ branches)
        const mainLine = this.identifyMainCenterline(intersectingLines);
        const branches = intersectingLines.filter(line => line.id !== mainLine.id);

        // Determine complexity
        const complexity = this.determineIntersectionComplexity(branches.length, intersection);

        // Get recommended solution for complex intersections
        let recommendedSolution: ComplexFittingSolution | undefined;
        if (complexity !== 'simple') {
          recommendedSolution = this.getOptimalComplexFittingSolution(
            mainLine,
            branches,
            intersection
          ) || undefined;
        }

        complexIntersections.push({
          intersectionPoint: intersection,
          mainCenterline: mainLine,
          branchCenterlines: branches,
          complexity,
          recommendedSolution
        });
      }
    }

    return complexIntersections;
  }

  /**
   * Generate SMACNA compliance report for complex fitting
   */
  generateSMACNAComplianceReport(solution: ComplexFittingSolution): {
    isCompliant: boolean;
    complianceScore: number;
    violations: Array<{
      code: string;
      description: string;
      severity: 'minor' | 'major' | 'critical';
      recommendation: string;
    }>;
    recommendations: string[];
  } {
    const violations: Array<{
      code: string;
      description: string;
      severity: 'minor' | 'major' | 'critical';
      recommendation: string;
    }> = [];
    const recommendations: string[] = [];

    // Check pressure loss compliance
    if (solution.performance.totalPressureLoss > 0.5) {
      violations.push({
        code: 'SMACNA-PL-001',
        description: 'Pressure loss exceeds SMACNA recommended limits',
        severity: 'major',
        recommendation: 'Redesign fitting to reduce pressure loss'
      });
    }

    // Check velocity compliance
    if (solution.performance.maxVelocity > 2500) {
      violations.push({
        code: 'SMACNA-VEL-001',
        description: 'Maximum velocity exceeds SMACNA limits',
        severity: 'major',
        recommendation: 'Increase duct size to reduce velocity'
      });
    }

    // Check noise compliance
    if (solution.performance.noiseLevel > 45) {
      violations.push({
        code: 'SMACNA-NOISE-001',
        description: 'Noise level exceeds recommended limits',
        severity: 'minor',
        recommendation: 'Add acoustic treatment or redesign for lower noise'
      });
    }

    // Check fabrication compliance
    if (solution.fabrication.complexity === 'expert' && !solution.compliance.smacnaCompliant) {
      violations.push({
        code: 'SMACNA-FAB-001',
        description: 'Custom fabrication does not meet SMACNA standards',
        severity: 'critical',
        recommendation: 'Review fabrication design for SMACNA compliance'
      });
    }

    // Calculate compliance score
    const totalChecks = 4;
    const passedChecks = totalChecks - violations.filter(v => v.severity !== 'minor').length;
    const complianceScore = (passedChecks / totalChecks) * 100;

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Address all violations before proceeding with fabrication');
      recommendations.push('Consult SMACNA guidelines for detailed requirements');
    }

    if (complianceScore < 80) {
      recommendations.push('Consider alternative fitting solutions');
      recommendations.push('Engage SMACNA-certified fabricator for review');
    }

    return {
      isCompliant: violations.filter(v => v.severity === 'critical').length === 0,
      complianceScore,
      violations,
      recommendations
    };
  }

  /**
   * Update complex fittings configuration
   */
  updateComplexFittingsConfig(config: any): void {
    this.complexFittings.updateConfig(config);
  }

  /**
   * Get complex fittings configuration
   */
  getComplexFittingsConfig(): any {
    return this.complexFittings.getConfig();
  }

  /**
   * Clear complex fittings cache
   */
  clearComplexFittingsCache(): void {
    this.complexFittings.clearCache();
  }

  /**
   * Get complex fittings analysis history
   */
  getComplexFittingsHistory(): any[] {
    return this.complexFittings.getAnalysisHistory();
  }

  /**
   * Get default system requirements for complex analysis
   */
  private getDefaultSystemRequirements(): any {
    return {
      maxPressureLoss: 0.5,        // in. w.g.
      noiseLimit: 45,              // dB
      spaceConstraints: {
        maxHeight: 120,            // inches
        maxWidth: 120,             // inches
        maxDepth: 120              // inches
      },
      fabricationConstraints: {
        maxComplexity: 'complex',
        budgetLimit: 10000,        // dollars
        timeLimit: 7,              // days
        preferredMaterials: ['galvanized_steel', 'stainless_steel']
      },
      codeRequirements: {
        smacnaCompliance: true,
        localCodes: [],
        energyEfficiency: true,
        accessibilityRequirements: true
      }
    };
  }

  /**
   * Find all intersection points in centerline network
   */
  private findAllIntersections(centerlines: Centerline[]): Point2D[] {
    const intersections: Point2D[] = [];

    // Simplified intersection detection - would use proper line intersection algorithms
    for (let i = 0; i < centerlines.length; i++) {
      for (let j = i + 1; j < centerlines.length; j++) {
        const intersection = this.findCenterlineIntersection(centerlines[i], centerlines[j]);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }

    return intersections;
  }

  /**
   * Find intersection between two centerlines
   */
  private findCenterlineIntersection(line1: Centerline, line2: Centerline): Point2D | null {
    // Simplified intersection calculation - would use proper line intersection algorithms
    // This is a placeholder implementation
    return null;
  }

  /**
   * Get centerlines that intersect at a point
   */
  private getIntersectingCenterlines(centerlines: Centerline[], point: Point2D): Centerline[] {
    const tolerance = 5; // pixels
    return centerlines.filter(line => {
      return line.points.some(p =>
        Math.abs(p.x - point.x) < tolerance && Math.abs(p.y - point.y) < tolerance
      );
    });
  }

  /**
   * Identify main centerline from intersecting lines
   */
  private identifyMainCenterline(centerlines: Centerline[]): Centerline {
    // Identify main line based on size, flow, or other criteria
    // For now, return the first line as main
    return centerlines[0];
  }

  /**
   * Determine intersection complexity based on branch count
   */
  private determineIntersectionComplexity(branchCount: number, intersection: Point2D): 'simple' | 'moderate' | 'complex' | 'expert' {
    if (branchCount <= 1) return 'simple';
    if (branchCount === 2) return 'moderate';
    if (branchCount <= 4) return 'complex';
    return 'expert';
  }
}
