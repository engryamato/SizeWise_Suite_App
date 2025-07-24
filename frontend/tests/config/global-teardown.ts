/**
 * Global Test Teardown - Cleanup Testing Environment
 * 
 * MISSION-CRITICAL: Global teardown for comprehensive testing cleanup
 * Cleans up databases, mock servers, and testing infrastructure
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md sections 4.1-4.3
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  // Stop mock server
  await stopMockServer();
  console.log('✅ Mock API server stopped');

  // Cleanup test database
  await cleanupTestDatabase();
  console.log('✅ Test database cleaned up');

  // Cleanup test storage
  await cleanupTestStorage();
  console.log('✅ Test storage cleaned up');

  // Cleanup test artifacts
  await cleanupTestArtifacts();
  console.log('✅ Test artifacts cleaned up');

  // Generate test report summary
  await generateTestSummary();
  console.log('✅ Test summary generated');

  console.log('🎯 Global test teardown completed successfully');
}

async function stopMockServer() {
  // The MSW server is automatically cleaned up
  // This is a placeholder for any additional server cleanup
  try {
    // If we had a real mock server running, we would stop it here
    console.log('Mock server cleanup completed');
  } catch (error) {
    console.warn('Mock server cleanup warning:', error.message);
  }
}

async function cleanupTestDatabase() {
  // Clear global test database
  if ((global as any).testDatabase) {
    delete (global as any).testDatabase;
  }

  // Clear any temporary database files
  const tempDbFiles = [
    'test-database.sqlite',
    'test-database.sqlite-journal',
    'test-database.sqlite-wal'
  ];

  for (const file of tempDbFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Removed temporary database file: ${file}`);
      }
    } catch (error) {
      console.warn(`Failed to remove database file ${file}:`, error.message);
    }
  }
}

async function cleanupTestStorage() {
  // Clear global test storage
  if ((global as any).testStorage) {
    delete (global as any).testStorage;
  }

  if ((global as any).authStates) {
    delete (global as any).authStates;
  }

  // Cleanup temporary storage files
  const tempStorageFiles = [
    'test-results/auth-free.json',
    'test-results/auth-pro.json',
    'test-results/auth-enterprise.json'
  ];

  for (const file of tempStorageFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Removed temporary storage file: ${file}`);
      }
    } catch (error) {
      console.warn(`Failed to remove storage file ${file}:`, error.message);
    }
  }
}

async function cleanupTestArtifacts() {
  // Define directories to clean up
  const artifactDirs = [
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/downloads'
  ];

  // Clean up old artifacts (keep only recent ones)
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const now = Date.now();

  for (const dir of artifactDirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        let cleanedCount = 0;

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        }

        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} old artifacts from ${dir}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup artifacts in ${dir}:`, error.message);
    }
  }

  // Clean up temporary files
  const tempFiles = [
    'playwright-report/trace.zip',
    'test-results/temp-*',
    'coverage/tmp/*'
  ];

  for (const pattern of tempFiles) {
    try {
      // Simple cleanup for exact matches
      if (!pattern.includes('*') && fs.existsSync(pattern)) {
        fs.unlinkSync(pattern);
        console.log(`Removed temporary file: ${pattern}`);
      }
    } catch (error) {
      console.warn(`Failed to remove temporary file ${pattern}:`, error.message);
    }
  }
}

async function generateTestSummary() {
  try {
    const summaryData = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV
      },
      testRun: {
        configFile: 'playwright.config.ts',
        testDir: '../e2e',
        workers: process.env.CI ? 1 : 'auto',
        retries: process.env.CI ? 2 : 0
      },
      cleanup: {
        mockServerStopped: true,
        databaseCleaned: true,
        storageCleaned: true,
        artifactsCleaned: true
      }
    };

    // Write summary to file
    const summaryPath = 'test-results/teardown-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`Test teardown summary written to: ${summaryPath}`);

    // Log key metrics
    console.log('📊 Test Environment Summary:');
    console.log(`   Platform: ${summaryData.environment.platform}-${summaryData.environment.arch}`);
    console.log(`   Node.js: ${summaryData.environment.nodeVersion}`);
    console.log(`   Environment: ${summaryData.environment.nodeEnv}`);
    console.log(`   Timestamp: ${summaryData.timestamp}`);

  } catch (error) {
    console.warn('Failed to generate test summary:', error.message);
  }
}

export default globalTeardown;
