/**
 * Global Setup for Integration Tests
 * 
 * Sets up the test environment before all integration tests run
 * Part of Phase 1 bridging plan for comprehensive integration testing
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

export default async function globalSetup() {
  console.log('🚀 Setting up SizeWise Suite integration test environment...');
  
  // Set global test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TESTING = 'true';
  process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';
  
  // Configure test timeouts
  jest.setTimeout(30000);
  
  console.log('✅ Integration test environment ready');
}
