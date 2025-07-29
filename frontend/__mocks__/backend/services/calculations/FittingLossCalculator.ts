/**
 * Mock FittingLossCalculator for Jest testing
 * Provides mock implementations for fitting loss calculations
 */

export interface FittingConfiguration {
  type: string;
  size?: string;
  angle?: number;
  velocity?: number;
  airDensity?: number;
  roughness?: number;
}

export interface VelocityPressureInput {
  velocity: number;
  airDensity?: number;
}

export interface FittingLossResult {
  velocityPressure: number;
  kFactor: number;
  pressureLoss: number;
  configuration: FittingConfiguration;
}

export class FittingLossCalculator {
  static calculateVelocityPressure(input: VelocityPressureInput): number {
    const { velocity, airDensity = 0.075 } = input;
    // Mock calculation: VP = (V/4005)² for standard air density
    return Math.pow(velocity / 4005, 2);
  }

  static getKFactor(config: FittingConfiguration): number {
    // Mock K-factor lookup based on fitting type
    const mockKFactors: Record<string, number> = {
      'elbow_90': 0.75,
      'elbow_45': 0.35,
      'tee_branch': 1.0,
      'tee_straight': 0.2,
      'reducer': 0.1,
      'expansion': 0.25,
      'entrance': 0.5,
      'exit': 1.0,
    };
    
    return mockKFactors[config.type] || 0.5;
  }

  static calculateFittingLoss(config: FittingConfiguration): FittingLossResult {
    const velocity = config.velocity || 1000;
    const velocityPressure = this.calculateVelocityPressure({ velocity });
    const kFactor = this.getKFactor(config);
    const pressureLoss = kFactor * velocityPressure;

    return {
      velocityPressure,
      kFactor,
      pressureLoss,
      configuration: config,
    };
  }

  static calculateSystemLoss(fittings: FittingConfiguration[]): {
    totalPressureLoss: number;
    fittingResults: FittingLossResult[];
  } {
    const fittingResults = fittings.map(fitting => this.calculateFittingLoss(fitting));
    const totalPressureLoss = fittingResults.reduce((sum, result) => sum + result.pressureLoss, 0);

    return {
      totalPressureLoss,
      fittingResults,
    };
  }

  static validateConfiguration(config: FittingConfiguration): boolean {
    return !!(config.type && config.velocity && config.velocity > 0);
  }

  static getSupportedFittingTypes(): string[] {
    return [
      'elbow_90',
      'elbow_45', 
      'tee_branch',
      'tee_straight',
      'reducer',
      'expansion',
      'entrance',
      'exit',
    ];
  }
}

// Export default for compatibility
export default FittingLossCalculator;
