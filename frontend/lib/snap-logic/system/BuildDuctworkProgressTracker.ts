/**
 * Build Ductwork Progress Tracker
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Tracks and manages progress for Build Ductwork operations, providing real-time
 * progress updates, step tracking, and estimated completion times for the
 * Results/Warnings Bar integration.
 * 
 * @fileoverview Progress tracking system for Build Ductwork operations
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const progressTracker = new BuildDuctworkProgressTracker();
 * 
 * progressTracker.onProgress((progress) => {
 *   console.log(`Step: ${progress.currentStep}, Progress: ${progress.progress}%`);
 * });
 * 
 * await progressTracker.trackBuildOperation(async (tracker) => {
 *   tracker.updateStep('Validating centerlines', 0);
 *   // ... validation logic ...
 *   tracker.updateStep('Converting to 3D', 50);
 *   // ... conversion logic ...
 *   tracker.updateStep('Complete', 100);
 * });
 * ```
 */

import { BuildDuctworkProgress, BuildDuctworkStatus } from '../../../components/snap-logic/SnapLogicStatusBar';

/**
 * Build operation step definition
 */
interface BuildStep {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // milliseconds
  weight: number; // 0-1, relative weight for progress calculation
}

/**
 * Progress callback function type
 */
type ProgressCallback = (progress: BuildDuctworkProgress) => void;

/**
 * Build operation function type
 */
type BuildOperationFunction = (tracker: BuildDuctworkProgressTracker) => Promise<void>;

/**
 * Default build steps for ductwork conversion
 */
const DEFAULT_BUILD_STEPS: BuildStep[] = [
  {
    id: 'validation',
    name: 'Validating Centerlines',
    description: 'Checking centerline integrity and SMACNA compliance',
    estimatedDuration: 500,
    weight: 0.1
  },
  {
    id: 'preprocessing',
    name: 'Preprocessing Data',
    description: 'Preparing centerline data for 3D conversion',
    estimatedDuration: 300,
    weight: 0.1
  },
  {
    id: 'segmentation',
    name: 'Creating Segments',
    description: 'Converting centerlines to duct segments',
    estimatedDuration: 1000,
    weight: 0.3
  },
  {
    id: 'fittings',
    name: 'Generating Fittings',
    description: 'Creating fittings and connections',
    estimatedDuration: 800,
    weight: 0.25
  },
  {
    id: 'optimization',
    name: 'Optimizing Geometry',
    description: 'Optimizing 3D geometry and connections',
    estimatedDuration: 600,
    weight: 0.15
  },
  {
    id: 'finalization',
    name: 'Finalizing Build',
    description: 'Completing build and generating results',
    estimatedDuration: 300,
    weight: 0.1
  }
];

/**
 * Build Ductwork progress tracker
 */
export class BuildDuctworkProgressTracker {
  private steps: BuildStep[];
  private currentStepIndex: number = 0;
  private currentProgress: number = 0;
  private status: BuildDuctworkStatus = 'idle';
  private startTime: number = 0;
  private progressCallbacks: ProgressCallback[] = [];
  private estimatedTotalDuration: number = 0;

  constructor(customSteps?: BuildStep[]) {
    this.steps = customSteps || DEFAULT_BUILD_STEPS;
    this.estimatedTotalDuration = this.steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  /**
   * Register a progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Remove a progress callback
   */
  offProgress(callback: ProgressCallback): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current progress information
   */
  getProgress(): BuildDuctworkProgress {
    const currentStep = this.steps[this.currentStepIndex];
    const elapsedTime = this.startTime > 0 ? Date.now() - this.startTime : 0;
    
    // Calculate estimated time remaining
    let estimatedTimeRemaining: number | undefined;
    if (this.status === 'building' && this.currentProgress > 0) {
      const progressRatio = this.currentProgress / 100;
      const estimatedTotalTime = elapsedTime / progressRatio;
      estimatedTimeRemaining = Math.max(0, (estimatedTotalTime - elapsedTime) / 1000); // seconds
    }

    return {
      status: this.status,
      progress: this.currentProgress,
      currentStep: currentStep?.name || 'Unknown',
      totalSteps: this.steps.length,
      currentStepIndex: this.currentStepIndex,
      estimatedTimeRemaining
    };
  }

  /**
   * Start tracking a build operation
   */
  async trackBuildOperation(operation: BuildOperationFunction): Promise<void> {
    this.reset();
    this.status = 'building';
    this.startTime = Date.now();
    this.notifyProgress();

    try {
      await operation(this);
      this.status = 'success';
      this.currentProgress = 100;
      this.notifyProgress();
    } catch (error) {
      this.status = 'error';
      this.notifyProgress();
      throw error;
    }
  }

  /**
   * Update current step and progress
   */
  updateStep(stepName: string, progressPercentage?: number): void {
    // Find step by name or use current step
    const stepIndex = this.steps.findIndex(step => step.name === stepName);
    if (stepIndex >= 0) {
      this.currentStepIndex = stepIndex;
    }

    // Update progress
    if (progressPercentage !== undefined) {
      this.currentProgress = Math.max(0, Math.min(100, progressPercentage));
    } else {
      // Auto-calculate progress based on step weights
      this.currentProgress = this.calculateProgressFromSteps();
    }

    this.notifyProgress();
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.currentProgress = this.calculateProgressFromSteps();
      this.notifyProgress();
    }
  }

  /**
   * Update progress within current step
   */
  updateProgress(progressPercentage: number): void {
    this.currentProgress = Math.max(0, Math.min(100, progressPercentage));
    this.notifyProgress();
  }

  /**
   * Complete current step and move to next
   */
  completeStep(): void {
    const currentStep = this.steps[this.currentStepIndex];
    if (currentStep) {
      // Mark current step as complete
      const stepProgress = this.calculateStepProgress(this.currentStepIndex, 100);
      this.currentProgress = stepProgress;
      this.notifyProgress();

      // Move to next step after a brief delay
      setTimeout(() => {
        this.nextStep();
      }, 100);
    }
  }

  /**
   * Reset progress tracker
   */
  reset(): void {
    this.currentStepIndex = 0;
    this.currentProgress = 0;
    this.status = 'idle';
    this.startTime = 0;
  }

  /**
   * Calculate progress based on completed steps and current step progress
   */
  private calculateProgressFromSteps(): number {
    let totalProgress = 0;

    // Add progress from completed steps
    for (let i = 0; i < this.currentStepIndex; i++) {
      totalProgress += this.steps[i].weight * 100;
    }

    // Add progress from current step (assume 50% complete if not specified)
    if (this.currentStepIndex < this.steps.length) {
      totalProgress += this.steps[this.currentStepIndex].weight * 50;
    }

    return Math.min(100, totalProgress);
  }

  /**
   * Calculate progress for a specific step
   */
  private calculateStepProgress(stepIndex: number, stepProgressPercentage: number): number {
    let totalProgress = 0;

    // Add progress from completed steps
    for (let i = 0; i < stepIndex; i++) {
      totalProgress += this.steps[i].weight * 100;
    }

    // Add progress from specified step
    if (stepIndex < this.steps.length) {
      totalProgress += this.steps[stepIndex].weight * stepProgressPercentage;
    }

    return Math.min(100, totalProgress);
  }

  /**
   * Notify all progress callbacks
   */
  private notifyProgress(): void {
    const progress = this.getProgress();
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Get step information
   */
  getSteps(): BuildStep[] {
    return [...this.steps];
  }

  /**
   * Get current step information
   */
  getCurrentStep(): BuildStep | null {
    return this.steps[this.currentStepIndex] || null;
  }

  /**
   * Check if operation is in progress
   */
  isBuilding(): boolean {
    return this.status === 'building';
  }

  /**
   * Check if operation completed successfully
   */
  isSuccess(): boolean {
    return this.status === 'success';
  }

  /**
   * Check if operation failed
   */
  isError(): boolean {
    return this.status === 'error';
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0;
  }

  /**
   * Create a simple progress tracker for basic operations
   */
  static createSimple(stepNames: string[]): BuildDuctworkProgressTracker {
    const steps: BuildStep[] = stepNames.map((name, index) => ({
      id: `step-${index}`,
      name,
      description: name,
      estimatedDuration: 500,
      weight: 1 / stepNames.length
    }));

    return new BuildDuctworkProgressTracker(steps);
  }

  /**
   * Destroy progress tracker and cleanup
   */
  destroy(): void {
    this.progressCallbacks = [];
    this.reset();
  }
}
