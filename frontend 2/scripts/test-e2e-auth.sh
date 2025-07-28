#!/bin/bash

# End-to-End Authentication Test Suite Runner
# Comprehensive E2E testing for hybrid authentication system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored status messages
print_status() {
    echo -e "${BLUE}[E2E-AUTH]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[E2E-AUTH]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[E2E-AUTH]${NC} ⚠️  $1"
}

print_error() {
    echo -e "${RED}[E2E-AUTH]${NC} ❌ $1"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Must be run from the frontend directory"
    exit 1
fi

print_status "Starting End-to-End Authentication Test Suite..."

# Install Playwright if not already installed
print_status "Checking Playwright installation..."
if ! npx playwright --version > /dev/null 2>&1; then
    print_status "Installing Playwright..."
    npx playwright install
    npx playwright install-deps
fi

# Check if servers are running
print_status "Checking server status..."

# Check frontend server
if ! curl -s http://localhost:3001 > /dev/null; then
    print_warning "Frontend server not running on port 3001"
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    sleep 10
else
    print_success "Frontend server is running"
fi

# Check backend server
if ! curl -s http://localhost:5000/health > /dev/null; then
    print_warning "Backend server not running on port 5000"
    print_status "Starting backend server..."
    cd .. && python3 run_backend.py &
    BACKEND_PID=$!
    cd frontend
    sleep 10
else
    print_success "Backend server is running"
fi

# Set environment variables for testing
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:3001"
export NODE_ENV="test"

print_status "Running E2E Authentication Tests..."

# Run the E2E tests
if npx playwright test e2e/auth-flows.spec.ts --reporter=html,json,junit; then
    print_success "All E2E authentication tests passed!"
    
    # Generate test report
    print_status "Generating test report..."
    
    echo ""
    echo "📊 E2E Test Results Summary:"
    echo "================================"
    
    # Parse test results if available
    if [ -f "test-results/e2e-results.json" ]; then
        # Extract test counts from JSON (simplified parsing)
        TOTAL_TESTS=$(grep -o '"tests":\[' test-results/e2e-results.json | wc -l)
        echo "Total E2E Tests: $TOTAL_TESTS"
        echo "Status: ✅ ALL PASSED"
    fi
    
    echo ""
    echo "🎯 Authentication Scenarios Validated:"
    echo "• Super Admin Login (admin@sizewise.com)"
    echo "• User Registration with 14-day Trial"
    echo "• Tier Enforcement (3 projects, 25 segments)"
    echo "• Offline-First Functionality"
    echo "• Trial Management & Expiration"
    echo "• Post-Login Redirect Fix (/dashboard)"
    echo ""
    
    print_success "E2E Authentication Test Suite completed successfully!"
    
    # Open test report
    if command -v open > /dev/null; then
        print_status "Opening test report..."
        open playwright-report/index.html
    fi
    
    exit 0
else
    print_error "E2E authentication tests failed!"
    
    # Show failure summary
    echo ""
    echo "❌ Test Failures Detected"
    echo "========================="
    echo "Check the Playwright report for detailed failure information:"
    echo "• HTML Report: playwright-report/index.html"
    echo "• JSON Results: test-results/e2e-results.json"
    echo ""
    
    # Clean up background processes
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    exit 1
fi
