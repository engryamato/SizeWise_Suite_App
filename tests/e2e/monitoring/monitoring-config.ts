/**
 * SizeWise Suite - E2E Monitoring Configuration
 * 
 * Configuration settings for E2E monitoring system including
 * performance thresholds, reporting options, and monitoring behavior.
 */

export interface MonitoringConfig {
  // Performance thresholds
  performance: {
    pageLoadThreshold: number;        // Maximum acceptable page load time (ms)
    apiResponseThreshold: number;     // Maximum acceptable API response time (ms)
    interactionThreshold: number;     // Maximum acceptable interaction time (ms)
    memoryThreshold: number;          // Maximum acceptable memory usage (bytes)
    networkErrorThreshold: number;    // Maximum acceptable network error rate (%)
  };
  
  // Reporting configuration
  reporting: {
    enabled: boolean;                 // Enable/disable reporting
    detailedReporting: boolean;       // Enable detailed reporting for all tests
    exportOnFailure: boolean;         // Export metrics when tests fail
    exportDirectory: string;          // Directory for exported metrics
    includeScreenshots: boolean;      // Include screenshots in reports
    includeVideoRecording: boolean;   // Include video recordings
  };
  
  // Monitoring behavior
  monitoring: {
    trackAllInteractions: boolean;    // Track all user interactions
    trackNetworkRequests: boolean;    // Track network requests
    trackConsoleMessages: boolean;    // Track console messages
    trackJavaScriptErrors: boolean;   // Track JavaScript errors
    trackMemoryUsage: boolean;        // Track memory usage
    trackPerformanceMetrics: boolean; // Track performance metrics
  };
  
  // Alert thresholds
  alerts: {
    criticalPerformanceThreshold: number;  // Critical performance threshold (ms)
    highErrorRateThreshold: number;        // High error rate threshold (%)
    memoryLeakThreshold: number;           // Memory leak threshold (bytes)
    consecutiveFailureThreshold: number;   // Consecutive failure alert threshold
  };
  
  // Test execution settings
  execution: {
    retryOnFailure: boolean;          // Retry failed tests
    maxRetries: number;               // Maximum number of retries
    stabilizationTimeout: number;     // Time to wait for performance stabilization (ms)
    networkIdleTimeout: number;       // Network idle timeout (ms)
  };
}

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  performance: {
    pageLoadThreshold: 3000,          // 3 seconds
    apiResponseThreshold: 500,        // 500ms
    interactionThreshold: 200,        // 200ms
    memoryThreshold: 100 * 1024 * 1024, // 100MB
    networkErrorThreshold: 5          // 5%
  },
  
  reporting: {
    enabled: true,
    detailedReporting: process.env.E2E_DETAILED_REPORTING === 'true',
    exportOnFailure: true,
    exportDirectory: 'test-results/e2e-metrics',
    includeScreenshots: true,
    includeVideoRecording: false
  },
  
  monitoring: {
    trackAllInteractions: true,
    trackNetworkRequests: true,
    trackConsoleMessages: true,
    trackJavaScriptErrors: true,
    trackMemoryUsage: true,
    trackPerformanceMetrics: true
  },
  
  alerts: {
    criticalPerformanceThreshold: 5000,  // 5 seconds
    highErrorRateThreshold: 10,          // 10%
    memoryLeakThreshold: 200 * 1024 * 1024, // 200MB
    consecutiveFailureThreshold: 3       // 3 consecutive failures
  },
  
  execution: {
    retryOnFailure: true,
    maxRetries: 2,
    stabilizationTimeout: 5000,         // 5 seconds
    networkIdleTimeout: 2000            // 2 seconds
  }
};

// Environment-specific configurations
export const environmentConfigs: Record<string, Partial<MonitoringConfig>> = {
  development: {
    performance: {
      pageLoadThreshold: 5000,          // More lenient in development
      apiResponseThreshold: 1000
    },
    reporting: {
      detailedReporting: true,
      includeVideoRecording: true
    }
  },
  
  staging: {
    performance: {
      pageLoadThreshold: 3000,
      apiResponseThreshold: 500
    },
    reporting: {
      detailedReporting: false,
      includeVideoRecording: false
    }
  },
  
  production: {
    performance: {
      pageLoadThreshold: 2000,          // Stricter in production
      apiResponseThreshold: 300
    },
    reporting: {
      detailedReporting: false,
      includeVideoRecording: false
    },
    alerts: {
      criticalPerformanceThreshold: 3000,
      highErrorRateThreshold: 5
    }
  },
  
  ci: {
    performance: {
      pageLoadThreshold: 10000,         // More lenient in CI
      apiResponseThreshold: 2000
    },
    reporting: {
      detailedReporting: true,
      includeScreenshots: true,
      includeVideoRecording: false
    },
    execution: {
      retryOnFailure: true,
      maxRetries: 3,
      stabilizationTimeout: 10000
    }
  }
};

// Performance benchmarks for different test types
export const performanceBenchmarks = {
  hvacCalculations: {
    airDuctSizing: {
      maxTime: 500,                     // 500ms
      description: 'Air duct sizing calculation'
    },
    loadCalculation: {
      maxTime: 1000,                    // 1 second
      description: 'HVAC load calculation'
    },
    equipmentSizing: {
      maxTime: 800,                     // 800ms
      description: 'Equipment sizing calculation'
    },
    reportGeneration: {
      maxTime: 5000,                    // 5 seconds
      description: 'Report generation'
    }
  },
  
  userInterface: {
    pageNavigation: {
      maxTime: 2000,                    // 2 seconds
      description: 'Page navigation'
    },
    formSubmission: {
      maxTime: 1500,                    // 1.5 seconds
      description: 'Form submission'
    },
    dataVisualization: {
      maxTime: 3000,                    // 3 seconds
      description: 'Data visualization rendering'
    }
  },
  
  offlineFunctionality: {
    offlineMode: {
      maxTime: 100,                     // 100ms (should be immediate)
      description: 'Offline mode activation'
    },
    localCalculation: {
      maxTime: 300,                     // 300ms
      description: 'Offline calculation'
    },
    dataSync: {
      maxTime: 2000,                    // 2 seconds
      description: 'Data synchronization'
    }
  }
};

// Quality gates for test execution
export const qualityGates = {
  performance: {
    minimumScore: 80,                   // Minimum performance score (0-100)
    description: 'Overall performance quality gate'
  },
  
  reliability: {
    minimumSuccessRate: 95,             // Minimum test success rate (%)
    description: 'Test reliability quality gate'
  },
  
  errorRate: {
    maximumErrorRate: 2,                // Maximum error rate (%)
    description: 'Error rate quality gate'
  },
  
  memoryUsage: {
    maximumMemoryIncrease: 50,          // Maximum memory increase (%)
    description: 'Memory usage quality gate'
  }
};

// Monitoring utilities
export class MonitoringConfigManager {
  private static config: MonitoringConfig;
  
  /**
   * Get monitoring configuration for current environment
   */
  static getConfig(): MonitoringConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }
  
  /**
   * Load configuration based on environment
   */
  private static loadConfig(): MonitoringConfig {
    const environment = process.env.NODE_ENV || 'development';
    const envConfig = environmentConfigs[environment] || {};
    
    // Merge default config with environment-specific config
    return this.mergeConfigs(defaultMonitoringConfig, envConfig);
  }
  
  /**
   * Merge configuration objects
   */
  private static mergeConfigs(base: MonitoringConfig, override: Partial<MonitoringConfig>): MonitoringConfig {
    return {
      performance: { ...base.performance, ...override.performance },
      reporting: { ...base.reporting, ...override.reporting },
      monitoring: { ...base.monitoring, ...override.monitoring },
      alerts: { ...base.alerts, ...override.alerts },
      execution: { ...base.execution, ...override.execution }
    };
  }
  
  /**
   * Update configuration at runtime
   */
  static updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = this.mergeConfigs(this.getConfig(), updates);
  }
  
  /**
   * Check if performance meets benchmark
   */
  static checkPerformanceBenchmark(testType: string, operation: string, actualTime: number): {
    passed: boolean;
    benchmark: number;
    description: string;
  } {
    const benchmarks = (performanceBenchmarks as any)[testType];
    if (!benchmarks || !benchmarks[operation]) {
      return {
        passed: true,
        benchmark: 0,
        description: 'No benchmark defined'
      };
    }
    
    const benchmark = benchmarks[operation];
    return {
      passed: actualTime <= benchmark.maxTime,
      benchmark: benchmark.maxTime,
      description: benchmark.description
    };
  }
  
  /**
   * Check quality gates
   */
  static checkQualityGates(metrics: {
    performanceScore: number;
    successRate: number;
    errorRate: number;
    memoryIncrease: number;
  }): {
    passed: boolean;
    failures: string[];
  } {
    const failures: string[] = [];
    
    if (metrics.performanceScore < qualityGates.performance.minimumScore) {
      failures.push(`Performance score ${metrics.performanceScore} below minimum ${qualityGates.performance.minimumScore}`);
    }
    
    if (metrics.successRate < qualityGates.reliability.minimumSuccessRate) {
      failures.push(`Success rate ${metrics.successRate}% below minimum ${qualityGates.reliability.minimumSuccessRate}%`);
    }
    
    if (metrics.errorRate > qualityGates.errorRate.maximumErrorRate) {
      failures.push(`Error rate ${metrics.errorRate}% above maximum ${qualityGates.errorRate.maximumErrorRate}%`);
    }
    
    if (metrics.memoryIncrease > qualityGates.memoryUsage.maximumMemoryIncrease) {
      failures.push(`Memory increase ${metrics.memoryIncrease}% above maximum ${qualityGates.memoryUsage.maximumMemoryIncrease}%`);
    }
    
    return {
      passed: failures.length === 0,
      failures
    };
  }
}

// Export configuration for use in tests
export const monitoringConfig = MonitoringConfigManager.getConfig();
