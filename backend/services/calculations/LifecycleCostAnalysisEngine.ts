/**
 * Lifecycle Cost Analysis Engine
 * 
 * Comprehensive lifecycle cost analysis service for Phase 3 Priority 3: Advanced System Analysis Tools
 * Provides initial costs, operating costs, maintenance costs, energy costs, and total cost of ownership
 * calculations for HVAC duct systems.
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import {
  LifecycleCostAnalysis,
  CostAnalysisParameters,
  InitialCosts,
  OperatingCosts,
  MaintenanceCosts,
  ReplacementCosts,
  TotalCostOfOwnership,
  CostComparison,
  CostSensitivityAnalysis,
  CostRecommendation,
  CostAnalysisMethod,
  UncertaintyLevel,
  EquipmentCosts,
  SystemConfiguration,
  EnergyAnalysis,
  TimeFrame
} from './types/SystemAnalysisTypes';

import { EnergyEfficiencyAnalysisEngine } from './EnergyEfficiencyAnalysisEngine';

/**
 * Lifecycle Cost Analysis Engine
 * 
 * Provides comprehensive lifecycle cost analysis capabilities including:
 * - Initial capital cost analysis
 * - Operating cost projections
 * - Maintenance cost modeling
 * - Replacement cost planning
 * - Total cost of ownership calculations
 * - Cost comparison and sensitivity analysis
 * - Financial metrics (NPV, IRR, Payback)
 */
export class LifecycleCostAnalysisEngine {
  private static readonly VERSION = '3.0.0';
  private static readonly COST_CACHE = new Map<string, LifecycleCostAnalysis>();
  
  // Cost escalation rates (annual)
  private static readonly DEFAULT_ESCALATION_RATES = {
    ENERGY: 0.03, // 3% annual energy cost escalation
    MAINTENANCE: 0.025, // 2.5% annual maintenance cost escalation
    LABOR: 0.035, // 3.5% annual labor cost escalation
    MATERIALS: 0.028 // 2.8% annual materials cost escalation
  };

  // Equipment life expectancy (years)
  private static readonly EQUIPMENT_LIFE = {
    FANS: 20,
    MOTORS: 15,
    VFD: 12,
    DUCTWORK: 30,
    DAMPERS: 20,
    CONTROLS: 10,
    FILTERS: 0.25 // 3 months
  };

  /**
   * Perform comprehensive lifecycle cost analysis
   */
  public static async analyzeLifecycleCosts(
    systemConfiguration: SystemConfiguration,
    energyAnalysis: EnergyAnalysis,
    analysisParameters?: Partial<CostAnalysisParameters>
  ): Promise<LifecycleCostAnalysis> {
    try {
      const analysisId = this.generateAnalysisId(systemConfiguration.id);
      const timestamp = new Date();

      // Set default analysis parameters
      const parameters = this.setDefaultParameters(analysisParameters);

      // Calculate initial costs
      const initialCosts = await this.calculateInitialCosts(systemConfiguration);

      // Calculate operating costs
      const operatingCosts = await this.calculateOperatingCosts(
        systemConfiguration,
        energyAnalysis,
        parameters
      );

      // Calculate maintenance costs
      const maintenanceCosts = await this.calculateMaintenanceCosts(
        systemConfiguration,
        parameters
      );

      // Calculate replacement costs
      const replacementCosts = await this.calculateReplacementCosts(
        systemConfiguration,
        parameters
      );

      // Calculate total cost of ownership
      const totalCostOfOwnership = await this.calculateTotalCostOfOwnership(
        initialCosts,
        operatingCosts,
        maintenanceCosts,
        replacementCosts,
        parameters
      );

      // Perform cost comparison
      const costComparison = await this.performCostComparison(
        systemConfiguration,
        totalCostOfOwnership
      );

      // Perform sensitivity analysis
      const sensitivityAnalysis = await this.performSensitivityAnalysis(
        systemConfiguration,
        parameters,
        totalCostOfOwnership
      );

      // Generate cost recommendations
      const recommendations = await this.generateCostRecommendations(
        totalCostOfOwnership,
        sensitivityAnalysis,
        costComparison
      );

      const analysis: LifecycleCostAnalysis = {
        id: analysisId,
        systemId: systemConfiguration.id,
        analysisTimestamp: timestamp,
        analysisParameters: parameters,
        initialCosts,
        operatingCosts,
        maintenanceCosts,
        replacementCosts,
        totalCostOfOwnership,
        costComparison,
        sensitivityAnalysis,
        recommendations
      };

      // Cache the analysis
      this.COST_CACHE.set(analysisId, analysis);

      return analysis;

    } catch (error) {
      throw new Error(`Lifecycle cost analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set default analysis parameters
   */
  private static setDefaultParameters(
    provided?: Partial<CostAnalysisParameters>
  ): CostAnalysisParameters {
    return {
      analysisHorizon: provided?.analysisHorizon || 20, // 20 years
      discountRate: provided?.discountRate || 0.06, // 6% discount rate
      inflationRate: provided?.inflationRate || 0.025, // 2.5% inflation
      energyEscalationRate: provided?.energyEscalationRate || this.DEFAULT_ESCALATION_RATES.ENERGY,
      currency: provided?.currency || 'USD',
      analysisMethod: provided?.analysisMethod || CostAnalysisMethod.NET_PRESENT_VALUE,
      uncertaintyLevel: provided?.uncertaintyLevel || UncertaintyLevel.MEDIUM
    };
  }

  /**
   * Calculate initial system costs
   */
  private static async calculateInitialCosts(
    systemConfiguration: SystemConfiguration
  ): Promise<InitialCosts> {
    const designAirflow = systemConfiguration.designParameters.designAirflow;
    const systemType = systemConfiguration.systemType;

    // Equipment costs based on system size and type
    const equipmentCosts = this.calculateEquipmentCosts(systemConfiguration);

    // Installation costs (typically 40-60% of equipment costs)
    const installationCosts = this.calculateInstallationCosts(equipmentCosts);

    // Design costs (typically 8-12% of total project cost)
    const designCosts = this.calculateDesignCosts(equipmentCosts, installationCosts);

    // Permits and fees (typically 2-5% of total project cost)
    const permitsCosts = this.calculatePermitsCosts(equipmentCosts, installationCosts);

    const totalInitialCost = equipmentCosts.total + installationCosts.total + 
                           designCosts.total + permitsCosts.total;

    return {
      equipmentCosts,
      installationCosts,
      designCosts,
      permitsCosts,
      totalInitialCost,
      costPerCFM: totalInitialCost / designAirflow,
      costPerSquareFoot: totalInitialCost / 10000 // Assumed building area
    };
  }

  /**
   * Calculate equipment costs breakdown
   */
  private static calculateEquipmentCosts(systemConfiguration: SystemConfiguration): EquipmentCosts {
    const designAirflow = systemConfiguration.designParameters.designAirflow;
    const designPressure = systemConfiguration.designParameters.designPressure;

    // Cost factors based on system size ($/CFM)
    const fanCostFactor = this.getFanCostFactor(designAirflow, designPressure);
    const ductworkCostFactor = 8.5; // $/CFM for ductwork
    const fittingsCostFactor = 2.2; // $/CFM for fittings
    const dampersCostFactor = 1.8; // $/CFM for dampers
    const controlsCostFactor = 3.5; // $/CFM for controls
    const accessoriesCostFactor = 1.2; // $/CFM for accessories

    const fans = designAirflow * fanCostFactor;
    const ductwork = designAirflow * ductworkCostFactor;
    const fittings = designAirflow * fittingsCostFactor;
    const dampers = designAirflow * dampersCostFactor;
    const controls = designAirflow * controlsCostFactor;
    const accessories = designAirflow * accessoriesCostFactor;

    return {
      fans,
      ductwork,
      fittings,
      dampers,
      controls,
      accessories,
      total: fans + ductwork + fittings + dampers + controls + accessories
    };
  }

  /**
   * Get fan cost factor based on size and pressure
   */
  private static getFanCostFactor(airflow: number, pressure: number): number {
    // Base cost factor
    let costFactor = 12.0; // $/CFM base

    // Size adjustments
    if (airflow > 50000) costFactor *= 0.85; // Economies of scale
    else if (airflow < 5000) costFactor *= 1.25; // Small system premium

    // Pressure adjustments
    if (pressure > 4.0) costFactor *= 1.3; // High pressure premium
    else if (pressure < 2.0) costFactor *= 0.9; // Low pressure discount

    return costFactor;
  }

  /**
   * Calculate installation costs
   */
  private static calculateInstallationCosts(equipmentCosts: EquipmentCosts): InstallationCosts {
    // Installation cost factors (as percentage of equipment cost)
    const factors = {
      fans: 0.4, // 40% of fan cost
      ductwork: 0.6, // 60% of ductwork cost
      fittings: 0.5, // 50% of fittings cost
      dampers: 0.3, // 30% of dampers cost
      controls: 0.8, // 80% of controls cost (complex installation)
      accessories: 0.4 // 40% of accessories cost
    };

    const fans = equipmentCosts.fans * factors.fans;
    const ductwork = equipmentCosts.ductwork * factors.ductwork;
    const fittings = equipmentCosts.fittings * factors.fittings;
    const dampers = equipmentCosts.dampers * factors.dampers;
    const controls = equipmentCosts.controls * factors.controls;
    const accessories = equipmentCosts.accessories * factors.accessories;

    // Additional installation costs
    const laborCosts = (fans + ductwork + fittings + dampers + controls + accessories) * 0.6;
    const materialsCosts = equipmentCosts.total * 0.15; // 15% for installation materials
    const equipmentRental = equipmentCosts.total * 0.05; // 5% for equipment rental
    const testing = equipmentCosts.total * 0.03; // 3% for testing and commissioning

    const total = fans + ductwork + fittings + dampers + controls + accessories + 
                 laborCosts + materialsCosts + equipmentRental + testing;

    return {
      fans,
      ductwork,
      fittings,
      dampers,
      controls,
      accessories,
      laborCosts,
      materialsCosts,
      equipmentRental,
      testing,
      total
    };
  }

  /**
   * Calculate design costs
   */
  private static calculateDesignCosts(
    equipmentCosts: EquipmentCosts,
    installationCosts: InstallationCosts
  ): DesignCosts {
    const projectCost = equipmentCosts.total + installationCosts.total;

    const engineeringDesign = projectCost * 0.08; // 8% for engineering design
    const drawings = projectCost * 0.02; // 2% for drawings and specifications
    const calculations = projectCost * 0.015; // 1.5% for calculations
    const projectManagement = projectCost * 0.025; // 2.5% for project management

    return {
      engineeringDesign,
      drawings,
      calculations,
      projectManagement,
      total: engineeringDesign + drawings + calculations + projectManagement
    };
  }

  /**
   * Calculate permits and fees
   */
  private static calculatePermitsCosts(
    equipmentCosts: EquipmentCosts,
    installationCosts: InstallationCosts
  ): PermitsCosts {
    const projectCost = equipmentCosts.total + installationCosts.total;

    const buildingPermits = projectCost * 0.015; // 1.5% for building permits
    const inspectionFees = projectCost * 0.008; // 0.8% for inspection fees
    const utilityConnections = 2500; // Fixed cost for utility connections
    const environmentalFees = projectCost * 0.005; // 0.5% for environmental fees

    return {
      buildingPermits,
      inspectionFees,
      utilityConnections,
      environmentalFees,
      total: buildingPermits + inspectionFees + utilityConnections + environmentalFees
    };
  }

  /**
   * Calculate operating costs over analysis horizon
   */
  private static async calculateOperatingCosts(
    systemConfiguration: SystemConfiguration,
    energyAnalysis: EnergyAnalysis,
    parameters: CostAnalysisParameters
  ): Promise<OperatingCosts> {
    const analysisHorizon = parameters.analysisHorizon;
    const energyEscalationRate = parameters.energyEscalationRate;
    const discountRate = parameters.discountRate;

    // Annual energy costs
    const annualEnergyCosts = energyAnalysis.energyCosts.currentCosts.totalCost;

    // Calculate present value of energy costs over analysis horizon
    let totalEnergyPV = 0;
    const yearlyEnergyCosts: number[] = [];

    for (let year = 1; year <= analysisHorizon; year++) {
      const yearlyEnergyCost = annualEnergyCosts * Math.pow(1 + energyEscalationRate, year - 1);
      const presentValue = yearlyEnergyCost / Math.pow(1 + discountRate, year);
      totalEnergyPV += presentValue;
      yearlyEnergyCosts.push(yearlyEnergyCost);
    }

    // Other operating costs
    const annualInsurance = annualEnergyCosts * 0.02; // 2% of energy costs
    const annualUtilities = 1200; // Fixed annual utilities
    const annualCompliance = 800; // Annual compliance and reporting costs

    // Calculate present values for other operating costs
    const insurancePV = this.calculatePresentValue(annualInsurance, parameters.inflationRate, discountRate, analysisHorizon);
    const utilitiesPV = this.calculatePresentValue(annualUtilities, parameters.inflationRate, discountRate, analysisHorizon);
    const compliancePV = this.calculatePresentValue(annualCompliance, parameters.inflationRate, discountRate, analysisHorizon);

    const totalOperatingPV = totalEnergyPV + insurancePV + utilitiesPV + compliancePV;

    return {
      energyCosts: {
        annual: annualEnergyCosts,
        presentValue: totalEnergyPV,
        yearlyProjection: yearlyEnergyCosts,
        escalationRate: energyEscalationRate
      },
      maintenanceCosts: {
        annual: 0, // Calculated separately
        presentValue: 0,
        yearlyProjection: [],
        escalationRate: this.DEFAULT_ESCALATION_RATES.MAINTENANCE
      },
      insuranceCosts: {
        annual: annualInsurance,
        presentValue: insurancePV,
        escalationRate: parameters.inflationRate
      },
      utilityCosts: {
        annual: annualUtilities,
        presentValue: utilitiesPV,
        escalationRate: parameters.inflationRate
      },
      complianceCosts: {
        annual: annualCompliance,
        presentValue: compliancePV,
        escalationRate: parameters.inflationRate
      },
      totalAnnual: annualEnergyCosts + annualInsurance + annualUtilities + annualCompliance,
      totalPresentValue: totalOperatingPV
    };
  }

  /**
   * Calculate present value of annual costs
   */
  private static calculatePresentValue(
    annualCost: number,
    escalationRate: number,
    discountRate: number,
    years: number
  ): number {
    let presentValue = 0;
    
    for (let year = 1; year <= years; year++) {
      const yearlyValue = annualCost * Math.pow(1 + escalationRate, year - 1);
      presentValue += yearlyValue / Math.pow(1 + discountRate, year);
    }
    
    return presentValue;
  }

  /**
   * Calculate maintenance costs over analysis horizon
   */
  private static async calculateMaintenanceCosts(
    systemConfiguration: SystemConfiguration,
    parameters: CostAnalysisParameters
  ): Promise<MaintenanceCosts> {
    const designAirflow = systemConfiguration.designParameters.designAirflow;
    const analysisHorizon = parameters.analysisHorizon;
    const discountRate = parameters.discountRate;
    const maintenanceEscalationRate = this.DEFAULT_ESCALATION_RATES.MAINTENANCE;

    // Annual maintenance costs ($/CFM/year)
    const preventiveMaintenanceFactor = 0.8; // $/CFM/year
    const correctiveMaintenanceFactor = 0.4; // $/CFM/year
    const filterReplacementFactor = 0.6; // $/CFM/year

    const annualPreventive = designAirflow * preventiveMaintenanceFactor;
    const annualCorrective = designAirflow * correctiveMaintenanceFactor;
    const annualFilters = designAirflow * filterReplacementFactor;

    // Calculate present values
    const preventivePV = this.calculatePresentValue(annualPreventive, maintenanceEscalationRate, discountRate, analysisHorizon);
    const correctivePV = this.calculatePresentValue(annualCorrective, maintenanceEscalationRate, discountRate, analysisHorizon);
    const filtersPV = this.calculatePresentValue(annualFilters, maintenanceEscalationRate, discountRate, analysisHorizon);

    // Major overhauls (every 10 years)
    const majorOverhaulCost = designAirflow * 5.0; // $5/CFM
    const overhaulYears = [10, 20].filter(year => year <= analysisHorizon);
    let overhaulsPV = 0;
    
    overhaulYears.forEach(year => {
      const overhaulCostInflated = majorOverhaulCost * Math.pow(1 + maintenanceEscalationRate, year - 1);
      overhaulsPV += overhaulCostInflated / Math.pow(1 + discountRate, year);
    });

    const totalAnnual = annualPreventive + annualCorrective + annualFilters;
    const totalPresentValue = preventivePV + correctivePV + filtersPV + overhaulsPV;

    return {
      preventiveMaintenance: {
        annual: annualPreventive,
        presentValue: preventivePV,
        description: 'Regular inspections, cleaning, and adjustments'
      },
      correctiveMaintenance: {
        annual: annualCorrective,
        presentValue: correctivePV,
        description: 'Repairs and component replacements'
      },
      filterReplacement: {
        annual: annualFilters,
        presentValue: filtersPV,
        description: 'Regular filter replacements'
      },
      majorOverhauls: {
        cost: majorOverhaulCost,
        presentValue: overhaulsPV,
        schedule: overhaulYears,
        description: 'Major system overhauls and upgrades'
      },
      totalAnnual,
      totalPresentValue,
      escalationRate: maintenanceEscalationRate
    };
  }

  /**
   * Calculate replacement costs over analysis horizon
   */
  private static async calculateReplacementCosts(
    systemConfiguration: SystemConfiguration,
    parameters: CostAnalysisParameters
  ): Promise<ReplacementCosts> {
    const analysisHorizon = parameters.analysisHorizon;
    const discountRate = parameters.discountRate;
    const materialEscalationRate = this.DEFAULT_ESCALATION_RATES.MATERIALS;

    const equipmentReplacements: EquipmentReplacement[] = [];
    let totalReplacementPV = 0;

    // Calculate replacement costs for each equipment type
    const equipmentTypes = [
      { type: 'fans', life: this.EQUIPMENT_LIFE.FANS, costFactor: 12.0 },
      { type: 'motors', life: this.EQUIPMENT_LIFE.MOTORS, costFactor: 3.5 },
      { type: 'vfd', life: this.EQUIPMENT_LIFE.VFD, costFactor: 2.8 },
      { type: 'dampers', life: this.EQUIPMENT_LIFE.DAMPERS, costFactor: 1.8 },
      { type: 'controls', life: this.EQUIPMENT_LIFE.CONTROLS, costFactor: 3.5 }
    ];

    const designAirflow = systemConfiguration.designParameters.designAirflow;

    equipmentTypes.forEach(equipment => {
      const replacementYears = [];
      for (let year = equipment.life; year <= analysisHorizon; year += equipment.life) {
        replacementYears.push(year);
      }

      if (replacementYears.length > 0) {
        const replacementCost = designAirflow * equipment.costFactor;
        let equipmentPV = 0;

        replacementYears.forEach(year => {
          const inflatedCost = replacementCost * Math.pow(1 + materialEscalationRate, year - 1);
          const presentValue = inflatedCost / Math.pow(1 + discountRate, year);
          equipmentPV += presentValue;
        });

        equipmentReplacements.push({
          equipmentType: equipment.type,
          replacementYears,
          unitCost: replacementCost,
          totalPresentValue: equipmentPV,
          description: `${equipment.type} replacement based on ${equipment.life}-year life expectancy`
        });

        totalReplacementPV += equipmentPV;
      }
    });

    // Salvage value at end of analysis period
    const salvageValue = this.calculateSalvageValue(systemConfiguration, parameters);
    const salvagePV = salvageValue / Math.pow(1 + discountRate, analysisHorizon);

    return {
      equipmentReplacements,
      salvageValue: {
        value: salvageValue,
        presentValue: salvagePV,
        description: 'Estimated salvage value at end of analysis period'
      },
      totalReplacementCost: totalReplacementPV,
      netReplacementCost: totalReplacementPV - salvagePV
    };
  }

  /**
   * Calculate salvage value at end of analysis period
   */
  private static calculateSalvageValue(
    systemConfiguration: SystemConfiguration,
    parameters: CostAnalysisParameters
  ): number {
    const designAirflow = systemConfiguration.designParameters.designAirflow;
    const analysisHorizon = parameters.analysisHorizon;

    // Calculate remaining life for each equipment type
    const ductworkRemainingLife = Math.max(0, this.EQUIPMENT_LIFE.DUCTWORK - analysisHorizon);
    const fansRemainingLife = Math.max(0, this.EQUIPMENT_LIFE.FANS - (analysisHorizon % this.EQUIPMENT_LIFE.FANS));
    const dampersRemainingLife = Math.max(0, this.EQUIPMENT_LIFE.DAMPERS - (analysisHorizon % this.EQUIPMENT_LIFE.DAMPERS));

    // Calculate salvage value based on remaining useful life
    const ductworkSalvage = (designAirflow * 8.5) * (ductworkRemainingLife / this.EQUIPMENT_LIFE.DUCTWORK);
    const fansSalvage = (designAirflow * 12.0) * (fansRemainingLife / this.EQUIPMENT_LIFE.FANS);
    const dampersSalvage = (designAirflow * 1.8) * (dampersRemainingLife / this.EQUIPMENT_LIFE.DAMPERS);

    return ductworkSalvage + fansSalvage + dampersSalvage;
  }

  /**
   * Calculate total cost of ownership
   */
  private static async calculateTotalCostOfOwnership(
    initialCosts: InitialCosts,
    operatingCosts: OperatingCosts,
    maintenanceCosts: MaintenanceCosts,
    replacementCosts: ReplacementCosts,
    parameters: CostAnalysisParameters
  ): Promise<TotalCostOfOwnership> {
    const totalPresentValue = initialCosts.totalInitialCost +
                             operatingCosts.totalPresentValue +
                             maintenanceCosts.totalPresentValue +
                             replacementCosts.netReplacementCost;

    const totalAnnualizedCost = this.calculateAnnualizedCost(totalPresentValue, parameters);

    // Cost breakdown by category
    const costBreakdown = {
      initialCosts: {
        amount: initialCosts.totalInitialCost,
        percentage: (initialCosts.totalInitialCost / totalPresentValue) * 100
      },
      operatingCosts: {
        amount: operatingCosts.totalPresentValue,
        percentage: (operatingCosts.totalPresentValue / totalPresentValue) * 100
      },
      maintenanceCosts: {
        amount: maintenanceCosts.totalPresentValue,
        percentage: (maintenanceCosts.totalPresentValue / totalPresentValue) * 100
      },
      replacementCosts: {
        amount: replacementCosts.netReplacementCost,
        percentage: (replacementCosts.netReplacementCost / totalPresentValue) * 100
      }
    };

    // Financial metrics
    const financialMetrics = this.calculateFinancialMetrics(
      initialCosts.totalInitialCost,
      operatingCosts.energyCosts.annual + maintenanceCosts.totalAnnual,
      parameters
    );

    return {
      totalPresentValue,
      totalAnnualizedCost,
      costBreakdown,
      financialMetrics,
      analysisParameters: parameters,
      costPerCFM: totalPresentValue / 10000, // Assuming 10,000 CFM system
      costPerSquareFoot: totalPresentValue / 10000, // Assuming 10,000 sq ft building
      paybackPeriod: this.calculateSimplePaybackPeriod(initialCosts.totalInitialCost, operatingCosts.energyCosts.annual)
    };
  }

  /**
   * Calculate annualized cost
   */
  private static calculateAnnualizedCost(
    presentValue: number,
    parameters: CostAnalysisParameters
  ): number {
    const discountRate = parameters.discountRate;
    const analysisHorizon = parameters.analysisHorizon;

    // Capital recovery factor
    const crf = (discountRate * Math.pow(1 + discountRate, analysisHorizon)) /
                (Math.pow(1 + discountRate, analysisHorizon) - 1);

    return presentValue * crf;
  }

  /**
   * Calculate financial metrics
   */
  private static calculateFinancialMetrics(
    initialCost: number,
    annualSavings: number,
    parameters: CostAnalysisParameters
  ): FinancialMetrics {
    const discountRate = parameters.discountRate;
    const analysisHorizon = parameters.analysisHorizon;

    // Net Present Value (assuming savings compared to baseline)
    const npv = this.calculateNPV(initialCost, annualSavings, discountRate, analysisHorizon);

    // Internal Rate of Return (simplified calculation)
    const irr = this.calculateIRR(initialCost, annualSavings, analysisHorizon);

    // Discounted Payback Period
    const discountedPayback = this.calculateDiscountedPayback(initialCost, annualSavings, discountRate);

    // Profitability Index
    const profitabilityIndex = (npv + initialCost) / initialCost;

    return {
      netPresentValue: npv,
      internalRateOfReturn: irr,
      paybackPeriod: this.calculateSimplePaybackPeriod(initialCost, annualSavings),
      discountedPaybackPeriod: discountedPayback,
      profitabilityIndex,
      returnOnInvestment: (annualSavings * analysisHorizon - initialCost) / initialCost * 100
    };
  }

  /**
   * Calculate Net Present Value
   */
  private static calculateNPV(
    initialCost: number,
    annualCashFlow: number,
    discountRate: number,
    years: number
  ): number {
    let npv = -initialCost;

    for (let year = 1; year <= years; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }

    return npv;
  }

  /**
   * Calculate Internal Rate of Return (simplified)
   */
  private static calculateIRR(
    initialCost: number,
    annualCashFlow: number,
    years: number
  ): number {
    // Simplified IRR calculation using approximation
    if (annualCashFlow <= 0) return 0;

    const totalCashFlow = annualCashFlow * years;
    if (totalCashFlow <= initialCost) return 0;

    // Approximation: IRR ≈ (Total Cash Flow / Initial Cost)^(1/years) - 1
    return Math.pow(totalCashFlow / initialCost, 1 / years) - 1;
  }

  /**
   * Calculate simple payback period
   */
  private static calculateSimplePaybackPeriod(
    initialCost: number,
    annualSavings: number
  ): number {
    if (annualSavings <= 0) return Infinity;
    return initialCost / annualSavings;
  }

  /**
   * Calculate discounted payback period
   */
  private static calculateDiscountedPayback(
    initialCost: number,
    annualCashFlow: number,
    discountRate: number
  ): number {
    let cumulativePV = 0;
    let year = 0;

    while (cumulativePV < initialCost && year < 50) { // Max 50 years
      year++;
      cumulativePV += annualCashFlow / Math.pow(1 + discountRate, year);
    }

    return year;
  }

  /**
   * Perform cost comparison with alternatives
   */
  private static async performCostComparison(
    systemConfiguration: SystemConfiguration,
    totalCostOfOwnership: TotalCostOfOwnership
  ): Promise<CostComparison> {
    // Simplified cost comparison with typical alternatives
    const alternatives = [
      {
        name: 'High Efficiency System',
        initialCostMultiplier: 1.25,
        operatingCostMultiplier: 0.8,
        description: 'Premium efficiency equipment with advanced controls'
      },
      {
        name: 'Standard System',
        initialCostMultiplier: 1.0,
        operatingCostMultiplier: 1.0,
        description: 'Standard efficiency equipment (baseline)'
      },
      {
        name: 'Budget System',
        initialCostMultiplier: 0.8,
        operatingCostMultiplier: 1.2,
        description: 'Lower cost equipment with higher operating costs'
      }
    ];

    const comparisonResults = alternatives.map(alt => ({
      alternativeName: alt.name,
      description: alt.description,
      totalCost: totalCostOfOwnership.totalPresentValue *
                 ((alt.initialCostMultiplier * 0.3) + (alt.operatingCostMultiplier * 0.7)),
      costDifference: (totalCostOfOwnership.totalPresentValue *
                      ((alt.initialCostMultiplier * 0.3) + (alt.operatingCostMultiplier * 0.7))) -
                     totalCostOfOwnership.totalPresentValue,
      percentageDifference: (((alt.initialCostMultiplier * 0.3) + (alt.operatingCostMultiplier * 0.7)) - 1) * 100
    }));

    return {
      baselineSystem: {
        name: 'Current System Configuration',
        totalCost: totalCostOfOwnership.totalPresentValue,
        description: 'System as currently configured'
      },
      alternatives: comparisonResults,
      recommendedAlternative: comparisonResults.reduce((min, current) =>
        current.totalCost < min.totalCost ? current : min
      ),
      costRankings: comparisonResults.sort((a, b) => a.totalCost - b.totalCost)
    };
  }

  /**
   * Perform sensitivity analysis
   */
  private static async performSensitivityAnalysis(
    systemConfiguration: SystemConfiguration,
    parameters: CostAnalysisParameters,
    totalCostOfOwnership: TotalCostOfOwnership
  ): Promise<CostSensitivityAnalysis> {
    const baselineCost = totalCostOfOwnership.totalPresentValue;
    const sensitivityFactors = [
      { parameter: 'discountRate', baseValue: parameters.discountRate, variations: [-0.02, -0.01, 0.01, 0.02] },
      { parameter: 'energyEscalationRate', baseValue: parameters.energyEscalationRate, variations: [-0.01, -0.005, 0.005, 0.01] },
      { parameter: 'analysisHorizon', baseValue: parameters.analysisHorizon, variations: [-5, -2, 2, 5] },
      { parameter: 'initialCost', baseValue: 1.0, variations: [-0.2, -0.1, 0.1, 0.2] }
    ];

    const sensitivityResults = sensitivityFactors.map(factor => {
      const impacts = factor.variations.map(variation => {
        let adjustedCost = baselineCost;

        // Simplified sensitivity calculation
        if (factor.parameter === 'discountRate') {
          const newRate = factor.baseValue + variation;
          adjustedCost = baselineCost * (parameters.discountRate / newRate);
        } else if (factor.parameter === 'energyEscalationRate') {
          adjustedCost = baselineCost * (1 + variation * 2); // Simplified impact
        } else if (factor.parameter === 'analysisHorizon') {
          adjustedCost = baselineCost * (1 + variation * 0.02); // Simplified impact
        } else if (factor.parameter === 'initialCost') {
          adjustedCost = baselineCost * (1 + variation * 0.3); // 30% of total is initial cost
        }

        return {
          variation,
          adjustedValue: factor.baseValue + variation,
          resultingCost: adjustedCost,
          costChange: adjustedCost - baselineCost,
          percentageChange: ((adjustedCost - baselineCost) / baselineCost) * 100
        };
      });

      return {
        parameter: factor.parameter,
        baseValue: factor.baseValue,
        impacts,
        sensitivity: Math.max(...impacts.map(i => Math.abs(i.percentageChange))) /
                    Math.max(...factor.variations.map(v => Math.abs(v)))
      };
    });

    // Identify most sensitive parameters
    const rankedSensitivities = sensitivityResults
      .sort((a, b) => b.sensitivity - a.sensitivity)
      .map((result, index) => {
        let impact: string;
        if (result.sensitivity > 2) {
          impact = 'High';
        } else if (result.sensitivity > 1) {
          impact = 'Medium';
        } else {
          impact = 'Low';
        }

        return {
          rank: index + 1,
          parameter: result.parameter,
          sensitivity: result.sensitivity,
          impact
        };
      });

    return {
      baselineCost,
      sensitivityResults,
      rankedSensitivities,
      keyFindings: [
        `Most sensitive parameter: ${rankedSensitivities[0].parameter}`,
        `Cost range: $${Math.min(...sensitivityResults.flatMap(r => r.impacts.map(i => i.resultingCost))).toLocaleString()} - $${Math.max(...sensitivityResults.flatMap(r => r.impacts.map(i => i.resultingCost))).toLocaleString()}`,
        `Sensitivity analysis shows ${rankedSensitivities.filter(r => r.impact === 'High').length} high-impact parameters`
      ]
    };
  }

  /**
   * Generate cost recommendations
   */
  private static async generateCostRecommendations(
    totalCostOfOwnership: TotalCostOfOwnership,
    sensitivityAnalysis: CostSensitivityAnalysis,
    costComparison: CostComparison
  ): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];

    // Operating cost optimization
    if (totalCostOfOwnership.costBreakdown.operatingCosts.percentage > 60) {
      recommendations.push({
        id: 'operating_cost_optimization',
        category: 'Operating Cost Reduction',
        priority: 'High',
        title: 'Focus on Operating Cost Reduction',
        description: 'Operating costs represent a significant portion of total lifecycle costs. Focus on energy efficiency improvements.',
        potentialSavings: totalCostOfOwnership.totalPresentValue * 0.15,
        implementationCost: totalCostOfOwnership.costBreakdown.initialCosts.amount * 0.1,
        paybackPeriod: 3.5,
        actions: [
          'Implement advanced control strategies',
          'Upgrade to high-efficiency equipment',
          'Optimize system operation schedules',
          'Consider demand response programs'
        ],
        riskLevel: 'Low'
      });
    }

    // Maintenance cost optimization
    if (totalCostOfOwnership.costBreakdown.maintenanceCosts.percentage > 25) {
      recommendations.push({
        id: 'maintenance_optimization',
        category: 'Maintenance Cost Reduction',
        priority: 'Medium',
        title: 'Optimize Maintenance Strategy',
        description: 'Maintenance costs are higher than typical. Consider predictive maintenance and equipment upgrades.',
        potentialSavings: totalCostOfOwnership.totalPresentValue * 0.08,
        implementationCost: 15000,
        paybackPeriod: 4.2,
        actions: [
          'Implement predictive maintenance program',
          'Upgrade to more reliable equipment',
          'Train maintenance staff',
          'Establish preventive maintenance schedules'
        ],
        riskLevel: 'Medium'
      });
    }

    // Alternative system recommendation
    const bestAlternative = costComparison.recommendedAlternative;
    if (bestAlternative.costDifference < -10000) {
      recommendations.push({
        id: 'alternative_system',
        category: 'System Alternative',
        priority: 'High',
        title: `Consider ${bestAlternative.alternativeName}`,
        description: bestAlternative.description,
        potentialSavings: Math.abs(bestAlternative.costDifference),
        implementationCost: 0, // Alternative, not additional cost
        paybackPeriod: 0,
        actions: [
          'Evaluate alternative system configuration',
          'Perform detailed feasibility study',
          'Consider phased implementation'
        ],
        riskLevel: 'Medium'
      });
    }

    return recommendations;
  }

  /**
   * Generate unique analysis ID
   */
  private static generateAnalysisId(systemId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cost_analysis_${systemId}_${timestamp}_${random}`;
  }
}

// Supporting interfaces
interface EquipmentReplacement {
  equipmentType: string;
  replacementYears: number[];
  unitCost: number;
  totalPresentValue: number;
  description: string;
}

interface InstallationCosts {
  fans: number;
  ductwork: number;
  fittings: number;
  dampers: number;
  controls: number;
  accessories: number;
  laborCosts: number;
  materialsCosts: number;
  equipmentRental: number;
  testing: number;
  total: number;
}

interface DesignCosts {
  engineeringDesign: number;
  drawings: number;
  calculations: number;
  projectManagement: number;
  total: number;
}

interface PermitsCosts {
  buildingPermits: number;
  inspectionFees: number;
  utilityConnections: number;
  environmentalFees: number;
  total: number;
}

interface FinancialMetrics {
  netPresentValue: number;
  internalRateOfReturn: number;
  paybackPeriod: number;
  discountedPaybackPeriod: number;
  profitabilityIndex: number;
  returnOnInvestment: number;
}
