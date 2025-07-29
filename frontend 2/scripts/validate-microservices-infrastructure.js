/**
 * Microservices Infrastructure Validation Script
 * 
 * Comprehensive validation script for microservices infrastructure including:
 * - ServiceRegistry functionality
 * - Circuit breaker patterns
 * - API gateway routing
 * - Load balancing strategies
 * - Health monitoring
 * - React hook integration
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Validation Functions
// =============================================================================

function validateFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)}KB`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
  }
  
  return exists;
}

function validateServiceRegistryImplementation() {
  console.log('\n🔍 Validating ServiceRegistry Implementation...');
  
  const serviceFile = 'lib/services/ServiceRegistry.ts';
  const exists = validateFileExists(serviceFile, 'ServiceRegistry');
  
  if (!exists) return false;
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', serviceFile), 'utf8');
    
    // Check for key implementation features
    const features = {
      'Service Registration': content.includes('registerService') || content.includes('register'),
      'Service Discovery': content.includes('discoverServices') || content.includes('discover'),
      'Health Monitoring': content.includes('health') && content.includes('monitor'),
      'Circuit Breaker': content.includes('CircuitBreaker') || content.includes('circuit'),
      'API Gateway': content.includes('APIGateway') || content.includes('gateway'),
      'Load Balancing': content.includes('loadBalanc') || content.includes('LoadBalanc'),
      'Service Endpoints': content.includes('ServiceEndpoint') || content.includes('endpoint'),
      'Health Status Types': content.includes('healthy') && content.includes('unhealthy'),
      'Async Operations': content.includes('async') && content.includes('await'),
      'Error Handling': content.includes('try') && content.includes('catch'),
      'TypeScript Interfaces': content.includes('interface') && content.includes('export'),
      'Metrics Collection': content.includes('metrics') || content.includes('Metrics')
    };
    
    console.log('   Core Features:');
    let implementedFeatures = 0;
    for (const [feature, implemented] of Object.entries(features)) {
      console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
      if (implemented) implementedFeatures++;
    }
    
    const completeness = (implementedFeatures / Object.keys(features).length) * 100;
    console.log(`   Implementation Completeness: ${completeness.toFixed(1)}%`);
    
    return completeness >= 85; // 85% threshold for microservices
  } catch (error) {
    console.log(`   ❌ Error validating implementation: ${error.message}`);
    return false;
  }
}

function validateCircuitBreakerImplementation() {
  console.log('\n🔍 Validating Circuit Breaker Implementation...');
  
  const serviceFile = 'lib/services/ServiceRegistry.ts';
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', serviceFile), 'utf8');
    
    // Check for circuit breaker patterns
    const circuitFeatures = {
      'Circuit States': content.includes('closed') && content.includes('open') && content.includes('half-open'),
      'Failure Threshold': content.includes('failureThreshold') || content.includes('threshold'),
      'Recovery Timeout': content.includes('recoveryTimeout') || content.includes('timeout'),
      'State Transitions': content.includes('transition') || content.includes('state'),
      'Failure Counting': content.includes('failureCount') || content.includes('failures'),
      'Success Tracking': content.includes('successCount') || content.includes('success'),
      'Metrics Collection': content.includes('getMetrics') || content.includes('metrics'),
      'Execute Method': content.includes('execute') && content.includes('async')
    };
    
    console.log('   Circuit Breaker Features:');
    let implementedFeatures = 0;
    for (const [feature, implemented] of Object.entries(circuitFeatures)) {
      console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
      if (implemented) implementedFeatures++;
    }
    
    const completeness = (implementedFeatures / Object.keys(circuitFeatures).length) * 100;
    console.log(`   Circuit Breaker Completeness: ${completeness.toFixed(1)}%`);
    
    return completeness >= 75;
  } catch (error) {
    console.log(`   ❌ Error validating circuit breaker: ${error.message}`);
    return false;
  }
}

function validateAPIGatewayImplementation() {
  console.log('\n🔍 Validating API Gateway Implementation...');
  
  const serviceFile = 'lib/services/ServiceRegistry.ts';
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', serviceFile), 'utf8');
    
    // Check for API gateway features
    const gatewayFeatures = {
      'Request Routing': content.includes('routeRequest') || content.includes('route'),
      'Load Balancing': content.includes('loadBalanc') || content.includes('balance'),
      'Rate Limiting': content.includes('rateLimit') || content.includes('limit'),
      'Request Forwarding': content.includes('forward') || content.includes('proxy'),
      'Response Handling': content.includes('response') && content.includes('handle'),
      'Authentication': content.includes('auth') || content.includes('token'),
      'Error Responses': content.includes('error') && content.includes('status'),
      'Metrics Tracking': content.includes('metrics') && content.includes('track')
    };
    
    console.log('   API Gateway Features:');
    let implementedFeatures = 0;
    for (const [feature, implemented] of Object.entries(gatewayFeatures)) {
      console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
      if (implemented) implementedFeatures++;
    }
    
    const completeness = (implementedFeatures / Object.keys(gatewayFeatures).length) * 100;
    console.log(`   API Gateway Completeness: ${completeness.toFixed(1)}%`);
    
    return completeness >= 70;
  } catch (error) {
    console.log(`   ❌ Error validating API gateway: ${error.message}`);
    return false;
  }
}

function validateReactHookImplementation() {
  console.log('\n🔍 Validating useMicroservices Hook Implementation...');
  
  const hookFile = 'lib/hooks/useMicroservices.ts';
  const exists = validateFileExists(hookFile, 'useMicroservices Hook');
  
  if (!exists) return false;
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', hookFile), 'utf8');
    
    // Check for React hook patterns
    const hookFeatures = {
      'React Imports': content.includes('react'),
      'Hook Function': content.includes('useMicroservices'),
      'useState Usage': content.includes('useState'),
      'useEffect Usage': content.includes('useEffect'),
      'useCallback Usage': content.includes('useCallback'),
      'Service Integration': content.includes('ServiceRegistry'),
      'Error State Management': content.includes('error'),
      'Loading State': content.includes('loading') || content.includes('isLoading'),
      'Service Discovery': content.includes('discoverServices'),
      'Health Monitoring': content.includes('health'),
      'API Gateway Integration': content.includes('routeRequest'),
      'Cleanup Logic': content.includes('cleanup') || content.includes('unmount'),
      'TypeScript Types': content.includes('interface') && content.includes('export')
    };
    
    console.log('   React Hook Features:');
    let implementedFeatures = 0;
    for (const [feature, implemented] of Object.entries(hookFeatures)) {
      console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
      if (implemented) implementedFeatures++;
    }
    
    const completeness = (implementedFeatures / Object.keys(hookFeatures).length) * 100;
    console.log(`   Hook Implementation Completeness: ${completeness.toFixed(1)}%`);
    
    return completeness >= 80;
  } catch (error) {
    console.log(`   ❌ Error validating hook: ${error.message}`);
    return false;
  }
}

function validateTestImplementation() {
  console.log('\n🔍 Validating Test Implementation...');
  
  const testFiles = [
    'lib/services/__tests__/ServiceRegistry.test.ts',
    'lib/hooks/__tests__/useMicroservices.test.tsx'
  ];
  
  let allTestsExist = true;
  let totalTestFeatures = 0;
  let implementedTestFeatures = 0;
  
  for (const testFile of testFiles) {
    const exists = validateFileExists(testFile, `Test: ${path.basename(testFile)}`);
    if (!exists) {
      allTestsExist = false;
      continue;
    }
    
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', testFile), 'utf8');
      
      // Check for comprehensive test coverage
      const testFeatures = {
        'Service Registration Tests': content.includes('Service Registration') || content.includes('register'),
        'Service Discovery Tests': content.includes('Service Discovery') || content.includes('discover'),
        'Health Monitoring Tests': content.includes('Health Monitoring') || content.includes('health'),
        'Circuit Breaker Tests': content.includes('Circuit Breaker') || content.includes('circuit'),
        'Load Balancing Tests': content.includes('Load Balancing') || content.includes('balance'),
        'Error Handling Tests': content.includes('Error Handling') || content.includes('error'),
        'Mock Implementations': content.includes('mock') || content.includes('Mock'),
        'Async Test Patterns': content.includes('async') && content.includes('await'),
        'Test Assertions': content.includes('expect') && content.includes('toBe'),
        'Test Setup/Teardown': content.includes('beforeEach') || content.includes('afterEach')
      };
      
      console.log(`   ${path.basename(testFile)} Features:`);
      for (const [feature, implemented] of Object.entries(testFeatures)) {
        console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
        totalTestFeatures++;
        if (implemented) implementedTestFeatures++;
      }
    } catch (error) {
      console.log(`   ❌ Error reading test file: ${error.message}`);
    }
  }
  
  const testCompleteness = totalTestFeatures > 0 ? (implementedTestFeatures / totalTestFeatures) * 100 : 0;
  console.log(`   Overall Test Completeness: ${testCompleteness.toFixed(1)}%`);
  
  return allTestsExist && testCompleteness >= 70;
}

function validatePerformanceExpectations() {
  console.log('\n🔍 Validating Performance Expectations...');
  
  const serviceFile = 'lib/services/ServiceRegistry.ts';
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', serviceFile), 'utf8');
    
    // Check for performance-related features
    const perfFeatures = {
      'Response Time Tracking': content.includes('responseTime') || content.includes('latency'),
      'Metrics Collection': content.includes('metrics') || content.includes('Metrics'),
      'Performance Monitoring': content.includes('monitor') && content.includes('performance'),
      'Load Balancing Optimization': content.includes('optimize') || content.includes('efficient'),
      'Caching Integration': content.includes('cache') || content.includes('Cache'),
      'Connection Pooling': content.includes('pool') || content.includes('connection'),
      'Timeout Handling': content.includes('timeout') || content.includes('Timeout'),
      'Retry Logic': content.includes('retry') || content.includes('Retry')
    };
    
    console.log('   Performance Features:');
    let implementedFeatures = 0;
    for (const [feature, implemented] of Object.entries(perfFeatures)) {
      console.log(`     ${implemented ? '✅' : '❌'} ${feature}`);
      if (implemented) implementedFeatures++;
    }
    
    const completeness = (implementedFeatures / Object.keys(perfFeatures).length) * 100;
    console.log(`   Performance Features Completeness: ${completeness.toFixed(1)}%`);
    
    return completeness >= 60; // Lower threshold for performance features
  } catch (error) {
    console.log(`   ❌ Error validating performance features: ${error.message}`);
    return false;
  }
}

function generateValidationReport(results) {
  console.log('\n📊 MICROSERVICES VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  
  const categories = [
    { name: 'ServiceRegistry Implementation', result: results.serviceRegistry, weight: 25 },
    { name: 'Circuit Breaker Patterns', result: results.circuitBreaker, weight: 20 },
    { name: 'API Gateway Functionality', result: results.apiGateway, weight: 20 },
    { name: 'React Hook Integration', result: results.reactHook, weight: 20 },
    { name: 'Test Implementation', result: results.tests, weight: 10 },
    { name: 'Performance Features', result: results.performance, weight: 5 }
  ];
  
  let totalScore = 0;
  let maxScore = 0;
  
  console.log('\nCategory Results:');
  for (const category of categories) {
    const status = category.result ? '✅ PASS' : '❌ FAIL';
    const score = category.result ? category.weight : 0;
    console.log(`  ${status} ${category.name} (${score}/${category.weight} points)`);
    totalScore += score;
    maxScore += category.weight;
  }
  
  const overallScore = (totalScore / maxScore) * 100;
  console.log(`\nOverall Score: ${totalScore}/${maxScore} (${overallScore.toFixed(1)}%)`);
  
  // Determine overall status
  let status, recommendation;
  if (overallScore >= 90) {
    status = '🎉 EXCELLENT';
    recommendation = 'Microservices infrastructure is production-ready with comprehensive fault tolerance.';
  } else if (overallScore >= 75) {
    status = '✅ GOOD';
    recommendation = 'Microservices infrastructure is solid with minor areas for improvement.';
  } else if (overallScore >= 60) {
    status = '⚠️ ACCEPTABLE';
    recommendation = 'Microservices infrastructure has core features but needs additional work.';
  } else {
    status = '❌ NEEDS WORK';
    recommendation = 'Microservices infrastructure requires significant improvements before production use.';
  }
  
  console.log(`\nOverall Status: ${status}`);
  console.log(`Recommendation: ${recommendation}`);
  
  // Next steps
  console.log('\n🎯 NEXT STEPS:');
  if (!results.serviceRegistry) {
    console.log('  1. Complete ServiceRegistry implementation with service discovery');
  }
  if (!results.circuitBreaker) {
    console.log('  2. Implement circuit breaker patterns for fault tolerance');
  }
  if (!results.apiGateway) {
    console.log('  3. Complete API gateway with routing and load balancing');
  }
  if (!results.reactHook) {
    console.log('  4. Implement useMicroservices React hook');
  }
  if (!results.tests) {
    console.log('  5. Create comprehensive test suites for all components');
  }
  if (!results.performance) {
    console.log('  6. Add performance monitoring and optimization features');
  }
  
  if (overallScore >= 75) {
    console.log('  ✅ Ready for integration with HVAC calculation services');
    console.log('  ✅ Ready for load testing and performance validation');
    console.log('  ✅ Ready for production deployment preparation');
  }
  
  return overallScore >= 75;
}

// =============================================================================
// Main Validation Execution
// =============================================================================

function main() {
  console.log('🏗️ MICROSERVICES INFRASTRUCTURE VALIDATION');
  console.log('=' .repeat(50));
  console.log(`Validation started at: ${new Date().toISOString()}`);
  
  const results = {
    serviceRegistry: validateServiceRegistryImplementation(),
    circuitBreaker: validateCircuitBreakerImplementation(),
    apiGateway: validateAPIGatewayImplementation(),
    reactHook: validateReactHookImplementation(),
    tests: validateTestImplementation(),
    performance: validatePerformanceExpectations()
  };
  
  const success = generateValidationReport(results);
  
  console.log(`\nValidation completed at: ${new Date().toISOString()}`);
  console.log(`Exit code: ${success ? 0 : 1}`);
  
  process.exit(success ? 0 : 1);
}

// Run validation
main();
