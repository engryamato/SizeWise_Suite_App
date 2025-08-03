#!/usr/bin/env node

/**
 * Integration Test Runner for SizeWise Suite
 * 
 * Comprehensive test runner for HVAC component integration testing
 * Part of Phase 1 bridging plan to achieve 75% integration test coverage
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.1
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  testDir: path.join(__dirname, '../tests/integration'),
  coverageDir: path.join(__dirname, '../coverage/integration'),
  jestConfig: path.join(__dirname, '../tests/integration/jest.config.integration.js'),
  timeout: 300000, // 5 minutes
  retries: 2
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Logger utility
 */
const logger = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}=== ${msg} ===${colors.reset}\n`)
};

/**
 * Check if required dependencies are installed
 */
function checkDependencies() {
  logger.header('Checking Dependencies');
  
  const requiredPackages = [
    '@jest/globals',
    '@testing-library/jest-dom',
    'jest',
    'ts-jest'
  ];
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logger.error('package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missing = requiredPackages.filter(pkg => !allDeps[pkg]);
  
  if (missing.length > 0) {
    logger.error(`Missing required packages: ${missing.join(', ')}`);
    logger.info('Run: npm install --save-dev ' + missing.join(' '));
    return false;
  }
  
  logger.success('All required dependencies are installed');
  return true;
}

/**
 * Ensure test directories exist
 */
function ensureTestDirectories() {
  logger.header('Setting Up Test Environment');
  
  const directories = [
    CONFIG.testDir,
    CONFIG.coverageDir,
    path.join(CONFIG.coverageDir, 'html-report'),
    path.join(CONFIG.testDir, 'setup'),
    path.join(CONFIG.testDir, 'processors')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
  
  logger.success('Test directories ready');
}

/**
 * Run Jest with specified configuration
 */
function runJest(options = {}) {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--config', CONFIG.jestConfig,
      '--testTimeout', CONFIG.timeout.toString(),
      '--maxWorkers', '50%',
      '--verbose'
    ];
    
    // Add coverage if requested
    if (options.coverage) {
      jestArgs.push('--coverage');
    }
    
    // Add watch mode if requested
    if (options.watch) {
      jestArgs.push('--watch');
    }
    
    // Add specific test pattern if provided
    if (options.testPattern) {
      jestArgs.push('--testNamePattern', options.testPattern);
    }
    
    // Add specific test file if provided
    if (options.testFile) {
      jestArgs.push(options.testFile);
    }
    
    logger.info(`Running Jest with args: ${jestArgs.join(' ')}`);
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TESTING: 'true'
      }
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate test coverage report
 */
async function generateCoverageReport() {
  logger.header('Generating Coverage Report');
  
  const coverageFile = path.join(CONFIG.coverageDir, 'lcov.info');
  if (!fs.existsSync(coverageFile)) {
    logger.warning('No coverage data found');
    return;
  }
  
  try {
    // Read coverage data
    const coverageData = fs.readFileSync(coverageFile, 'utf8');
    const lines = coverageData.split('\n');
    
    // Parse coverage statistics
    const stats = {
      totalLines: 0,
      coveredLines: 0,
      totalFunctions: 0,
      coveredFunctions: 0,
      totalBranches: 0,
      coveredBranches: 0
    };
    
    lines.forEach(line => {
      if (line.startsWith('LF:')) stats.totalLines += parseInt(line.split(':')[1]);
      if (line.startsWith('LH:')) stats.coveredLines += parseInt(line.split(':')[1]);
      if (line.startsWith('FNF:')) stats.totalFunctions += parseInt(line.split(':')[1]);
      if (line.startsWith('FNH:')) stats.coveredFunctions += parseInt(line.split(':')[1]);
      if (line.startsWith('BRF:')) stats.totalBranches += parseInt(line.split(':')[1]);
      if (line.startsWith('BRH:')) stats.coveredBranches += parseInt(line.split(':')[1]);
    });
    
    // Calculate percentages
    const linesCoverage = stats.totalLines > 0 ? (stats.coveredLines / stats.totalLines * 100).toFixed(2) : 0;
    const functionsCoverage = stats.totalFunctions > 0 ? (stats.coveredFunctions / stats.totalFunctions * 100).toFixed(2) : 0;
    const branchesCoverage = stats.totalBranches > 0 ? (stats.coveredBranches / stats.totalBranches * 100).toFixed(2) : 0;
    
    logger.success('Coverage Report Generated:');
    console.log(`  Lines: ${linesCoverage}% (${stats.coveredLines}/${stats.totalLines})`);
    console.log(`  Functions: ${functionsCoverage}% (${stats.coveredFunctions}/${stats.totalFunctions})`);
    console.log(`  Branches: ${branchesCoverage}% (${stats.coveredBranches}/${stats.totalBranches})`);
    
    // Check if we meet the 75% target
    const targetCoverage = 75;
    const meetsTarget = parseFloat(linesCoverage) >= targetCoverage;
    
    if (meetsTarget) {
      logger.success(`✅ Integration test coverage target of ${targetCoverage}% achieved!`);
    } else {
      logger.warning(`⚠️  Integration test coverage (${linesCoverage}%) below target of ${targetCoverage}%`);
    }
    
  } catch (error) {
    logger.error(`Failed to generate coverage report: ${error.message}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    testPattern: args.find(arg => arg.startsWith('--testNamePattern='))?.split('=')[1],
    testFile: args.find(arg => arg.startsWith('--testFile='))?.split('=')[1]
  };
  
  logger.header('SizeWise Suite Integration Test Runner');
  logger.info('Part of Phase 1 bridging plan for 75% integration coverage');
  
  try {
    // Pre-flight checks
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    ensureTestDirectories();
    
    // Run tests
    logger.header('Running Integration Tests');
    await runJest(options);
    
    // Generate coverage report if coverage was requested
    if (options.coverage) {
      await generateCoverageReport();
    }
    
    logger.success('Integration tests completed successfully!');
    
  } catch (error) {
    logger.error(`Integration tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle CLI usage
if (require.main === module) {
  main().catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runJest,
  generateCoverageReport,
  CONFIG
};
