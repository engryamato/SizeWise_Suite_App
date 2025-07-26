/**
 * Gradient Descent Algorithm Implementation for System Optimization
 * 
 * Implements gradient descent optimization with:
 * - Multiple variants (standard, momentum, Adam, RMSprop)
 * - Numerical gradient computation with finite differences
 * - Adaptive learning rate and step size control
 * - Line search optimization
 * - Constraint handling with projected gradients
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
  ConstraintFunctionType
} from '../types/SystemOptimizationTypes';

export interface GradientDescentParameters {
  maxIterations: number;
  learningRate: number;
  learningRateMin: number;
  learningRateMax: number;
  variant: 'standard' | 'momentum' | 'adam' | 'rmsprop' | 'adagrad';
  momentumCoefficient: number;
  adamBeta1: number;
  adamBeta2: number;
  adamEpsilon: number;
  rmspropDecayRate: number;
  rmspropEpsilon: number;
  gradientMethod: 'forward' | 'backward' | 'central';
  finiteDifferenceStep: number;
  adaptiveLearningRate: boolean;
  lineSearch: boolean;
  lineSearchMethod: 'armijo' | 'wolfe' | 'golden_section';
  constraintHandling: 'penalty' | 'projection' | 'barrier';
  penaltyCoefficient: number;
  convergenceTolerance: number;
  gradientTolerance: number;
  seedValue?: number;
}

export interface GradientState {
  solution: OptimizationSolution;
  gradient: number[];
  momentum: number[];
  adamM: number[];
  adamV: number[];
  rmspropV: number[];
  adagradG: number[];
  iteration: number;
  learningRate: number;
  gradientNorm: number;
  stepSize: number;
  functionValue: number;
}

/**
 * Gradient Descent optimizer for continuous optimization problems
 */
export class GradientDescent {
  private parameters: GradientDescentParameters;
  private currentState: GradientState | null = null;
  private bestSolution: OptimizationSolution | null = null;
  private history: IterationHistory[] = [];
  private random: () => number;
  private evaluationCount: number = 0;

  constructor(parameters?: Partial<GradientDescentParameters>) {
    this.parameters = {
      maxIterations: 1000,
      learningRate: 0.01,
      learningRateMin: 1e-6,
      learningRateMax: 1.0,
      variant: 'adam',
      momentumCoefficient: 0.9,
      adamBeta1: 0.9,
      adamBeta2: 0.999,
      adamEpsilon: 1e-8,
      rmspropDecayRate: 0.9,
      rmspropEpsilon: 1e-8,
      gradientMethod: 'central',
      finiteDifferenceStep: 1e-6,
      adaptiveLearningRate: true,
      lineSearch: true,
      lineSearchMethod: 'armijo',
      constraintHandling: 'projection',
      penaltyCoefficient: 1000,
      convergenceTolerance: 1e-6,
      gradientTolerance: 1e-6,
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
      // Validate problem for gradient descent
      this.validateProblem(problem);
      
      // Initialize algorithm
      this.initializeAlgorithm(problem);
      
      // Create initial solution
      await this.createInitialSolution(problem, objectiveFunction, constraintFunctions);
      
      // Main optimization loop
      while (!this.shouldTerminate()) {
        await this.performIteration(problem, objectiveFunction, constraintFunctions);
        this.updateHistory();
        
        if (this.parameters.adaptiveLearningRate) {
          this.adaptLearningRate();
        }
      }
      
      // Create final result
      return this.createOptimizationResult(problem, startTime);
      
    } catch (error) {
      console.error('Gradient descent optimization failed:', error);
      throw error;
    }
  }

  /**
   * Validate problem for gradient descent
   */
  private validateProblem(problem: OptimizationProblem): void {
    // Check for continuous variables only
    const hasDiscreteVariables = problem.variables.some(v => v.discreteValues && v.discreteValues.length > 0);
    if (hasDiscreteVariables) {
      console.warn('Gradient descent works best with continuous variables. Discrete variables will be treated as continuous.');
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
    
    console.log(`Initializing Gradient Descent (${this.parameters.variant}) with learning rate: ${this.parameters.learningRate}`);
  }

  /**
   * Create initial solution
   */
  private async createInitialSolution(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    // Generate initial solution
    const initialSolution = this.createRandomSolution(problem);
    await this.evaluateSolution(initialSolution, problem, objectiveFunction, constraintFunctions);
    
    // Initialize gradient state
    const numVariables = problem.variables.length;
    this.currentState = {
      solution: initialSolution,
      gradient: new Array(numVariables).fill(0),
      momentum: new Array(numVariables).fill(0),
      adamM: new Array(numVariables).fill(0),
      adamV: new Array(numVariables).fill(0),
      rmspropV: new Array(numVariables).fill(0),
      adagradG: new Array(numVariables).fill(0),
      iteration: 0,
      learningRate: this.parameters.learningRate,
      gradientNorm: 0,
      stepSize: 0,
      functionValue: initialSolution.fitness
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
        // Discrete variable - select random value
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
      for (let i = 0; i < constraintFunctions.length; i++) {
        const violation = constraintFunctions[i](variables);
        solution.constraintViolations.push({
          constraintId: `constraint_${i}`,
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
   * Perform one iteration of gradient descent
   */
  private async performIteration(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    // Compute gradient
    await this.computeGradient(problem, objectiveFunction, constraintFunctions);
    
    // Update solution based on variant
    await this.updateSolution(problem, objectiveFunction, constraintFunctions);
    
    // Apply constraints if using projection
    if (this.parameters.constraintHandling === 'projection') {
      this.projectSolution(problem);
    }
    
    // Update best solution
    if (this.currentState.solution.fitness < this.bestSolution!.fitness) {
      this.bestSolution = { ...this.currentState.solution };
    }
    
    this.currentState.iteration++;
  }

  /**
   * Compute numerical gradient
   */
  private async computeGradient(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    const currentVariables = this.solutionToVariables(this.currentState.solution, problem.variables);
    const h = this.parameters.finiteDifferenceStep;
    
    for (let i = 0; i < problem.variables.length; i++) {
      const variable = problem.variables[i];
      
      // Skip discrete variables
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        this.currentState.gradient[i] = 0;
        continue;
      }
      
      const originalValue = currentVariables[i].currentValue as number;
      
      let gradient = 0;
      
      switch (this.parameters.gradientMethod) {
        case 'forward':
          // f'(x) ≈ (f(x+h) - f(x)) / h
          currentVariables[i].currentValue = originalValue + h;
          const forwardValue = objectiveFunction(currentVariables);
          gradient = (forwardValue - this.currentState.functionValue) / h;
          break;
          
        case 'backward':
          // f'(x) ≈ (f(x) - f(x-h)) / h
          currentVariables[i].currentValue = originalValue - h;
          const backwardValue = objectiveFunction(currentVariables);
          gradient = (this.currentState.functionValue - backwardValue) / h;
          break;
          
        case 'central':
          // f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
          currentVariables[i].currentValue = originalValue + h;
          const forwardVal = objectiveFunction(currentVariables);
          currentVariables[i].currentValue = originalValue - h;
          const backwardVal = objectiveFunction(currentVariables);
          gradient = (forwardVal - backwardVal) / (2 * h);
          break;
      }
      
      // Restore original value
      currentVariables[i].currentValue = originalValue;
      
      this.currentState.gradient[i] = gradient;
      this.evaluationCount += this.parameters.gradientMethod === 'central' ? 2 : 1;
    }
    
    // Compute gradient norm
    this.currentState.gradientNorm = Math.sqrt(
      this.currentState.gradient.reduce((sum, g) => sum + g * g, 0)
    );
  }

  /**
   * Update solution based on gradient descent variant
   */
  private async updateSolution(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.currentState) return;
    
    const stepDirection = this.computeStepDirection();
    
    // Determine step size
    let stepSize = this.currentState.learningRate;
    if (this.parameters.lineSearch) {
      stepSize = await this.performLineSearch(problem, objectiveFunction, constraintFunctions, stepDirection);
    }
    
    // Update solution
    const newVariables: { [variableId: string]: number | string } = {};
    
    for (let i = 0; i < problem.variables.length; i++) {
      const variable = problem.variables[i];
      const currentValue = this.currentState.solution.variables[variable.id];
      
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        // Keep discrete variables unchanged
        newVariables[variable.id] = currentValue;
      } else if (typeof currentValue === 'number') {
        // Update continuous variables
        const newValue = currentValue - stepSize * stepDirection[i];
        
        // Apply bounds
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : -Infinity;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : Infinity;
        newVariables[variable.id] = Math.max(min, Math.min(max, newValue));
      } else {
        newVariables[variable.id] = currentValue;
      }
    }
    
    // Create new solution
    const newSolution: OptimizationSolution = {
      ...this.currentState.solution,
      id: this.generateSolutionId(),
      variables: newVariables
    };
    
    // Evaluate new solution
    await this.evaluateSolution(newSolution, problem, objectiveFunction, constraintFunctions);
    
    // Update state
    this.currentState.solution = newSolution;
    this.currentState.stepSize = stepSize;
    this.currentState.functionValue = newSolution.fitness;
  }

  /**
   * Compute step direction based on variant
   */
  private computeStepDirection(): number[] {
    if (!this.currentState) return [];
    
    const gradient = this.currentState.gradient;
    const stepDirection = new Array(gradient.length);
    
    switch (this.parameters.variant) {
      case 'standard':
        // Standard gradient descent: d = -∇f
        for (let i = 0; i < gradient.length; i++) {
          stepDirection[i] = gradient[i];
        }
        break;
        
      case 'momentum':
        // Momentum: v = β*v + ∇f, d = v
        for (let i = 0; i < gradient.length; i++) {
          this.currentState.momentum[i] = this.parameters.momentumCoefficient * this.currentState.momentum[i] + gradient[i];
          stepDirection[i] = this.currentState.momentum[i];
        }
        break;
        
      case 'adam':
        // Adam optimizer
        const beta1 = this.parameters.adamBeta1;
        const beta2 = this.parameters.adamBeta2;
        const epsilon = this.parameters.adamEpsilon;
        const t = this.currentState.iteration + 1;
        
        for (let i = 0; i < gradient.length; i++) {
          // Update biased first moment estimate
          this.currentState.adamM[i] = beta1 * this.currentState.adamM[i] + (1 - beta1) * gradient[i];
          
          // Update biased second raw moment estimate
          this.currentState.adamV[i] = beta2 * this.currentState.adamV[i] + (1 - beta2) * gradient[i] * gradient[i];
          
          // Compute bias-corrected first moment estimate
          const mHat = this.currentState.adamM[i] / (1 - Math.pow(beta1, t));
          
          // Compute bias-corrected second raw moment estimate
          const vHat = this.currentState.adamV[i] / (1 - Math.pow(beta2, t));
          
          // Update step direction
          stepDirection[i] = mHat / (Math.sqrt(vHat) + epsilon);
        }
        break;
        
      case 'rmsprop':
        // RMSprop
        const decay = this.parameters.rmspropDecayRate;
        const eps = this.parameters.rmspropEpsilon;
        
        for (let i = 0; i < gradient.length; i++) {
          this.currentState.rmspropV[i] = decay * this.currentState.rmspropV[i] + (1 - decay) * gradient[i] * gradient[i];
          stepDirection[i] = gradient[i] / (Math.sqrt(this.currentState.rmspropV[i]) + eps);
        }
        break;
        
      case 'adagrad':
        // Adagrad
        const adagradEps = this.parameters.adamEpsilon;
        
        for (let i = 0; i < gradient.length; i++) {
          this.currentState.adagradG[i] += gradient[i] * gradient[i];
          stepDirection[i] = gradient[i] / (Math.sqrt(this.currentState.adagradG[i]) + adagradEps);
        }
        break;
        
      default:
        // Default to standard gradient descent
        for (let i = 0; i < gradient.length; i++) {
          stepDirection[i] = gradient[i];
        }
    }
    
    return stepDirection;
  }

  /**
   * Perform line search to find optimal step size
   */
  private async performLineSearch(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[],
    stepDirection: number[]
  ): Promise<number> {
    if (!this.currentState) return this.parameters.learningRate;
    
    switch (this.parameters.lineSearchMethod) {
      case 'armijo':
        return this.armijoLineSearch(problem, objectiveFunction, constraintFunctions, stepDirection);
      case 'wolfe':
        return this.wolfeLineSearch(problem, objectiveFunction, constraintFunctions, stepDirection);
      case 'golden_section':
        return this.goldenSectionLineSearch(problem, objectiveFunction, constraintFunctions, stepDirection);
      default:
        return this.parameters.learningRate;
    }
  }

  /**
   * Armijo line search
   */
  private async armijoLineSearch(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[],
    stepDirection: number[]
  ): Promise<number> {
    if (!this.currentState) return this.parameters.learningRate;
    
    const c1 = 1e-4; // Armijo constant
    let alpha = this.parameters.learningRate;
    const maxBacktrack = 20;
    
    const currentValue = this.currentState.functionValue;
    const gradientDotDirection = this.currentState.gradient.reduce((sum, g, i) => sum + g * stepDirection[i], 0);
    
    for (let i = 0; i < maxBacktrack; i++) {
      // Test step
      const testVariables = this.createTestVariables(problem, stepDirection, alpha);
      const testValue = objectiveFunction(testVariables);
      this.evaluationCount++;
      
      // Armijo condition
      if (testValue <= currentValue - c1 * alpha * gradientDotDirection) {
        return alpha;
      }
      
      alpha *= 0.5; // Backtrack
    }
    
    return alpha;
  }

  /**
   * Wolfe line search (simplified)
   */
  private async wolfeLineSearch(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[],
    stepDirection: number[]
  ): Promise<number> {
    // Simplified implementation - use Armijo for now
    return this.armijoLineSearch(problem, objectiveFunction, constraintFunctions, stepDirection);
  }

  /**
   * Golden section line search
   */
  private async goldenSectionLineSearch(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[],
    stepDirection: number[]
  ): Promise<number> {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const resphi = 2 - phi;
    
    let a = 0;
    let b = this.parameters.learningRate * 2;
    const tol = 1e-6;
    
    // Find initial bracket
    let x1 = a + resphi * (b - a);
    let x2 = a + (1 - resphi) * (b - a);
    
    let f1 = this.evaluateAtStep(problem, objectiveFunction, stepDirection, x1);
    let f2 = this.evaluateAtStep(problem, objectiveFunction, stepDirection, x2);
    
    while (Math.abs(b - a) > tol) {
      if (f1 < f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = a + resphi * (b - a);
        f1 = this.evaluateAtStep(problem, objectiveFunction, stepDirection, x1);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = a + (1 - resphi) * (b - a);
        f2 = this.evaluateAtStep(problem, objectiveFunction, stepDirection, x2);
      }
    }
    
    return (a + b) / 2;
  }

  /**
   * Create test variables for line search
   */
  private createTestVariables(problem: OptimizationProblem, stepDirection: number[], alpha: number): OptimizationVariable[] {
    if (!this.currentState) return [];
    
    return problem.variables.map((variable, i) => {
      const currentValue = this.currentState!.solution.variables[variable.id];
      
      if (typeof currentValue === 'number') {
        const newValue = currentValue - alpha * stepDirection[i];
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : -Infinity;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : Infinity;
        
        return {
          ...variable,
          currentValue: Math.max(min, Math.min(max, newValue))
        };
      } else {
        return {
          ...variable,
          currentValue
        };
      }
    });
  }

  /**
   * Evaluate function at specific step size
   */
  private evaluateAtStep(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    stepDirection: number[],
    alpha: number
  ): number {
    const testVariables = this.createTestVariables(problem, stepDirection, alpha);
    this.evaluationCount++;
    return objectiveFunction(testVariables);
  }

  /**
   * Project solution onto feasible region
   */
  private projectSolution(problem: OptimizationProblem): void {
    if (!this.currentState) return;
    
    // Simple box constraint projection
    const projectedVariables: { [variableId: string]: number | string } = {};
    
    for (const variable of problem.variables) {
      const currentValue = this.currentState.solution.variables[variable.id];
      
      if (typeof currentValue === 'number') {
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : -Infinity;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : Infinity;
        projectedVariables[variable.id] = Math.max(min, Math.min(max, currentValue));
      } else {
        projectedVariables[variable.id] = currentValue;
      }
    }
    
    this.currentState.solution.variables = projectedVariables;
  }

  /**
   * Adapt learning rate based on progress
   */
  private adaptLearningRate(): void {
    if (!this.currentState) return;
    
    // Simple adaptive scheme based on gradient norm
    if (this.currentState.gradientNorm > 1.0) {
      // Large gradient - decrease learning rate
      this.currentState.learningRate = Math.max(
        this.parameters.learningRateMin,
        this.currentState.learningRate * 0.9
      );
    } else if (this.currentState.gradientNorm < 0.1) {
      // Small gradient - increase learning rate
      this.currentState.learningRate = Math.min(
        this.parameters.learningRateMax,
        this.currentState.learningRate * 1.1
      );
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
    
    // Gradient tolerance
    if (this.currentState.gradientNorm < this.parameters.gradientTolerance) {
      return true;
    }
    
    // Function value convergence
    if (this.history.length >= 10) {
      const recentHistory = this.history.slice(-10);
      const functionImprovement = recentHistory[0].bestFitness - recentHistory[recentHistory.length - 1].bestFitness;
      
      if (Math.abs(functionImprovement) < this.parameters.convergenceTolerance) {
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
    
    const history: IterationHistory = {
      iteration: this.currentState.iteration,
      bestFitness: this.bestSolution?.fitness || this.currentState.functionValue,
      averageFitness: this.currentState.functionValue,
      worstFitness: this.currentState.functionValue,
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
        variant: this.parameters.variant,
        finalLearningRate: this.currentState?.learningRate || 0,
        finalGradientNorm: this.currentState?.gradientNorm || 0,
        finalStepSize: this.currentState?.stepSize || 0
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
    return `gd_sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
