/**
 * Optimization Framework Usage Examples
 * 
 * Demonstrates practical usage of the System Optimization Framework with real HVAC scenarios:
 * - Single-objective optimization examples
 * - Multi-objective optimization with trade-off analysis
 * - Integration with existing Phase 1/2/3 Priority 1 components
 * - Real-world HVAC system optimization scenarios
 * - Best practices and common patterns
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import {
  OptimizationProblem,
  OptimizationResult,
  OptimizationAlgorithm,
  OptimizationObjective,
  OptimizationVariable,
  OptimizationConstraint,
  SystemConfiguration,
  ObjectiveFunctionType,
  ConstraintFunctionType
} from '../types/SystemOptimizationTypes';

import { SystemOptimizationEngine } from '../SystemOptimizationEngine';
import { GeneticAlgorithm } from '../algorithms/GeneticAlgorithm';
import { MultiObjectiveOptimizationFramework } from '../MultiObjectiveOptimizationFramework';

/**
 * Example 1: Single-Objective Duct Sizing Optimization
 * 
 * Optimize duct diameter to minimize pressure loss while meeting airflow requirements
 */
export async function example1_DuctSizingOptimization(): Promise<OptimizationResult> {
  console.log('=== Example 1: Duct Sizing Optimization ===');
  
  // Define system configuration
  const systemConfig: SystemConfiguration = {
    id: 'office_building_hvac',
    name: 'Office Building HVAC System',
    description: 'Main supply air system for 50,000 sq ft office building',
    systemType: 'supply_air',
    designAirflow: 25000, // CFM
    designPressure: 4.0,   // inWC
    operatingConditions: {
      temperature: 72,     // °F
      humidity: 45,        // %RH
      elevation: 1000      // ft above sea level
    },
    components: [
      {
        id: 'main_fan',
        type: 'fan',
        specifications: {
          maxPressure: 8.0,
          maxAirflow: 30000,
          efficiency: 0.82
        }
      },
      {
        id: 'main_duct',
        type: 'duct',
        specifications: {
          length: 200,
          material: 'galvanized_steel',
          roughness: 0.0015
        }
      }
    ]
  };

  // Define optimization variables
  const variables: OptimizationVariable[] = [
    {
      id: 'main_duct_diameter',
      name: 'Main Duct Diameter',
      description: 'Diameter of the main supply duct',
      type: 'continuous',
      bounds: { minimum: 18, maximum: 36 },
      units: 'inches',
      currentValue: 24
    },
    {
      id: 'branch_duct_diameter',
      name: 'Branch Duct Diameter',
      description: 'Diameter of branch ducts',
      type: 'continuous',
      bounds: { minimum: 8, maximum: 20 },
      units: 'inches',
      currentValue: 12
    },
    {
      id: 'fan_speed',
      name: 'Fan Speed',
      description: 'Fan operating speed percentage',
      type: 'continuous',
      bounds: { minimum: 60, maximum: 100 },
      units: 'percent',
      currentValue: 85
    }
  ];

  // Define constraints
  const constraints: OptimizationConstraint[] = [
    {
      id: 'airflow_requirement',
      name: 'Minimum Airflow Requirement',
      description: 'System must deliver at least design airflow',
      type: 'inequality',
      bounds: { minimum: 25000 },
      units: 'CFM',
      evaluationFunction: (vars: OptimizationVariable[]) => {
        const fanSpeed = vars.find(v => v.id === 'fan_speed')?.currentValue as number || 85;
        const deliveredAirflow = (fanSpeed / 100) * 30000; // Simplified model
        return 25000 - deliveredAirflow; // Violation if < 0
      }
    },
    {
      id: 'max_pressure_loss',
      name: 'Maximum System Pressure Loss',
      description: 'Total pressure loss must not exceed fan capacity',
      type: 'inequality',
      bounds: { maximum: 6.0 },
      units: 'inWC',
      evaluationFunction: (vars: OptimizationVariable[]) => {
        const mainDiameter = vars.find(v => v.id === 'main_duct_diameter')?.currentValue as number || 24;
        const branchDiameter = vars.find(v => v.id === 'branch_duct_diameter')?.currentValue as number || 12;
        const fanSpeed = vars.find(v => v.id === 'fan_speed')?.currentValue as number || 85;
        
        // Simplified pressure loss calculation
        const velocity = (fanSpeed / 100) * 25000 / (Math.PI * (mainDiameter / 12) ** 2 / 4 * 144);
        const mainLoss = 0.02 * 200 * (velocity / 4005) ** 1.85 / (mainDiameter / 12) ** 1.23;
        const branchLoss = 0.015 * 50 * (velocity / 4005) ** 1.85 / (branchDiameter / 12) ** 1.23;
        
        const totalLoss = mainLoss + branchLoss + 1.5; // Include fittings
        return totalLoss - 6.0; // Violation if > 0
      }
    }
  ];

  // Define objective function (minimize pressure loss)
  const objectiveFunction: ObjectiveFunctionType = (vars: OptimizationVariable[]): number => {
    const mainDiameter = vars.find(v => v.id === 'main_duct_diameter')?.currentValue as number || 24;
    const branchDiameter = vars.find(v => v.id === 'branch_duct_diameter')?.currentValue as number || 12;
    const fanSpeed = vars.find(v => v.id === 'fan_speed')?.currentValue as number || 85;
    
    // Calculate total system pressure loss
    const velocity = (fanSpeed / 100) * 25000 / (Math.PI * (mainDiameter / 12) ** 2 / 4 * 144);
    const mainLoss = 0.02 * 200 * (velocity / 4005) ** 1.85 / (mainDiameter / 12) ** 1.23;
    const branchLoss = 0.015 * 50 * (velocity / 4005) ** 1.85 / (branchDiameter / 12) ** 1.23;
    
    return mainLoss + branchLoss + 1.5; // Total pressure loss including fittings
  };

  // Create optimization problem
  const problem: OptimizationProblem = {
    id: 'duct_sizing_optimization',
    name: 'Duct Sizing Optimization',
    description: 'Optimize duct diameters to minimize pressure loss',
    systemConfiguration: systemConfig,
    variables,
    objectives: {
      objectives: [{
        id: 'minimize_pressure_loss',
        objective: OptimizationObjective.MINIMIZE_PRESSURE_LOSS,
        weight: 1.0,
        description: 'Minimize total system pressure loss',
        evaluationFunction: objectiveFunction,
        units: 'inWC'
      }],
      aggregationMethod: 'single_objective'
    },
    constraints,
    algorithmSettings: {
      algorithm: OptimizationAlgorithm.GENETIC_ALGORITHM,
      parameters: {
        populationSize: 50,
        maxIterations: 100,
        crossoverRate: 0.8,
        mutationRate: 0.1
      },
      parallelization: { enabled: true },
      convergenceCriteria: {
        maxIterations: 100,
        toleranceValue: 1e-6,
        stagnationLimit: 20
      }
    },
    convergenceCriteria: {
      maxIterations: 100,
      toleranceValue: 1e-6,
      stagnationLimit: 20
    }
  };

  // Run optimization
  const ga = new GeneticAlgorithm({
    populationSize: 50,
    maxGenerations: 100,
    crossoverRate: 0.8,
    mutationRate: 0.1,
    eliteSize: 5,
    constraintHandling: 'penalty',
    penaltyCoefficient: 1000
  });

  const constraintFunctions = constraints.map(c => c.evaluationFunction);
  const result = await ga.optimize(problem, objectiveFunction, constraintFunctions);

  console.log('Optimization Results:');
  console.log(`Status: ${result.status}`);
  console.log(`Best Fitness: ${result.bestSolution.fitness.toFixed(4)} inWC`);
  console.log(`Main Duct Diameter: ${(result.bestSolution.variables['main_duct_diameter'] as number).toFixed(1)} inches`);
  console.log(`Branch Duct Diameter: ${(result.bestSolution.variables['branch_duct_diameter'] as number).toFixed(1)} inches`);
  console.log(`Fan Speed: ${(result.bestSolution.variables['fan_speed'] as number).toFixed(1)}%`);
  console.log(`Execution Time: ${result.statistics.executionTime.toFixed(2)} ms`);
  console.log(`Total Evaluations: ${result.statistics.totalEvaluations}`);

  return result;
}

/**
 * Example 2: Multi-Objective HVAC System Optimization
 * 
 * Optimize system for multiple competing objectives: pressure loss, energy consumption, and cost
 */
export async function example2_MultiObjectiveOptimization(): Promise<OptimizationResult> {
  console.log('\n=== Example 2: Multi-Objective HVAC Optimization ===');
  
  // Define system configuration for a commercial building
  const systemConfig: SystemConfiguration = {
    id: 'commercial_hvac_system',
    name: 'Commercial Building HVAC System',
    description: 'Multi-zone HVAC system with VAV boxes',
    systemType: 'supply_air',
    designAirflow: 50000,
    designPressure: 5.0,
    operatingConditions: {
      temperature: 70,
      humidity: 50,
      elevation: 500
    },
    components: [
      {
        id: 'supply_fan',
        type: 'fan',
        specifications: {
          maxPressure: 10.0,
          maxAirflow: 60000,
          efficiency: 0.85,
          powerRating: 75 // HP
        }
      },
      {
        id: 'main_supply_duct',
        type: 'duct',
        specifications: {
          length: 300,
          material: 'galvanized_steel',
          roughness: 0.0015
        }
      }
    ]
  };

  // Define optimization variables
  const variables: OptimizationVariable[] = [
    {
      id: 'supply_duct_diameter',
      name: 'Supply Duct Diameter',
      description: 'Main supply duct diameter',
      type: 'continuous',
      bounds: { minimum: 24, maximum: 48 },
      units: 'inches',
      currentValue: 36
    },
    {
      id: 'duct_material',
      name: 'Duct Material',
      description: 'Duct material selection',
      type: 'discrete',
      discreteValues: ['galvanized_steel', 'aluminum', 'fiberglass', 'stainless_steel'],
      units: 'material_type',
      currentValue: 'galvanized_steel'
    },
    {
      id: 'insulation_thickness',
      name: 'Insulation Thickness',
      description: 'Duct insulation thickness',
      type: 'discrete',
      discreteValues: [1, 2, 3, 4],
      units: 'inches',
      currentValue: 2
    },
    {
      id: 'fan_efficiency',
      name: 'Fan Efficiency',
      description: 'Fan motor efficiency selection',
      type: 'discrete',
      discreteValues: [0.80, 0.85, 0.90, 0.93, 0.95],
      units: 'efficiency',
      currentValue: 0.85
    }
  ];

  // Define constraints
  const constraints: OptimizationConstraint[] = [
    {
      id: 'airflow_delivery',
      name: 'Airflow Delivery Requirement',
      description: 'Must deliver design airflow',
      type: 'inequality',
      bounds: { minimum: 50000 },
      units: 'CFM',
      evaluationFunction: (vars: OptimizationVariable[]) => {
        // Simplified: assume delivered airflow is close to design
        return 50000 - 49000; // Always feasible for this example
      }
    },
    {
      id: 'noise_limit',
      name: 'Noise Level Limit',
      description: 'System noise must not exceed limit',
      type: 'inequality',
      bounds: { maximum: 55 },
      units: 'dBA',
      evaluationFunction: (vars: OptimizationVariable[]) => {
        const diameter = vars.find(v => v.id === 'supply_duct_diameter')?.currentValue as number || 36;
        const velocity = 50000 / (Math.PI * (diameter / 12) ** 2 / 4 * 144);
        const noiseLevel = 30 + 20 * Math.log10(velocity / 1000); // Simplified noise model
        return noiseLevel - 55; // Violation if > 0
      }
    }
  ];

  // Define objective functions
  const pressureLossObjective: ObjectiveFunctionType = (vars: OptimizationVariable[]): number => {
    const diameter = vars.find(v => v.id === 'supply_duct_diameter')?.currentValue as number || 36;
    const material = vars.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';
    
    // Material roughness factors
    const roughnessFactors = {
      'galvanized_steel': 1.0,
      'aluminum': 0.8,
      'fiberglass': 1.2,
      'stainless_steel': 0.6
    };
    
    const roughnessFactor = roughnessFactors[material as keyof typeof roughnessFactors] || 1.0;
    const velocity = 50000 / (Math.PI * (diameter / 12) ** 2 / 4 * 144);
    const pressureLoss = roughnessFactor * 0.025 * 300 * (velocity / 4005) ** 1.85 / (diameter / 12) ** 1.23;
    
    return pressureLoss + 2.0; // Include fittings and equipment losses
  };

  const energyConsumptionObjective: ObjectiveFunctionType = (vars: OptimizationVariable[]): number => {
    const diameter = vars.find(v => v.id === 'supply_duct_diameter')?.currentValue as number || 36;
    const fanEfficiency = vars.find(v => v.id === 'fan_efficiency')?.currentValue as number || 0.85;
    
    // Calculate fan power based on pressure loss and efficiency
    const pressureLoss = pressureLossObjective(vars);
    const fanPower = (50000 * pressureLoss) / (6356 * fanEfficiency); // HP
    const annualEnergyConsumption = fanPower * 0.746 * 8760 * 0.7; // kWh/year (70% load factor)
    
    return annualEnergyConsumption;
  };

  const totalCostObjective: ObjectiveFunctionType = (vars: OptimizationVariable[]): number => {
    const diameter = vars.find(v => v.id === 'supply_duct_diameter')?.currentValue as number || 36;
    const material = vars.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';
    const insulationThickness = vars.find(v => v.id === 'insulation_thickness')?.currentValue as number || 2;
    const fanEfficiency = vars.find(v => v.id === 'fan_efficiency')?.currentValue as number || 0.85;
    
    // Material costs per sq ft
    const materialCosts = {
      'galvanized_steel': 12,
      'aluminum': 18,
      'fiberglass': 8,
      'stainless_steel': 25
    };
    
    // Fan efficiency premium costs
    const efficiencyPremiums = {
      0.80: 0,
      0.85: 500,
      0.90: 1200,
      0.93: 2000,
      0.95: 3500
    };
    
    const materialCost = materialCosts[material as keyof typeof materialCosts] || 12;
    const ductSurfaceArea = Math.PI * (diameter / 12) * 300; // sq ft
    const ductCost = materialCost * ductSurfaceArea;
    const insulationCost = insulationThickness * 3 * ductSurfaceArea;
    const fanPremium = efficiencyPremiums[fanEfficiency as keyof typeof efficiencyPremiums] || 0;
    
    // Operating cost (energy cost over 10 years)
    const energyConsumption = energyConsumptionObjective(vars);
    const operatingCost = energyConsumption * 0.12 * 10; // $0.12/kWh for 10 years
    
    return ductCost + insulationCost + fanPremium + operatingCost;
  };

  // Create optimization problem
  const problem: OptimizationProblem = {
    id: 'multi_objective_hvac_optimization',
    name: 'Multi-Objective HVAC System Optimization',
    description: 'Optimize for pressure loss, energy consumption, and total cost',
    systemConfiguration: systemConfig,
    variables,
    objectives: {
      objectives: [
        {
          id: 'minimize_pressure_loss',
          objective: OptimizationObjective.MINIMIZE_PRESSURE_LOSS,
          weight: 0.4,
          description: 'Minimize system pressure loss',
          evaluationFunction: pressureLossObjective,
          units: 'inWC'
        },
        {
          id: 'minimize_energy_consumption',
          objective: OptimizationObjective.MINIMIZE_ENERGY_CONSUMPTION,
          weight: 0.4,
          description: 'Minimize annual energy consumption',
          evaluationFunction: energyConsumptionObjective,
          units: 'kWh/year'
        },
        {
          id: 'minimize_total_cost',
          objective: OptimizationObjective.MINIMIZE_TOTAL_COST,
          weight: 0.2,
          description: 'Minimize total lifecycle cost',
          evaluationFunction: totalCostObjective,
          units: 'USD'
        }
      ],
      aggregationMethod: 'pareto_optimal'
    },
    constraints,
    algorithmSettings: {
      algorithm: OptimizationAlgorithm.NSGA_II,
      parameters: {
        populationSize: 100,
        maxIterations: 150,
        crossoverRate: 0.9,
        mutationRate: 0.1
      },
      parallelization: { enabled: true },
      convergenceCriteria: {
        maxIterations: 150,
        toleranceValue: 1e-6,
        stagnationLimit: 30
      }
    },
    convergenceCriteria: {
      maxIterations: 150,
      toleranceValue: 1e-6,
      stagnationLimit: 30
    }
  };

  // Run multi-objective optimization
  const moFramework = new MultiObjectiveOptimizationFramework({
    algorithm: 'nsga2',
    populationSize: 100,
    maxGenerations: 150,
    crossoverRate: 0.9,
    mutationRate: 0.1,
    eliteSize: 10,
    paretoSettings: {
      maxSolutions: 50,
      diversityThreshold: 0.01,
      convergenceThreshold: 1e-6,
      hypervolume: { enabled: true, referencePoint: [] },
      spacing: { enabled: true, targetSpacing: 0.1 }
    },
    diversityMaintenance: true,
    archiveSize: 100
  });

  const constraintFunctions = constraints.map(c => c.evaluationFunction);
  const result = await moFramework.optimizeMultiObjective(
    problem,
    [pressureLossObjective, energyConsumptionObjective, totalCostObjective],
    constraintFunctions
  );

  console.log('Multi-Objective Optimization Results:');
  console.log(`Status: ${result.status}`);
  console.log(`Pareto Front Size: ${result.analysis?.paretoFront?.solutions.length || 0}`);
  console.log(`Hypervolume: ${result.analysis?.paretoFront?.hypervolume?.toFixed(4) || 'N/A'}`);
  console.log(`Knee Points Found: ${result.analysis?.tradeoffAnalysis?.kneePoints.length || 0}`);
  console.log(`Execution Time: ${result.statistics.executionTime.toFixed(2)} ms`);
  console.log(`Total Evaluations: ${result.statistics.totalEvaluations}`);

  // Display best compromise solution
  if (result.bestSolution) {
    console.log('\nBest Compromise Solution:');
    console.log(`Supply Duct Diameter: ${(result.bestSolution.variables['supply_duct_diameter'] as number).toFixed(1)} inches`);
    console.log(`Duct Material: ${result.bestSolution.variables['duct_material']}`);
    console.log(`Insulation Thickness: ${result.bestSolution.variables['insulation_thickness']} inches`);
    console.log(`Fan Efficiency: ${((result.bestSolution.variables['fan_efficiency'] as number) * 100).toFixed(1)}%`);
  }

  return result;
}

/**
 * Example 3: Integration with Existing Phase 1/2/3 Priority 1 Components
 * 
 * Demonstrates how to use optimization with existing calculation services
 */
export async function example3_IntegrationWithExistingComponents(): Promise<OptimizationResult> {
  console.log('\n=== Example 3: Integration with Existing Components ===');
  
  // This example shows how the optimization framework integrates with:
  // - SystemPressureCalculator (Phase 1)
  // - FittingLossCalculator (Phase 1) 
  // - AdvancedFittingCalculator (Phase 3 Priority 1)
  // - AirPropertiesCalculator (Phase 2)
  
  const systemConfig: SystemConfiguration = {
    id: 'integrated_system',
    name: 'Integrated HVAC System with Advanced Fittings',
    description: 'System using all Phase 1/2/3 Priority 1 components',
    systemType: 'supply_air',
    designAirflow: 15000,
    designPressure: 3.5,
    operatingConditions: {
      temperature: 68,
      humidity: 40,
      elevation: 2000
    },
    components: [
      {
        id: 'main_fan',
        type: 'fan',
        specifications: {
          maxPressure: 6.0,
          maxAirflow: 20000,
          efficiency: 0.88
        }
      },
      {
        id: 'main_duct',
        type: 'duct',
        specifications: {
          length: 150,
          material: 'galvanized_steel',
          roughness: 0.0015
        }
      },
      {
        id: 'transition_fitting',
        type: 'transition',
        specifications: {
          type: 'round_to_rectangular',
          inletDiameter: 20,
          outletWidth: 24,
          outletHeight: 12
        }
      }
    ]
  };

  // Use SystemOptimizationEngine for integrated optimization
  const variables: OptimizationVariable[] = [
    {
      id: 'main_duct_diameter',
      name: 'Main Duct Diameter',
      description: 'Diameter of main supply duct',
      type: 'continuous',
      bounds: { minimum: 16, maximum: 28 },
      units: 'inches',
      currentValue: 20
    },
    {
      id: 'transition_type',
      name: 'Transition Fitting Type',
      description: 'Type of transition fitting',
      type: 'discrete',
      discreteValues: ['round_to_rectangular', 'round_to_round', 'rectangular_to_round'],
      units: 'fitting_type',
      currentValue: 'round_to_rectangular'
    }
  ];

  const constraints: OptimizationConstraint[] = [
    {
      id: 'velocity_limit',
      name: 'Maximum Velocity Limit',
      description: 'Duct velocity must not exceed limit',
      type: 'inequality',
      bounds: { maximum: 2500 },
      units: 'FPM',
      evaluationFunction: (vars: OptimizationVariable[]) => {
        const diameter = vars.find(v => v.id === 'main_duct_diameter')?.currentValue as number || 20;
        const velocity = 15000 / (Math.PI * (diameter / 12) ** 2 / 4 * 144);
        return velocity - 2500; // Violation if > 0
      }
    }
  ];

  const problem: OptimizationProblem = {
    id: 'integrated_optimization',
    name: 'Integrated System Optimization',
    description: 'Optimization using all existing calculation components',
    systemConfiguration: systemConfig,
    variables,
    objectives: {
      objectives: [{
        id: 'minimize_total_pressure_loss',
        objective: OptimizationObjective.MINIMIZE_PRESSURE_LOSS,
        weight: 1.0,
        description: 'Minimize total system pressure loss including advanced fittings',
        evaluationFunction: (vars: OptimizationVariable[]) => {
          // This would integrate with actual Phase 1/2/3 Priority 1 calculators
          const diameter = vars.find(v => v.id === 'main_duct_diameter')?.currentValue as number || 20;
          const transitionType = vars.find(v => v.id === 'transition_type')?.currentValue as string || 'round_to_rectangular';
          
          // Simplified calculation - in practice would use:
          // - SystemPressureCalculator.calculateTotalPressureLoss()
          // - AdvancedFittingCalculator.calculateFittingLoss()
          // - AirPropertiesCalculator.getAirProperties()
          
          const velocity = 15000 / (Math.PI * (diameter / 12) ** 2 / 4 * 144);
          const ductLoss = 0.02 * 150 * (velocity / 4005) ** 1.85 / (diameter / 12) ** 1.23;
          
          // Transition fitting losses (simplified)
          const transitionLosses = {
            'round_to_rectangular': 0.15,
            'round_to_round': 0.05,
            'rectangular_to_round': 0.12
          };
          
          const fittingLoss = transitionLosses[transitionType as keyof typeof transitionLosses] || 0.15;
          const velocityPressure = (velocity / 4005) ** 2;
          
          return ductLoss + fittingLoss * velocityPressure;
        },
        units: 'inWC'
      }],
      aggregationMethod: 'single_objective'
    },
    constraints,
    algorithmSettings: {
      algorithm: OptimizationAlgorithm.PARTICLE_SWARM,
      parameters: {
        populationSize: 30,
        maxIterations: 75,
        inertiaWeight: 0.9,
        accelerationCoefficients: [2.0, 2.0]
      },
      parallelization: { enabled: false },
      convergenceCriteria: {
        maxIterations: 75,
        toleranceValue: 1e-6,
        stagnationLimit: 15
      }
    },
    convergenceCriteria: {
      maxIterations: 75,
      toleranceValue: 1e-6,
      stagnationLimit: 15
    }
  };

  // Use SystemOptimizationEngine for integrated optimization
  const result = await SystemOptimizationEngine.optimizeSystem(
    problem,
    OptimizationAlgorithm.PARTICLE_SWARM
  );

  console.log('Integrated Optimization Results:');
  console.log(`Status: ${result.status}`);
  console.log(`Best Fitness: ${result.bestSolution.fitness.toFixed(4)} inWC`);
  console.log(`Optimal Duct Diameter: ${(result.bestSolution.variables['main_duct_diameter'] as number).toFixed(1)} inches`);
  console.log(`Optimal Transition Type: ${result.bestSolution.variables['transition_type']}`);
  console.log(`Execution Time: ${result.statistics.executionTime.toFixed(2)} ms`);

  return result;
}

/**
 * Run all optimization examples
 */
export async function runAllOptimizationExamples(): Promise<void> {
  console.log('🚀 Running SizeWise Suite Optimization Framework Examples\n');
  
  try {
    // Example 1: Single-objective optimization
    await example1_DuctSizingOptimization();
    
    // Example 2: Multi-objective optimization
    await example2_MultiObjectiveOptimization();
    
    // Example 3: Integration with existing components
    await example3_IntegrationWithExistingComponents();
    
    console.log('\n✅ All optimization examples completed successfully!');
    console.log('\nNext Steps:');
    console.log('1. Review the optimization results and trade-offs');
    console.log('2. Integrate with your specific HVAC system requirements');
    console.log('3. Customize objective functions for your use case');
    console.log('4. Add additional constraints as needed');
    console.log('5. Experiment with different optimization algorithms');
    
  } catch (error) {
    console.error('❌ Error running optimization examples:', error);
    throw error;
  }
}

// Export individual examples for selective usage
export {
  example1_DuctSizingOptimization as ductSizingOptimization,
  example2_MultiObjectiveOptimization as multiObjectiveOptimization,
  example3_IntegrationWithExistingComponents as integratedOptimization
};
