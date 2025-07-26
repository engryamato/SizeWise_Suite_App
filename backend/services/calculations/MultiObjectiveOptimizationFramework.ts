/**
 * Multi-objective Optimization Framework for System Optimization
 * 
 * Implements comprehensive multi-objective optimization with:
 * - NSGA-II (Non-dominated Sorting Genetic Algorithm II)
 * - Pareto front analysis and visualization
 * - Trade-off analysis and knee point identification
 * - Multi-criteria decision making support
 * - Weighted sum aggregation methods
 * - Constraint handling for multi-objective problems
 * 
 * @version 3.0.0
 * @author SizeWise Suite Development Team
 */

import {
  OptimizationSolution,
  OptimizationVariable,
  OptimizationProblem,
  OptimizationResult,
  OptimizationStatus,
  OptimizationStatistics,
  OptimizationHistory,
  IterationHistory,
  PopulationSnapshot,
  SolutionPerformanceMetrics,
  ObjectiveFunctionType,
  ConstraintFunctionType,
  MultiObjectiveFunction,
  ParetoSettings,
  ObjectiveFunction,
  ParetoFront,
  ParetoSolution,
  TradeoffAnalysis,
  KneePoint,
  DominanceRelation,
  CrowdingDistance
} from './types/SystemOptimizationTypes';

import { GeneticAlgorithm, GeneticAlgorithmParameters } from './algorithms/GeneticAlgorithm';

export interface MultiObjectiveParameters {
  algorithm: 'nsga2' | 'spea2' | 'moead' | 'weighted_sum';
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  eliteSize: number;
  paretoSettings: ParetoSettings;
  weightedSumWeights?: number[];
  diversityMaintenance: boolean;
  constraintHandling: 'penalty' | 'repair' | 'death_penalty';
  penaltyCoefficient: number;
  archiveSize: number;
  seedValue?: number;
}

export interface NSGA2Individual extends OptimizationSolution {
  objectives: number[];
  rank: number;
  crowdingDistance: number;
  dominationCount: number;
  dominatedSolutions: string[];
}

export interface MultiObjectiveState {
  population: NSGA2Individual[];
  archive: NSGA2Individual[];
  paretoFronts: NSGA2Individual[][];
  generation: number;
  hypervolume: number;
  spacing: number;
  convergenceMetric: number;
}

/**
 * Multi-objective optimization framework with NSGA-II and Pareto analysis
 */
export class MultiObjectiveOptimizationFramework {
  private parameters: MultiObjectiveParameters;
  private currentState: MultiObjectiveState | null = null;
  private paretoFront: ParetoFront | null = null;
  private history: IterationHistory[] = [];
  private populationHistory: PopulationSnapshot[] = [];
  private random: () => number;
  private evaluationCount: number = 0;

  constructor(parameters?: Partial<MultiObjectiveParameters>) {
    this.parameters = {
      algorithm: 'nsga2',
      populationSize: 100,
      maxGenerations: 100,
      crossoverRate: 0.9,
      mutationRate: 0.1,
      eliteSize: 10,
      paretoSettings: {
        maxSolutions: 100,
        diversityThreshold: 0.01,
        convergenceThreshold: 1e-6,
        hypervolume: {
          enabled: true,
          referencePoint: []
        },
        spacing: {
          enabled: true,
          targetSpacing: 0.1
        }
      },
      diversityMaintenance: true,
      constraintHandling: 'penalty',
      penaltyCoefficient: 1000,
      archiveSize: 200,
      ...parameters
    };

    // Initialize random number generator
    if (this.parameters.seedValue !== undefined) {
      this.random = this.createSeededRandom(this.parameters.seedValue);
    } else {
      this.random = Math.random;
    }
  }

  /**
   * Main multi-objective optimization method
   */
  public async optimizeMultiObjective(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    try {
      // Validate multi-objective problem
      this.validateMultiObjectiveProblem(problem, objectiveFunctions);
      
      // Initialize algorithm
      this.initializeAlgorithm(problem);
      
      // Create initial population
      await this.createInitialPopulation(problem, objectiveFunctions, constraintFunctions);
      
      // Main optimization loop
      while (!this.shouldTerminate(problem)) {
        await this.evolvePopulation(problem, objectiveFunctions, constraintFunctions);
        this.updateHistory();
        this.updateParetoFront();
      }
      
      // Perform final analysis
      const tradeoffAnalysis = this.performTradeoffAnalysis();
      
      // Create final result
      return this.createMultiObjectiveResult(problem, startTime, tradeoffAnalysis);
      
    } catch (error) {
      console.error('Multi-objective optimization failed:', error);
      throw error;
    }
  }

  /**
   * Validate multi-objective problem
   */
  private validateMultiObjectiveProblem(problem: OptimizationProblem, objectiveFunctions: ObjectiveFunctionType[]): void {
    if (objectiveFunctions.length < 2) {
      throw new Error('Multi-objective optimization requires at least 2 objective functions');
    }
    
    if (problem.objectives.objectives.length !== objectiveFunctions.length) {
      throw new Error('Number of objective functions must match problem definition');
    }
  }

  /**
   * Initialize algorithm state
   */
  private initializeAlgorithm(problem: OptimizationProblem): void {
    this.currentState = null;
    this.paretoFront = null;
    this.history = [];
    this.populationHistory = [];
    this.evaluationCount = 0;
    
    console.log(`Initializing Multi-objective Optimization (${this.parameters.algorithm}) with population size: ${this.parameters.populationSize}`);
  }

  /**
   * Create initial population
   */
  private async createInitialPopulation(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    const population: NSGA2Individual[] = [];
    
    // Create random individuals
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const individual = this.createRandomIndividual(problem);
      await this.evaluateIndividual(individual, problem, objectiveFunctions, constraintFunctions);
      population.push(individual);
    }
    
    // Perform non-dominated sorting
    const fronts = this.nonDominatedSort(population);
    
    // Calculate crowding distances
    for (const front of fronts) {
      this.calculateCrowdingDistance(front, objectiveFunctions.length);
    }
    
    // Initialize state
    this.currentState = {
      population,
      archive: [...population],
      paretoFronts: fronts,
      generation: 0,
      hypervolume: this.calculateHypervolume(fronts[0] || []),
      spacing: this.calculateSpacing(fronts[0] || []),
      convergenceMetric: 0
    };
  }

  /**
   * Create a random individual
   */
  private createRandomIndividual(problem: OptimizationProblem): NSGA2Individual {
    const variables: { [variableId: string]: number | string } = {};
    
    for (const variable of problem.variables) {
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        // Discrete variable
        const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
        variables[variable.id] = variable.discreteValues[randomIndex];
      } else {
        // Continuous variable
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
        variables[variable.id] = min + this.random() * (max - min);
      }
    }
    
    return {
      id: this.generateIndividualId(),
      variables,
      objectiveValues: {},
      constraintViolations: [],
      feasible: true,
      fitness: 0,
      systemConfiguration: problem.systemConfiguration,
      performanceMetrics: {} as SolutionPerformanceMetrics,
      objectives: [],
      rank: 0,
      crowdingDistance: 0,
      dominationCount: 0,
      dominatedSolutions: []
    };
  }

  /**
   * Evaluate individual on all objectives
   */
  private async evaluateIndividual(
    individual: NSGA2Individual,
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    try {
      // Convert individual to optimization variables
      const variables = this.individualToVariables(individual, problem.variables);
      
      // Evaluate all objective functions
      individual.objectives = [];
      for (let i = 0; i < objectiveFunctions.length; i++) {
        const objectiveValue = objectiveFunctions[i](variables);
        individual.objectives.push(objectiveValue);
        
        // Store in objectiveValues map
        if (problem.objectives.objectives[i]) {
          individual.objectiveValues[problem.objectives.objectives[i].id] = objectiveValue;
        }
      }
      
      // Calculate fitness (for single-objective compatibility)
      individual.fitness = this.calculateScalarFitness(individual.objectives, problem);
      
      // Evaluate constraints
      individual.constraintViolations = [];
      for (let i = 0; i < constraintFunctions.length; i++) {
        const violation = constraintFunctions[i](variables);
        individual.constraintViolations.push({
          constraintId: `constraint_${i}`,
          violationType: violation > 0 ? 'inequality' : 'boundary',
          currentValue: violation,
          requiredValue: 0,
          severity: violation > 0 ? 'major' : 'minor',
          penalty: violation > 0 ? violation * this.parameters.penaltyCoefficient : 0
        });
      }
      
      // Check feasibility
      individual.feasible = individual.constraintViolations.every(v => v.currentValue <= 0);
      
      // Apply constraint handling
      if (!individual.feasible && this.parameters.constraintHandling === 'penalty') {
        const totalPenalty = individual.constraintViolations
          .filter(v => v.currentValue > 0)
          .reduce((sum, v) => sum + v.penalty, 0);
        
        // Add penalty to all objectives
        for (let i = 0; i < individual.objectives.length; i++) {
          individual.objectives[i] += totalPenalty;
        }
      }
      
      this.evaluationCount++;
      
    } catch (error) {
      console.error('Error evaluating individual:', error);
      individual.objectives = new Array(objectiveFunctions.length).fill(Number.MAX_VALUE);
      individual.fitness = Number.MAX_VALUE;
      individual.feasible = false;
    }
  }

  /**
   * Convert individual to optimization variables
   */
  private individualToVariables(individual: NSGA2Individual, variableTemplates: OptimizationVariable[]): OptimizationVariable[] {
    return variableTemplates.map(template => ({
      ...template,
      currentValue: individual.variables[template.id]
    }));
  }

  /**
   * Calculate scalar fitness for compatibility
   */
  private calculateScalarFitness(objectives: number[], problem: OptimizationProblem): number {
    if (this.parameters.weightedSumWeights && this.parameters.weightedSumWeights.length === objectives.length) {
      // Weighted sum aggregation
      return objectives.reduce((sum, obj, i) => sum + this.parameters.weightedSumWeights![i] * obj, 0);
    } else {
      // Simple sum
      return objectives.reduce((sum, obj) => sum + obj, 0);
    }
  }

  /**
   * Evolve population for one generation
   */
  private async evolvePopulation(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    switch (this.parameters.algorithm) {
      case 'nsga2':
        await this.evolveNSGA2(problem, objectiveFunctions, constraintFunctions);
        break;
      case 'weighted_sum':
        await this.evolveWeightedSum(problem, objectiveFunctions, constraintFunctions);
        break;
      default:
        await this.evolveNSGA2(problem, objectiveFunctions, constraintFunctions);
    }
    
    this.currentState.generation++;
  }

  /**
   * Evolve using NSGA-II algorithm
   */
  private async evolveNSGA2(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    // Create offspring population
    const offspring = await this.createOffspring(problem, objectiveFunctions, constraintFunctions);
    
    // Combine parent and offspring populations
    const combinedPopulation = [...this.currentState.population, ...offspring];
    
    // Perform non-dominated sorting
    const fronts = this.nonDominatedSort(combinedPopulation);
    
    // Select next generation
    const nextGeneration: NSGA2Individual[] = [];
    let frontIndex = 0;
    
    while (nextGeneration.length + fronts[frontIndex].length <= this.parameters.populationSize) {
      // Calculate crowding distance for current front
      this.calculateCrowdingDistance(fronts[frontIndex], objectiveFunctions.length);
      
      // Add entire front
      nextGeneration.push(...fronts[frontIndex]);
      frontIndex++;
      
      if (frontIndex >= fronts.length) break;
    }
    
    // Fill remaining slots with best individuals from next front
    if (nextGeneration.length < this.parameters.populationSize && frontIndex < fronts.length) {
      const remainingSlots = this.parameters.populationSize - nextGeneration.length;
      const lastFront = fronts[frontIndex];
      
      // Calculate crowding distance for last front
      this.calculateCrowdingDistance(lastFront, objectiveFunctions.length);
      
      // Sort by crowding distance (descending)
      lastFront.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
      
      // Add best individuals
      nextGeneration.push(...lastFront.slice(0, remainingSlots));
    }
    
    // Update state
    this.currentState.population = nextGeneration;
    this.currentState.paretoFronts = fronts;
    this.currentState.hypervolume = this.calculateHypervolume(fronts[0] || []);
    this.currentState.spacing = this.calculateSpacing(fronts[0] || []);
    
    // Update archive
    this.updateArchive(fronts[0] || []);
  }

  /**
   * Create offspring population
   */
  private async createOffspring(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<NSGA2Individual[]> {
    const offspring: NSGA2Individual[] = [];
    
    while (offspring.length < this.parameters.populationSize) {
      // Tournament selection
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      
      if (!parent1 || !parent2) continue;
      
      // Crossover
      if (this.random() < this.parameters.crossoverRate) {
        const [child1, child2] = this.crossover(parent1, parent2, problem);
        
        // Mutation
        if (this.random() < this.parameters.mutationRate) {
          this.mutate(child1, problem);
        }
        if (this.random() < this.parameters.mutationRate) {
          this.mutate(child2, problem);
        }
        
        // Evaluate children
        await this.evaluateIndividual(child1, problem, objectiveFunctions, constraintFunctions);
        await this.evaluateIndividual(child2, problem, objectiveFunctions, constraintFunctions);
        
        offspring.push(child1);
        if (offspring.length < this.parameters.populationSize) {
          offspring.push(child2);
        }
      }
    }
    
    return offspring;
  }

  /**
   * Tournament selection for NSGA-II
   */
  private tournamentSelection(): NSGA2Individual | null {
    if (!this.currentState || this.currentState.population.length === 0) return null;
    
    const tournamentSize = 2;
    const tournament: NSGA2Individual[] = [];
    
    // Select random individuals for tournament
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(this.random() * this.currentState.population.length);
      tournament.push(this.currentState.population[randomIndex]);
    }
    
    // Select best individual based on rank and crowding distance
    return tournament.reduce((best, current) => {
      if (current.rank < best.rank) {
        return current;
      } else if (current.rank === best.rank && current.crowdingDistance > best.crowdingDistance) {
        return current;
      }
      return best;
    });
  }

  /**
   * Crossover operation
   */
  private crossover(parent1: NSGA2Individual, parent2: NSGA2Individual, problem: OptimizationProblem): [NSGA2Individual, NSGA2Individual] {
    const child1 = this.createRandomIndividual(problem);
    const child2 = this.createRandomIndividual(problem);
    
    // Simulated binary crossover (SBX) for continuous variables
    const eta = 20; // Distribution index
    
    for (const variable of problem.variables) {
      const value1 = parent1.variables[variable.id];
      const value2 = parent2.variables[variable.id];
      
      if (typeof value1 === 'number' && typeof value2 === 'number') {
        // Continuous variable - SBX
        const u = this.random();
        const beta = u <= 0.5 ? 
          Math.pow(2 * u, 1 / (eta + 1)) : 
          Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1));
        
        const child1Value = 0.5 * ((1 + beta) * value1 + (1 - beta) * value2);
        const child2Value = 0.5 * ((1 - beta) * value1 + (1 + beta) * value2);
        
        // Apply bounds
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : -Infinity;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : Infinity;
        
        child1.variables[variable.id] = Math.max(min, Math.min(max, child1Value));
        child2.variables[variable.id] = Math.max(min, Math.min(max, child2Value));
      } else {
        // Discrete variable - random selection
        child1.variables[variable.id] = this.random() < 0.5 ? value1 : value2;
        child2.variables[variable.id] = this.random() < 0.5 ? value1 : value2;
      }
    }
    
    return [child1, child2];
  }

  /**
   * Mutation operation
   */
  private mutate(individual: NSGA2Individual, problem: OptimizationProblem): void {
    const eta = 20; // Distribution index
    
    for (const variable of problem.variables) {
      if (this.random() < (1 / problem.variables.length)) { // Mutation probability per variable
        const currentValue = individual.variables[variable.id];
        
        if (typeof currentValue === 'number') {
          // Continuous variable - polynomial mutation
          const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
          const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
          
          const u = this.random();
          const delta = u < 0.5 ? 
            Math.pow(2 * u, 1 / (eta + 1)) - 1 : 
            1 - Math.pow(2 * (1 - u), 1 / (eta + 1));
          
          const mutatedValue = currentValue + delta * (max - min);
          individual.variables[variable.id] = Math.max(min, Math.min(max, mutatedValue));
        } else if (variable.discreteValues && variable.discreteValues.length > 0) {
          // Discrete variable - random selection
          const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
          individual.variables[variable.id] = variable.discreteValues[randomIndex];
        }
      }
    }
  }

  /**
   * Non-dominated sorting
   */
  private nonDominatedSort(population: NSGA2Individual[]): NSGA2Individual[][] {
    const fronts: NSGA2Individual[][] = [];
    
    // Initialize domination properties
    for (const individual of population) {
      individual.dominationCount = 0;
      individual.dominatedSolutions = [];
    }
    
    // Calculate domination relationships
    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        const dominance = this.checkDominance(population[i], population[j]);
        
        if (dominance === 'first_dominates') {
          population[i].dominatedSolutions.push(population[j].id);
          population[j].dominationCount++;
        } else if (dominance === 'second_dominates') {
          population[j].dominatedSolutions.push(population[i].id);
          population[i].dominationCount++;
        }
      }
    }
    
    // Create first front
    const firstFront: NSGA2Individual[] = [];
    for (const individual of population) {
      if (individual.dominationCount === 0) {
        individual.rank = 0;
        firstFront.push(individual);
      }
    }
    
    if (firstFront.length > 0) {
      fronts.push(firstFront);
    }
    
    // Create subsequent fronts
    let currentFront = firstFront;
    let frontIndex = 0;
    
    while (currentFront.length > 0) {
      const nextFront: NSGA2Individual[] = [];
      
      for (const individual of currentFront) {
        for (const dominatedId of individual.dominatedSolutions) {
          const dominated = population.find(p => p.id === dominatedId);
          if (dominated) {
            dominated.dominationCount--;
            if (dominated.dominationCount === 0) {
              dominated.rank = frontIndex + 1;
              nextFront.push(dominated);
            }
          }
        }
      }
      
      if (nextFront.length > 0) {
        fronts.push(nextFront);
      }
      
      currentFront = nextFront;
      frontIndex++;
    }
    
    return fronts;
  }

  /**
   * Check dominance relationship between two individuals
   */
  private checkDominance(individual1: NSGA2Individual, individual2: NSGA2Individual): DominanceRelation {
    let firstBetter = false;
    let secondBetter = false;
    
    for (let i = 0; i < individual1.objectives.length; i++) {
      if (individual1.objectives[i] < individual2.objectives[i]) {
        firstBetter = true;
      } else if (individual1.objectives[i] > individual2.objectives[i]) {
        secondBetter = true;
      }
    }
    
    if (firstBetter && !secondBetter) {
      return 'first_dominates';
    } else if (secondBetter && !firstBetter) {
      return 'second_dominates';
    } else {
      return 'non_dominated';
    }
  }

  /**
   * Calculate crowding distance
   */
  private calculateCrowdingDistance(front: NSGA2Individual[], numObjectives: number): void {
    const frontSize = front.length;
    
    // Initialize crowding distances
    for (const individual of front) {
      individual.crowdingDistance = 0;
    }
    
    if (frontSize <= 2) {
      // Boundary solutions get infinite distance
      for (const individual of front) {
        individual.crowdingDistance = Infinity;
      }
      return;
    }
    
    // Calculate crowding distance for each objective
    for (let obj = 0; obj < numObjectives; obj++) {
      // Sort by objective value
      front.sort((a, b) => a.objectives[obj] - b.objectives[obj]);
      
      // Boundary solutions get infinite distance
      front[0].crowdingDistance = Infinity;
      front[frontSize - 1].crowdingDistance = Infinity;
      
      // Calculate distance for intermediate solutions
      const objectiveRange = front[frontSize - 1].objectives[obj] - front[0].objectives[obj];
      
      if (objectiveRange > 0) {
        for (let i = 1; i < frontSize - 1; i++) {
          const distance = (front[i + 1].objectives[obj] - front[i - 1].objectives[obj]) / objectiveRange;
          front[i].crowdingDistance += distance;
        }
      }
    }
  }

  /**
   * Evolve using weighted sum approach
   */
  private async evolveWeightedSum(
    problem: OptimizationProblem,
    objectiveFunctions: ObjectiveFunctionType[],
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    // Use genetic algorithm with weighted sum aggregation
    const gaParameters: Partial<GeneticAlgorithmParameters> = {
      populationSize: this.parameters.populationSize,
      maxGenerations: 1, // Single generation evolution
      crossoverRate: this.parameters.crossoverRate,
      mutationRate: this.parameters.mutationRate,
      eliteSize: this.parameters.eliteSize,
      constraintHandling: this.parameters.constraintHandling,
      penaltyCoefficient: this.parameters.penaltyCoefficient
    };
    
    const ga = new GeneticAlgorithm(gaParameters);
    
    // Create weighted objective function
    const weightedObjectiveFunction = (variables: OptimizationVariable[]): number => {
      let weightedSum = 0;
      for (let i = 0; i < objectiveFunctions.length; i++) {
        const weight = this.parameters.weightedSumWeights?.[i] || (1 / objectiveFunctions.length);
        weightedSum += weight * objectiveFunctions[i](variables);
      }
      return weightedSum;
    };
    
    // Evolve population
    const result = await ga.optimize(problem, weightedObjectiveFunction, constraintFunctions);
    
    // Convert result back to multi-objective format
    if (this.currentState && result.bestSolution) {
      // Update population with new solutions (simplified)
      const newIndividual = this.solutionToIndividual(result.bestSolution, problem);
      await this.evaluateIndividual(newIndividual, problem, objectiveFunctions, constraintFunctions);
      
      // Replace worst individual
      this.currentState.population.sort((a, b) => a.fitness - b.fitness);
      this.currentState.population[this.currentState.population.length - 1] = newIndividual;
    }
  }

  /**
   * Convert optimization solution to NSGA2 individual
   */
  private solutionToIndividual(solution: OptimizationSolution, problem: OptimizationProblem): NSGA2Individual {
    return {
      ...solution,
      objectives: [],
      rank: 0,
      crowdingDistance: 0,
      dominationCount: 0,
      dominatedSolutions: []
    };
  }

  /**
   * Update archive with non-dominated solutions
   */
  private updateArchive(paretoFront: NSGA2Individual[]): void {
    if (!this.currentState) return;
    
    // Add new non-dominated solutions to archive
    for (const individual of paretoFront) {
      const isDominated = this.currentState.archive.some(archived => 
        this.checkDominance(archived, individual) === 'first_dominates'
      );
      
      if (!isDominated) {
        // Remove dominated solutions from archive
        this.currentState.archive = this.currentState.archive.filter(archived =>
          this.checkDominance(individual, archived) !== 'first_dominates'
        );
        
        // Add new solution
        this.currentState.archive.push({ ...individual });
      }
    }
    
    // Limit archive size
    if (this.currentState.archive.length > this.parameters.archiveSize) {
      // Sort by crowding distance and keep best
      this.calculateCrowdingDistance(this.currentState.archive, this.currentState.archive[0]?.objectives.length || 0);
      this.currentState.archive.sort((a, b) => b.crowdingDistance - a.crowdingDistance);
      this.currentState.archive = this.currentState.archive.slice(0, this.parameters.archiveSize);
    }
  }

  /**
   * Update Pareto front
   */
  private updateParetoFront(): void {
    if (!this.currentState || this.currentState.paretoFronts.length === 0) return;
    
    const paretoSolutions: ParetoSolution[] = this.currentState.paretoFronts[0].map(individual => ({
      id: individual.id,
      objectives: [...individual.objectives],
      variables: { ...individual.variables },
      dominanceRank: individual.rank,
      crowdingDistance: individual.crowdingDistance,
      feasible: individual.feasible,
      constraintViolations: individual.constraintViolations.length
    }));
    
    this.paretoFront = {
      solutions: paretoSolutions,
      hypervolume: this.currentState.hypervolume,
      spacing: this.currentState.spacing,
      convergenceMetric: this.currentState.convergenceMetric,
      generationFound: this.currentState.generation,
      dominanceDepth: 1
    };
  }

  /**
   * Calculate hypervolume indicator
   */
  private calculateHypervolume(paretoFront: NSGA2Individual[]): number {
    if (paretoFront.length === 0) return 0;
    
    // Simplified hypervolume calculation
    // In practice, would use more sophisticated algorithms like WFG or FPRAS
    
    const referencePoint = this.parameters.paretoSettings.hypervolume.referencePoint;
    if (referencePoint.length === 0) {
      // Use worst values as reference point
      const numObjectives = paretoFront[0]?.objectives.length || 0;
      for (let i = 0; i < numObjectives; i++) {
        const maxValue = Math.max(...paretoFront.map(ind => ind.objectives[i]));
        referencePoint.push(maxValue * 1.1); // 10% worse than worst
      }
    }
    
    // Simple hypervolume approximation
    let hypervolume = 0;
    for (const individual of paretoFront) {
      let volume = 1;
      for (let i = 0; i < individual.objectives.length; i++) {
        volume *= Math.max(0, referencePoint[i] - individual.objectives[i]);
      }
      hypervolume += volume;
    }
    
    return hypervolume;
  }

  /**
   * Calculate spacing metric
   */
  private calculateSpacing(paretoFront: NSGA2Individual[]): number {
    if (paretoFront.length < 2) return 0;
    
    const distances: number[] = [];
    
    for (let i = 0; i < paretoFront.length; i++) {
      let minDistance = Infinity;
      
      for (let j = 0; j < paretoFront.length; j++) {
        if (i !== j) {
          const distance = this.calculateObjectiveDistance(paretoFront[i], paretoFront[j]);
          minDistance = Math.min(minDistance, distance);
        }
      }
      
      distances.push(minDistance);
    }
    
    const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - meanDistance, 2), 0) / distances.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate distance between two individuals in objective space
   */
  private calculateObjectiveDistance(individual1: NSGA2Individual, individual2: NSGA2Individual): number {
    let distance = 0;
    for (let i = 0; i < individual1.objectives.length; i++) {
      const diff = individual1.objectives[i] - individual2.objectives[i];
      distance += diff * diff;
    }
    return Math.sqrt(distance);
  }

  /**
   * Perform trade-off analysis
   */
  private performTradeoffAnalysis(): TradeoffAnalysis {
    if (!this.paretoFront) {
      return {
        kneePoints: [],
        tradeoffCurves: [],
        sensitivityAnalysis: {},
        recommendations: []
      };
    }
    
    // Find knee points (solutions with best trade-offs)
    const kneePoints = this.findKneePoints();
    
    // Generate trade-off curves
    const tradeoffCurves = this.generateTradeoffCurves();
    
    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(kneePoints);
    
    return {
      kneePoints,
      tradeoffCurves,
      sensitivityAnalysis,
      recommendations
    };
  }

  /**
   * Find knee points in Pareto front
   */
  private findKneePoints(): KneePoint[] {
    if (!this.paretoFront || this.paretoFront.solutions.length < 3) return [];
    
    const kneePoints: KneePoint[] = [];
    const solutions = this.paretoFront.solutions;
    
    // Simple knee point detection using angle-based method
    for (let i = 1; i < solutions.length - 1; i++) {
      const prev = solutions[i - 1];
      const current = solutions[i];
      const next = solutions[i + 1];
      
      // Calculate angle at current point
      const angle = this.calculateAngle(prev.objectives, current.objectives, next.objectives);
      
      // Knee points have small angles (sharp turns)
      if (angle < Math.PI / 3) { // 60 degrees threshold
        kneePoints.push({
          solutionId: current.id,
          objectives: [...current.objectives],
          kneeMetric: Math.PI - angle, // Higher value = sharper knee
          tradeoffRatio: this.calculateTradeoffRatio(current.objectives),
          description: `Knee point with ${(Math.PI - angle).toFixed(3)} knee metric`
        });
      }
    }
    
    // Sort by knee metric (best knees first)
    kneePoints.sort((a, b) => b.kneeMetric - a.kneeMetric);
    
    return kneePoints.slice(0, 5); // Return top 5 knee points
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(p1: number[], p2: number[], p3: number[]): number {
    const v1 = p1.map((val, i) => val - p2[i]);
    const v2 = p3.map((val, i) => val - p2[i]);
    
    const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    
    if (mag1 === 0 || mag2 === 0) return Math.PI;
    
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  }

  /**
   * Calculate trade-off ratio for objectives
   */
  private calculateTradeoffRatio(objectives: number[]): number {
    if (objectives.length !== 2) return 1; // Only for bi-objective problems
    
    return objectives[0] / objectives[1];
  }

  /**
   * Generate trade-off curves
   */
  private generateTradeoffCurves(): any[] {
    // Simplified implementation - would generate actual curve data
    return [];
  }

  /**
   * Perform sensitivity analysis
   */
  private performSensitivityAnalysis(): any {
    // Simplified implementation - would analyze parameter sensitivity
    return {};
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(kneePoints: KneePoint[]): string[] {
    const recommendations: string[] = [];
    
    if (kneePoints.length > 0) {
      recommendations.push(`Consider solution ${kneePoints[0].solutionId} as it represents the best trade-off between objectives.`);
    }
    
    if (this.paretoFront && this.paretoFront.solutions.length > 10) {
      recommendations.push('Large Pareto front indicates good diversity in solutions. Consider multiple alternatives.');
    }
    
    return recommendations;
  }

  /**
   * Check termination criteria
   */
  private shouldTerminate(problem: OptimizationProblem): boolean {
    if (!this.currentState) return true;
    
    // Maximum generations
    if (this.currentState.generation >= this.parameters.maxGenerations) {
      return true;
    }
    
    // Convergence check
    if (this.history.length >= 10) {
      const recentHistory = this.history.slice(-10);
      const hypervolumeImprovement = recentHistory[recentHistory.length - 1].bestFitness - recentHistory[0].bestFitness;
      
      if (Math.abs(hypervolumeImprovement) < this.parameters.paretoSettings.convergenceThreshold) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Update optimization history
   */
  private updateHistory(): void {
    if (!this.currentState) return;
    
    const feasibleIndividuals = this.currentState.population.filter(ind => ind.feasible);
    const fitnesses = feasibleIndividuals.map(ind => ind.fitness);
    
    if (fitnesses.length === 0) {
      fitnesses.push(Number.MAX_VALUE);
    }
    
    const history: IterationHistory = {
      iteration: this.currentState.generation,
      bestFitness: Math.min(...fitnesses),
      averageFitness: fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length,
      worstFitness: Math.max(...fitnesses),
      diversity: this.currentState.spacing,
      constraintViolations: this.currentState.population.filter(ind => !ind.feasible).length,
      timestamp: new Date()
    };
    
    this.history.push(history);
  }

  /**
   * Create multi-objective optimization result
   */
  private createMultiObjectiveResult(problem: OptimizationProblem, startTime: number, tradeoffAnalysis: TradeoffAnalysis): OptimizationResult {
    const executionTime = performance.now() - startTime;
    
    // Find best solution (first in Pareto front)
    const bestSolution = this.currentState?.paretoFronts[0]?.[0] || this.currentState?.population[0];
    
    const statistics: OptimizationStatistics = {
      totalIterations: this.currentState?.generation || 0,
      totalEvaluations: this.evaluationCount,
      convergenceIteration: this.currentState?.generation || 0,
      executionTime,
      bestFitnessHistory: this.history.map(h => h.bestFitness),
      averageFitnessHistory: this.history.map(h => h.averageFitness),
      diversityHistory: this.history.map(h => h.diversity),
      constraintViolationHistory: this.history.map(h => h.constraintViolations),
      algorithmSpecificStats: {
        algorithm: this.parameters.algorithm,
        populationSize: this.parameters.populationSize,
        paretoFrontSize: this.currentState?.paretoFronts[0]?.length || 0,
        hypervolume: this.currentState?.hypervolume || 0,
        spacing: this.currentState?.spacing || 0,
        archiveSize: this.currentState?.archive.length || 0
      }
    };
    
    const optimizationHistory: OptimizationHistory = {
      iterations: this.history,
      populationHistory: this.populationHistory,
      parameterHistory: [],
      convergenceMetrics: []
    };
    
    return {
      problemId: problem.id,
      status: OptimizationStatus.CONVERGED,
      bestSolution: bestSolution || this.createDummySolution(problem),
      statistics,
      history: optimizationHistory,
      analysis: {
        paretoFront: this.paretoFront,
        tradeoffAnalysis
      },
      recommendations: tradeoffAnalysis.recommendations,
      warnings: [],
      errors: []
    };
  }

  /**
   * Create dummy solution for error cases
   */
  private createDummySolution(problem: OptimizationProblem): OptimizationSolution {
    const variables: { [variableId: string]: number | string } = {};
    for (const variable of problem.variables) {
      variables[variable.id] = 0;
    }
    
    return {
      id: 'dummy_solution',
      variables,
      objectiveValues: {},
      constraintViolations: [],
      feasible: false,
      fitness: Number.MAX_VALUE,
      systemConfiguration: problem.systemConfiguration,
      performanceMetrics: {} as SolutionPerformanceMetrics
    };
  }

  // Utility methods
  private generateIndividualId(): string {
    return `mo_ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
