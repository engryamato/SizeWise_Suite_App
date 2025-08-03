/**
 * Hook Validation Utility
 * 
 * Consolidates React hook validation logic that was duplicated across
 * multiple validation scripts in the frontend/scripts/ directory.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface HookValidationConfig {
  hookName: string;
  requiredFeatures: string[];
  customChecks?: Record<string, (content: string) => boolean>;
  filePath: string;
}

export interface ReactPatternResult {
  hasReactImports: boolean;
  hasUseState: boolean;
  hasUseEffect: boolean;
  hasUseCallback: boolean;
  hasUseMemo: boolean;
  hasErrorHandling: boolean;
  hasLoadingState: boolean;
  hasCleanupLogic: boolean;
  hasTypeScript: boolean;
  score: number;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  foundFeatures: number;
  totalFeatures: number;
  missingFeatures: string[];
  reactPatterns: ReactPatternResult;
  customCheckResults: Record<string, boolean>;
  message: string;
}

export interface ValidationReport {
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  averageScore: number;
  results: ValidationResult[];
  summary: string;
}

/**
 * Centralized React Hook Validator
 * Replaces duplicated validation logic across multiple scripts
 */
export class HookValidator {
  
  /**
   * Validate a React hook file against configuration
   */
  static validateHook(config: HookValidationConfig): ValidationResult {
    if (!fs.existsSync(config.filePath)) {
      return {
        valid: false,
        score: 0,
        foundFeatures: 0,
        totalFeatures: config.requiredFeatures.length,
        missingFeatures: config.requiredFeatures,
        reactPatterns: this.getEmptyReactPatterns(),
        customCheckResults: {},
        message: `Hook file not found: ${config.filePath}`
      };
    }

    const content = fs.readFileSync(config.filePath, 'utf8');
    
    // Check required features
    const foundFeatures: string[] = [];
    const missingFeatures: string[] = [];
    
    config.requiredFeatures.forEach(feature => {
      if (content.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    });

    // Validate React patterns
    const reactPatterns = this.validateReactPatterns(content);
    
    // Run custom checks
    const customCheckResults: Record<string, boolean> = {};
    if (config.customChecks) {
      Object.entries(config.customChecks).forEach(([checkName, checkFn]) => {
        customCheckResults[checkName] = checkFn(content);
      });
    }

    // Calculate score
    const featureScore = (foundFeatures.length / config.requiredFeatures.length) * 70;
    const reactScore = reactPatterns.score * 0.25;
    const customScore = Object.values(customCheckResults).filter(Boolean).length * 5;
    const totalScore = Math.round(featureScore + reactScore + customScore);

    return {
      valid: totalScore >= 85,
      score: totalScore,
      foundFeatures: foundFeatures.length,
      totalFeatures: config.requiredFeatures.length,
      missingFeatures,
      reactPatterns,
      customCheckResults,
      message: `Hook validation: ${totalScore}% complete. Found ${foundFeatures.length}/${config.requiredFeatures.length} features.`
    };
  }

  /**
   * Validate React patterns in hook content
   */
  static validateReactPatterns(content: string): ReactPatternResult {
    const patterns = {
      hasReactImports: content.includes('react') || content.includes('React'),
      hasUseState: content.includes('useState'),
      hasUseEffect: content.includes('useEffect'),
      hasUseCallback: content.includes('useCallback'),
      hasUseMemo: content.includes('useMemo'),
      hasErrorHandling: content.includes('error') || content.includes('Error') || content.includes('try') || content.includes('catch'),
      hasLoadingState: content.includes('loading') || content.includes('isLoading') || content.includes('Loading'),
      hasCleanupLogic: content.includes('cleanup') || content.includes('unmount') || content.includes('return () =>'),
      hasTypeScript: content.includes('interface') || content.includes('type ') || content.includes(': React.FC')
    };

    // Calculate score based on React best practices
    const patternCount = Object.values(patterns).filter(Boolean).length;
    const score = Math.round((patternCount / Object.keys(patterns).length) * 100);

    return {
      ...patterns,
      score
    };
  }

  /**
   * Generate comprehensive validation report for multiple hooks
   */
  static generateValidationReport(configs: HookValidationConfig[]): ValidationReport {
    const results = configs.map(config => this.validateHook(config));
    
    const passedFiles = results.filter(r => r.valid).length;
    const failedFiles = results.length - passedFiles;
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );

    const summary = `Validation Summary: ${passedFiles}/${results.length} files passed (${averageScore}% average score)`;

    return {
      totalFiles: results.length,
      passedFiles,
      failedFiles,
      averageScore,
      results,
      summary
    };
  }

  /**
   * Create standard hook validation configs for common patterns
   */
  static createStandardConfigs(): Record<string, Partial<HookValidationConfig>> {
    return {
      stateManagement: {
        requiredFeatures: [
          'useState',
          'useEffect',
          'useCallback',
          'cleanup',
          'error handling'
        ],
        customChecks: {
          hasProperCleanup: (content) => content.includes('return () =>') || content.includes('cleanup'),
          hasErrorBoundary: (content) => content.includes('ErrorBoundary') || content.includes('error'),
          hasTypeDefinitions: (content) => content.includes('interface') && content.includes('export')
        }
      },
      
      apiIntegration: {
        requiredFeatures: [
          'useState',
          'useEffect',
          'useCallback',
          'loading',
          'error',
          'cleanup'
        ],
        customChecks: {
          hasLoadingState: (content) => content.includes('loading') || content.includes('isLoading'),
          hasErrorHandling: (content) => content.includes('error') && content.includes('catch'),
          hasAbortController: (content) => content.includes('AbortController') || content.includes('signal')
        }
      },

      performanceOptimized: {
        requiredFeatures: [
          'useMemo',
          'useCallback',
          'performance',
          'metrics'
        ],
        customChecks: {
          hasMemoization: (content) => content.includes('useMemo') && content.includes('useCallback'),
          hasPerformanceMonitoring: (content) => content.includes('performance') || content.includes('metrics'),
          hasLazyLoading: (content) => content.includes('lazy') || content.includes('Suspense')
        }
      }
    };
  }

  /**
   * Validate multiple hook files with batch processing
   */
  static validateHookBatch(
    filePaths: string[], 
    configType: keyof ReturnType<typeof HookValidator.createStandardConfigs>
  ): ValidationReport {
    const standardConfigs = this.createStandardConfigs();
    const baseConfig = standardConfigs[configType];
    
    const configs: HookValidationConfig[] = filePaths.map(filePath => ({
      hookName: path.basename(filePath, path.extname(filePath)),
      filePath,
      ...baseConfig
    } as HookValidationConfig));

    return this.generateValidationReport(configs);
  }

  /**
   * Get empty React patterns result for error cases
   */
  private static getEmptyReactPatterns(): ReactPatternResult {
    return {
      hasReactImports: false,
      hasUseState: false,
      hasUseEffect: false,
      hasUseCallback: false,
      hasUseMemo: false,
      hasErrorHandling: false,
      hasLoadingState: false,
      hasCleanupLogic: false,
      hasTypeScript: false,
      score: 0
    };
  }

  /**
   * Export validation results to JSON for CI/CD integration
   */
  static exportResults(report: ValidationReport, outputPath: string): void {
    const exportData = {
      timestamp: new Date().toISOString(),
      report,
      metadata: {
        tool: 'HookValidator',
        version: '1.0.0'
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  }
}

/**
 * Utility functions for common validation patterns
 */
export const HookValidationUtils = {
  /**
   * Check if hook follows naming convention
   */
  isValidHookName: (name: string): boolean => {
    return /^use[A-Z][a-zA-Z]*$/.test(name);
  },

  /**
   * Extract hook dependencies from useEffect
   */
  extractDependencies: (content: string): string[] => {
    const dependencyRegex = /useEffect\([^,]+,\s*\[([^\]]*)\]/g;
    const dependencies: string[] = [];
    let match;
    
    while ((match = dependencyRegex.exec(content)) !== null) {
      const deps = match[1].split(',').map(dep => dep.trim().replace(/['"]/g, ''));
      dependencies.push(...deps.filter(dep => dep.length > 0));
    }
    
    return [...new Set(dependencies)];
  },

  /**
   * Check for potential memory leaks in hooks
   */
  checkMemoryLeaks: (content: string): string[] => {
    const issues: string[] = [];
    
    if (content.includes('setInterval') && !content.includes('clearInterval')) {
      issues.push('setInterval without clearInterval');
    }
    
    if (content.includes('setTimeout') && !content.includes('clearTimeout')) {
      issues.push('setTimeout without clearTimeout');
    }
    
    if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
      issues.push('addEventListener without removeEventListener');
    }
    
    return issues;
  }
};
