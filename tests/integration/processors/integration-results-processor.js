/**
 * Integration Test Results Processor
 * 
 * Processes and formats integration test results for reporting
 * Part of Phase 1 bridging plan for comprehensive integration testing
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

module.exports = (results) => {
  console.log('\n📊 Integration Test Results Summary:');
  console.log(`Total test suites: ${results.numTotalTestSuites}`);
  console.log(`Passed test suites: ${results.numPassedTestSuites}`);
  console.log(`Failed test suites: ${results.numFailedTestSuites}`);
  console.log(`Total tests: ${results.numTotalTests}`);
  console.log(`Passed tests: ${results.numPassedTests}`);
  console.log(`Failed tests: ${results.numFailedTests}`);
  
  if (results.coverageMap) {
    console.log('\n📈 Coverage Summary:');
    const summary = results.coverageMap.getCoverageSummary();
    console.log(`Lines: ${summary.lines.pct}%`);
    console.log(`Functions: ${summary.functions.pct}%`);
    console.log(`Branches: ${summary.branches.pct}%`);
    console.log(`Statements: ${summary.statements.pct}%`);
    
    // Check if we meet the 75% target
    const targetCoverage = 75;
    const linesCoverage = summary.lines.pct;
    
    if (linesCoverage >= targetCoverage) {
      console.log(`\n✅ Integration test coverage target of ${targetCoverage}% achieved!`);
    } else {
      console.log(`\n⚠️  Integration test coverage (${linesCoverage}%) below target of ${targetCoverage}%`);
    }
  }
  
  return results;
};
