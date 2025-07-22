import { ValidationWarning } from '@/components/ui/WarningPanel';

export interface DuctSegment {
  id: string;
  type: 'supply' | 'return' | 'exhaust';
  width: number;
  height: number;
  length: number;
  material: string;
  airflow: number;
  velocity?: number;
  pressureLoss?: number;
  frictionRate?: number;
}

export interface Room {
  id: string;
  name: string;
  area: number;
  airflow: number;
  function: string;
}

export interface ValidationContext {
  segments: DuctSegment[];
  rooms: Room[];
  standards: {
    ductSizing: string;
    material: string;
    velocityLimits: {
      supply: { min: number; max: number };
      return: { min: number; max: number };
      exhaust: { min: number; max: number };
    };
    pressureLimits: {
      maxStaticPressure: number;
      maxVelocityPressure: number;
    };
  };
}

export class HVACValidator {
  private static instance: HVACValidator;
  
  public static getInstance(): HVACValidator {
    if (!HVACValidator.instance) {
      HVACValidator.instance = new HVACValidator();
    }
    return HVACValidator.instance;
  }

  /**
   * Validate all elements and return warnings
   */
  public validateSystem(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Validate each duct segment
    context.segments.forEach(segment => {
      warnings.push(...this.validateDuctSegment(segment, context.standards));
    });

    // Validate rooms
    context.rooms.forEach(room => {
      warnings.push(...this.validateRoom(room));
    });

    // System-level validations
    warnings.push(...this.validateSystemBalance(context));

    return warnings;
  }

  /**
   * Validate individual duct segment
   */
  private validateDuctSegment(segment: DuctSegment, standards: ValidationContext['standards']): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const now = new Date();

    // Calculate velocity if not provided
    const area = (segment.width * segment.height) / 144; // sq ft
    const velocity = segment.velocity || (segment.airflow / area);

    // SMACNA Velocity Limits
    const velocityLimits = standards.velocityLimits[segment.type];
    if (velocity > velocityLimits.max) {
      warnings.push({
        id: `velocity-high-${segment.id}`,
        type: 'error',
        category: 'SMACNA',
        title: 'Velocity Exceeds Maximum',
        message: `Velocity of ${velocity.toFixed(0)} FPM exceeds SMACNA maximum of ${velocityLimits.max} FPM for ${segment.type} ducts.`,
        elementId: segment.id,
        elementType: 'duct',
        code: 'SMACNA-VEL-001',
        severity: 'high',
        timestamp: now
      });
    }

    if (velocity < velocityLimits.min) {
      warnings.push({
        id: `velocity-low-${segment.id}`,
        type: 'warning',
        category: 'SMACNA',
        title: 'Velocity Below Minimum',
        message: `Velocity of ${velocity.toFixed(0)} FPM is below SMACNA minimum of ${velocityLimits.min} FPM for ${segment.type} ducts. This may cause poor air distribution.`,
        elementId: segment.id,
        elementType: 'duct',
        code: 'SMACNA-VEL-002',
        severity: 'medium',
        timestamp: now
      });
    }

    // Aspect Ratio Check
    const aspectRatio = Math.max(segment.width, segment.height) / Math.min(segment.width, segment.height);
    if (aspectRatio > 4.0) {
      warnings.push({
        id: `aspect-ratio-${segment.id}`,
        type: 'warning',
        category: 'SMACNA',
        title: 'High Aspect Ratio',
        message: `Aspect ratio of ${aspectRatio.toFixed(1)}:1 exceeds recommended maximum of 4:1. Consider using a more square duct for better performance.`,
        elementId: segment.id,
        elementType: 'duct',
        code: 'SMACNA-AR-001',
        severity: 'medium',
        timestamp: now
      });
    }

    // Pressure Loss Check
    if (segment.pressureLoss && segment.pressureLoss > standards.pressureLimits.maxStaticPressure) {
      warnings.push({
        id: `pressure-high-${segment.id}`,
        type: 'error',
        category: 'ASHRAE',
        title: 'Excessive Pressure Loss',
        message: `Pressure loss of ${segment.pressureLoss.toFixed(2)}" w.g. exceeds system limit of ${standards.pressureLimits.maxStaticPressure}" w.g.`,
        elementId: segment.id,
        elementType: 'duct',
        code: 'ASHRAE-PL-001',
        severity: 'critical',
        timestamp: now
      });
    }

    // Material Compatibility
    if (segment.type === 'exhaust' && segment.material === 'pvc') {
      warnings.push({
        id: `material-compatibility-${segment.id}`,
        type: 'warning',
        category: 'Safety',
        title: 'Material Compatibility Warning',
        message: 'PVC material may not be suitable for all exhaust applications. Verify temperature and chemical compatibility.',
        elementId: segment.id,
        elementType: 'duct',
        code: 'SAFETY-MAT-001',
        severity: 'medium',
        timestamp: now
      });
    }

    // Minimum Duct Size
    if (segment.width < 4 || segment.height < 4) {
      warnings.push({
        id: `min-size-${segment.id}`,
        type: 'error',
        category: 'SMACNA',
        title: 'Duct Size Too Small',
        message: 'Minimum duct dimension is 4 inches per SMACNA standards.',
        elementId: segment.id,
        elementType: 'duct',
        code: 'SMACNA-SIZE-001',
        severity: 'high',
        timestamp: now
      });
    }

    // Friction Rate Check
    if (segment.frictionRate && segment.frictionRate > 0.5) {
      warnings.push({
        id: `friction-high-${segment.id}`,
        type: 'warning',
        category: 'Performance',
        title: 'High Friction Rate',
        message: `Friction rate of ${segment.frictionRate.toFixed(3)}" w.g./100ft is high. Consider increasing duct size for better efficiency.`,
        elementId: segment.id,
        elementType: 'duct',
        code: 'PERF-FR-001',
        severity: 'medium',
        timestamp: now
      });
    }

    return warnings;
  }

  /**
   * Validate room requirements
   */
  private validateRoom(room: Room): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const now = new Date();

    // Air changes per hour check
    const ceilingHeight = 10; // Assume 10ft ceiling
    const roomVolume = room.area * ceilingHeight;
    const airChangesPerHour = (room.airflow * 60) / roomVolume;

    // Minimum ACH requirements by room function
    const minACH = {
      'office': 4,
      'classroom': 6,
      'laboratory': 8,
      'kitchen': 15,
      'bathroom': 8,
      'conference': 6
    };

    const requiredACH = minACH[room.function as keyof typeof minACH] || 4;
    
    if (airChangesPerHour < requiredACH) {
      warnings.push({
        id: `ach-low-${room.id}`,
        type: 'warning',
        category: 'ASHRAE',
        title: 'Insufficient Air Changes',
        message: `Room has ${airChangesPerHour.toFixed(1)} ACH, but ${room.function} requires minimum ${requiredACH} ACH.`,
        elementId: room.id,
        elementType: 'room',
        code: 'ASHRAE-ACH-001',
        severity: 'medium',
        timestamp: now
      });
    }

    // Airflow density check
    const airflowPerSqFt = room.airflow / room.area;
    if (airflowPerSqFt < 0.5) {
      warnings.push({
        id: `airflow-density-${room.id}`,
        type: 'info',
        category: 'Performance',
        title: 'Low Airflow Density',
        message: `Airflow density of ${airflowPerSqFt.toFixed(2)} CFM/sq ft may be insufficient for comfort.`,
        elementId: room.id,
        elementType: 'room',
        code: 'PERF-AFD-001',
        severity: 'low',
        timestamp: now
      });
    }

    return warnings;
  }

  /**
   * System-level validations
   */
  private validateSystemBalance(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const now = new Date();

    // Calculate total supply vs return airflow
    const supplyFlow = context.segments
      .filter(s => s.type === 'supply')
      .reduce((sum, s) => sum + s.airflow, 0);
    
    const returnFlow = context.segments
      .filter(s => s.type === 'return')
      .reduce((sum, s) => sum + s.airflow, 0);

    const imbalance = Math.abs(supplyFlow - returnFlow);
    const imbalancePercent = (imbalance / Math.max(supplyFlow, returnFlow)) * 100;

    if (imbalancePercent > 10) {
      warnings.push({
        id: 'system-imbalance',
        type: 'warning',
        category: 'ASHRAE',
        title: 'System Airflow Imbalance',
        message: `Supply (${supplyFlow.toFixed(0)} CFM) and return (${returnFlow.toFixed(0)} CFM) airflows are imbalanced by ${imbalancePercent.toFixed(1)}%.`,
        code: 'ASHRAE-BAL-001',
        severity: 'medium',
        timestamp: now
      });
    }

    // Check for oversized ducts (low velocity across system)
    const lowVelocitySegments = context.segments.filter(s => {
      const area = (s.width * s.height) / 144;
      const velocity = s.airflow / area;
      return velocity < 400; // Below minimum recommended
    });

    if (lowVelocitySegments.length > context.segments.length * 0.3) {
      warnings.push({
        id: 'system-oversized',
        type: 'info',
        category: 'Performance',
        title: 'System May Be Oversized',
        message: `${lowVelocitySegments.length} segments have low velocity. Consider reducing duct sizes for better performance and cost savings.`,
        code: 'PERF-OS-001',
        severity: 'low',
        timestamp: now
      });
    }

    return warnings;
  }

  /**
   * Get validation suggestions for improving system
   */
  public getOptimizationSuggestions(context: ValidationContext): ValidationWarning[] {
    const suggestions: ValidationWarning[] = [];
    const now = new Date();

    // Energy efficiency suggestions
    const highVelocitySegments = context.segments.filter(s => {
      const area = (s.width * s.height) / 144;
      const velocity = s.airflow / area;
      return velocity > 1800; // Above efficient range
    });

    if (highVelocitySegments.length > 0) {
      suggestions.push({
        id: 'efficiency-suggestion',
        type: 'info',
        category: 'Performance',
        title: 'Energy Efficiency Opportunity',
        message: `${highVelocitySegments.length} segments could be upsized to reduce fan energy consumption.`,
        code: 'PERF-EFF-001',
        severity: 'low',
        timestamp: now
      });
    }

    return suggestions;
  }
}
