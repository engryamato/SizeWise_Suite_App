/**
 * Test Data Validator for SizeWise Suite Frontend
 * 
 * Provides comprehensive validation utilities for test data integrity,
 * realistic HVAC calculations, and data consistency checks.
 */

import { TestUser, TestProject, TestCalculation, TestScenario } from '../fixtures/TestDataManager';
import { SizeWiseProject, ProjectSegment } from '@/lib/database/DexieDatabase';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 validation score
}

export interface HVACValidationRules {
  airflowRange: { min: number; max: number };
  velocityRange: { min: number; max: number };
  pressureDropRange: { min: number; max: number };
  diameterRange: { min: number; max: number };
  reynoldsNumberRange: { min: number; max: number };
}

export class TestDataValidator {
  private hvacRules: HVACValidationRules = {
    airflowRange: { min: 50, max: 50000 }, // CFM
    velocityRange: { min: 300, max: 4000 }, // FPM
    pressureDropRange: { min: 0.01, max: 2.0 }, // in. w.g. per 100 ft
    diameterRange: { min: 3, max: 60 }, // inches
    reynoldsNumberRange: { min: 10000, max: 1000000 }
  };

  validateUser(user: TestUser): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!user.id) errors.push('User ID is required');
    if (!user.email) errors.push('User email is required');
    if (!user.name) errors.push('User name is required');
    if (!user.tier) errors.push('User tier is required');

    // Email format validation
    if (user.email && !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    // Tier validation
    const validTiers = ['trial', 'free', 'premium', 'enterprise'];
    if (user.tier && !validTiers.includes(user.tier)) {
      errors.push(`Invalid tier: ${user.tier}. Must be one of: ${validTiers.join(', ')}`);
    }

    // License key validation for premium tiers
    if ((user.tier === 'premium' || user.tier === 'enterprise') && !user.licenseKey) {
      warnings.push('Premium/Enterprise users should have license keys');
    }

    // Organization ID validation for enterprise
    if (user.tier === 'enterprise' && !user.organizationId) {
      warnings.push('Enterprise users should have organization IDs');
    }

    // Settings validation
    if (user.settings) {
      if (!user.settings.units) {
        warnings.push('User settings should include units preference');
      }
      if (!user.settings.defaultCodes || !Array.isArray(user.settings.defaultCodes)) {
        warnings.push('User settings should include default codes array');
      }
    }

    const score = this.calculateValidationScore(errors.length, warnings.length, 8); // 8 total checks

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  validateProject(project: TestProject): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!project.uuid) errors.push('Project UUID is required');
    if (!project.project_name) errors.push('Project name is required');
    if (!project.project_location) errors.push('Project location is required');

    // Project name validation
    if (project.project_name && project.project_name.length < 3) {
      warnings.push('Project name should be at least 3 characters long');
    }

    // Codes validation
    if (!project.codes || !Array.isArray(project.codes) || project.codes.length === 0) {
      errors.push('Project must have at least one code standard');
    }

    // Rooms validation
    if (project.rooms && Array.isArray(project.rooms)) {
      project.rooms.forEach((room, index) => {
        if (!room.id) errors.push(`Room ${index + 1} missing ID`);
        if (!room.name) errors.push(`Room ${index + 1} missing name`);
        if (typeof room.area !== 'number' || room.area <= 0) {
          errors.push(`Room ${index + 1} has invalid area`);
        }
        if (typeof room.occupancy !== 'number' || room.occupancy < 0) {
          errors.push(`Room ${index + 1} has invalid occupancy`);
        }
      });
    }

    // Segments validation
    if (project.segments && Array.isArray(project.segments)) {
      project.segments.forEach((segment, index) => {
        const segmentValidation = this.validateSegmentData(segment, index + 1);
        errors.push(...segmentValidation.errors);
        warnings.push(...segmentValidation.warnings);
      });
    }

    // Equipment validation
    if (project.equipment && Array.isArray(project.equipment)) {
      project.equipment.forEach((equipment, index) => {
        if (!equipment.id) errors.push(`Equipment ${index + 1} missing ID`);
        if (!equipment.name) errors.push(`Equipment ${index + 1} missing name`);
        if (typeof equipment.capacity !== 'number' || equipment.capacity <= 0) {
          errors.push(`Equipment ${index + 1} has invalid capacity`);
        }
      });
    }

    // Date validation
    if (project.created_at && !this.isValidDate(project.created_at)) {
      errors.push('Invalid created_at date');
    }
    if (project.last_modified && !this.isValidDate(project.last_modified)) {
      errors.push('Invalid last_modified date');
    }

    const score = this.calculateValidationScore(errors.length, warnings.length, 12); // 12 total checks

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  validateCalculation(calculation: TestCalculation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!calculation.id) errors.push('Calculation ID is required');
    if (!calculation.projectId) errors.push('Project ID is required');
    if (!calculation.userId) errors.push('User ID is required');
    if (!calculation.type) errors.push('Calculation type is required');

    // Inputs validation
    if (!calculation.inputs || typeof calculation.inputs !== 'object') {
      errors.push('Calculation inputs are required');
    } else {
      const inputValidation = this.validateCalculationInputs(calculation.type, calculation.inputs);
      errors.push(...inputValidation.errors);
      warnings.push(...inputValidation.warnings);
    }

    // Results validation
    if (!calculation.results || typeof calculation.results !== 'object') {
      errors.push('Calculation results are required');
    } else {
      const resultValidation = this.validateCalculationResults(calculation.type, calculation.results);
      errors.push(...resultValidation.errors);
      warnings.push(...resultValidation.warnings);
    }

    // Cross-validation between inputs and results
    if (calculation.inputs && calculation.results) {
      const crossValidation = this.validateCalculationConsistency(calculation.type, calculation.inputs, calculation.results);
      errors.push(...crossValidation.errors);
      warnings.push(...crossValidation.warnings);
    }

    // Metadata validation
    if (calculation.metadata) {
      if (!calculation.metadata.calculationMethod) {
        warnings.push('Calculation metadata should include calculation method');
      }
      if (!calculation.metadata.version) {
        warnings.push('Calculation metadata should include version');
      }
    }

    const score = this.calculateValidationScore(errors.length, warnings.length, 10); // 10 total checks

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  validateSegmentData(segment: any, segmentNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!segment.id) errors.push(`Segment ${segmentNumber} missing ID`);
    if (!segment.name) errors.push(`Segment ${segmentNumber} missing name`);

    // Airflow validation
    if (typeof segment.airflow !== 'number' || segment.airflow <= 0) {
      errors.push(`Segment ${segmentNumber} has invalid airflow`);
    } else if (segment.airflow < this.hvacRules.airflowRange.min || segment.airflow > this.hvacRules.airflowRange.max) {
      warnings.push(`Segment ${segmentNumber} airflow (${segment.airflow} CFM) outside typical range`);
    }

    // Length validation
    if (typeof segment.length !== 'number' || segment.length <= 0) {
      errors.push(`Segment ${segmentNumber} has invalid length`);
    }

    // Material validation
    const validMaterials = ['galvanized_steel', 'aluminum', 'stainless_steel', 'pvc', 'fiberglass'];
    if (!segment.material || !validMaterials.includes(segment.material)) {
      warnings.push(`Segment ${segmentNumber} has unusual material: ${segment.material}`);
    }

    // Dimension validation
    if (segment.diameter) {
      if (typeof segment.diameter !== 'number' || segment.diameter <= 0) {
        errors.push(`Segment ${segmentNumber} has invalid diameter`);
      } else if (segment.diameter < this.hvacRules.diameterRange.min || segment.diameter > this.hvacRules.diameterRange.max) {
        warnings.push(`Segment ${segmentNumber} diameter (${segment.diameter}") outside typical range`);
      }
    }

    if (segment.width && segment.height) {
      if (typeof segment.width !== 'number' || segment.width <= 0) {
        errors.push(`Segment ${segmentNumber} has invalid width`);
      }
      if (typeof segment.height !== 'number' || segment.height <= 0) {
        errors.push(`Segment ${segmentNumber} has invalid height`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors.length, warnings.length, 8)
    };
  }

  validateCalculationInputs(calculationType: string, inputs: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (calculationType) {
      case 'round_duct':
        if (typeof inputs.airflow !== 'number' || inputs.airflow <= 0) {
          errors.push('Round duct calculation requires valid airflow');
        }
        if (typeof inputs.velocity !== 'number' || inputs.velocity <= 0) {
          errors.push('Round duct calculation requires valid velocity');
        }
        break;

      case 'rectangular_duct':
        if (typeof inputs.airflow !== 'number' || inputs.airflow <= 0) {
          errors.push('Rectangular duct calculation requires valid airflow');
        }
        if (typeof inputs.width !== 'number' || inputs.width <= 0) {
          errors.push('Rectangular duct calculation requires valid width');
        }
        if (typeof inputs.height !== 'number' || inputs.height <= 0) {
          errors.push('Rectangular duct calculation requires valid height');
        }
        break;

      case 'load_calculation':
        if (typeof inputs.area !== 'number' || inputs.area <= 0) {
          errors.push('Load calculation requires valid area');
        }
        if (typeof inputs.occupancy !== 'number' || inputs.occupancy < 0) {
          errors.push('Load calculation requires valid occupancy');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors.length, warnings.length, 5)
    };
  }

  validateCalculationResults(calculationType: string, results: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (calculationType) {
      case 'round_duct':
        if (typeof results.diameter !== 'number' || results.diameter <= 0) {
          errors.push('Round duct results must include valid diameter');
        }
        if (typeof results.pressureDrop !== 'number' || results.pressureDrop < 0) {
          errors.push('Round duct results must include valid pressure drop');
        }
        break;

      case 'rectangular_duct':
        if (typeof results.velocity !== 'number' || results.velocity <= 0) {
          errors.push('Rectangular duct results must include valid velocity');
        }
        if (typeof results.pressureDrop !== 'number' || results.pressureDrop < 0) {
          errors.push('Rectangular duct results must include valid pressure drop');
        }
        break;

      case 'load_calculation':
        if (typeof results.totalLoad !== 'number' || results.totalLoad <= 0) {
          errors.push('Load calculation results must include valid total load');
        }
        if (typeof results.tons !== 'number' || results.tons <= 0) {
          errors.push('Load calculation results must include valid tonnage');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors.length, warnings.length, 4)
    };
  }

  validateCalculationConsistency(calculationType: string, inputs: any, results: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (calculationType) {
      case 'round_duct':
        if (inputs.airflow && inputs.velocity && results.diameter) {
          // Check if diameter calculation is consistent: A = Q/V, D = sqrt(4A/π)
          const expectedArea = inputs.airflow / inputs.velocity; // sq ft
          const expectedDiameter = Math.sqrt(4 * expectedArea / Math.PI) * 12; // inches
          const tolerance = 0.5; // inches

          if (Math.abs(results.diameter - expectedDiameter) > tolerance) {
            warnings.push(`Diameter calculation may be inconsistent. Expected ~${expectedDiameter.toFixed(1)}", got ${results.diameter}"`);
          }
        }
        break;

      case 'rectangular_duct':
        if (inputs.airflow && inputs.width && inputs.height && results.velocity) {
          const area = (inputs.width * inputs.height) / 144; // sq ft
          const expectedVelocity = inputs.airflow / area;
          const tolerance = 50; // FPM

          if (Math.abs(results.velocity - expectedVelocity) > tolerance) {
            warnings.push(`Velocity calculation may be inconsistent. Expected ~${expectedVelocity.toFixed(0)} FPM, got ${results.velocity} FPM`);
          }
        }
        break;

      case 'load_calculation':
        if (results.sensibleLoad && results.latentLoad && results.totalLoad) {
          const expectedTotal = results.sensibleLoad + results.latentLoad;
          const tolerance = 100; // BTU/hr

          if (Math.abs(results.totalLoad - expectedTotal) > tolerance) {
            warnings.push(`Total load calculation may be inconsistent. Expected ${expectedTotal}, got ${results.totalLoad}`);
          }
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors.length, warnings.length, 3)
    };
  }

  validateTestScenario(scenario: TestScenario): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;
    let validationCount = 0;

    // Validate scenario metadata
    if (!scenario.name) errors.push('Scenario name is required');
    if (!scenario.description) warnings.push('Scenario description is recommended');

    // Validate users
    scenario.users.forEach((user, index) => {
      const userValidation = this.validateUser(user);
      if (!userValidation.isValid) {
        errors.push(`User ${index + 1}: ${userValidation.errors.join(', ')}`);
      }
      warnings.push(...userValidation.warnings.map(w => `User ${index + 1}: ${w}`));
      totalScore += userValidation.score;
      validationCount++;
    });

    // Validate projects
    scenario.projects.forEach((project, index) => {
      const projectValidation = this.validateProject(project);
      if (!projectValidation.isValid) {
        errors.push(`Project ${index + 1}: ${projectValidation.errors.join(', ')}`);
      }
      warnings.push(...projectValidation.warnings.map(w => `Project ${index + 1}: ${w}`));
      totalScore += projectValidation.score;
      validationCount++;
    });

    // Validate calculations
    scenario.calculations.forEach((calculation, index) => {
      const calcValidation = this.validateCalculation(calculation);
      if (!calcValidation.isValid) {
        errors.push(`Calculation ${index + 1}: ${calcValidation.errors.join(', ')}`);
      }
      warnings.push(...calcValidation.warnings.map(w => `Calculation ${index + 1}: ${w}`));
      totalScore += calcValidation.score;
      validationCount++;
    });

    // Validate data relationships
    const relationshipValidation = this.validateDataRelationships(scenario);
    errors.push(...relationshipValidation.errors);
    warnings.push(...relationshipValidation.warnings);

    const averageScore = validationCount > 0 ? totalScore / validationCount : 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: averageScore
    };
  }

  validateDataRelationships(scenario: TestScenario): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const userIds = new Set(scenario.users.map(u => u.id));
    const projectIds = new Set(scenario.projects.map(p => p.uuid));

    // Check project-user relationships
    scenario.projects.forEach(project => {
      // Note: TestProject doesn't have user_id field in current structure
      // This would need to be added if user relationships are needed
    });

    // Check calculation-project relationships
    scenario.calculations.forEach(calculation => {
      if (!projectIds.has(calculation.projectId)) {
        errors.push(`Calculation ${calculation.id} references non-existent project ${calculation.projectId}`);
      }
      if (!userIds.has(calculation.userId)) {
        errors.push(`Calculation ${calculation.id} references non-existent user ${calculation.userId}`);
      }
    });

    // Check segment-project relationships
    scenario.segments.forEach(segment => {
      if (!projectIds.has(segment.projectUuid)) {
        errors.push(`Segment ${segment.uuid} references non-existent project ${segment.projectUuid}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors.length, warnings.length, 5)
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private calculateValidationScore(errorCount: number, warningCount: number, totalChecks: number): number {
    const errorPenalty = errorCount * 20; // 20 points per error
    const warningPenalty = warningCount * 5; // 5 points per warning
    const maxScore = 100;
    
    const score = Math.max(0, maxScore - errorPenalty - warningPenalty);
    return Math.round(score);
  }
}

// Convenience functions
export function validateTestData(data: TestUser | TestProject | TestCalculation | TestScenario): ValidationResult {
  const validator = new TestDataValidator();
  
  if ('tier' in data) {
    return validator.validateUser(data as TestUser);
  } else if ('project_name' in data) {
    return validator.validateProject(data as TestProject);
  } else if ('type' in data && 'inputs' in data) {
    return validator.validateCalculation(data as TestCalculation);
  } else if ('users' in data && 'projects' in data) {
    return validator.validateTestScenario(data as TestScenario);
  } else {
    return {
      isValid: false,
      errors: ['Unknown data type for validation'],
      warnings: [],
      score: 0
    };
  }
}

export function generateValidationReport(validationResult: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Validation Score: ${validationResult.score}/100`);
  lines.push(`Status: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);
  
  if (validationResult.errors.length > 0) {
    lines.push('\nErrors:');
    validationResult.errors.forEach(error => lines.push(`  - ${error}`));
  }
  
  if (validationResult.warnings.length > 0) {
    lines.push('\nWarnings:');
    validationResult.warnings.forEach(warning => lines.push(`  - ${warning}`));
  }
  
  return lines.join('\n');
}
