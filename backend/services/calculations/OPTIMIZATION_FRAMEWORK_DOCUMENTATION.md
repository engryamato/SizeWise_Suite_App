# SizeWise Suite Optimization Framework Documentation

## Overview

The SizeWise Suite Optimization Framework provides comprehensive optimization capabilities for HVAC system design and analysis. This framework implements Phase 3 Priority 2: Dynamic System Optimization, building upon the successful completion of Phase 1 (core calculations), Phase 2 (enhanced data layer), and Phase 3 Priority 1 (advanced fitting types).

## Architecture

### Core Components

1. **SystemOptimizationEngine** - Main optimization service with algorithm selection and problem solving
2. **MultiObjectiveOptimizationFramework** - Specialized framework for multi-objective optimization with Pareto analysis
3. **Optimization Algorithms Library** - Four comprehensive algorithm implementations:
   - GeneticAlgorithm (NSGA-II support for multi-objective)
   - SimulatedAnnealing (multiple cooling schedules)
   - ParticleSwarmOptimization (swarm topology options)
   - GradientDescent (multiple variants: Adam, RMSprop, etc.)
4. **SystemOptimizationTypes** - Comprehensive TypeScript type definitions (50+ interfaces)

### Integration with Existing Components

The optimization framework seamlessly integrates with existing SizeWise Suite components:
- **Phase 1**: SystemPressureCalculator, FittingLossCalculator
- **Phase 2**: AirPropertiesCalculator, enhanced material properties
- **Phase 3 Priority 1**: AdvancedFittingCalculator

## Key Features

### Single-Objective Optimization
- Minimize pressure loss, energy consumption, cost, or noise
- Support for continuous and discrete variables
- Comprehensive constraint handling (penalty, repair, death penalty methods)
- Multiple algorithm options with adaptive parameters

### Multi-Objective Optimization
- NSGA-II implementation with non-dominated sorting
- Pareto front analysis and visualization
- Trade-off analysis with knee point identification
- Hypervolume and spacing metrics for convergence assessment
- Weighted sum aggregation as alternative approach

### Constraint Handling
- Inequality and equality constraints
- Boundary constraints with automatic validation
- Penalty methods with configurable coefficients
- Repair operators for constraint satisfaction
- Death penalty for infeasible solutions

### Performance Features
- Parallel evaluation support for population-based algorithms
- Convergence monitoring with multiple criteria
- Execution time tracking and performance metrics
- Memory-efficient population management
- Configurable termination criteria

## Usage Examples

### Basic Single-Objective Optimization

```typescript
import { GeneticAlgorithm } from './algorithms/GeneticAlgorithm';
import { OptimizationProblem, ObjectiveFunctionType } from './types/SystemOptimizationTypes';

// Define optimization problem
const problem: OptimizationProblem = {
  id: 'duct_sizing',
  name: 'Duct Sizing Optimization',
  variables: [
    {
      id: 'diameter',
      type: 'continuous',
      bounds: { minimum: 6, maximum: 24 },
      units: 'inches',
      currentValue: 12
    }
  ],
  // ... other problem definition
};

// Define objective function
const objectiveFunction: ObjectiveFunctionType = (variables) => {
  const diameter = variables.find(v => v.id === 'diameter')?.currentValue as number;
  // Calculate pressure loss based on diameter
  return pressureLossCalculation(diameter);
};

// Create and run optimization
const ga = new GeneticAlgorithm({
  populationSize: 50,
  maxGenerations: 100,
  crossoverRate: 0.8,
  mutationRate: 0.1
});

const result = await ga.optimize(problem, objectiveFunction, constraintFunctions);
```

### Multi-Objective Optimization

```typescript
import { MultiObjectiveOptimizationFramework } from './MultiObjectiveOptimizationFramework';

// Define multiple objective functions
const pressureLossObjective: ObjectiveFunctionType = (variables) => {
  // Calculate pressure loss
};

const costObjective: ObjectiveFunctionType = (variables) => {
  // Calculate total cost
};

// Create multi-objective framework
const moFramework = new MultiObjectiveOptimizationFramework({
  algorithm: 'nsga2',
  populationSize: 100,
  maxGenerations: 150,
  paretoSettings: {
    maxSolutions: 50,
    diversityThreshold: 0.01,
    hypervolume: { enabled: true, referencePoint: [] }
  }
});

// Run optimization
const result = await moFramework.optimizeMultiObjective(
  problem,
  [pressureLossObjective, costObjective],
  constraintFunctions
);

// Access Pareto front
const paretoFront = result.analysis?.paretoFront;
const kneePoints = result.analysis?.tradeoffAnalysis?.kneePoints;
```

### Integration with SystemOptimizationEngine

```typescript
import { SystemOptimizationEngine } from './SystemOptimizationEngine';

// Single-objective optimization
const result = await SystemOptimizationEngine.optimizeSystem(
  problem,
  OptimizationAlgorithm.GENETIC_ALGORITHM
);

// Multi-objective optimization
const moResult = await SystemOptimizationEngine.optimizeMultiObjective(
  problem,
  OptimizationAlgorithm.NSGA_II
);

// Specialized optimization methods
const balanceResult = await SystemOptimizationEngine.optimizeSystemBalance(
  systemConfiguration,
  targetFlowRates,
  constraints
);

const energyResult = await SystemOptimizationEngine.optimizeEnergyEfficiency(
  systemConfiguration,
  operatingConditions,
  constraints
);
```

## Algorithm Selection Guide

### Genetic Algorithm (GA)
- **Best for**: Multi-objective problems, discrete variables, global optimization
- **Strengths**: Robust, handles constraints well, good for complex search spaces
- **Parameters**: Population size (50-200), crossover rate (0.7-0.9), mutation rate (0.01-0.1)

### Simulated Annealing (SA)
- **Best for**: Single-objective problems, escaping local optima, continuous variables
- **Strengths**: Simple, effective for rugged landscapes, good convergence properties
- **Parameters**: Initial temperature (100-1000), cooling rate (0.9-0.99), final temperature (0.01-0.1)

### Particle Swarm Optimization (PSO)
- **Best for**: Continuous optimization, fast convergence, social optimization
- **Strengths**: Fast, simple implementation, good for smooth functions
- **Parameters**: Swarm size (20-100), inertia weight (0.4-0.9), acceleration coefficients (1.5-2.5)

### Gradient Descent (GD)
- **Best for**: Smooth, differentiable functions, local optimization, fine-tuning
- **Strengths**: Fast convergence for smooth functions, mathematical foundation
- **Parameters**: Learning rate (0.001-0.1), variant (Adam, RMSprop), momentum (0.9)

## Performance Guidelines

### Target Performance Metrics
- **Response Time**: <100ms for simple problems, <5s for complex multi-objective
- **Accuracy**: >99% convergence to known optimal solutions
- **Reliability**: >99.9% successful completion rate
- **Scalability**: Support for 10-100 variables, 2-10 objectives

### Optimization Tips
1. **Problem Scaling**: Normalize variables to similar ranges (0-1 or -1 to 1)
2. **Population Sizing**: Use 10-20 times the number of variables for GA/PSO
3. **Constraint Handling**: Use penalty coefficients 100-10000 times objective magnitude
4. **Convergence**: Monitor stagnation over 10-50 generations
5. **Multi-objective**: Use population sizes 50-200 for good Pareto front diversity

## Testing and Validation

### Integration Tests
- Single-objective optimization with all four algorithms
- Multi-objective optimization with Pareto analysis
- Integration with existing Phase 1/2/3 Priority 1 components
- Constraint handling validation
- Performance benchmarking

### Test Coverage
- Algorithm correctness and convergence
- Constraint satisfaction and penalty methods
- Multi-objective Pareto front generation
- Integration with existing calculation services
- Performance under various problem sizes

### Validation Scenarios
- Known analytical solutions for simple problems
- Comparison with commercial optimization software
- Real-world HVAC system optimization cases
- Stress testing with large-scale problems

## Best Practices

### Problem Definition
1. **Clear Objectives**: Define measurable, quantifiable objectives
2. **Realistic Constraints**: Ensure constraints are achievable and well-defined
3. **Variable Bounds**: Set reasonable bounds based on engineering limits
4. **Units Consistency**: Maintain consistent units throughout the problem

### Algorithm Configuration
1. **Start Simple**: Begin with default parameters and adjust based on results
2. **Monitor Convergence**: Track fitness improvement and diversity metrics
3. **Multiple Runs**: Run optimization multiple times with different seeds
4. **Parameter Sensitivity**: Test sensitivity to key algorithm parameters

### Results Analysis
1. **Feasibility Check**: Verify all solutions satisfy constraints
2. **Engineering Validation**: Ensure results make physical sense
3. **Trade-off Analysis**: For multi-objective, analyze Pareto front trade-offs
4. **Sensitivity Analysis**: Test robustness to input parameter variations

## Future Enhancements

### Planned Features
- Additional optimization algorithms (Differential Evolution, CMA-ES)
- Advanced constraint handling techniques
- Parallel multi-objective optimization
- Machine learning-assisted optimization
- Real-time optimization capabilities

### Integration Roadmap
- Phase 3 Priority 3: Advanced System Analysis Tools
- Phase 3 Priority 4: Comprehensive Reporting and Visualization
- Cloud-based optimization services for SaaS deployment
- Integration with building automation systems

## Support and Documentation

### Additional Resources
- API Reference: See TypeScript interfaces in SystemOptimizationTypes.ts
- Examples: Comprehensive examples in examples/OptimizationExamples.ts
- Tests: Integration tests in tests/SystemOptimization.integration.test.ts
- Implementation Plans: PHASE3-IMPLEMENTATION-PLAN.md and PHASE3-TECHNICAL-SPECIFICATION.md

### Getting Help
- Review the examples for common usage patterns
- Check the integration tests for validation approaches
- Consult the technical specifications for detailed architecture
- Follow the implementation plan for development guidelines

---

*This documentation is part of the SizeWise Suite Phase 3 Priority 2 implementation. For questions or contributions, please refer to the project development team.*
