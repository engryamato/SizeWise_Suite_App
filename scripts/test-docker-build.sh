#!/bin/bash

# Quick Docker Build Test Script
# Tests if Docker images can be built successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get docker-compose command
get_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

echo "🧪 Testing Docker Build Process"
echo "==============================="
echo ""

# Test individual service builds
services=("frontend" "backend" "auth-server")
compose_cmd=$(get_compose_cmd)

for service in "${services[@]}"; do
    print_status "Testing $service build..."
    
    if $compose_cmd -f docker-compose.dev.yml build --no-cache "$service" >/dev/null 2>&1; then
        print_success "$service builds successfully"
    else
        print_error "$service build failed"
        echo "Trying to get more details..."
        $compose_cmd -f docker-compose.dev.yml build --no-cache "$service"
        exit 1
    fi
done

echo ""
print_success "✅ All Docker images build successfully!"
print_status "You can now run './scripts/docker-dev-setup.sh' to start the full environment"

# Clean up test images
print_status "Cleaning up test images..."
docker image prune -f >/dev/null 2>&1

echo ""
print_success "🎉 Docker build test completed successfully!"
