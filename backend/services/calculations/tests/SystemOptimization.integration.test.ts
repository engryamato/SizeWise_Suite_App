/**
 * Integration Tests for System Optimization Framework
 * 
 * Tests the complete optimization pipeline including:
 * - Single-objective optimization with all algorithms
 * - Multi-objective optimization with Pareto analysis
 * - Integration with existing Phase 1/2/3 Priority 1 components
 * - Constraint handling and validation
 * - Performance benchmarking
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/testing-library/jest-dom';
import {
  OptimizationProblem,
  OptimizationSolution,
  OptimizationResult,
  OptimizationAlgorithm,
  OptimizationObjective,
  OptimizationStatus,
  OptimizationVariable,
  OptimizationConstraint,
  SystemConfiguration,
  ObjectiveFunctionType,
  ConstraintFunctionType
} from '../types/SystemOptimizationTypes';

import { SystemOptimizationEngine } from '../SystemOptimizationEngine';
import { GeneticAlgorithm } from '../algorithms/GeneticAlgorithm';
import { SimulatedAnnealing } from '../algorithms/SimulatedAnnealing';
import { ParticleSwarmOptimization } from '../algorithms/ParticleSwarmOptimization';
import { GradientDescent } from '../algorithms/GradientDescent';
import { MultiObjectiveOptimizationFramework } from '../MultiObjectiveOptimizationFramework';

describe('System Optimization Integration Tests', () => {
  let testSystemConfiguration: SystemConfiguration;
  let testOptimizationProblem: OptimizationProblem;
  let testObjectiveFunction: ObjectiveFunctionType;
  let testConstraintFunctions: ConstraintFunctionType[];

  beforeEach(() => {
    // Create test system configuration
    testSystemConfiguration = {
      id: 'test_system_001',
      name: 'Test HVAC System',
      description: 'Test system for optimization validation',
      systemType: 'supply_air',
      designAirflow: 5000,
      designPressure: 2.5,
      operatingConditions: {
        temperature: 70,
        humidity: 50,
        elevation: 0
      },
      components: [
        {
          id: 'fan_001',
          type: 'fan',
          specifications: {
            maxPressure: 5.0,
            maxAirflow: 10000,
            efficiency: 0.85
          }
        },
        {
          id: 'duct_001',
          type: 'duct',
          specifications: {
            diameter: 12,
            length: 100,
            material: 'galvanized_steel',
            roughness: 0.0015
          }
        }
      ]
    };

    // Create test optimization variables
    const testVariables: OptimizationVariable[] = [
      {
        id: 'duct_diameter',
        name: 'Duct Diameter',
        description: 'Main duct diameter in inches',
        type: 'continuous',
        bounds: {
          minimum: 6,
          maximum: 24
        },
        units: 'inches',
        currentValue: 12
      },
      {
        id: 'fan_speed',
        name: 'Fan Speed',
        description: 'Fan speed as percentage of maximum',
        type: 'continuous',
        bounds: {
          minimum: 30,
          maximum: 100
        },
        units: 'percent',
        currentValue: 80
      },
      {
        id: 'duct_material',
        name: 'Duct Material',
        description: 'Duct material type',
        type: 'discrete',
        discreteValues: ['galvanized_steel', 'aluminum', 'fiberglass'],
        units: 'material_type',
        currentValue: 'galvanized_steel'
      }
    ];

    // Create test constraints
    const testConstraints: OptimizationConstraint[] = [
      {
        id: 'max_pressure_loss',
        name: 'Maximum Pressure Loss',
        description: 'Total system pressure loss must not exceed limit',
        type: 'inequality',
        bounds: {
          maximum: 3.0
        },
        units: 'inWC',
        evaluationFunction: (variables: OptimizationVariable[]) => {
          // Simplified pressure loss calculation
          const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
          const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
          
          // Simple pressure loss model: inversely proportional to diameter^4, proportional to speed^2
          const pressureLoss = (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
          return pressureLoss - 3.0; // Constraint violation if > 0
        }
      },
      {
        id: 'min_airflow',
        name: 'Minimum Airflow',
        description: 'System must deliver minimum required airflow',
        type: 'inequality',
        bounds: {
          minimum: 4000
        },
        units: 'CFM',
        evaluationFunction: (variables: OptimizationVariable[]) => {
          const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
          const airflow = (fanSpeed / 100) * 5000; // Linear relationship for simplicity
          return 4000 - airflow; // Constraint violation if > 0
        }
      }
    ];

    // Create test optimization problem
    testOptimizationProblem = {
      id: 'test_optimization_001',
      name: 'Test System Optimization',
      description: 'Test optimization problem for validation',
      systemConfiguration: testSystemConfiguration,
      variables: testVariables,
      objectives: {
        objectives: [
          {
            id: 'minimize_pressure_loss',
            objective: OptimizationObjective.MINIMIZE_PRESSURE_LOSS,
            weight: 0.6,
            description: 'Minimize total system pressure loss',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
              return (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
            },
            units: 'inWC'
          },
          {
            id: 'minimize_cost',
            objective: OptimizationObjective.MINIMIZE_TOTAL_COST,
            weight: 0.4,
            description: 'Minimize total system cost',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              const material = variables.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';
              
              // Simple cost model
              const materialCosts = {
                'galvanized_steel': 10,
                'aluminum': 15,
                'fiberglass': 8
              };
              
              const baseCost = materialCosts[material as keyof typeof materialCosts] || 10;
              return baseCost * diameter * diameter * 0.1; // Cost proportional to area
            },
            units: 'USD'
          }
        ],
        aggregationMethod: 'weighted_sum'
      },
      constraints: testConstraints,
      algorithmSettings: {
        algorithm: OptimizationAlgorithm.GENETIC_ALGORITHM,
        parameters: {
          populationSize: 20,
          maxIterations: 50,
          crossoverRate: 0.8,
          mutationRate: 0.1
        },
        parallelization: { enabled: false },
        convergenceCriteria: {
          maxIterations: 50,
          toleranceValue: 1e-6,
          stagnationLimit: 10
        }
      },
      convergenceCriteria: {
        maxIterations: 50,
        toleranceValue: 1e-6,
        stagnationLimit: 10
      }
    };

    // Create test objective function
    testObjectiveFunction = (variables: OptimizationVariable[]): number => {
      const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
      const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
      const material = variables.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';
      
      // Combined objective: pressure loss + cost
      const pressureLoss = (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
      
      const materialCosts = {
        'galvanized_steel': 10,
        'aluminum': 15,
        'fiberglass': 8
      };
      const baseCost = materialCosts[material as keyof typeof materialCosts] || 10;
      const cost = baseCost * diameter * diameter * 0.1;
      
      return 0.6 * pressureLoss + 0.4 * cost / 100; // Normalize cost
    };

    // Create test constraint functions
    testConstraintFunctions = testConstraints.map(constraint => constraint.evaluationFunction);
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Single-Objective Optimization', () => {
    test('should optimize using Genetic Algorithm', async () => {
      const ga = new GeneticAlgorithm({
        populationSize: 20,
        maxGenerations: 30,
        crossoverRate: 0.8,
        mutationRate: 0.1,
        eliteSize: 2
      });

      const result = await ga.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.bestSolution.feasible).toBe(true);
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
      expect(result.statistics.executionTime).toBeGreaterThan(0);
    }, 30000);

    test('should optimize using Simulated Annealing', async () => {
      const sa = new SimulatedAnnealing({
        initialTemperature: 100,
        finalTemperature: 0.1,
        maxIterations: 100,
        coolingSchedule: {
          initialTemperature: 100,
          finalTemperature: 0.1,
          coolingRate: 0.95,
          method: 'exponential'
        }
      });

      const result = await sa.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
    }, 15000);

    test('should optimize using Particle Swarm Optimization', async () => {
      const pso = new ParticleSwarmOptimization({
        swarmSize: 20,
        maxIterations: 50,
        inertiaWeight: 0.9,
        accelerationCoefficients: [2.0, 2.0]
      });

      const result = await pso.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
    }, 15000);

    test('should optimize using Gradient Descent', async () => {
      const gd = new GradientDescent({
        maxIterations: 100,
        learningRate: 0.01,
        variant: 'adam',
        convergenceTolerance: 1e-6
      });

      const result = await gd.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Multi-Objective Optimization', () => {
    test('should perform multi-objective optimization with NSGA-II', async () => {
      // Create separate objective functions
      const pressureLossObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
        return (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
      };

      const costObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const material = variables.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';
        
        const materialCosts = {
          'galvanized_steel': 10,
          'aluminum': 15,
          'fiberglass': 8
        };
        const baseCost = materialCosts[material as keyof typeof materialCosts] || 10;
        return baseCost * diameter * diameter * 0.1;
      };

      const moFramework = new MultiObjectiveOptimizationFramework({
        algorithm: 'nsga2',
        populationSize: 30,
        maxGenerations: 20,
        crossoverRate: 0.9,
        mutationRate: 0.1
      });

      const result = await moFramework.optimizeMultiObjective(
        testOptimizationProblem,
        [pressureLossObjective, costObjective],
        testConstraintFunctions
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.analysis?.paretoFront).toBeDefined();
      expect(result.analysis?.tradeoffAnalysis).toBeDefined();
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
    }, 30000);

    test('should generate Pareto front with multiple solutions', async () => {
      const pressureLossObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
        return (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
      };

      const costObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        return diameter * diameter * 0.1; // Simplified cost model
      };

      const moFramework = new MultiObjectiveOptimizationFramework({
        algorithm: 'nsga2',
        populationSize: 40,
        maxGenerations: 25,
        paretoSettings: {
          maxSolutions: 20,
          diversityThreshold: 0.01,
          convergenceThreshold: 1e-6,
          hypervolume: { enabled: true, referencePoint: [] },
          spacing: { enabled: true, targetSpacing: 0.1 }
        }
      });

      const result = await moFramework.optimizeMultiObjective(
        testOptimizationProblem,
        [pressureLossObjective, costObjective],
        testConstraintFunctions
      );

      expect(result.analysis?.paretoFront?.solutions).toBeDefined();
      expect(result.analysis?.paretoFront?.solutions.length).toBeGreaterThan(1);
      expect(result.analysis?.paretoFront?.hypervolume).toBeGreaterThan(0);
      expect(result.analysis?.tradeoffAnalysis?.kneePoints).toBeDefined();
    }, 35000);
  });

  describe('Integration with Existing Components', () => {
    test('should integrate with SystemOptimizationEngine', async () => {
      const result = await SystemOptimizationEngine.optimizeSystem(
        testOptimizationProblem,
        OptimizationAlgorithm.GENETIC_ALGORITHM
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.statistics).toBeDefined();
    }, 20000);

    test('should perform multi-objective optimization through engine', async () => {
      const result = await SystemOptimizationEngine.optimizeMultiObjective(
        testOptimizationProblem,
        OptimizationAlgorithm.NSGA_II
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.analysis?.paretoFront).toBeDefined();
    }, 25000);
  });

  describe('Performance Benchmarking', () => {
    test('should complete optimization within performance targets', async () => {
      const startTime = performance.now();
      
      const ga = new GeneticAlgorithm({
        populationSize: 30,
        maxGenerations: 50,
        crossoverRate: 0.8,
        mutationRate: 0.1
      });

      const result = await ga.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);
      
      const executionTime = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.statistics.executionTime).toBeLessThan(30000);
      expect(result.statistics.totalEvaluations).toBeGreaterThan(100);
    }, 35000);

    test('should maintain accuracy across multiple runs', async () => {
      const results: OptimizationResult[] = [];
      const numRuns = 3;

      for (let i = 0; i < numRuns; i++) {
        const ga = new GeneticAlgorithm({
          populationSize: 20,
          maxGenerations: 30,
          seedValue: 12345 + i // Different seed for each run
        });

        const result = await ga.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);
        results.push(result);
      }

      // Check that all runs converged
      results.forEach(result => {
        expect(result.status).toBe(OptimizationStatus.CONVERGED);
        expect(result.bestSolution.feasible).toBe(true);
      });

      // Check fitness consistency (should be within reasonable range)
      const fitnesses = results.map(r => r.bestSolution.fitness);
      const avgFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
      const maxDeviation = Math.max(...fitnesses.map(f => Math.abs(f - avgFitness)));
      
      expect(maxDeviation / avgFitness).toBeLessThan(0.5); // Within 50% of average
    }, 60000);
  });

  describe('Constraint Handling', () => {
    test('should handle constraint violations properly', async () => {
      // Create problem with tight constraints
      const constrainedProblem = {
        ...testOptimizationProblem,
        constraints: [
          {
            id: 'very_tight_constraint',
            name: 'Very Tight Constraint',
            description: 'Artificially tight constraint for testing',
            type: 'inequality' as const,
            bounds: { maximum: 0.1 },
            units: 'dimensionless',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              return diameter - 8; // Only allows very small diameters
            }
          }
        ]
      };

      const ga = new GeneticAlgorithm({
        populationSize: 30,
        maxGenerations: 50,
        constraintHandling: 'penalty',
        penaltyCoefficient: 1000
      });

      const constraintFunction = constrainedProblem.constraints[0].evaluationFunction;
      const result = await ga.optimize(constrainedProblem, testObjectiveFunction, [constraintFunction]);

      expect(result).toBeDefined();
      expect(result.bestSolution).toBeDefined();
      
      // Check that the best solution respects the constraint
      const diameter = result.bestSolution.variables['duct_diameter'] as number;
      expect(diameter).toBeLessThanOrEqual(8.1); // Allow small tolerance
    }, 25000);
  });

  describe('Multi-Objective Optimization', () => {
    test('should perform multi-objective optimization with NSGA-II', async () => {
      // Create separate objective functions
      const pressureLossObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
        return (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
      };

      const costObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const material = variables.find(v => v.id === 'duct_material')?.currentValue as string || 'galvanized_steel';

        const materialCosts = {
          'galvanized_steel': 10,
          'aluminum': 15,
          'fiberglass': 8
        };
        const baseCost = materialCosts[material as keyof typeof materialCosts] || 10;
        return baseCost * diameter * diameter * 0.1;
      };

      const moFramework = new MultiObjectiveOptimizationFramework({
        algorithm: 'nsga2',
        populationSize: 30,
        maxGenerations: 20,
        crossoverRate: 0.9,
        mutationRate: 0.1
      });

      const result = await moFramework.optimizeMultiObjective(
        testOptimizationProblem,
        [pressureLossObjective, costObjective],
        testConstraintFunctions
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.analysis?.paretoFront).toBeDefined();
      expect(result.analysis?.tradeoffAnalysis).toBeDefined();
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
    }, 30000);

    test('should generate Pareto front with multiple solutions', async () => {
      const pressureLossObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        const fanSpeed = variables.find(v => v.id === 'fan_speed')?.currentValue as number || 80;
        return (fanSpeed / 100) ** 2 * (12 / diameter) ** 4 * 2.0;
      };

      const costObjective: ObjectiveFunctionType = (variables: OptimizationVariable[]): number => {
        const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
        return diameter * diameter * 0.1; // Simplified cost model
      };

      const moFramework = new MultiObjectiveOptimizationFramework({
        algorithm: 'nsga2',
        populationSize: 40,
        maxGenerations: 25,
        paretoSettings: {
          maxSolutions: 20,
          diversityThreshold: 0.01,
          convergenceThreshold: 1e-6,
          hypervolume: { enabled: true, referencePoint: [] },
          spacing: { enabled: true, targetSpacing: 0.1 }
        }
      });

      const result = await moFramework.optimizeMultiObjective(
        testOptimizationProblem,
        [pressureLossObjective, costObjective],
        testConstraintFunctions
      );

      expect(result.analysis?.paretoFront?.solutions).toBeDefined();
      expect(result.analysis?.paretoFront?.solutions.length).toBeGreaterThan(1);
      expect(result.analysis?.paretoFront?.hypervolume).toBeGreaterThan(0);
      expect(result.analysis?.tradeoffAnalysis?.kneePoints).toBeDefined();
    }, 35000);
  });

  describe('Integration with Existing Components', () => {
    test('should integrate with SystemOptimizationEngine', async () => {
      const result = await SystemOptimizationEngine.optimizeSystem(
        testOptimizationProblem,
        OptimizationAlgorithm.GENETIC_ALGORITHM
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.statistics).toBeDefined();
    }, 20000);

    test('should perform multi-objective optimization through engine', async () => {
      const result = await SystemOptimizationEngine.optimizeMultiObjective(
        testOptimizationProblem,
        OptimizationAlgorithm.NSGA_II
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OptimizationStatus.CONVERGED);
      expect(result.bestSolution).toBeDefined();
      expect(result.analysis?.paretoFront).toBeDefined();
    }, 25000);
  });

  describe('Performance Benchmarking', () => {
    test('should complete optimization within performance targets', async () => {
      const startTime = performance.now();

      const ga = new GeneticAlgorithm({
        populationSize: 30,
        maxGenerations: 50,
        crossoverRate: 0.8,
        mutationRate: 0.1
      });

      const result = await ga.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);

      const executionTime = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.statistics.executionTime).toBeLessThan(30000);
      expect(result.statistics.totalEvaluations).toBeGreaterThan(100);
    }, 35000);

    test('should maintain accuracy across multiple runs', async () => {
      const results: OptimizationResult[] = [];
      const numRuns = 3;

      for (let i = 0; i < numRuns; i++) {
        const ga = new GeneticAlgorithm({
          populationSize: 20,
          maxGenerations: 30,
          seedValue: 12345 + i // Different seed for each run
        });

        const result = await ga.optimize(testOptimizationProblem, testObjectiveFunction, testConstraintFunctions);
        results.push(result);
      }

      // Check that all runs converged
      results.forEach(result => {
        expect(result.status).toBe(OptimizationStatus.CONVERGED);
        expect(result.bestSolution.feasible).toBe(true);
      });

      // Check fitness consistency (should be within reasonable range)
      const fitnesses = results.map(r => r.bestSolution.fitness);
      const avgFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
      const maxDeviation = Math.max(...fitnesses.map(f => Math.abs(f - avgFitness)));

      expect(maxDeviation / avgFitness).toBeLessThan(0.5); // Within 50% of average
    }, 60000);
  });

  describe('Constraint Handling', () => {
    test('should handle constraint violations properly', async () => {
      // Create problem with tight constraints
      const constrainedProblem = {
        ...testOptimizationProblem,
        constraints: [
          {
            id: 'very_tight_constraint',
            name: 'Very Tight Constraint',
            description: 'Artificially tight constraint for testing',
            type: 'inequality' as const,
            bounds: { maximum: 0.1 },
            units: 'dimensionless',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              return diameter - 8; // Only allows very small diameters
            }
          }
        ]
      };

      const ga = new GeneticAlgorithm({
        populationSize: 30,
        maxGenerations: 50,
        constraintHandling: 'penalty',
        penaltyCoefficient: 1000
      });

      const constraintFunction = constrainedProblem.constraints[0].evaluationFunction;
      const result = await ga.optimize(constrainedProblem, testObjectiveFunction, [constraintFunction]);

      expect(result).toBeDefined();
      expect(result.bestSolution).toBeDefined();

      // Check that the best solution respects the constraint
      const diameter = result.bestSolution.variables['duct_diameter'] as number;
      expect(diameter).toBeLessThanOrEqual(8.1); // Allow small tolerance
    }, 25000);

    test('should validate optimization problem structure', async () => {
      // Test with invalid problem structure
      const invalidProblem = {
        ...testOptimizationProblem,
        variables: [] // Empty variables array
      };

      const ga = new GeneticAlgorithm();

      await expect(
        ga.optimize(invalidProblem, testObjectiveFunction, testConstraintFunctions)
      ).rejects.toThrow();
    });

    test('should handle infeasible problems gracefully', async () => {
      // Create impossible constraints
      const infeasibleProblem = {
        ...testOptimizationProblem,
        constraints: [
          {
            id: 'impossible_constraint_1',
            name: 'Impossible Constraint 1',
            description: 'Diameter must be less than 5',
            type: 'inequality' as const,
            bounds: { maximum: 0 },
            units: 'inches',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              return diameter - 5; // Violation if diameter > 5
            }
          },
          {
            id: 'impossible_constraint_2',
            name: 'Impossible Constraint 2',
            description: 'Diameter must be greater than 20',
            type: 'inequality' as const,
            bounds: { minimum: 20 },
            units: 'inches',
            evaluationFunction: (variables: OptimizationVariable[]) => {
              const diameter = variables.find(v => v.id === 'duct_diameter')?.currentValue as number || 12;
              return 20 - diameter; // Violation if diameter < 20
            }
          }
        ]
      };

      const ga = new GeneticAlgorithm({
        populationSize: 20,
        maxGenerations: 30,
        constraintHandling: 'death_penalty'
      });

      const constraintFunctions = infeasibleProblem.constraints.map(c => c.evaluationFunction);
      const result = await ga.optimize(infeasibleProblem, testObjectiveFunction, constraintFunctions);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      // Should either find no feasible solution or handle gracefully
    }, 20000);
  });
});
