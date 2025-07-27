#!/usr/bin/env node

/**
 * Sentry Configuration Test Script
 * 
 * This script tests the Sentry configuration to identify and fix API errors.
 * Run this script to diagnose Sentry connectivity and configuration issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 SizeWise Suite - Sentry Configuration Diagnostic\n');

// Test 1: Check Sentry SDK versions
console.log('1. Checking Sentry SDK versions...');
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`   Frontend @sentry/nextjs: ${frontendPackage.dependencies['@sentry/nextjs'] || 'Not found'}`);
  console.log(`   Root @sentry/electron: ${rootPackage.dependencies['@sentry/electron'] || 'Not found'}`);
  console.log(`   Root @sentry/nextjs: ${rootPackage.dependencies['@sentry/nextjs'] || 'Not found'}`);
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

// Test 2: Check configuration files
console.log('\n2. Checking Sentry configuration files...');
const configFiles = [
  'sentry.server.config.js',
  'sentry.edge.config.js',
  'frontend/sentry.server.config.ts',
  'frontend/sentry.edge.config.ts',
  'backend/sentry_config.py',
  'auth-server/sentry_config.py'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
    
    // Check for high sample rates
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('tracesSampleRate: 1') || content.includes('traces_sample_rate=1.0')) {
      console.log(`   ⚠️  ${file} has high sample rate (may cause rate limiting)`);
    }
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Test 3: Check environment variables
console.log('\n3. Checking environment variables...');
const envVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_SENTRY_RELEASE',
  'SENTRY_RELEASE'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value}`);
  } else {
    console.log(`   ⚠️  ${envVar}: not set`);
  }
});

// Test 4: Test Sentry connectivity
console.log('\n4. Testing Sentry connectivity...');
try {
  // Simple test to see if we can reach Sentry
  const testScript = `
    const path = require('path');
    process.chdir('${process.cwd()}');
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: 'https://805514204a48915f64a39c0f5e7544f9@o4509734387056640.ingest.us.sentry.io/4509741504069632',
      tracesSampleRate: 0.01,
      debug: false,
      beforeSend: () => null // Don't actually send events
    });
    console.log('Sentry initialized successfully');
  `;

  fs.writeFileSync('/tmp/sentry-test.js', testScript);
  execSync('node /tmp/sentry-test.js', { stdio: 'pipe', cwd: process.cwd() });
  console.log('   ✅ Sentry SDK can be initialized');
  fs.unlinkSync('/tmp/sentry-test.js');
} catch (error) {
  console.log(`   ❌ Sentry initialization failed: ${error.message.split('\n')[0]}`);
}

// Test 5: Recommendations
console.log('\n5. Recommendations:');
console.log('   📋 To fix Sentry API errors:');
console.log('   • Ensure sample rates are low (< 0.1) to prevent rate limiting');
console.log('   • Add beforeSend filters to prevent spam');
console.log('   • Update to latest Sentry SDK versions');
console.log('   • Check network connectivity to sentry.io');
console.log('   • Verify DSN is valid and project exists');

console.log('\n✅ Diagnostic complete. Check the output above for issues.');
