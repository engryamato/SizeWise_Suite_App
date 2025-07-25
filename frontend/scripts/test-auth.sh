#!/bin/bash

# Authentication Test Suite Runner
# Runs comprehensive tests for the hybrid authentication system

set -e

echo "🧪 SizeWise Suite - Authentication Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    npm install
fi

print_status "Starting authentication test suite..."

# 1. Unit Tests
print_status "Running unit tests..."
echo "----------------------------------------"

# Test HybridAuthManager
print_status "Testing HybridAuthManager..."
npm test -- __tests__/auth/HybridAuthManager.test.ts --verbose

# Test Auth Store
print_status "Testing Auth Store integration..."
npm test -- __tests__/auth/auth-store.test.ts --verbose

# Test Tier Enforcement Service
print_status "Testing Tier Enforcement Service..."
npm test -- __tests__/services/HybridTierEnforcementService.test.ts --verbose

# Test UI Components
print_status "Testing UI Components..."
npm test -- __tests__/components/auth/TrialManager.test.tsx --verbose

print_success "Unit tests completed!"

# 2. Integration Tests
print_status "Running integration tests..."
echo "----------------------------------------"

# Run all auth-related tests
npm test -- --testPathPattern="auth|Auth" --coverage --verbose

print_success "Integration tests completed!"

# 3. E2E Tests (if Playwright is available)
if command -v npx playwright &> /dev/null; then
    print_status "Running E2E tests..."
    echo "----------------------------------------"
    
    # Check if Playwright is configured
    if [ -f "playwright.config.ts" ]; then
        print_status "Starting authentication server for E2E tests..."
        
        # Start the auth server in background (if available)
        if [ -f "../backend/auth_server.py" ]; then
            cd ../backend
            python auth_server.py &
            AUTH_SERVER_PID=$!
            cd ../frontend
            
            # Wait for server to start
            sleep 3
            
            print_status "Running Playwright E2E tests..."
            npx playwright test __tests__/e2e/auth-flows.test.ts --reporter=html
            
            # Stop auth server
            kill $AUTH_SERVER_PID 2>/dev/null || true
        else
            print_warning "Auth server not found. Skipping E2E tests that require server."
            npx playwright test __tests__/e2e/auth-flows.test.ts --grep="offline|Super Admin" --reporter=html
        fi
    else
        print_warning "Playwright not configured. Skipping E2E tests."
    fi
else
    print_warning "Playwright not installed. Skipping E2E tests."
fi

# 4. Coverage Report
print_status "Generating coverage report..."
echo "----------------------------------------"

npm test -- --coverage --testPathPattern="auth|Auth" --coverageReporters=text --coverageReporters=html

print_success "Coverage report generated!"

# 5. Test Summary
echo ""
echo "🎉 Authentication Test Suite Complete!"
echo "======================================"

print_status "Test Results Summary:"
echo "• Unit Tests: ✅ Completed"
echo "• Integration Tests: ✅ Completed"
echo "• Coverage Report: ✅ Generated"

if command -v npx playwright &> /dev/null && [ -f "playwright.config.ts" ]; then
    echo "• E2E Tests: ✅ Completed"
else
    echo "• E2E Tests: ⚠️  Skipped (Playwright not available)"
fi

echo ""
print_status "Coverage reports available at:"
echo "• HTML: coverage/lcov-report/index.html"
echo "• Text: Displayed above"

if [ -f "playwright-report/index.html" ]; then
    echo "• E2E Report: playwright-report/index.html"
fi

echo ""
print_success "All authentication tests completed successfully!"

# Optional: Open coverage report
if command -v open &> /dev/null; then
    read -p "Open coverage report in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open coverage/lcov-report/index.html
    fi
fi
