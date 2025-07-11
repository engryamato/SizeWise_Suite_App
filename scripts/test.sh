#!/bin/bash

# SizeWise Suite Test Runner
# Runs both frontend (JavaScript) and backend (Python) tests

set -e

echo "🧪 Running SizeWise Suite Test Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
fi

# Activate Python virtual environment if it exists
if [ -d "venv" ]; then
    print_status "Activating Python virtual environment..."
    source venv/bin/activate
else
    print_warning "Python virtual environment not found. Some tests may fail."
fi

# Run frontend tests
print_status "Running frontend JavaScript tests..."
echo "------------------------------------"
npm test -- --coverage --watchAll=false

FRONTEND_EXIT_CODE=$?

# Run backend tests
print_status "Running backend Python tests..."
echo "--------------------------------"
python -m pytest tests/unit/backend/ -v --tb=short

BACKEND_EXIT_CODE=$?

# Run integration tests (if backend is running)
print_status "Checking if backend is running for integration tests..."
if curl -s http://127.0.0.1:5000/api/health > /dev/null 2>&1; then
    print_status "Backend is running. Running integration tests..."
    npm run test:integration
    INTEGRATION_EXIT_CODE=$?
else
    print_warning "Backend is not running. Skipping integration tests."
    print_warning "To run integration tests, start the backend with: npm run start:backend"
    INTEGRATION_EXIT_CODE=0
fi

# Summary
echo ""
echo "🏁 Test Summary"
echo "==============="

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    print_status "✅ Frontend tests: PASSED"
else
    print_error "❌ Frontend tests: FAILED"
fi

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    print_status "✅ Backend tests: PASSED"
else
    print_error "❌ Backend tests: FAILED"
fi

if [ $INTEGRATION_EXIT_CODE -eq 0 ]; then
    print_status "✅ Integration tests: PASSED"
else
    print_error "❌ Integration tests: FAILED"
fi

# Exit with error if any tests failed
TOTAL_EXIT_CODE=$((FRONTEND_EXIT_CODE + BACKEND_EXIT_CODE + INTEGRATION_EXIT_CODE))

if [ $TOTAL_EXIT_CODE -eq 0 ]; then
    echo ""
    print_status "🎉 All tests passed successfully!"
    exit 0
else
    echo ""
    print_error "💥 Some tests failed. Please check the output above."
    exit 1
fi
