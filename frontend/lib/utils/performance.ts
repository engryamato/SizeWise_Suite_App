/**
 * Performance Optimization Utilities
 * 
 * GPU and rendering performance optimization tools for SizeWise Suite
 */

export interface PerformanceConfig {
  targetFPS: number;
  enableAdaptiveQuality: boolean;
  enablePerformanceMonitoring: boolean;
  particleCountLimit: number;
  enableGPUOptimizations: boolean;
}

export interface GPUPerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuMemoryUsage?: number;
  renderCalls: number;
  particleCount: number;
  timestamp: number;
}

/**
 * Frame rate limiter for animations and rendering
 */
export class FrameRateLimiter {
  private lastFrameTime: number = 0;
  private targetFrameTime: number;
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  private readonly maxFPSHistory = 60; // Track last 60 frames

  constructor(targetFPS: number = 30) {
    this.targetFrameTime = 1000 / targetFPS;
  }

  /**
   * Check if enough time has passed for the next frame
   */
  shouldRender(currentTime: number): boolean {
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= this.targetFrameTime) {
      this.lastFrameTime = currentTime;
      this.updateFPSMetrics(deltaTime);
      return true;
    }
    
    return false;
  }

  /**
   * Update FPS tracking metrics
   */
  private updateFPSMetrics(deltaTime: number): void {
    this.frameCount++;
    const currentFPS = 1000 / deltaTime;
    
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > this.maxFPSHistory) {
      this.fpsHistory.shift();
    }
  }

  /**
   * Get current FPS metrics
   */
  getFPSMetrics(): { current: number; average: number; min: number; max: number } {
    if (this.fpsHistory.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0 };
    }

    const current = this.fpsHistory[this.fpsHistory.length - 1] || 0;
    const average = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    const min = Math.min(...this.fpsHistory);
    const max = Math.max(...this.fpsHistory);

    return { current, average, min, max };
  }

  /**
   * Set new target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFrameTime = 1000 / fps;
  }
}

/**
 * Adaptive quality manager for performance optimization
 */
export class AdaptiveQualityManager {
  private performanceHistory: number[] = [];
  private readonly targetFPS = 30;
  private readonly performanceWindow = 30; // Track last 30 frames
  private currentQualityLevel = 1.0; // 1.0 = full quality, 0.5 = half quality

  /**
   * Update performance metrics and adjust quality
   */
  updatePerformance(fps: number): number {
    this.performanceHistory.push(fps);
    
    if (this.performanceHistory.length > this.performanceWindow) {
      this.performanceHistory.shift();
    }

    // Calculate average FPS over the window
    const avgFPS = this.performanceHistory.reduce((sum, f) => sum + f, 0) / this.performanceHistory.length;

    // Adjust quality based on performance
    if (avgFPS < this.targetFPS * 0.8) { // Below 80% of target
      this.currentQualityLevel = Math.max(0.3, this.currentQualityLevel - 0.1);
    } else if (avgFPS > this.targetFPS * 0.95) { // Above 95% of target
      this.currentQualityLevel = Math.min(1.0, this.currentQualityLevel + 0.05);
    }

    return this.currentQualityLevel;
  }

  /**
   * Get current quality level
   */
  getQualityLevel(): number {
    return this.currentQualityLevel;
  }

  /**
   * Get quality-adjusted particle count
   */
  getOptimalParticleCount(baseCount: number): number {
    return Math.floor(baseCount * this.currentQualityLevel);
  }

  /**
   * Get quality-adjusted blur intensity
   */
  getOptimalBlurIntensity(baseIntensity: number): number {
    return Math.max(1, Math.floor(baseIntensity * this.currentQualityLevel));
  }
}

/**
 * Visibility-based rendering controller
 */
export class VisibilityController {
  private intersectionObserver: IntersectionObserver | null = null;
  private visibilityCallbacks = new Map<Element, (isVisible: boolean) => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const callback = this.visibilityCallbacks.get(entry.target);
            if (callback) {
              callback(entry.isIntersecting);
            }
          });
        },
        {
          threshold: 0.1, // Trigger when 10% visible
          rootMargin: '50px' // Start rendering 50px before entering viewport
        }
      );
    }
  }

  /**
   * Register element for visibility tracking
   */
  observe(element: Element, callback: (isVisible: boolean) => void): void {
    if (this.intersectionObserver) {
      this.visibilityCallbacks.set(element, callback);
      this.intersectionObserver.observe(element);
    } else {
      // Fallback: assume always visible
      callback(true);
    }
  }

  /**
   * Unregister element from visibility tracking
   */
  unobserve(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
      this.visibilityCallbacks.delete(element);
    }
  }

  /**
   * Cleanup
   */
  disconnect(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.visibilityCallbacks.clear();
    }
  }
}

/**
 * GPU Performance Monitor
 */
export class GPUPerformanceMonitor {
  private metrics: GPUPerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 300; // 10 seconds at 30fps
  private frameRateLimiter: FrameRateLimiter;
  private adaptiveQuality: AdaptiveQualityManager;

  constructor(targetFPS: number = 30) {
    this.frameRateLimiter = new FrameRateLimiter(targetFPS);
    this.adaptiveQuality = new AdaptiveQualityManager();
  }

  /**
   * Record performance metrics
   */
  recordMetrics(renderCalls: number, particleCount: number): void {
    const fpsMetrics = this.frameRateLimiter.getFPSMetrics();
    
    const metric: GPUPerformanceMetrics = {
      fps: fpsMetrics.current,
      frameTime: 1000 / fpsMetrics.current,
      renderCalls,
      particleCount,
      timestamp: performance.now()
    };

    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Update adaptive quality
    this.adaptiveQuality.updatePerformance(fpsMetrics.current);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageFPS: number;
    currentQuality: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageFPS: 0,
        currentQuality: 1.0,
        recommendations: []
      };
    }

    const averageFPS = this.metrics.reduce((sum, m) => sum + m.fps, 0) / this.metrics.length;
    const currentQuality = this.adaptiveQuality.getQualityLevel();
    const recommendations: string[] = [];

    if (averageFPS < 25) {
      recommendations.push('Consider reducing particle count or disabling complex effects');
    }
    if (currentQuality < 0.7) {
      recommendations.push('Performance has been automatically reduced. Consider upgrading hardware.');
    }

    return {
      averageFPS,
      currentQuality,
      recommendations
    };
  }

  /**
   * Get frame rate limiter
   */
  getFrameRateLimiter(): FrameRateLimiter {
    return this.frameRateLimiter;
  }

  /**
   * Get adaptive quality manager
   */
  getAdaptiveQuality(): AdaptiveQualityManager {
    return this.adaptiveQuality;
  }
}

/**
 * Default performance configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  targetFPS: 30,
  enableAdaptiveQuality: true,
  enablePerformanceMonitoring: true,
  particleCountLimit: 100, // Reduced from 200
  enableGPUOptimizations: true
};

/**
 * Create performance monitor instance
 */
export const createPerformanceMonitor = (config: Partial<PerformanceConfig> = {}) => {
  const finalConfig = { ...defaultPerformanceConfig, ...config };
  return new GPUPerformanceMonitor(finalConfig.targetFPS);
};
