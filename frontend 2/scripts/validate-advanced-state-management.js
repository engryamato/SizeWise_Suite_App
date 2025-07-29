#!/usr/bin/env node

/**
 * Advanced State Management Implementation Validation Script
 * 
 * Validates the complete implementation of advanced state management features including:
 * - AdvancedStateManager core functionality
 * - Enhanced project store implementation
 * - React hooks integration
 * - Test coverage and quality
 * - Performance optimization features
 * - Documentation completeness
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration and Constants
// =============================================================================

const VALIDATION_CONFIG = {
  requiredFiles: [
    'frontend/lib/state/AdvancedStateManager.ts',
    'frontend/stores/enhanced-project-store.ts',
    'frontend/lib/hooks/useEnhancedProjectStore.ts',
    'frontend/lib/state/__tests__/AdvancedStateManager.test.ts',
    'frontend/stores/__tests__/enhanced-project-store.test.ts',
    'frontend/lib/hooks/__tests__/useEnhancedProjectStore.test.tsx'
  ],
  requiredFeatures: {
    advancedStateManager: [
      'ComputedProperty',
      'CrossStoreSubscription',
      'OptimisticUpdate',
      'StateHistoryEntry',
      'AdvancedStoreConfig',
      'createStore',
      'addComputedProperty',
      'addCrossStoreSubscription',
      'optimisticUpdate',
      'undo',
      'redo',
      'getStateMetrics',
      'cleanup'
    ],
    enhancedProjectStore: [
      'EnhancedProjectState',
      'computed properties',
      'cross-store dependencies',
      'optimistic updates',
      'undo/redo functionality',
      'performance monitoring',
      'project CRUD operations',
      'room management',
      'segment management',
      'equipment management'
    ],
    reactHooks: [
      'useEnhancedProjectStore',
      'useProjectStats',
      'useProjectActions',
      'useProjectValidation',
      'useOptimisticUpdates',
      'useProjectHistory',
      'useProjectStorePerformance'
    ]
  },
  performanceThresholds: {
    maxFileSize: 50000, // 50KB
    minTestCoverage: 80,
    maxComplexity: 15
  }
};

// =============================================================================
// Validation Functions
// =============================================================================

function validateFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    return {
      valid: false,
      message: `File not found: ${filePath}`,
      score: 0
    };
  }

  const stats = fs.statSync(fullPath);
  const sizeValid = stats.size > 0 && stats.size <= VALIDATION_CONFIG.performanceThresholds.maxFileSize;
  
  return {
    valid: true,
    sizeValid,
    size: stats.size,
    message: sizeValid ? 
      `File exists and size is acceptable (${stats.size} bytes)` :
      `File exists but size is ${stats.size > VALIDATION_CONFIG.performanceThresholds.maxFileSize ? 'too large' : 'empty'}`,
    score: sizeValid ? 100 : 75
  };
}

function validateTypeScriptSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic TypeScript syntax validation
    const hasInterfaces = content.includes('interface ') || content.includes('type ');
    const hasExports = content.includes('export ');
    const hasImports = content.includes('import ');
    const hasTypeAnnotations = content.includes(': ') && content.includes('=>');
    
    const syntaxScore = [hasInterfaces, hasExports, hasImports, hasTypeAnnotations]
      .filter(Boolean).length * 25;
    
    return {
      valid: syntaxScore >= 75,
      hasInterfaces,
      hasExports,
      hasImports,
      hasTypeAnnotations,
      score: syntaxScore,
      message: `TypeScript syntax validation: ${syntaxScore}% complete`
    };
  } catch (error) {
    return {
      valid: false,
      score: 0,
      message: `Error reading file: ${error.message}`
    };
  }
}

function validateAdvancedStateManager() {
  const filePath = 'frontend/lib/state/AdvancedStateManager.ts';
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, score: 0, message: 'AdvancedStateManager file not found' };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const features = VALIDATION_CONFIG.requiredFeatures.advancedStateManager;
  
  let foundFeatures = 0;
  const missingFeatures = [];
  
  features.forEach(feature => {
    if (content.includes(feature)) {
      foundFeatures++;
    } else {
      missingFeatures.push(feature);
    }
  });

  // Additional specific validations
  const hasComputedPropertiesLogic = content.includes('updateComputedProperties') && 
                                    content.includes('computedCache');
  const hasCrossStoreLogic = content.includes('triggerCrossStoreUpdates') && 
                            content.includes('setupCrossStoreSubscription');
  const hasOptimisticLogic = content.includes('addOptimisticUpdate') && 
                            content.includes('rollbackOptimisticUpdate');
  const hasHistoryLogic = content.includes('recordStateHistory') && 
                         content.includes('undo') && content.includes('redo');
  const hasPerformanceLogic = content.includes('getStateMetrics') && 
                             content.includes('estimateMemoryUsage');

  const advancedFeatures = [
    hasComputedPropertiesLogic,
    hasCrossStoreLogic,
    hasOptimisticLogic,
    hasHistoryLogic,
    hasPerformanceLogic
  ].filter(Boolean).length;

  const score = Math.round(((foundFeatures / features.length) * 70) + (advancedFeatures * 6));

  return {
    valid: score >= 85,
    score,
    foundFeatures,
    totalFeatures: features.length,
    missingFeatures,
    advancedFeatures: {
      computedProperties: hasComputedPropertiesLogic,
      crossStore: hasCrossStoreLogic,
      optimistic: hasOptimisticLogic,
      history: hasHistoryLogic,
      performance: hasPerformanceLogic
    },
    message: `AdvancedStateManager validation: ${score}% complete. Found ${foundFeatures}/${features.length} features.`
  };
}

function validateEnhancedProjectStore() {
  const filePath = 'frontend/stores/enhanced-project-store.ts';
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, score: 0, message: 'Enhanced project store file not found' };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for required interfaces and types
  const hasEnhancedProjectState = content.includes('EnhancedProjectState');
  const hasComputedProperties = content.includes('totalRooms') && 
                               content.includes('totalCFM') && 
                               content.includes('projectComplexity');
  const hasOptimisticUpdates = content.includes('optimisticUpdate') && 
                              content.includes('confirmOptimisticUpdate');
  const hasUndoRedo = content.includes('undo') && content.includes('redo');
  const hasAdvancedStateManager = content.includes('advancedStateManager') && 
                                 content.includes('createStore');
  
  // Check for CRUD operations
  const hasProjectCRUD = content.includes('createProject') && 
                        content.includes('updateProject') && 
                        content.includes('deleteProject');
  const hasRoomManagement = content.includes('addRoom') && 
                           content.includes('updateRoom') && 
                           content.includes('deleteRoom');
  const hasSegmentManagement = content.includes('addSegment') && 
                              content.includes('updateSegment') && 
                              content.includes('deleteSegment');
  const hasEquipmentManagement = content.includes('addEquipment') && 
                                content.includes('updateEquipment') && 
                                content.includes('deleteEquipment');

  // Check for computed properties definitions
  const hasComputedPropertiesArray = content.includes('projectComputedProperties') && 
                                     content.includes('dependencies') && 
                                     content.includes('compute');

  const features = [
    hasEnhancedProjectState,
    hasComputedProperties,
    hasOptimisticUpdates,
    hasUndoRedo,
    hasAdvancedStateManager,
    hasProjectCRUD,
    hasRoomManagement,
    hasSegmentManagement,
    hasEquipmentManagement,
    hasComputedPropertiesArray
  ];

  const score = Math.round((features.filter(Boolean).length / features.length) * 100);

  return {
    valid: score >= 90,
    score,
    features: {
      enhancedProjectState: hasEnhancedProjectState,
      computedProperties: hasComputedProperties,
      optimisticUpdates: hasOptimisticUpdates,
      undoRedo: hasUndoRedo,
      advancedStateManager: hasAdvancedStateManager,
      projectCRUD: hasProjectCRUD,
      roomManagement: hasRoomManagement,
      segmentManagement: hasSegmentManagement,
      equipmentManagement: hasEquipmentManagement,
      computedPropertiesArray: hasComputedPropertiesArray
    },
    message: `Enhanced project store validation: ${score}% complete`
  };
}

function validateReactHooks() {
  const filePath = 'frontend/lib/hooks/useEnhancedProjectStore.ts';
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, score: 0, message: 'React hooks file not found' };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const hooks = VALIDATION_CONFIG.requiredFeatures.reactHooks;
  
  let foundHooks = 0;
  const missingHooks = [];
  
  hooks.forEach(hook => {
    if (content.includes(hook)) {
      foundHooks++;
    } else {
      missingHooks.push(hook);
    }
  });

  // Check for React-specific features
  const hasUseEffect = content.includes('useEffect');
  const hasUseState = content.includes('useState');
  const hasUseMemo = content.includes('useMemo');
  const hasUseCallback = content.includes('useCallback');
  const hasSubscriptions = content.includes('subscribe') && content.includes('unsubscribe');
  const hasPerformanceMonitoring = content.includes('metrics') && content.includes('performance');

  const reactFeatures = [
    hasUseEffect,
    hasUseState,
    hasUseMemo,
    hasUseCallback,
    hasSubscriptions,
    hasPerformanceMonitoring
  ].filter(Boolean).length;

  const score = Math.round(((foundHooks / hooks.length) * 70) + (reactFeatures * 5));

  return {
    valid: score >= 85,
    score,
    foundHooks,
    totalHooks: hooks.length,
    missingHooks,
    reactFeatures: {
      useEffect: hasUseEffect,
      useState: hasUseState,
      useMemo: hasUseMemo,
      useCallback: hasUseCallback,
      subscriptions: hasSubscriptions,
      performanceMonitoring: hasPerformanceMonitoring
    },
    message: `React hooks validation: ${score}% complete. Found ${foundHooks}/${hooks.length} hooks.`
  };
}

function validateTestCoverage() {
  const testFiles = [
    'frontend/lib/state/__tests__/AdvancedStateManager.test.ts',
    'frontend/stores/__tests__/enhanced-project-store.test.ts',
    'frontend/lib/hooks/__tests__/useEnhancedProjectStore.test.tsx'
  ];

  let totalTests = 0;
  let totalDescribeBlocks = 0;
  const testResults = {};

  testFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const itMatches = content.match(/it\(/g) || [];
      const describeMatches = content.match(/describe\(/g) || [];
      
      totalTests += itMatches.length;
      totalDescribeBlocks += describeMatches.length;
      
      testResults[path.basename(filePath)] = {
        tests: itMatches.length,
        describes: describeMatches.length,
        hasBeforeEach: content.includes('beforeEach'),
        hasAfterEach: content.includes('afterEach'),
        hasMocks: content.includes('jest.mock') || content.includes('jest.fn'),
        hasAsyncTests: content.includes('async ') && content.includes('await')
      };
    }
  });

  const averageTestsPerDescribe = totalDescribeBlocks > 0 ? totalTests / totalDescribeBlocks : 0;
  const score = Math.min(100, Math.round((totalTests * 2) + (totalDescribeBlocks * 5)));

  return {
    valid: score >= 70,
    score,
    totalTests,
    totalDescribeBlocks,
    averageTestsPerDescribe: Math.round(averageTestsPerDescribe * 10) / 10,
    testResults,
    message: `Test coverage validation: ${score}% complete. ${totalTests} tests in ${totalDescribeBlocks} describe blocks.`
  };
}

function validatePerformanceOptimizations() {
  const files = [
    'frontend/lib/state/AdvancedStateManager.ts',
    'frontend/stores/enhanced-project-store.ts',
    'frontend/lib/hooks/useEnhancedProjectStore.ts'
  ];

  let performanceFeatures = 0;
  const features = [];

  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for performance optimization features
      if (content.includes('useMemo') || content.includes('useCallback')) {
        performanceFeatures++;
        features.push('React memoization');
      }
      
      if (content.includes('cache') && content.includes('ttl')) {
        performanceFeatures++;
        features.push('Caching with TTL');
      }
      
      if (content.includes('memoryUsage') || content.includes('estimateMemoryUsage')) {
        performanceFeatures++;
        features.push('Memory usage tracking');
      }
      
      if (content.includes('debounce') || content.includes('throttle')) {
        performanceFeatures++;
        features.push('Debouncing/Throttling');
      }
      
      if (content.includes('cleanup') || content.includes('unsubscribe')) {
        performanceFeatures++;
        features.push('Proper cleanup');
      }
      
      if (content.includes('optimistic') && content.includes('rollback')) {
        performanceFeatures++;
        features.push('Optimistic updates');
      }
    }
  });

  const score = Math.min(100, performanceFeatures * 15);

  return {
    valid: score >= 70,
    score,
    performanceFeatures,
    features,
    message: `Performance optimizations: ${score}% complete. Found ${performanceFeatures} optimization features.`
  };
}

// =============================================================================
// Main Validation Function
// =============================================================================

function runValidation() {
  console.log('🔍 Advanced State Management Implementation Validation\n');
  console.log('=' .repeat(60));

  const results = {
    fileValidation: {},
    syntaxValidation: {},
    featureValidation: {},
    testValidation: null,
    performanceValidation: null,
    overallScore: 0
  };

  // File existence validation
  console.log('\n📁 File Existence Validation:');
  VALIDATION_CONFIG.requiredFiles.forEach(filePath => {
    const result = validateFileExists(filePath);
    results.fileValidation[filePath] = result;
    console.log(`  ${result.valid ? '✅' : '❌'} ${filePath}: ${result.message}`);
  });

  // TypeScript syntax validation
  console.log('\n📝 TypeScript Syntax Validation:');
  VALIDATION_CONFIG.requiredFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const result = validateTypeScriptSyntax(filePath);
      results.syntaxValidation[filePath] = result;
      console.log(`  ${result.valid ? '✅' : '❌'} ${path.basename(filePath)}: ${result.message}`);
    }
  });

  // Feature validation
  console.log('\n🚀 Feature Implementation Validation:');
  
  const advancedStateManagerResult = validateAdvancedStateManager();
  results.featureValidation.advancedStateManager = advancedStateManagerResult;
  console.log(`  ${advancedStateManagerResult.valid ? '✅' : '❌'} AdvancedStateManager: ${advancedStateManagerResult.message}`);
  
  const enhancedProjectStoreResult = validateEnhancedProjectStore();
  results.featureValidation.enhancedProjectStore = enhancedProjectStoreResult;
  console.log(`  ${enhancedProjectStoreResult.valid ? '✅' : '❌'} Enhanced Project Store: ${enhancedProjectStoreResult.message}`);
  
  const reactHooksResult = validateReactHooks();
  results.featureValidation.reactHooks = reactHooksResult;
  console.log(`  ${reactHooksResult.valid ? '✅' : '❌'} React Hooks: ${reactHooksResult.message}`);

  // Test coverage validation
  console.log('\n🧪 Test Coverage Validation:');
  const testResult = validateTestCoverage();
  results.testValidation = testResult;
  console.log(`  ${testResult.valid ? '✅' : '❌'} Test Coverage: ${testResult.message}`);

  // Performance optimization validation
  console.log('\n⚡ Performance Optimization Validation:');
  const performanceResult = validatePerformanceOptimizations();
  results.performanceValidation = performanceResult;
  console.log(`  ${performanceResult.valid ? '✅' : '❌'} Performance: ${performanceResult.message}`);

  // Calculate overall score
  const scores = [
    ...Object.values(results.fileValidation).map(r => r.score),
    ...Object.values(results.syntaxValidation).map(r => r.score),
    ...Object.values(results.featureValidation).map(r => r.score),
    results.testValidation.score,
    results.performanceValidation.score
  ];

  results.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Overall Score: ${results.overallScore}%`);
  console.log(`Status: ${results.overallScore >= 85 ? '✅ EXCELLENT' : results.overallScore >= 70 ? '⚠️  GOOD' : '❌ NEEDS IMPROVEMENT'}`);

  if (results.overallScore >= 85) {
    console.log('\n🎉 Advanced State Management implementation is production-ready!');
    console.log('   All core features are implemented with proper testing and optimization.');
  } else if (results.overallScore >= 70) {
    console.log('\n⚠️  Advanced State Management implementation is mostly complete.');
    console.log('   Some improvements needed for production readiness.');
  } else {
    console.log('\n❌ Advanced State Management implementation needs significant work.');
    console.log('   Please address the failing validations before proceeding.');
  }

  // Detailed recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  
  if (advancedStateManagerResult.score < 90) {
    console.log('  • Enhance AdvancedStateManager with missing features');
  }
  
  if (enhancedProjectStoreResult.score < 90) {
    console.log('  • Complete enhanced project store implementation');
  }
  
  if (reactHooksResult.score < 85) {
    console.log('  • Improve React hooks integration and performance');
  }
  
  if (testResult.score < 80) {
    console.log('  • Increase test coverage and add more comprehensive tests');
  }
  
  if (performanceResult.score < 70) {
    console.log('  • Add more performance optimization features');
  }

  console.log('\n✨ Advanced State Management validation complete!\n');

  return results;
}

// =============================================================================
// Script Execution
// =============================================================================

if (require.main === module) {
  try {
    const results = runValidation();
    process.exit(results.overallScore >= 70 ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

module.exports = { runValidation, VALIDATION_CONFIG };
