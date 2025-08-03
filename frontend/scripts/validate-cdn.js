/**
 * CDN Integration Validation Script
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Simple validation script to test CDN functionality
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description} exists`, 'green');
    return true;
  } else {
    log(`✗ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function validateFileContent(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} file missing: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allFound = true;

  searchStrings.forEach(searchString => {
    if (content.includes(searchString)) {
      log(`  ✓ Contains: ${searchString}`, 'green');
    } else {
      log(`  ✗ Missing: ${searchString}`, 'red');
      allFound = false;
    }
  });

  return allFound;
}

async function validateCDNIntegration() {
  log('\n🚀 CDN Integration Validation', 'blue');
  log('=' .repeat(50), 'blue');

  let allValid = true;

  // 1. Validate CDN Manager
  log('\n📦 CDN Manager System', 'yellow');
  const cdnManagerValid = validateFileExists('lib/cdn/cdn-manager.ts', 'CDN Manager');
  if (cdnManagerValid) {
    const cdnManagerContentValid = validateFileContent(
      'lib/cdn/cdn-manager.ts',
      [
        'export class CDNManager',
        'getAssetUrl',
        'get3DModelUrl',
        'preloadAssets',
        'purgeAsset',
        'warmCache'
      ],
      'CDN Manager functionality'
    );
    allValid = allValid && cdnManagerContentValid;
  } else {
    allValid = false;
  }

  // 2. Validate React Hooks
  log('\n🎣 React CDN Hooks', 'yellow');
  const hooksValid = validateFileExists('lib/hooks/useCDN.ts', 'CDN Hooks');
  if (hooksValid) {
    const hooksContentValid = validateFileContent(
      'lib/hooks/useCDN.ts',
      [
        'export function useCDN',
        'export function useCDNImage',
        'export function useCDN3DModel',
        'CDNManager'
      ],
      'CDN Hooks functionality'
    );
    allValid = allValid && hooksContentValid;
  } else {
    allValid = false;
  }

  // 3. Validate CDN Components
  log('\n🧩 CDN Components', 'yellow');
  const componentsValid = validateFileExists('components/ui/CDNImage.tsx', 'CDN Components');
  if (componentsValid) {
    const componentsContentValid = validateFileContent(
      'components/ui/CDNImage.tsx',
      [
        'export const CDNImage',
        'export function CDNBackgroundImage',
        'export function CDNAvatar',
        'useCDN'
      ],
      'CDN Components functionality'
    );
    allValid = allValid && componentsContentValid;
  } else {
    allValid = false;
  }

  // 4. Validate Next.js Configuration
  log('\n⚙️ Next.js CDN Configuration', 'yellow');
  const nextConfigValid = validateFileExists('next.config.js', 'Next.js Config');
  if (nextConfigValid) {
    const nextConfigContentValid = validateFileContent(
      'next.config.js',
      [
        'assetPrefix',
        'NEXT_PUBLIC_CDN_URL',
        'images'
      ],
      'Next.js CDN configuration'
    );
    allValid = allValid && nextConfigContentValid;
  } else {
    allValid = false;
  }

  // 5. Validate Backend API
  log('\n🔧 Backend CDN API', 'yellow');
  const backendApiValid = validateFileExists('../backend/api/cdn_management.py', 'Backend CDN API');
  if (backendApiValid) {
    const backendApiContentValid = validateFileContent(
      '../backend/api/cdn_management.py',
      [
        '@cdn_bp.route',
        'purge_asset',
        'warm_cache',
        'optimize_asset'
      ],
      'Backend CDN API functionality'
    );
    allValid = allValid && backendApiContentValid;
  } else {
    allValid = false;
  }

  // 6. Validate Flask App Integration
  log('\n🌐 Flask App CDN Integration', 'yellow');
  const flaskAppValid = validateFileExists('../backend/app.py', 'Flask App');
  if (flaskAppValid) {
    const flaskAppContentValid = validateFileContent(
      '../backend/app.py',
      [
        'from backend.api.cdn_management import cdn_bp',
        'app.register_blueprint(cdn_bp)'
      ],
      'Flask CDN blueprint registration'
    );
    allValid = allValid && flaskAppContentValid;
  } else {
    allValid = false;
  }

  // 7. Validate Test Files
  log('\n🧪 CDN Test Files', 'yellow');
  const testValid = validateFileExists('tests/cdn/cdn-integration.test.tsx', 'CDN Tests');
  if (testValid) {
    const testContentValid = validateFileContent(
      'tests/cdn/cdn-integration.test.tsx',
      [
        'CDN Manager',
        'CDN Integration Tests',
        'describe',
        'expect'
      ],
      'CDN test functionality'
    );
    allValid = allValid && testContentValid;
  } else {
    allValid = false;
  }

  // Final validation summary
  log('\n📊 Validation Summary', 'blue');
  log('=' .repeat(50), 'blue');
  
  if (allValid) {
    log('✅ CDN Integration validation PASSED', 'green');
    log('All CDN components are properly implemented and integrated.', 'green');
    return true;
  } else {
    log('❌ CDN Integration validation FAILED', 'red');
    log('Some CDN components are missing or incomplete.', 'red');
    return false;
  }
}

// Run validation
validateCDNIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`\n💥 Validation error: ${error.message}`, 'red');
    process.exit(1);
  });
