#!/bin/bash

# Docker Cleanup Script for SizeWise Suite
# Safely removes unused Docker resources while preserving active containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}🧹 SizeWise Suite Docker Cleanup${NC}"
    echo "=================================="
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

# Function to show current Docker usage
show_docker_usage() {
    echo -e "${CYAN}📊 Current Docker Usage:${NC}"
    echo "========================"
    
    echo -e "\n${BLUE}Containers:${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
    
    echo -e "\n${BLUE}Images:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo -e "\n${BLUE}Volumes:${NC}"
    docker volume ls
    
    echo -e "\n${BLUE}Networks:${NC}"
    docker network ls
    
    echo -e "\n${BLUE}System Usage:${NC}"
    docker system df
    echo ""
}

# Function to stop SizeWise containers
stop_sizewise_containers() {
    print_status "Stopping SizeWise Suite containers..."
    compose_cmd=$(get_compose_cmd)
    
    # Stop development environment
    if [ -f "docker-compose.dev.yml" ]; then
        $compose_cmd -f docker-compose.dev.yml down 2>/dev/null || true
    fi
    
    # Stop production environment
    if [ -f "docker-compose.prod.yml" ]; then
        $compose_cmd -f docker-compose.prod.yml down 2>/dev/null || true
    fi
    
    print_success "SizeWise containers stopped"
}

# Function for safe cleanup (removes only unused resources)
safe_cleanup() {
    print_status "Performing safe cleanup (unused resources only)..."
    
    # Remove stopped containers
    print_status "Removing stopped containers..."
    docker container prune -f
    
    # Remove unused images (not referenced by any container)
    print_status "Removing unused images..."
    docker image prune -f
    
    # Remove unused networks
    print_status "Removing unused networks..."
    docker network prune -f
    
    # Remove unused build cache
    print_status "Removing build cache..."
    docker builder prune -f
    
    print_success "Safe cleanup completed"
}

# Function for aggressive cleanup (removes more resources)
aggressive_cleanup() {
    print_warning "Performing aggressive cleanup..."
    print_warning "This will remove ALL unused images, not just dangling ones"
    
    # Remove all unused images (including tagged ones not used by containers)
    print_status "Removing all unused images..."
    docker image prune -a -f
    
    # Remove unused volumes (be careful with this)
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_success "Aggressive cleanup completed"
}

# Function to remove specific SizeWise images
remove_sizewise_images() {
    print_status "Removing SizeWise Suite images..."
    
    # Remove SizeWise images
    docker images | grep -E "(sizewise|frontend|backend|auth-server)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    print_success "SizeWise images removed"
}

# Function to show cleanup options
show_menu() {
    echo -e "${CYAN}🛠️  Cleanup Options:${NC}"
    echo "==================="
    echo "1. Show current Docker usage"
    echo "2. Safe cleanup (unused resources only)"
    echo "3. Stop SizeWise containers"
    echo "4. Aggressive cleanup (all unused images + volumes)"
    echo "5. Remove SizeWise images specifically"
    echo "6. Complete system cleanup (DANGEROUS)"
    echo "7. Exit"
    echo ""
}

# Function for complete system cleanup
complete_cleanup() {
    print_error "⚠️  DANGEROUS: Complete system cleanup"
    print_error "This will remove ALL containers, images, volumes, and networks"
    print_error "This action cannot be undone!"
    
    read -p "Are you absolutely sure? Type 'YES' to continue: " confirm
    if [ "$confirm" = "YES" ]; then
        print_status "Stopping all containers..."
        docker stop $(docker ps -aq) 2>/dev/null || true
        
        print_status "Removing all containers..."
        docker rm $(docker ps -aq) 2>/dev/null || true
        
        print_status "Removing all images..."
        docker rmi $(docker images -q) -f 2>/dev/null || true
        
        print_status "Removing all volumes..."
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
        
        print_status "Removing all networks..."
        docker network rm $(docker network ls -q) 2>/dev/null || true
        
        print_status "Cleaning system..."
        docker system prune -a -f --volumes
        
        print_success "Complete cleanup finished"
    else
        print_status "Complete cleanup cancelled"
    fi
}

# Main script
print_header

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# If no arguments, show interactive menu
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        read -p "Choose an option (1-7): " choice
        echo ""
        
        case $choice in
            1)
                show_docker_usage
                ;;
            2)
                safe_cleanup
                ;;
            3)
                stop_sizewise_containers
                ;;
            4)
                aggressive_cleanup
                ;;
            5)
                remove_sizewise_images
                ;;
            6)
                complete_cleanup
                ;;
            7)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
else
    # Handle command line arguments
    case $1 in
        "usage"|"status")
            show_docker_usage
            ;;
        "safe")
            safe_cleanup
            ;;
        "stop")
            stop_sizewise_containers
            ;;
        "aggressive")
            aggressive_cleanup
            ;;
        "sizewise")
            remove_sizewise_images
            ;;
        "complete")
            complete_cleanup
            ;;
        *)
            echo "Usage: $0 [usage|safe|stop|aggressive|sizewise|complete]"
            echo ""
            echo "Options:"
            echo "  usage      - Show current Docker usage"
            echo "  safe       - Safe cleanup (unused resources only)"
            echo "  stop       - Stop SizeWise containers"
            echo "  aggressive - Aggressive cleanup (all unused images + volumes)"
            echo "  sizewise   - Remove SizeWise images specifically"
            echo "  complete   - Complete system cleanup (DANGEROUS)"
            echo ""
            echo "Run without arguments for interactive menu"
            exit 1
            ;;
    esac
fi
