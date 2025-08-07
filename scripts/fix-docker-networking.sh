#!/bin/bash

# Docker Networking Fix Script for SizeWise Suite
# Fixes networking issues while monitoring all containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}🔧 SizeWise Suite Docker Networking Fix${NC}"
    echo "=========================================="
    echo ""
}

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

# Function to get docker-compose command
get_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Function to show current container status
show_container_status() {
    echo -e "${CYAN}📊 Current Container Status:${NC}"
    echo "============================"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Networks}}"
    echo ""
}

# Function to show network status
show_network_status() {
    echo -e "${CYAN}🌐 Current Networks:${NC}"
    echo "==================="
    docker network ls
    echo ""
}

# Function to monitor container health
monitor_containers() {
    local duration=${1:-30}
    print_status "Monitoring containers for $duration seconds..."
    
    for i in $(seq 1 $duration); do
        echo -ne "\r${BLUE}[MONITOR]${NC} Checking containers... ${i}/${duration}s"
        
        # Check for any failing containers
        failing=$(docker ps -a --filter "status=exited" --filter "status=dead" --format "{{.Names}}" | wc -l)
        if [ $failing -gt 1 ]; then  # Allow 1 for the nginx container we're fixing
            echo ""
            print_warning "Detected failing containers:"
            docker ps -a --filter "status=exited" --filter "status=dead" --format "table {{.Names}}\t{{.Status}}"
        fi
        
        sleep 1
    done
    echo ""
    print_success "Container monitoring completed"
}

# Function to fix networking issues
fix_networking() {
    print_status "Fixing Docker networking issues..."
    
    # Stop the failing nginx container
    print_status "Stopping failing nginx container..."
    docker stop sizewise-nginx-prod-test 2>/dev/null || true
    docker rm sizewise-nginx-prod-test 2>/dev/null || true
    
    # Check if we have docker-compose files
    compose_cmd=$(get_compose_cmd)
    
    if [ -f "docker-compose.prod.yml" ]; then
        print_status "Recreating production environment with proper networking..."
        
        # Stop any existing production services
        $compose_cmd -f docker-compose.prod.yml down 2>/dev/null || true
        
        # Start production services (this will recreate the network)
        print_status "Starting production services..."
        $compose_cmd -f docker-compose.prod.yml up -d
        
        print_success "Production environment recreated"
    else
        print_error "docker-compose.prod.yml not found"
        return 1
    fi
}

# Function to verify fix
verify_fix() {
    print_status "Verifying the fix..."
    
    # Wait a moment for containers to start
    sleep 5
    
    # Check container status
    print_status "Checking container health..."
    
    # Get all containers from production compose
    if [ -f "docker-compose.prod.yml" ]; then
        compose_cmd=$(get_compose_cmd)
        
        # Check if services are running
        services_status=$($compose_cmd -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}")
        echo "$services_status"
        
        # Count healthy services
        healthy_count=$(echo "$services_status" | grep -c "Up" || echo "0")
        total_count=$(echo "$services_status" | tail -n +2 | wc -l)
        
        if [ $healthy_count -eq $total_count ] && [ $total_count -gt 0 ]; then
            print_success "All production services are running correctly"
            return 0
        else
            print_warning "$healthy_count/$total_count services are healthy"
            return 1
        fi
    fi
}

# Function to rollback if needed
rollback_changes() {
    print_warning "Rolling back changes..."
    
    compose_cmd=$(get_compose_cmd)
    
    # Stop production services
    if [ -f "docker-compose.prod.yml" ]; then
        $compose_cmd -f docker-compose.prod.yml down 2>/dev/null || true
    fi
    
    print_status "Rollback completed. You may need to restart services manually."
}

# Function to show health check
health_check() {
    print_status "Performing comprehensive health check..."
    
    echo -e "${CYAN}🏥 Container Health Check:${NC}"
    echo "=========================="
    
    # Check all containers
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo -e "${CYAN}🌐 Network Health Check:${NC}"
    echo "======================="
    docker network ls
    
    echo ""
    echo -e "${CYAN}📊 System Resources:${NC}"
    echo "==================="
    docker system df
    
    # Check for any containers in restart loops
    restarting=$(docker ps --filter "status=restarting" --format "{{.Names}}" | wc -l)
    if [ $restarting -gt 0 ]; then
        print_warning "Containers in restart loop:"
        docker ps --filter "status=restarting" --format "table {{.Names}}\t{{.Status}}"
    fi
}

# Main script
print_header

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Show initial status
print_status "Initial system status:"
show_container_status
show_network_status

# Handle command line arguments
case "${1:-fix}" in
    "status"|"check")
        health_check
        ;;
    "monitor")
        duration=${2:-60}
        monitor_containers $duration
        ;;
    "fix")
        print_status "Starting networking fix process..."
        
        # Start monitoring in background
        monitor_containers 60 &
        monitor_pid=$!
        
        # Attempt to fix networking
        if fix_networking; then
            print_success "Networking fix applied successfully"
            
            # Verify the fix
            if verify_fix; then
                print_success "✅ All services are running correctly"
            else
                print_warning "⚠️ Some services may need attention"
                show_container_status
            fi
        else
            print_error "Failed to apply networking fix"
            rollback_changes
            exit 1
        fi
        
        # Stop monitoring
        kill $monitor_pid 2>/dev/null || true
        
        # Final status check
        echo ""
        print_status "Final system status:"
        show_container_status
        show_network_status
        ;;
    "rollback")
        rollback_changes
        ;;
    *)
        echo "Usage: $0 [fix|status|monitor|rollback]"
        echo ""
        echo "Commands:"
        echo "  fix      - Fix networking issues (default)"
        echo "  status   - Show current system status"
        echo "  monitor  - Monitor containers for issues"
        echo "  rollback - Rollback recent changes"
        exit 1
        ;;
esac

print_success "🎉 Networking fix process completed!"
