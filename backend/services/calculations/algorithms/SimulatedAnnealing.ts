/**
 * Simulated Annealing Algorithm Implementation for System Optimization
 * 
 * Implements simulated annealing optimization with:
 * - Configurable cooling schedules (linear, exponential, logarithmic, adaptive)
 * - Multiple neighborhood generation strategies
 * - Constraint handling with penalty methods
 * - Adaptive parameter adjustment
 * - Restart mechanisms for global optimization
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
  SolutionPerformanceMetrics,
  ObjectiveFunctionType,
  ConstraintFunctionType,
  CoolingSchedule
} from '../types/SystemOptimizationTypes';

export interface SimulatedAnnealingParameters {
  initialTemperature: number;
  finalTemperature: number;
  maxIterations: number;
  coolingSchedule: CoolingSchedule;
  neighborhoodSize: number;
  neighborhoodMethod: 'gaussian' | 'uniform' | 'adaptive' | 'cauchy';
  acceptanceCriterion: 'metropolis' | 'boltzmann' | 'fast_annealing';
  constraintHandling: 'penalty' | 'repair' | 'rejection';
  penaltyCoefficient: number;
  restartEnabled: boolean;
  maxRestarts: number;
  restartTemperature: number;
  adaptiveNeighborhood: boolean;
  seedValue?: number;
}

export interface SAState {
  solution: OptimizationSolution;
  temperature: number;
  iteration: number;
  acceptedMoves: number;
  rejectedMoves: number;
  improvingMoves: number;
  worseningMoves: number;
  restartCount: number;
}

/**
 * Simulated Annealing optimizer for single-objective optimization problems
 */
export class SimulatedAnnealing {
  private parameters: SimulatedAnnealingParameters;
  private currentState: SAState | null = null;
  private bestSolution: OptimizationSolution | null = null;
  private history: IterationHistory[] = [];
  private random: () => number;
  private evaluationCount: number = 0;

  constructor(parameters?: Partial<SimulatedAnnealingParameters>) {
    this.parameters = {
      initialTemperature: 1000,
      finalTemperature: 0.01,
      maxIterations: 1000,
      coolingSchedule: {
        initialTemperature: 1000,
        finalTemperature: 0.01,
        coolingRate: 0.95,
        method: 'exponential'
      },
      neighborhoodSize: 0.1,
      neighborhoodMethod: 'gaussian',
      acceptanceCriterion: 'metropolis',
      constraintHandling: 'penalty',
      penaltyCoefficient: 1000,
      restartEnabled: true,
      maxRestarts: 3,
      restartTemperature: 100,
      adaptiveNeighborhood: true,
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
      
      // Create initial solution
      await this.createInitialSolution(problem, objectiveFunction, constraintFunctions);
      
      // Main annealing loop
      while (!this.shouldTerminate()) {
        await this.performIteration(problem, objectiveFunction, constraintFunctions);
        this.updateHistory();
        
        if (this.parameters.adaptiveNeighborhood) {
          this.adaptNeighborhoodSize();
        }
      }
      
      // Check for restart
      if (this.shouldRestart()) {
        await this.restart(problem, objectiveFunction, constraintFunctions);
      }
      
      // Create final result
      return this.createOptimizationResult(problem, startTime);
      
    } catch (error) {
      console.error('Simulated annealing optimization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize algorithm state
   */
  private initializeAlgorithm(problem: OptimizationProblem): void {
    this.currentState = null;
    this.bestSolution = null;
    this.history = [];
    this.evaluationCount = 0;
    
    console.log(`Initializing Simulated Annealing with initial temperature: ${this.parameters.initialTemperature}`);
  }

  /**
   * Create initial solution
   */
  private async createInitialSolution(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    // Generate random initial solution
    const initialSolution = this.createRandomSolution(problem);
    await this.evaluateSolution(initialSolution, problem, objectiveFunction, constraintFunctions);
    
    // Initialize state
    this.currentState = {
      solution: initialSolution,
      temperature: this.parameters.initialTemperature,
      iteration: 0,
      acceptedMoves: 0,
      rejectedMoves: 0,
      improvingMoves: 0,
      worseningMoves: 0,
      restartCount: 0
    };
    
    this.bestSolution = { ...initialSolution };
  }

  /**
   * Create a random solution
   */
  private createRandomSolution(problem: OptimizationProblem): OptimizationSolution {
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
      id: this.generateSolutionId(),
      variables,
      objectiveValues: {},
      constraintViolations: [],
      feasible: true,
      fitness: 0,
      systemConfiguration: problem.systemConfiguration,
      performanceMetrics: {} as SolutionPerformanceMetrics
    };
  }

  /**
   * Evaluate solution fitness and constraints
   */
  private async evaluateSolution(
    solution: OptimizationSolution,
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    try {
      // Convert solution to optimization variables
      const variables = this.solutionToVariables(solution, problem.variables);
      
      // Evaluate objective function
      const objectiveValue = objectiveFunction(variables);
      solution.fitness = objectiveValue;
      
      // Store objective values
      if (problem.objectives.objectives.length > 0) {
        solution.objectiveValues[problem.objectives.objectives[0].id] = objectiveValue;
      }
      
      // Evaluate constraints
      solution.constraintViolations = [];
      for (const constraintFunction of constraintFunctions) {
        const violation = constraintFunction(variables);
        solution.constraintViolations.push({
          constraintId: `constraint_${solution.constraintViolations.length}`,
          violationType: violation > 0 ? 'inequality' : 'boundary',
          currentValue: violation,
          requiredValue: 0,
          severity: violation > 0 ? 'major' : 'minor',
          penalty: violation > 0 ? violation * this.parameters.penaltyCoefficient : 0
        });
      }
      
      // Check feasibility
      solution.feasible = solution.constraintViolations.every(v => v.currentValue <= 0);
      
      // Apply constraint handling
      if (!solution.feasible && this.parameters.constraintHandling === 'penalty') {
        const totalPenalty = solution.constraintViolations
          .filter(v => v.currentValue > 0)
          .reduce((sum, v) => sum + v.penalty, 0);
        solution.fitness += totalPenalty;
      }
      
      this.evaluationCount++;
      
    } catch (error) {
      console.error('Error evaluating solution:', error);
      solution.fitness = Number.MAX_VALUE;
      solution.feasible = false;
    }
  }

  /**
   * Convert solution to optimization variables
   */
  private solutionToVariables(solution: OptimizationSolution, variableTemplates: OptimizationVariable[]): OptimizationVariable[] {
    return variableTemplates.map(template => ({
      ...template,
      currentValue: solution.variables[template.id]
    }));
  }

  /**
   * Perform one iteration of simulated annealing
   */
  private async performIteration(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    // Generate neighbor solution
    const neighborSolution = this.generateNeighbor(this.currentState.solution, problem);
    await this.evaluateSolution(neighborSolution, problem, objectiveFunction, constraintFunctions);
    
    // Calculate acceptance probability
    const deltaE = neighborSolution.fitness - this.currentState.solution.fitness;
    const acceptanceProbability = this.calculateAcceptanceProbability(deltaE, this.currentState.temperature);
    
    // Accept or reject the neighbor
    if (this.random() < acceptanceProbability) {
      // Accept the neighbor
      this.currentState.solution = neighborSolution;
      this.currentState.acceptedMoves++;
      
      if (deltaE < 0) {
        this.currentState.improvingMoves++;
        
        // Update best solution
        if (neighborSolution.fitness < this.bestSolution!.fitness) {
          this.bestSolution = { ...neighborSolution };
        }
      } else {
        this.currentState.worseningMoves++;
      }
    } else {
      // Reject the neighbor
      this.currentState.rejectedMoves++;
    }
    
    // Update temperature
    this.currentState.temperature = this.updateTemperature(this.currentState.temperature, this.currentState.iteration);
    this.currentState.iteration++;
  }

  /**
   * Generate neighbor solution
   */
  private generateNeighbor(currentSolution: OptimizationSolution, problem: OptimizationProblem): OptimizationSolution {
    const neighbor: OptimizationSolution = {
      ...currentSolution,
      id: this.generateSolutionId(),
      variables: { ...currentSolution.variables }
    };
    
    // Select random variable to modify
    const variableIds = Object.keys(neighbor.variables);
    const randomVariableId = variableIds[Math.floor(this.random() * variableIds.length)];
    const variable = problem.variables.find(v => v.id === randomVariableId);
    
    if (!variable) return neighbor;
    
    // Generate neighbor value based on neighborhood method
    neighbor.variables[randomVariableId] = this.generateNeighborValue(
      neighbor.variables[randomVariableId],
      variable
    );
    
    return neighbor;
  }

  /**
   * Generate neighbor value for a variable
   */
  private generateNeighborValue(currentValue: number | string, variable: OptimizationVariable): number | string {
    if (variable.discreteValues && variable.discreteValues.length > 0) {
      // Discrete variable - random selection from neighborhood
      const currentIndex = variable.discreteValues.indexOf(currentValue);
      const neighborhoodSize = Math.max(1, Math.floor(variable.discreteValues.length * this.parameters.neighborhoodSize));
      
      const minIndex = Math.max(0, currentIndex - neighborhoodSize);
      const maxIndex = Math.min(variable.discreteValues.length - 1, currentIndex + neighborhoodSize);
      
      const randomIndex = minIndex + Math.floor(this.random() * (maxIndex - minIndex + 1));
      return variable.discreteValues[randomIndex];
    } else if (typeof currentValue === 'number') {
      // Continuous variable
      const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
      const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
      const range = max - min;
      
      let neighborValue: number;
      
      switch (this.parameters.neighborhoodMethod) {
        case 'gaussian':
          const sigma = range * this.parameters.neighborhoodSize;
          neighborValue = currentValue + this.gaussianRandom() * sigma;
          break;
        case 'uniform':
          const delta = range * this.parameters.neighborhoodSize;
          neighborValue = currentValue + (this.random() - 0.5) * 2 * delta;
          break;
        case 'cauchy':
          const gamma = range * this.parameters.neighborhoodSize;
          neighborValue = currentValue + this.cauchyRandom() * gamma;
          break;
        default:
          neighborValue = currentValue + (this.random() - 0.5) * range * this.parameters.neighborhoodSize;
      }
      
      return Math.max(min, Math.min(max, neighborValue));
    }
    
    return currentValue;
  }

  /**
   * Calculate acceptance probability
   */
  private calculateAcceptanceProbability(deltaE: number, temperature: number): number {
    if (deltaE <= 0) {
      return 1.0; // Always accept improving solutions
    }
    
    switch (this.parameters.acceptanceCriterion) {
      case 'metropolis':
        return Math.exp(-deltaE / temperature);
      case 'boltzmann':
        return 1.0 / (1.0 + Math.exp(deltaE / temperature));
      case 'fast_annealing':
        return Math.exp(-deltaE / (temperature * Math.log(this.currentState!.iteration + 2)));
      default:
        return Math.exp(-deltaE / temperature);
    }
  }

  /**
   * Update temperature according to cooling schedule
   */
  private updateTemperature(currentTemperature: number, iteration: number): number {
    const schedule = this.parameters.coolingSchedule;
    
    switch (schedule.method) {
      case 'linear':
        const linearRate = (schedule.initialTemperature - schedule.finalTemperature) / this.parameters.maxIterations;
        return Math.max(schedule.finalTemperature, schedule.initialTemperature - iteration * linearRate);
        
      case 'exponential':
        return Math.max(schedule.finalTemperature, currentTemperature * schedule.coolingRate);
        
      case 'logarithmic':
        return Math.max(schedule.finalTemperature, schedule.initialTemperature / Math.log(iteration + 2));
        
      case 'adaptive':
        // Adaptive cooling based on acceptance rate
        const acceptanceRate = this.currentState!.acceptedMoves / (this.currentState!.acceptedMoves + this.currentState!.rejectedMoves + 1);
        const targetAcceptanceRate = 0.4;
        const adaptationFactor = acceptanceRate > targetAcceptanceRate ? 0.99 : 0.95;
        return Math.max(schedule.finalTemperature, currentTemperature * adaptationFactor);
        
      default:
        return Math.max(schedule.finalTemperature, currentTemperature * schedule.coolingRate);
    }
  }

  /**
   * Check termination criteria
   */
  private shouldTerminate(): boolean {
    if (!this.currentState) return true;
    
    // Maximum iterations
    if (this.currentState.iteration >= this.parameters.maxIterations) {
      return true;
    }
    
    // Temperature threshold
    if (this.currentState.temperature <= this.parameters.finalTemperature) {
      return true;
    }
    
    // Convergence check (no improvement in recent iterations)
    if (this.history.length >= 50) {
      const recentHistory = this.history.slice(-50);
      const bestRecent = Math.min(...recentHistory.map(h => h.bestFitness));
      const improvement = this.bestSolution!.fitness - bestRecent;
      
      if (Math.abs(improvement) < 1e-6) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if restart should be performed
   */
  private shouldRestart(): boolean {
    if (!this.parameters.restartEnabled) return false;
    if (!this.currentState) return false;
    if (this.currentState.restartCount >= this.parameters.maxRestarts) return false;
    
    // Restart if stuck in local minimum
    const recentIterations = 100;
    if (this.history.length >= recentIterations) {
      const recentHistory = this.history.slice(-recentIterations);
      const fitnessVariance = this.calculateVariance(recentHistory.map(h => h.bestFitness));
      
      if (fitnessVariance < 1e-6) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Restart the algorithm from a new random solution
   */
  private async restart(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    console.log(`Restarting simulated annealing (restart ${this.currentState!.restartCount + 1})`);
    
    // Create new random solution
    const newSolution = this.createRandomSolution(problem);
    await this.evaluateSolution(newSolution, problem, objectiveFunction, constraintFunctions);
    
    // Reset state with restart temperature
    this.currentState!.solution = newSolution;
    this.currentState!.temperature = this.parameters.restartTemperature;
    this.currentState!.iteration = 0;
    this.currentState!.acceptedMoves = 0;
    this.currentState!.rejectedMoves = 0;
    this.currentState!.improvingMoves = 0;
    this.currentState!.worseningMoves = 0;
    this.currentState!.restartCount++;
    
    // Continue optimization
    while (!this.shouldTerminate()) {
      await this.performIteration(problem, objectiveFunction, constraintFunctions);
      this.updateHistory();
    }
  }

  /**
   * Adapt neighborhood size based on acceptance rate
   */
  private adaptNeighborhoodSize(): void {
    if (!this.currentState) return;
    
    const totalMoves = this.currentState.acceptedMoves + this.currentState.rejectedMoves;
    if (totalMoves < 10) return;
    
    const acceptanceRate = this.currentState.acceptedMoves / totalMoves;
    const targetAcceptanceRate = 0.4;
    
    if (acceptanceRate > targetAcceptanceRate + 0.1) {
      // Too many acceptances - increase neighborhood size
      this.parameters.neighborhoodSize = Math.min(0.5, this.parameters.neighborhoodSize * 1.1);
    } else if (acceptanceRate < targetAcceptanceRate - 0.1) {
      // Too few acceptances - decrease neighborhood size
      this.parameters.neighborhoodSize = Math.max(0.01, this.parameters.neighborhoodSize * 0.9);
    }
  }

  /**
   * Update optimization history
   */
  private updateHistory(): void {
    if (!this.currentState || !this.bestSolution) return;
    
    const history: IterationHistory = {
      iteration: this.currentState.iteration,
      bestFitness: this.bestSolution.fitness,
      averageFitness: this.currentState.solution.fitness,
      worstFitness: this.currentState.solution.fitness,
      diversity: 0, // Not applicable for single solution
      constraintViolations: this.currentState.solution.feasible ? 0 : 1,
      timestamp: new Date()
    };
    
    this.history.push(history);
  }

  /**
   * Create optimization result
   */
  private createOptimizationResult(problem: OptimizationProblem, startTime: number): OptimizationResult {
    const executionTime = performance.now() - startTime;
    
    const statistics: OptimizationStatistics = {
      totalIterations: this.currentState?.iteration || 0,
      totalEvaluations: this.evaluationCount,
      convergenceIteration: this.currentState?.iteration || 0,
      executionTime,
      bestFitnessHistory: this.history.map(h => h.bestFitness),
      averageFitnessHistory: this.history.map(h => h.averageFitness),
      diversityHistory: this.history.map(h => h.diversity),
      constraintViolationHistory: this.history.map(h => h.constraintViolations),
      algorithmSpecificStats: {
        finalTemperature: this.currentState?.temperature || 0,
        acceptedMoves: this.currentState?.acceptedMoves || 0,
        rejectedMoves: this.currentState?.rejectedMoves || 0,
        improvingMoves: this.currentState?.improvingMoves || 0,
        worseningMoves: this.currentState?.worseningMoves || 0,
        restartCount: this.currentState?.restartCount || 0,
        finalNeighborhoodSize: this.parameters.neighborhoodSize
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
      bestSolution: this.bestSolution!,
      statistics,
      history: optimizationHistory,
      analysis: {},
      recommendations: [],
      warnings: [],
      errors: []
    };
  }

  // Utility methods
  private generateSolutionId(): string {
    return `sa_sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  private gaussianRandom(): number {
    // Box-Muller transform
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private cauchyRandom(): number {
    // Cauchy distribution using inverse transform
    const u = this.random();
    return Math.tan(Math.PI * (u - 0.5));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
