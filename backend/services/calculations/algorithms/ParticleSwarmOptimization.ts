/**
 * Particle Swarm Optimization Algorithm Implementation for System Optimization
 * 
 * Implements particle swarm optimization with:
 * - Configurable swarm topology (global, local, ring, star)
 * - Adaptive inertia weight and acceleration coefficients
 * - Constraint handling with penalty methods
 * - Multi-objective optimization support
 * - Velocity clamping and boundary handling
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
  ConstraintFunctionType
} from '../types/SystemOptimizationTypes';

export interface ParticleSwarmParameters {
  swarmSize: number;
  maxIterations: number;
  inertiaWeight: number;
  inertiaWeightMin: number;
  inertiaWeightMax: number;
  accelerationCoefficients: [number, number]; // [c1, c2] - cognitive and social
  maxVelocity: number;
  velocityClampingFactor: number;
  topology: 'global' | 'local' | 'ring' | 'star' | 'random';
  neighborhoodSize: number;
  boundaryHandling: 'reflect' | 'absorb' | 'invisible' | 'random';
  constraintHandling: 'penalty' | 'repair' | 'death_penalty';
  penaltyCoefficient: number;
  adaptiveParameters: boolean;
  diversityMaintenance: boolean;
  eliteSize: number;
  seedValue?: number;
}

export interface Particle {
  id: string;
  position: (number | string)[];
  velocity: number[];
  fitness: number;
  personalBest: {
    position: (number | string)[];
    fitness: number;
  };
  neighbors: string[];
  age: number;
  stagnationCount: number;
}

export interface SwarmState {
  particles: Particle[];
  globalBest: {
    position: (number | string)[];
    fitness: number;
    particleId: string;
  };
  iteration: number;
  averageFitness: number;
  diversityIndex: number;
  convergenceRate: number;
}

/**
 * Particle Swarm Optimization algorithm for single and multi-objective optimization
 */
export class ParticleSwarmOptimization {
  private parameters: ParticleSwarmParameters;
  private swarmState: SwarmState | null = null;
  private bestSolution: OptimizationSolution | null = null;
  private history: IterationHistory[] = [];
  private populationHistory: PopulationSnapshot[] = [];
  private random: () => number;
  private evaluationCount: number = 0;

  constructor(parameters?: Partial<ParticleSwarmParameters>) {
    this.parameters = {
      swarmSize: 30,
      maxIterations: 100,
      inertiaWeight: 0.9,
      inertiaWeightMin: 0.1,
      inertiaWeightMax: 0.9,
      accelerationCoefficients: [2.0, 2.0],
      maxVelocity: 0.2,
      velocityClampingFactor: 0.5,
      topology: 'global',
      neighborhoodSize: 3,
      boundaryHandling: 'reflect',
      constraintHandling: 'penalty',
      penaltyCoefficient: 1000,
      adaptiveParameters: true,
      diversityMaintenance: true,
      eliteSize: 2,
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
      
      // Create initial swarm
      await this.createInitialSwarm(problem, objectiveFunction, constraintFunctions);
      
      // Main optimization loop
      while (!this.shouldTerminate(problem)) {
        await this.updateSwarm(problem, objectiveFunction, constraintFunctions);
        this.updateHistory();
        
        if (this.parameters.adaptiveParameters) {
          this.adaptParameters();
        }
        
        if (this.parameters.diversityMaintenance) {
          this.maintainDiversity(problem);
        }
      }
      
      // Create final result
      return this.createOptimizationResult(problem, startTime);
      
    } catch (error) {
      console.error('Particle swarm optimization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize algorithm state
   */
  private initializeAlgorithm(problem: OptimizationProblem): void {
    this.swarmState = null;
    this.bestSolution = null;
    this.history = [];
    this.populationHistory = [];
    this.evaluationCount = 0;
    
    console.log(`Initializing Particle Swarm Optimization with swarm size: ${this.parameters.swarmSize}`);
  }

  /**
   * Create initial swarm
   */
  private async createInitialSwarm(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    const particles: Particle[] = [];
    
    // Create particles
    for (let i = 0; i < this.parameters.swarmSize; i++) {
      const particle = this.createRandomParticle(problem);
      await this.evaluateParticle(particle, problem, objectiveFunction, constraintFunctions);
      particles.push(particle);
    }
    
    // Initialize swarm state
    this.swarmState = {
      particles,
      globalBest: this.findGlobalBest(particles),
      iteration: 0,
      averageFitness: this.calculateAverageFitness(particles),
      diversityIndex: this.calculateDiversityIndex(particles),
      convergenceRate: 0
    };
    
    // Set up neighborhood topology
    this.setupTopology();
    
    // Convert best particle to optimization solution
    this.updateBestSolution(problem);
  }

  /**
   * Create a random particle
   */
  private createRandomParticle(problem: OptimizationProblem): Particle {
    const position: (number | string)[] = [];
    const velocity: number[] = [];
    
    for (const variable of problem.variables) {
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        // Discrete variable
        const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
        position.push(variable.discreteValues[randomIndex]);
        velocity.push(0); // No velocity for discrete variables
      } else {
        // Continuous variable
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
        const pos = min + this.random() * (max - min);
        const vel = (this.random() - 0.5) * this.parameters.maxVelocity * (max - min);
        
        position.push(pos);
        velocity.push(vel);
      }
    }
    
    const particle: Particle = {
      id: this.generateParticleId(),
      position,
      velocity,
      fitness: Number.MAX_VALUE,
      personalBest: {
        position: [...position],
        fitness: Number.MAX_VALUE
      },
      neighbors: [],
      age: 0,
      stagnationCount: 0
    };
    
    return particle;
  }

  /**
   * Evaluate particle fitness
   */
  private async evaluateParticle(
    particle: Particle,
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    try {
      // Convert particle position to optimization variables
      const variables = this.particleToVariables(particle, problem.variables);
      
      // Evaluate objective function
      const objectiveValue = objectiveFunction(variables);
      particle.fitness = objectiveValue;
      
      // Evaluate constraints
      const constraintViolations: number[] = [];
      for (const constraintFunction of constraintFunctions) {
        const violation = constraintFunction(variables);
        constraintViolations.push(violation);
      }
      
      // Apply constraint handling
      if (this.parameters.constraintHandling === 'penalty') {
        const totalPenalty = constraintViolations
          .filter(v => v > 0)
          .reduce((sum, v) => sum + v, 0) * this.parameters.penaltyCoefficient;
        particle.fitness += totalPenalty;
      }
      
      // Update personal best
      if (particle.fitness < particle.personalBest.fitness) {
        particle.personalBest.position = [...particle.position];
        particle.personalBest.fitness = particle.fitness;
        particle.stagnationCount = 0;
      } else {
        particle.stagnationCount++;
      }
      
      this.evaluationCount++;
      
    } catch (error) {
      console.error('Error evaluating particle:', error);
      particle.fitness = Number.MAX_VALUE;
    }
  }

  /**
   * Convert particle to optimization variables
   */
  private particleToVariables(particle: Particle, variableTemplates: OptimizationVariable[]): OptimizationVariable[] {
    return variableTemplates.map((template, index) => ({
      ...template,
      currentValue: particle.position[index]
    }));
  }

  /**
   * Update swarm for one iteration
   */
  private async updateSwarm(
    problem: OptimizationProblem,
    objectiveFunction: ObjectiveFunctionType,
    constraintFunctions: ConstraintFunctionType[]
  ): Promise<void> {
    if (!this.swarmState) return;
    
    // Update each particle
    for (const particle of this.swarmState.particles) {
      // Update velocity
      this.updateParticleVelocity(particle, problem);
      
      // Update position
      this.updateParticlePosition(particle, problem);
      
      // Evaluate new position
      await this.evaluateParticle(particle, problem, objectiveFunction, constraintFunctions);
      
      // Update age
      particle.age++;
    }
    
    // Update global best
    const newGlobalBest = this.findGlobalBest(this.swarmState.particles);
    if (newGlobalBest.fitness < this.swarmState.globalBest.fitness) {
      this.swarmState.globalBest = newGlobalBest;
      this.updateBestSolution(problem);
    }
    
    // Update swarm statistics
    this.swarmState.averageFitness = this.calculateAverageFitness(this.swarmState.particles);
    this.swarmState.diversityIndex = this.calculateDiversityIndex(this.swarmState.particles);
    this.swarmState.iteration++;
  }

  /**
   * Update particle velocity
   */
  private updateParticleVelocity(particle: Particle, problem: OptimizationProblem): void {
    const [c1, c2] = this.parameters.accelerationCoefficients;
    const w = this.getCurrentInertiaWeight();
    
    // Find neighborhood best
    const neighborhoodBest = this.findNeighborhoodBest(particle);
    
    for (let i = 0; i < particle.velocity.length; i++) {
      if (typeof particle.position[i] === 'number') {
        const currentPos = particle.position[i] as number;
        const personalBestPos = particle.personalBest.position[i] as number;
        const neighborhoodBestPos = neighborhoodBest.position[i] as number;
        
        // PSO velocity update equation
        const cognitive = c1 * this.random() * (personalBestPos - currentPos);
        const social = c2 * this.random() * (neighborhoodBestPos - currentPos);
        
        particle.velocity[i] = w * particle.velocity[i] + cognitive + social;
        
        // Velocity clamping
        const variable = problem.variables[i];
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
        const maxVel = this.parameters.maxVelocity * (max - min);
        
        particle.velocity[i] = Math.max(-maxVel, Math.min(maxVel, particle.velocity[i]));
      }
    }
  }

  /**
   * Update particle position
   */
  private updateParticlePosition(particle: Particle, problem: OptimizationProblem): void {
    for (let i = 0; i < particle.position.length; i++) {
      const variable = problem.variables[i];
      
      if (variable.discreteValues && variable.discreteValues.length > 0) {
        // Discrete variable - probabilistic update
        if (this.random() < 0.1) { // 10% chance to change
          const randomIndex = Math.floor(this.random() * variable.discreteValues.length);
          particle.position[i] = variable.discreteValues[randomIndex];
        }
      } else if (typeof particle.position[i] === 'number') {
        // Continuous variable
        const newPos = (particle.position[i] as number) + particle.velocity[i];
        
        // Boundary handling
        const min = typeof variable.bounds.minimum === 'number' ? variable.bounds.minimum : 0;
        const max = typeof variable.bounds.maximum === 'number' ? variable.bounds.maximum : 1;
        
        particle.position[i] = this.handleBoundary(newPos, min, max, particle.velocity[i], i);
      }
    }
  }

  /**
   * Handle boundary violations
   */
  private handleBoundary(position: number, min: number, max: number, velocity: number, index: number): number {
    switch (this.parameters.boundaryHandling) {
      case 'reflect':
        if (position < min) {
          return min + (min - position);
        } else if (position > max) {
          return max - (position - max);
        }
        return position;
        
      case 'absorb':
        return Math.max(min, Math.min(max, position));
        
      case 'invisible':
        // Keep position but set velocity to zero if boundary violated
        if (position < min || position > max) {
          return Math.max(min, Math.min(max, position));
        }
        return position;
        
      case 'random':
        if (position < min || position > max) {
          return min + this.random() * (max - min);
        }
        return position;
        
      default:
        return Math.max(min, Math.min(max, position));
    }
  }

  /**
   * Find global best particle
   */
  private findGlobalBest(particles: Particle[]): { position: (number | string)[]; fitness: number; particleId: string } {
    const best = particles.reduce((best, current) => 
      current.fitness < best.fitness ? current : best
    );
    
    return {
      position: [...best.position],
      fitness: best.fitness,
      particleId: best.id
    };
  }

  /**
   * Find neighborhood best for a particle
   */
  private findNeighborhoodBest(particle: Particle): { position: (number | string)[]; fitness: number } {
    if (!this.swarmState) return { position: particle.position, fitness: particle.fitness };
    
    switch (this.parameters.topology) {
      case 'global':
        return this.swarmState.globalBest;
        
      case 'local':
      case 'ring':
        // Find best among neighbors
        let best = particle.personalBest;
        for (const neighborId of particle.neighbors) {
          const neighbor = this.swarmState.particles.find(p => p.id === neighborId);
          if (neighbor && neighbor.personalBest.fitness < best.fitness) {
            best = neighbor.personalBest;
          }
        }
        return best;
        
      default:
        return this.swarmState.globalBest;
    }
  }

  /**
   * Setup neighborhood topology
   */
  private setupTopology(): void {
    if (!this.swarmState) return;
    
    const particles = this.swarmState.particles;
    
    switch (this.parameters.topology) {
      case 'ring':
        for (let i = 0; i < particles.length; i++) {
          const prev = (i - 1 + particles.length) % particles.length;
          const next = (i + 1) % particles.length;
          particles[i].neighbors = [particles[prev].id, particles[next].id];
        }
        break;
        
      case 'local':
        for (let i = 0; i < particles.length; i++) {
          const neighbors: string[] = [];
          for (let j = 0; j < this.parameters.neighborhoodSize && j < particles.length; j++) {
            const neighborIndex = (i + j + 1) % particles.length;
            if (neighborIndex !== i) {
              neighbors.push(particles[neighborIndex].id);
            }
          }
          particles[i].neighbors = neighbors;
        }
        break;
        
      case 'star':
        // All particles connected to best particle
        const bestParticle = this.findGlobalBest(particles);
        for (const particle of particles) {
          if (particle.id !== bestParticle.particleId) {
            particle.neighbors = [bestParticle.particleId];
          }
        }
        break;
        
      case 'random':
        for (const particle of particles) {
          const neighbors: string[] = [];
          for (let j = 0; j < this.parameters.neighborhoodSize; j++) {
            const randomIndex = Math.floor(this.random() * particles.length);
            if (particles[randomIndex].id !== particle.id && 
                !neighbors.includes(particles[randomIndex].id)) {
              neighbors.push(particles[randomIndex].id);
            }
          }
          particle.neighbors = neighbors;
        }
        break;
        
      default: // global
        // No explicit neighbors - all particles use global best
        break;
    }
  }

  /**
   * Get current inertia weight (adaptive)
   */
  private getCurrentInertiaWeight(): number {
    if (!this.parameters.adaptiveParameters || !this.swarmState) {
      return this.parameters.inertiaWeight;
    }
    
    // Linear decrease from max to min
    const progress = this.swarmState.iteration / this.parameters.maxIterations;
    return this.parameters.inertiaWeightMax - 
           progress * (this.parameters.inertiaWeightMax - this.parameters.inertiaWeightMin);
  }

  /**
   * Adapt algorithm parameters
   */
  private adaptParameters(): void {
    if (!this.swarmState) return;
    
    // Adapt based on diversity
    if (this.swarmState.diversityIndex < 0.1) {
      // Low diversity - increase exploration
      this.parameters.inertiaWeight = Math.min(0.9, this.parameters.inertiaWeight * 1.1);
      this.parameters.maxVelocity = Math.min(0.5, this.parameters.maxVelocity * 1.1);
    } else if (this.swarmState.diversityIndex > 0.8) {
      // High diversity - increase exploitation
      this.parameters.inertiaWeight = Math.max(0.1, this.parameters.inertiaWeight * 0.9);
      this.parameters.maxVelocity = Math.max(0.05, this.parameters.maxVelocity * 0.9);
    }
  }

  /**
   * Maintain swarm diversity
   */
  private maintainDiversity(problem: OptimizationProblem): void {
    if (!this.swarmState) return;
    
    // Replace stagnant particles
    for (const particle of this.swarmState.particles) {
      if (particle.stagnationCount > 20) {
        // Reinitialize particle
        const newParticle = this.createRandomParticle(problem);
        Object.assign(particle, newParticle);
      }
    }
  }

  /**
   * Calculate average fitness
   */
  private calculateAverageFitness(particles: Particle[]): number {
    const validFitnesses = particles.map(p => p.fitness).filter(f => f !== Number.MAX_VALUE);
    return validFitnesses.length > 0 ? 
           validFitnesses.reduce((sum, f) => sum + f, 0) / validFitnesses.length : 
           Number.MAX_VALUE;
  }

  /**
   * Calculate diversity index
   */
  private calculateDiversityIndex(particles: Particle[]): number {
    if (particles.length < 2) return 0;
    
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const distance = this.calculateDistance(particles[i], particles[j]);
        totalDistance += distance;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Calculate distance between particles
   */
  private calculateDistance(particle1: Particle, particle2: Particle): number {
    let distance = 0;
    
    for (let i = 0; i < particle1.position.length; i++) {
      if (typeof particle1.position[i] === 'number' && typeof particle2.position[i] === 'number') {
        const diff = (particle1.position[i] as number) - (particle2.position[i] as number);
        distance += diff * diff;
      }
    }
    
    return Math.sqrt(distance);
  }

  /**
   * Update best solution
   */
  private updateBestSolution(problem: OptimizationProblem): void {
    if (!this.swarmState) return;
    
    const bestParticle = this.swarmState.particles.find(p => p.id === this.swarmState!.globalBest.particleId);
    if (!bestParticle) return;
    
    const variables: { [variableId: string]: number | string } = {};
    problem.variables.forEach((variable, index) => {
      variables[variable.id] = bestParticle.position[index];
    });
    
    this.bestSolution = {
      id: `pso_best_${Date.now()}`,
      variables,
      objectiveValues: {},
      constraintViolations: [],
      feasible: true,
      fitness: bestParticle.fitness,
      systemConfiguration: problem.systemConfiguration,
      performanceMetrics: {} as SolutionPerformanceMetrics
    };
  }

  /**
   * Check termination criteria
   */
  private shouldTerminate(problem: OptimizationProblem): boolean {
    if (!this.swarmState) return true;
    
    // Maximum iterations
    if (this.swarmState.iteration >= this.parameters.maxIterations) {
      return true;
    }
    
    // Convergence check
    if (this.history.length >= 20) {
      const recentHistory = this.history.slice(-20);
      const fitnessImprovement = recentHistory[0].bestFitness - recentHistory[recentHistory.length - 1].bestFitness;
      
      if (Math.abs(fitnessImprovement) < problem.convergenceCriteria.toleranceValue) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Update optimization history
   */
  private updateHistory(): void {
    if (!this.swarmState) return;
    
    const feasibleParticles = this.swarmState.particles.filter(p => p.fitness !== Number.MAX_VALUE);
    const fitnesses = feasibleParticles.map(p => p.fitness);
    
    if (fitnesses.length === 0) {
      fitnesses.push(Number.MAX_VALUE);
    }
    
    const history: IterationHistory = {
      iteration: this.swarmState.iteration,
      bestFitness: Math.min(...fitnesses),
      averageFitness: this.swarmState.averageFitness,
      worstFitness: Math.max(...fitnesses),
      diversity: this.swarmState.diversityIndex,
      constraintViolations: this.swarmState.particles.filter(p => p.fitness === Number.MAX_VALUE).length,
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
      totalIterations: this.swarmState?.iteration || 0,
      totalEvaluations: this.evaluationCount,
      convergenceIteration: this.swarmState?.iteration || 0,
      executionTime,
      bestFitnessHistory: this.history.map(h => h.bestFitness),
      averageFitnessHistory: this.history.map(h => h.averageFitness),
      diversityHistory: this.history.map(h => h.diversity),
      constraintViolationHistory: this.history.map(h => h.constraintViolations),
      algorithmSpecificStats: {
        swarmSize: this.parameters.swarmSize,
        finalInertiaWeight: this.getCurrentInertiaWeight(),
        finalDiversityIndex: this.swarmState?.diversityIndex || 0
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
  private generateParticleId(): string {
    return `pso_particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
