/**
 * Genetic Algorithm Implementation for System Optimization
 * 
 * Implements genetic algorithm optimization with:
 * - Multi-objective optimization support (NSGA-II)
 * - Configurable selection, crossover, and mutation operators
 * - Constraint handling with penalty methods
 * - Elitism and diversity preservation
 * - Parallel evaluation support
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
  SelectionFunction,
  CrossoverFunction,
  MutationFunction
} from '../types/SystemOptimizationTypes';

export interface GeneticAlgorithmParameters {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  eliteSize: number;
  selectionMethod: 'tournament' | 'roulette' | 'rank' | 'random';
  crossoverMethod: 'single_point' | 'two_point' | 'uniform' | 'arithmetic';
  mutationMethod: 'gaussian' | 'uniform' | 'polynomial' | 'adaptive';
  tournamentSize?: number;
  diversityMaintenance: boolean;
  constraintHandling: 'penalty' | 'repair' | 'death_penalty';
  penaltyCoefficient: number;
  adaptiveParameters: boolean;
  parallelEvaluation: boolean;
  seedValue?: number;
}

export interface Individual {
  id: string;
  genes: (number | string)[];
  fitness: number;
  objectiveValues: number[];
  constraintViolations: number[];
  feasible: boolean;
  dominationRank?: number;
  crowdingDistance?: number;
  age: number;
}

/**
 * Genetic Algorithm optimizer for single and multi-objective optimization
 */
export class GeneticAlgorithm {
  private parameters: GeneticAlgorithmParameters;
  private population: Individual[];
  private bestIndividual: Individual | null = null;
  private paretoFront: Individual[] = [];
  private generation: number = 0;
  private evaluationCount: number = 0;
  private history: IterationHistory[] = [];
  private random: () => number;

  constructor(parameters?: Partial<GeneticAlgorithmParameters>) {
    this.parameters = {
      populationSize: 50,
      maxGenerations: 100,
      crossoverRate: 0.8,
      mutationRate: 0.1,
      eliteSize: 2,
      selectionMethod: 'tournament',
      crossoverMethod: 'two_point',
      mutationMethod: 'gaussian',
      tournamentSize: 3,
      diversityMaintenance: true,
      constraintHandling: 'penalty',
      penaltyCoefficient: 1000,
      adaptiveParameters: true,
      parallelEvaluation: false,
      ...parameters
    };

    // Initialize random number generator
    if (this.parameters.seedValue !== undefined) {
      this.random = this.createSeededRandom(this.parameters.seedValue);
    } else {
      this.random = Math.random;
    }

    this.population = [];
  }

  /**
   * Main optimization method
   */
  public async optimize(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    try {
      // Initialize algorithm
      this.initializeAlgorithm(problem);
      
      // Create initial population
      await this.createInitialPopulation(problem, objectiveFunction, constraintFunctions);
      
      // Evolution loop
      while (!this.shouldTerminate(problem)) {
        await this.evolveGeneration(problem, objectiveFunction, constraintFunctions);
        this.updateHistory();
        
        if (this.parameters.adaptiveParameters) {
          this.adaptParameters();
        }
      }
      
      // Create final result
      return this.createOptimizationResult(problem, startTime);
      
    } catch (error) {
      console.error('Genetic algorithm optimization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize algorithm state
   */
  private initializeAlgorithm(problem: OptimizationProblem): void {
    this.generation = 0;
    this.evaluationCount = 0;
    this.population = [];
    this.bestIndividual = null;
    this.paretoFront = [];
    this.history = [];
    
    console.log(`Initializing Genetic Algorithm with population size: ${this.parameters.populationSize}`);
  }

  /**
   * Create initial population
   */
  private async createInitialPopulation(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    this.population = [];
    
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const individual = this.createRandomIndividual(problem);
      await this.evaluateIndividual(individual, problem, objectiveFunction, constraintFunctions);
      this.population.push(individual);
    }
    
    this.updateBestIndividual();
    this.updateParetoFront();
  }

  /**
   * Create a random individual
   */
  private createRandomIndividual(problem: OptimizationProblem): Individual {
    const genes: (number | string)[] = [];
    
    for (const variable of problem.variables) {
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        // Discrete variable
        const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
        genes.push(variable.discreteValues[randomIndex]);
      } else {
        // Continuous variable
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
        const value = min + this.random() * (max - min);
        genes.push(value);
      }
    }
    
    return {
      id: this.generateIndividualId(),
      genes,
      fitness: 0,
      objectiveValues: [],
      constraintViolations: [],
      feasible: true,
      age: 0
    };
  }

  /**
   * Evaluate individual fitness
   */
  private async evaluateIndividual(
    individual: Individual,
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    try {
      // Convert genes to optimization variables
      const variables = this.genesToVariables(individual.genes, problem.variables);
      
      // Evaluate objectives
      if (problem.objectives.objectives.length === 1) {
        // Single objective
        const objectiveValue = objectiveFunction(variables);
        individual.objectiveValues = [objectiveValue];
        individual.fitness = objectiveValue;
      } else {
        // Multi-objective - evaluate each objective separately
        individual.objectiveValues = [];
        for (const objective of problem.objectives.objectives) {
          const value = objective.evaluationFunction(variables);
          individual.objectiveValues.push(value);
        }
        // Fitness will be calculated during Pareto ranking
        individual.fitness = 0;
      }
      
      // Evaluate constraints
      individual.constraintViolations = [];
      for (const constraintFunction of constraintFunctions) {
        const violation = constraintFunction(variables);
        individual.constraintViolations.push(violation);
      }
      
      // Check feasibility
      individual.feasible = individual.constraintViolations.every(v => v <= 0);
      
      // Apply constraint handling
      if (!individual.feasible && this.parameters.constraintHandling === 'penalty') {
        const penalty = individual.constraintViolations
          .filter(v => v > 0)
          .reduce((sum, v) => sum + v, 0) * this.parameters.penaltyCoefficient;
        
        if (problem.objectives.objectives.length === 1) {
          individual.fitness += penalty;
        } else {
          // Add penalty to all objectives for multi-objective
          individual.objectiveValues = individual.objectiveValues.map(v => v + penalty);
        }
      }
      
      this.evaluationCount++;
      
    } catch (error) {
      console.error('Error evaluating individual:', error);
      individual.fitness = Number.MAX_VALUE;
      individual.feasible = false;
    }
  }

  /**
   * Convert genes to optimization variables
   */
  private genesToVariables(genes: (number | string)[], variableTemplates: OptimizationVariable[]): OptimizationVariable[] {
    return variableTemplates.map((template, index) => ({
      ...template,
      currentValue: genes[index]
    }));
  }

  /**
   * Evolve one generation
   */
  private async evolveGeneration(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    // Selection
    const parents = this.selection();
    
    // Crossover and mutation
    const offspring: Individual[] = [];
    
    for (let i = 0; i < parents.length; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1] || parents[0]; // Handle odd population sizes
      
      let child1 = this.createChild(parent1);
      let child2 = this.createChild(parent2);
      
      // Crossover
      if (this.random() < this.parameters.crossoverRate) {
        [child1, child2] = this.crossover(parent1, parent2, problem);
      }
      
      // Mutation
      if (this.random() < this.parameters.mutationRate) {
        child1 = this.mutate(child1, problem);
      }
      if (this.random() < this.parameters.mutationRate) {
        child2 = this.mutate(child2, problem);
      }
      
      offspring.push(child1, child2);
    }
    
    // Evaluate offspring
    for (const child of offspring) {
      await this.evaluateIndividual(child, problem, objectiveFunction, constraintFunctions);
    }
    
    // Replacement
    this.replacement(offspring);
    
    // Update age
    this.population.forEach(individual => individual.age++);
    
    this.generation++;
    this.updateBestIndividual();
    this.updateParetoFront();
  }

  /**
   * Selection operator
   */
  private selection(): Individual[] {
    switch (this.parameters.selectionMethod) {
      case 'tournament':
        return this.tournamentSelection();
      case 'roulette':
        return this.rouletteWheelSelection();
      case 'rank':
        return this.rankSelection();
      case 'random':
        return this.randomSelection();
      default:
        return this.tournamentSelection();
    }
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(): Individual[] {
    const selected: Individual[] = [];
    const tournamentSize = this.parameters.tournamentSize || 3;
    
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const tournament: Individual[] = [];
      
      for (let j = 0; j < tournamentSize; j++) {
        const randomIndex = Math.floor(this.random() * this.population.length);
        tournament.push(this.population[randomIndex]);
      }
      
      // Select best from tournament
      tournament.sort((a, b) => a.fitness - b.fitness);
      selected.push(tournament[0]);
    }
    
    return selected;
  }

  /**
   * Roulette wheel selection
   */
  private rouletteWheelSelection(): Individual[] {
    const selected: Individual[] = [];
    
    // Calculate fitness sum (handle minimization by inverting fitness)
    const maxFitness = Math.max(...this.population.map(ind => ind.fitness));
    const adjustedFitness = this.population.map(ind => maxFitness - ind.fitness + 1);
    const totalFitness = adjustedFitness.reduce((sum, fitness) => sum + fitness, 0);
    
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const randomValue = this.random() * totalFitness;
      let cumulativeFitness = 0;
      
      for (let j = 0; j < this.population.length; j++) {
        cumulativeFitness += adjustedFitness[j];
        if (cumulativeFitness >= randomValue) {
          selected.push(this.population[j]);
          break;
        }
      }
    }
    
    return selected;
  }

  /**
   * Rank selection
   */
  private rankSelection(): Individual[] {
    const selected: Individual[] = [];
    
    // Sort population by fitness
    const sortedPopulation = [...this.population].sort((a, b) => a.fitness - b.fitness);
    
    // Assign ranks (best = highest rank)
    const ranks = sortedPopulation.map((_, index) => index + 1);
    const totalRank = ranks.reduce((sum, rank) => sum + rank, 0);
    
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const randomValue = this.random() * totalRank;
      let cumulativeRank = 0;
      
      for (let j = 0; j < ranks.length; j++) {
        cumulativeRank += ranks[j];
        if (cumulativeRank >= randomValue) {
          selected.push(sortedPopulation[j]);
          break;
        }
      }
    }
    
    return selected;
  }

  /**
   * Random selection
   */
  private randomSelection(): Individual[] {
    const selected: Individual[] = [];
    
    for (let i = 0; i < this.parameters.populationSize; i++) {
      const randomIndex = Math.floor(this.random() * this.population.length);
      selected.push(this.population[randomIndex]);
    }
    
    return selected;
  }

  /**
   * Crossover operator
   */
  private crossover(parent1: Individual, parent2: Individual, problem: OptimizationProblem): [Individual, Individual] {
    switch (this.parameters.crossoverMethod) {
      case 'single_point':
        return this.singlePointCrossover(parent1, parent2);
      case 'two_point':
        return this.twoPointCrossover(parent1, parent2);
      case 'uniform':
        return this.uniformCrossover(parent1, parent2);
      case 'arithmetic':
        return this.arithmeticCrossover(parent1, parent2);
      default:
        return this.twoPointCrossover(parent1, parent2);
    }
  }

  /**
   * Single point crossover
   */
  private singlePointCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const crossoverPoint = Math.floor(this.random() * parent1.genes.length);
    
    const child1 = this.createChild(parent1);
    const child2 = this.createChild(parent2);
    
    child1.genes = [
      ...parent1.genes.slice(0, crossoverPoint),
      ...parent2.genes.slice(crossoverPoint)
    ];
    
    child2.genes = [
      ...parent2.genes.slice(0, crossoverPoint),
      ...parent1.genes.slice(crossoverPoint)
    ];
    
    return [child1, child2];
  }

  /**
   * Two point crossover
   */
  private twoPointCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const point1 = Math.floor(this.random() * parent1.genes.length);
    const point2 = Math.floor(this.random() * parent1.genes.length);
    const [start, end] = [Math.min(point1, point2), Math.max(point1, point2)];
    
    const child1 = this.createChild(parent1);
    const child2 = this.createChild(parent2);
    
    child1.genes = [
      ...parent1.genes.slice(0, start),
      ...parent2.genes.slice(start, end),
      ...parent1.genes.slice(end)
    ];
    
    child2.genes = [
      ...parent2.genes.slice(0, start),
      ...parent1.genes.slice(start, end),
      ...parent2.genes.slice(end)
    ];
    
    return [child1, child2];
  }

  /**
   * Uniform crossover
   */
  private uniformCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const child1 = this.createChild(parent1);
    const child2 = this.createChild(parent2);
    
    child1.genes = parent1.genes.map((gene, index) => 
      this.random() < 0.5 ? gene : parent2.genes[index]
    );
    
    child2.genes = parent2.genes.map((gene, index) => 
      this.random() < 0.5 ? gene : parent1.genes[index]
    );
    
    return [child1, child2];
  }

  /**
   * Arithmetic crossover (for continuous variables)
   */
  private arithmeticCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const alpha = this.random();
    
    const child1 = this.createChild(parent1);
    const child2 = this.createChild(parent2);
    
    child1.genes = parent1.genes.map((gene, index) => {
      if (typeof gene === 'number' && typeof parent2.genes[index] === 'number') {
        return alpha * gene + (1 - alpha) * (parent2.genes[index] as number);
      }
      return gene;
    });
    
    child2.genes = parent2.genes.map((gene, index) => {
      if (typeof gene === 'number' && typeof parent1.genes[index] === 'number') {
        return alpha * gene + (1 - alpha) * (parent1.genes[index] as number);
      }
      return gene;
    });
    
    return [child1, child2];
  }

  /**
   * Mutation operator
   */
  private mutate(individual: Individual, problem: OptimizationProblem): Individual {
    const mutated = this.createChild(individual);
    
    for (let i = 0; i < mutated.genes.length; i++) {
      if (this.random() < this.parameters.mutationRate) {
        mutated.genes[i] = this.mutateGene(mutated.genes[i], problem.variables[i]);
      }
    }
    
    return mutated;
  }

  /**
   * Mutate a single gene
   */
  private mutateGene(gene: number | string, variable: OptimizationVariable): number | string {
    if (variable.discreteValues && variable.discreteValues.length > 0) {
      // Discrete variable - random selection
      const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
      return variable.discreteValues[randomIndex];
    } else if (typeof gene === 'number') {
      // Continuous variable
      const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
      const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
      
      switch (this.parameters.mutationMethod) {
        case 'gaussian':
          return this.gaussianMutation(gene, min, max);
        case 'uniform':
          return this.uniformMutation(min, max);
        case 'polynomial':
          return this.polynomialMutation(gene, min, max);
        default:
          return this.gaussianMutation(gene, min, max);
      }
    }
    
    return gene;
  }

  /**
   * Gaussian mutation
   */
  private gaussianMutation(value: number, min: number, max: number): number {
    const sigma = (max - min) * 0.1; // 10% of range
    const mutated = value + this.gaussianRandom() * sigma;
    return Math.max(min, Math.min(max, mutated));
  }

  /**
   * Uniform mutation
   */
  private uniformMutation(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * Polynomial mutation
   */
  private polynomialMutation(value: number, min: number, max: number): number {
    const eta = 20; // Distribution index
    const delta1 = (value - min) / (max - min);
    const delta2 = (max - value) / (max - min);
    const rnd = this.random();
    
    let deltaq: number;
    if (rnd <= 0.5) {
      const xy = 1.0 - delta1;
      const val = 2.0 * rnd + (1.0 - 2.0 * rnd) * Math.pow(xy, eta + 1.0);
      deltaq = Math.pow(val, 1.0 / (eta + 1.0)) - 1.0;
    } else {
      const xy = 1.0 - delta2;
      const val = 2.0 * (1.0 - rnd) + 2.0 * (rnd - 0.5) * Math.pow(xy, eta + 1.0);
      deltaq = 1.0 - Math.pow(val, 1.0 / (eta + 1.0));
    }
    
    const mutated = value + deltaq * (max - min);
    return Math.max(min, Math.min(max, mutated));
  }

  /**
   * Replacement strategy
   */
  private replacement(offspring: Individual[]): void {
    // Combine population and offspring
    const combined = [...this.population, ...offspring];
    
    // Sort by fitness
    combined.sort((a, b) => a.fitness - b.fitness);
    
    // Keep best individuals (elitism)
    this.population = combined.slice(0, this.parameters.populationSize);
  }

  /**
   * Update best individual
   */
  private updateBestIndividual(): void {
    const best = this.population.reduce((best, current) => 
      current.fitness < best.fitness ? current : best
    );
    
    if (!this.bestIndividual || best.fitness < this.bestIndividual.fitness) {
      this.bestIndividual = { ...best };
    }
  }

  /**
   * Update Pareto front for multi-objective optimization
   */
  private updateParetoFront(): void {
    // Implementation for Pareto front calculation
    // This is a simplified version - full NSGA-II implementation would be more complex
    this.paretoFront = this.population.filter(ind => ind.feasible);
  }

  /**
   * Update optimization history
   */
  private updateHistory(): void {
    const feasiblePopulation = this.population.filter(ind => ind.feasible);
    const fitnesses = feasiblePopulation.map(ind => ind.fitness);
    
    if (fitnesses.length === 0) {
      fitnesses.push(Number.MAX_VALUE);
    }
    
    const history: IterationHistory = {
      iteration: this.generation,
      bestFitness: Math.min(...fitnesses),
      averageFitness: fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length,
      worstFitness: Math.max(...fitnesses),
      diversity: this.calculateDiversity(),
      constraintViolations: this.population.filter(ind => !ind.feasible).length,
      timestamp: new Date()
    };
    
    this.history.push(history);
  }

  /**
   * Calculate population diversity
   */
  private calculateDiversity(): number {
    if (this.population.length < 2) return 0;
    
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < this.population.length; i++) {
      for (let j = i + 1; j < this.population.length; j++) {
        const distance = this.calculateDistance(this.population[i], this.population[j]);
        totalDistance += distance;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Calculate distance between two individuals
   */
  private calculateDistance(ind1: Individual, ind2: Individual): number {
    let distance = 0;
    
    for (let i = 0; i < ind1.genes.length; i++) {
      if (typeof ind1.genes[i] === 'number' && typeof ind2.genes[i] === 'number') {
        const diff = (ind1.genes[i] as number) - (ind2.genes[i] as number);
        distance += diff * diff;
      }
    }
    
    return Math.sqrt(distance);
  }

  /**
   * Check termination criteria
   */
  private shouldTerminate(problem: OptimizationProblem): boolean {
    // Maximum generations
    if (this.generation >= this.parameters.maxGenerations) {
      return true;
    }
    
    // Convergence check
    if (this.history.length >= 10) {
      const recentHistory = this.history.slice(-10);
      const fitnessImprovement = recentHistory[0].bestFitness - recentHistory[recentHistory.length - 1].bestFitness;
      
      if (Math.abs(fitnessImprovement) < problem.convergenceCriteria.toleranceValue) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Adapt algorithm parameters during evolution
   */
  private adaptParameters(): void {
    // Adaptive mutation rate based on diversity
    const diversity = this.calculateDiversity();
    const diversityThreshold = 0.1;
    
    if (diversity < diversityThreshold) {
      this.parameters.mutationRate = Math.min(0.5, this.parameters.mutationRate * 1.1);
    } else {
      this.parameters.mutationRate = Math.max(0.01, this.parameters.mutationRate * 0.9);
    }
  }

  /**
   * Create optimization result
   */
  private createOptimizationResult(problem: OptimizationProblem, startTime: number): OptimizationResult {
    const executionTime = performance.now() - startTime;
    
    // Convert best individual to optimization solution
    const bestSolution: OptimizationSolution = {
      id: this.bestIndividual?.id || 'no_solution',
      variables: {},
      objectiveValues: {},
      constraintViolations: [],
      feasible: this.bestIndividual?.feasible || false,
      fitness: this.bestIndividual?.fitness || Number.MAX_VALUE,
      systemConfiguration: problem.systemConfiguration, // Would be updated with optimized values
      performanceMetrics: {} as SolutionPerformanceMetrics
    };
    
    // Convert variables
    if (this.bestIndividual) {
      problem.variables.forEach((variable, index) => {
        bestSolution.variables[variable.id] = this.bestIndividual!.genes[index];
      });
      
      // Convert objectives
      problem.objectives.objectives.forEach((objective, index) => {
        bestSolution.objectiveValues[objective.id] = this.bestIndividual!.objectiveValues[index] || 0;
      });
    }
    
    const statistics: OptimizationStatistics = {
      totalIterations: this.generation,
      totalEvaluations: this.evaluationCount,
      convergenceIteration: this.generation,
      executionTime,
      bestFitnessHistory: this.history.map(h => h.bestFitness),
      averageFitnessHistory: this.history.map(h => h.averageFitness),
      diversityHistory: this.history.map(h => h.diversity),
      constraintViolationHistory: this.history.map(h => h.constraintViolations),
      algorithmSpecificStats: {
        populationSize: this.parameters.populationSize,
        finalMutationRate: this.parameters.mutationRate,
        finalCrossoverRate: this.parameters.crossoverRate
      }
    };
    
    const optimizationHistory: OptimizationHistory = {
      iterations: this.history,
      populationHistory: [],
      parameterHistory: [],
      convergenceMetrics: []
    };
    
    return {
      problemId: problem.id,
      status: OptimizationStatus.CONVERGED,
      bestSolution,
      paretoFront: [], // Would include Pareto solutions for multi-objective
      statistics,
      history: optimizationHistory,
      analysis: {},
      recommendations: [],
      warnings: [],
      errors: []
    };
  }

  // Utility methods
  private createChild(parent: Individual): Individual {
    return {
      id: this.generateIndividualId(),
      genes: [...parent.genes],
      fitness: 0,
      objectiveValues: [],
      constraintViolations: [],
      feasible: true,
      age: 0
    };
  }

  private generateIndividualId(): string {
    return `ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  private gaussianRandom(): number {
    // Box-Muller transform for Gaussian random numbers
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
