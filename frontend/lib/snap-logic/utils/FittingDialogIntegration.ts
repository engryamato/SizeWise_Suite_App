/**
 * Fitting Dialog Integration Utilities
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Utility functions for integrating fitting confirmation dialogs with the
 * snap logic system, AI fitting recommendations, and complex fitting support.
 * 
 * @fileoverview Fitting dialog integration utilities
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { Centerline, Point2D } from '@/types/air-duct-sizer';
import { FittingRecommendation, ComplexFittingSolution, FittingAI, ComplexFittings } from '../index';

/**
 * Intersection analysis result
 */
export interface IntersectionAnalysis {
  intersectionPoint: Point2D;
  mainCenterline: Centerline;
  branchCenterlines: Centerline[];
  branchCount: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  systemPressure: 'low' | 'medium' | 'high';
  primaryRecommendation: FittingRecommendation | ComplexFittingSolution;
  alternativeRecommendations: (FittingRecommendation | ComplexFittingSolution)[];
}

/**
 * Fitting dialog trigger callback
 */
export type FittingDialogTrigger = (
  primaryRecommendation: FittingRecommendation | ComplexFittingSolution,
  alternativeRecommendations: (FittingRecommendation | ComplexFittingSolution)[],
  intersectionInfo: {
    branchCount: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    location: { x: number; y: number };
    systemPressure: 'low' | 'medium' | 'high';
  }
) => void;

/**
 * Fitting dialog integration manager
 */
export class FittingDialogIntegration {
  private fittingAI: FittingAI;
  private complexFittings: ComplexFittings;
  private dialogTrigger: FittingDialogTrigger | null = null;

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
      performanceOptimization: true
    });
  }

  /**
   * Set the dialog trigger callback
   */
  setDialogTrigger(trigger: FittingDialogTrigger): void {
    this.dialogTrigger = trigger;
  }

  /**
   * Analyze intersection and trigger fitting dialog
   */
  async analyzeAndShowFittingDialog(
    mainCenterline: Centerline,
    branchCenterlines: Centerline[],
    intersectionPoint: Point2D,
    systemPressure: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    if (!this.dialogTrigger) {
      console.warn('Fitting dialog trigger not set');
      return;
    }

    try {
      // Analyze intersection
      const analysis = await this.analyzeIntersection(
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemPressure
      );

      // Trigger dialog with recommendations
      this.dialogTrigger(
        analysis.primaryRecommendation,
        analysis.alternativeRecommendations,
        {
          branchCount: analysis.branchCount,
          complexity: analysis.complexity,
          location: intersectionPoint,
          systemPressure
        }
      );
    } catch (error) {
      console.error('Error analyzing intersection for fitting dialog:', error);
    }
  }

  /**
   * Analyze intersection and generate recommendations
   */
  async analyzeIntersection(
    mainCenterline: Centerline,
    branchCenterlines: Centerline[],
    intersectionPoint: Point2D,
    systemPressure: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<IntersectionAnalysis> {
    const branchCount = branchCenterlines.length;
    const complexity = this.determineComplexity(branchCount);

    let primaryRecommendation: FittingRecommendation | ComplexFittingSolution;
    let alternativeRecommendations: (FittingRecommendation | ComplexFittingSolution)[] = [];

    if (branchCount >= 3) {
      // Use complex fitting system for 3+ branches
      const complexSolutions = this.complexFittings.analyzeComplexIntersection({
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemRequirements: this.getDefaultSystemRequirements(systemPressure),
        designPreferences: {
          prioritizePerformance: true,
          prioritizeCost: false,
          prioritizeMaintenance: true,
          allowCustomFabrication: true
        }
      });

      primaryRecommendation = complexSolutions[0] || this.createFallbackRecommendation(branchCount);
      alternativeRecommendations = complexSolutions.slice(1, 4); // Up to 3 alternatives
    } else {
      // Use AI fitting system for simple intersections
      const aiRecommendations = this.fittingAI.analyzeFittingRequirements({
        mainCenterline,
        branchCenterlines,
        intersectionPoint,
        systemPressure,
        airflowRates: this.generateDefaultAirflowRates(branchCount + 1),
        ductSizing: this.generateDefaultDuctSizing(branchCount + 1)
      });

      primaryRecommendation = aiRecommendations[0] || this.createFallbackRecommendation(branchCount);
      alternativeRecommendations = aiRecommendations.slice(1, 4); // Up to 3 alternatives
    }

    return {
      intersectionPoint,
      mainCenterline,
      branchCenterlines,
      branchCount,
      complexity,
      systemPressure,
      primaryRecommendation,
      alternativeRecommendations
    };
  }

  /**
   * Create mock fitting recommendation for demonstration
   */
  createMockFittingRecommendation(
    location: Point2D,
    branchCount: number = 2,
    systemPressure: 'low' | 'medium' | 'high' = 'medium'
  ): IntersectionAnalysis {
    const complexity = this.determineComplexity(branchCount);

    const primaryRecommendation: FittingRecommendation = {
      id: 'mock_fitting_' + Date.now(),
      type: branchCount <= 2 ? 'wye' : 'custom_fabrication',
      name: branchCount <= 2 ? 'Standard Wye Fitting' : 'Custom Multi-branch Fitting',
      description: `${branchCount <= 2 ? 'Standard' : 'Custom'} fitting for ${branchCount + 1}-branch intersection`,
      confidence: branchCount <= 2 ? 0.9 : 0.75,
      priority: 1,
      specifications: {
        dimensions: { width: 24, height: 12, shape: 'rectangular', gauge: 22 },
        angles: Array(branchCount).fill(0).map((_, i) => 45 + (i * 30)),
        pressureLoss: branchCount <= 2 ? 0.15 : 0.3,
        velocityRatio: 1.0,
        fabricationComplexity: complexity
      },
      compliance: {
        smacnaCompliant: branchCount <= 2,
        energyEfficient: true,
        codeCompliant: true,
        standardSizes: branchCount <= 2
      },
      fabrication: {
        estimatedCost: branchCount <= 2 ? 1.5 : 3.5,
        fabricationTime: branchCount <= 2 ? 1 : 5,
        materialWaste: branchCount <= 2 ? 10 : 25,
        customFabrication: branchCount > 2,
        toolingRequired: branchCount <= 2 ? ['Standard HVAC tools'] : ['Custom tooling', 'Welding equipment']
      },
      performance: {
        pressureLoss: branchCount <= 2 ? 0.15 : 0.3,
        noiseGeneration: branchCount <= 2 ? 30 : 40,
        airflowDistribution: branchCount <= 2 ? 0.9 : 0.7,
        maintenanceAccess: branchCount <= 2 ? 0.9 : 0.6
      },
      installation: {
        difficulty: branchCount <= 2 ? 'easy' : 'complex',
        spaceRequired: { width: 36, height: 18, shape: 'rectangular', gauge: 22 },
        supportRequirements: ['Standard hangers'],
        accessRequirements: ['Standard access']
      },
      alternatives: [],
      warnings: branchCount > 2 ? ['Custom fabrication required', 'Expert installation recommended'] : [],
      notes: [branchCount <= 2 ? 'Standard SMACNA compliant fitting' : 'Custom engineered solution']
    };

    const alternativeRecommendations: FittingRecommendation[] = branchCount <= 2 ? [
      {
        ...primaryRecommendation,
        id: 'mock_alt_1',
        type: 'straight_tee',
        name: 'Straight Tee Alternative',
        description: 'Standard straight tee fitting alternative',
        confidence: 0.8,
        priority: 2,
        specifications: {
          ...primaryRecommendation.specifications,
          pressureLoss: 0.2
        },
        performance: {
          ...primaryRecommendation.performance,
          pressureLoss: 0.2,
          airflowDistribution: 0.8
        }
      }
    ] : [];

    return {
      intersectionPoint: location,
      mainCenterline: this.createMockCenterline(location, 'main'),
      branchCenterlines: Array(branchCount).fill(0).map((_, i) => 
        this.createMockCenterline(location, `branch_${i}`)
      ),
      branchCount,
      complexity,
      systemPressure,
      primaryRecommendation,
      alternativeRecommendations
    };
  }

  /**
   * Determine intersection complexity based on branch count
   */
  private determineComplexity(branchCount: number): 'simple' | 'moderate' | 'complex' | 'expert' {
    if (branchCount <= 1) return 'simple';
    if (branchCount === 2) return 'moderate';
    if (branchCount <= 4) return 'complex';
    return 'expert';
  }

  /**
   * Get default system requirements
   */
  private getDefaultSystemRequirements(systemPressure: 'low' | 'medium' | 'high') {
    const pressureLimits = {
      low: 0.3,
      medium: 0.5,
      high: 0.8
    };

    return {
      maxPressureLoss: pressureLimits[systemPressure],
      noiseLimit: 45,
      spaceConstraints: {
        maxHeight: 120,
        maxWidth: 120,
        maxDepth: 120
      },
      fabricationConstraints: {
        maxComplexity: 'complex' as const,
        budgetLimit: 10000,
        timeLimit: 7,
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
   * Generate default airflow rates
   */
  private generateDefaultAirflowRates(count: number) {
    return Array(count).fill(0).map((_, i) => ({
      direction: 'supply' as const,
      velocity: 1500,
      volume: i === 0 ? 1000 : 300,
      pressure: 0.5,
      temperature: 70
    }));
  }

  /**
   * Generate default duct sizing
   */
  private generateDefaultDuctSizing(count: number) {
    return Array(count).fill(0).map((_, i) => ({
      width: i === 0 ? 24 : 18,
      height: i === 0 ? 12 : 10,
      shape: 'rectangular' as const,
      gauge: 22
    }));
  }

  /**
   * Create fallback recommendation when analysis fails
   */
  private createFallbackRecommendation(branchCount: number): FittingRecommendation {
    return {
      id: 'fallback_' + Date.now(),
      type: 'custom_fabrication',
      name: 'Custom Fabrication Required',
      description: `Custom fitting required for ${branchCount + 1}-branch intersection`,
      confidence: 0.5,
      priority: 5,
      specifications: {
        dimensions: { width: 24, height: 12, shape: 'rectangular', gauge: 22 },
        angles: [],
        pressureLoss: 0.4,
        velocityRatio: 1.0,
        fabricationComplexity: 'expert'
      },
      compliance: {
        smacnaCompliant: false,
        energyEfficient: false,
        codeCompliant: false,
        standardSizes: false
      },
      fabrication: {
        estimatedCost: 5.0,
        fabricationTime: 10,
        materialWaste: 30,
        customFabrication: true,
        toolingRequired: ['Custom tooling']
      },
      performance: {
        pressureLoss: 0.4,
        noiseGeneration: 50,
        airflowDistribution: 0.6,
        maintenanceAccess: 0.5
      },
      installation: {
        difficulty: 'expert',
        spaceRequired: { width: 48, height: 24, shape: 'rectangular', gauge: 22 },
        supportRequirements: ['Custom supports'],
        accessRequirements: ['Full access required']
      },
      alternatives: [],
      warnings: ['Custom fabrication required', 'Expert consultation recommended'],
      notes: ['Requires detailed engineering analysis']
    };
  }

  /**
   * Create mock centerline for testing
   */
  private createMockCenterline(center: Point2D, id: string): Centerline {
    return {
      id,
      points: [
        { x: center.x - 50, y: center.y },
        { x: center.x + 50, y: center.y }
      ],
      width: 24,
      height: 12
    };
  }
}

/**
 * Global fitting dialog integration instance
 */
export const fittingDialogIntegration = new FittingDialogIntegration();
