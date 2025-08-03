/**
 * Consolidated Validation Runner
 * 
 * Replaces multiple validation scripts with a single runner that uses
 * the new HookValidator utility to eliminate code duplication.
 */

const fs = require('fs');
const path = require('path');

// Import the HookValidator (would be compiled from TypeScript in real usage)
// For now, we'll implement a simplified version that matches the interface

class HookValidator {
  static validateHook(config) {
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
    const foundFeatures = [];
    const missingFeatures = [];
    
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
    const customCheckResults = {};
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

  static validateReactPatterns(content) {
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

    const patternCount = Object.values(patterns).filter(Boolean).length;
    const score = Math.round((patternCount / Object.keys(patterns).length) * 100);

    return { ...patterns, score };
  }

  static getEmptyReactPatterns() {
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

  static generateValidationReport(configs) {
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
}

// Validation configurations for different hook types
const VALIDATION_CONFIGS = {
  advancedStateManagement: {
    hookName: 'useEnhancedProjectStore',
    filePath: 'frontend/lib/hooks/useEnhancedProjectStore.ts',
    requiredFeatures: [
      'useEnhancedProjectStore',
      'useProjectStats',
      'useProjectActions',
      'useProjectValidation',
      'useOptimisticUpdates',
      'useProjectHistory',
      'useProjectStorePerformance'
    ],
    customChecks: {
      hasStateManagement: (content) => content.includes('useState') && content.includes('useEffect'),
      hasPerformanceOptimization: (content) => content.includes('useMemo') || content.includes('useCallback'),
      hasErrorHandling: (content) => content.includes('error') && content.includes('catch'),
      hasCleanup: (content) => content.includes('cleanup') || content.includes('unmount')
    }
  },

  cachingImplementation: {
    hookName: 'useAdvancedCaching',
    filePath: 'frontend/lib/hooks/useAdvancedCaching.ts',
    requiredFeatures: [
      'useAdvancedCaching',
      'AdvancedCachingService',
      'useState',
      'useEffect',
      'useCallback'
    ],
    customChecks: {
      hasCacheIntegration: (content) => content.includes('AdvancedCachingService'),
      hasLoadingState: (content) => content.includes('loading') || content.includes('isLoading'),
      hasErrorState: (content) => content.includes('error'),
      hasCleanupLogic: (content) => content.includes('cleanup') || content.includes('unmount')
    }
  },

  wasmPerformance: {
    hookName: 'useWASMCalculations',
    filePath: 'frontend/lib/hooks/useWASMCalculations.ts',
    requiredFeatures: [
      'useWASMCalculations',
      'WASMCalculationService',
      'useState',
      'useEffect',
      'useCallback'
    ],
    customChecks: {
      hasWASMIntegration: (content) => content.includes('WASMCalculationService'),
      hasPerformanceMonitoring: (content) => content.includes('performance') || content.includes('metrics'),
      hasFallbackHandling: (content) => content.includes('fallback') || content.includes('Fallback'),
      hasLoadingState: (content) => content.includes('loading') || content.includes('isLoading')
    }
  },

  microservicesInfrastructure: {
    hookName: 'useMicroservices',
    filePath: 'frontend/lib/hooks/useMicroservices.ts',
    requiredFeatures: [
      'useMicroservices',
      'ServiceRegistry',
      'useState',
      'useEffect',
      'useCallback'
    ],
    customChecks: {
      hasServiceIntegration: (content) => content.includes('ServiceRegistry'),
      hasServiceDiscovery: (content) => content.includes('discoverServices'),
      hasHealthMonitoring: (content) => content.includes('health'),
      hasAPIGatewayIntegration: (content) => content.includes('routeRequest')
    }
  }
};

/**
 * Main validation function that runs all hook validations
 */
function runConsolidatedValidation() {
  console.log('🔍 Running Consolidated Hook Validation...\n');

  const allConfigs = Object.values(VALIDATION_CONFIGS);
  const report = HookValidator.generateValidationReport(allConfigs);

  // Display results
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Files: ${report.totalFiles}`);
  console.log(`Passed: ${report.passedFiles}`);
  console.log(`Failed: ${report.failedFiles}`);
  console.log(`Average Score: ${report.averageScore}%`);
  console.log('');

  // Display individual results
  report.results.forEach((result, index) => {
    const config = allConfigs[index];
    const status = result.valid ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${status} ${config.hookName} (${result.score}%)`);
    console.log(`  File: ${config.filePath}`);
    console.log(`  Features: ${result.foundFeatures}/${result.totalFeatures}`);
    
    if (result.missingFeatures.length > 0) {
      console.log(`  Missing: ${result.missingFeatures.join(', ')}`);
    }
    
    // Show React patterns
    const reactPatterns = result.reactPatterns;
    const reactScore = reactPatterns.score;
    console.log(`  React Patterns: ${reactScore}%`);
    
    // Show custom check results
    const customResults = Object.entries(result.customCheckResults);
    if (customResults.length > 0) {
      const passedCustom = customResults.filter(([, passed]) => passed).length;
      console.log(`  Custom Checks: ${passedCustom}/${customResults.length}`);
    }
    
    console.log('');
  });

  // Summary
  console.log('📋 SUMMARY');
  console.log('='.repeat(50));
  console.log(report.summary);
  
  if (report.failedFiles > 0) {
    console.log('\n⚠️  Some validations failed. Please check the missing features and fix the issues.');
    process.exit(1);
  } else {
    console.log('\n🎉 All validations passed successfully!');
  }

  // Export results for CI/CD
  const exportData = {
    timestamp: new Date().toISOString(),
    report,
    metadata: {
      tool: 'ConsolidatedValidationRunner',
      version: '1.0.0',
      eliminatedDuplication: '200+ lines of duplicate validation logic'
    }
  };

  fs.writeFileSync('validation-results.json', JSON.stringify(exportData, null, 2));
  console.log('\n📄 Results exported to validation-results.json');
}

/**
 * Run specific validation by name
 */
function runSpecificValidation(validationName) {
  const config = VALIDATION_CONFIGS[validationName];
  if (!config) {
    console.error(`❌ Unknown validation: ${validationName}`);
    console.log('Available validations:', Object.keys(VALIDATION_CONFIGS).join(', '));
    process.exit(1);
  }

  console.log(`🔍 Running ${validationName} validation...\n`);
  
  const result = HookValidator.validateHook(config);
  const status = result.valid ? '✅ PASS' : '❌ FAIL';
  
  console.log(`${status} ${config.hookName} (${result.score}%)`);
  console.log(result.message);
  
  if (!result.valid) {
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runConsolidatedValidation();
  } else if (args[0] === '--specific' && args[1]) {
    runSpecificValidation(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node consolidated-validation-runner.js                    # Run all validations');
    console.log('  node consolidated-validation-runner.js --specific <name>  # Run specific validation');
    console.log('');
    console.log('Available validations:', Object.keys(VALIDATION_CONFIGS).join(', '));
  }
}

module.exports = {
  HookValidator,
  VALIDATION_CONFIGS,
  runConsolidatedValidation,
  runSpecificValidation
};
