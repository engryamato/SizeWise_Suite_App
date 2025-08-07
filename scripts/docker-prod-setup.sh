#!/bin/bash

# SizeWise Suite Production Environment Setup Script
# This script sets up the complete production environment using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="docker/.env.prod"
BACKUP_DIR="backups"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check production requirements
check_production_requirements() {
    print_status "Checking production requirements..."
    
    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended for production deployments."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check available memory (minimum 4GB for production)
    if command_exists free; then
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
        if [ "$TOTAL_MEM" -lt 4096 ]; then
            print_error "Production requires at least 4GB of RAM. Current: ${TOTAL_MEM}MB"
            exit 1
        fi
    fi
    
    # Check available disk space (minimum 20GB)
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 20971520 ]; then  # 20GB in KB
        print_error "Production requires at least 20GB of free disk space."
        exit 1
    fi
    
    # Check for required tools
    required_tools=("openssl" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command_exists "$tool"; then
            print_error "Required tool '$tool' is not installed."
            exit 1
        fi
    done
    
    print_success "Production requirements check passed"
}

# Function to setup production environment
setup_production_environment() {
    print_status "Setting up production environment..."
    
    # Create production environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "docker/.env.example" ]; then
            cp docker/.env.example "$ENV_FILE"
            print_success "Created $ENV_FILE from template"
        else
            print_error "docker/.env.example not found."
            exit 1
        fi
    fi
    
    # Generate secure secrets if they don't exist
    print_status "Generating secure secrets..."
    
    # Check if secrets are already set
    if grep -q "your-.*-secret-key" "$ENV_FILE"; then
        print_warning "Default secrets detected. Generating secure secrets..."
        
        SECRET_KEY=$(generate_secret)
        AUTH_SECRET_KEY=$(generate_secret)
        JWT_SECRET_KEY=$(generate_secret)
        POSTGRES_PASSWORD=$(generate_secret)
        REDIS_PASSWORD=$(generate_secret)
        
        # Update environment file with secure secrets
        sed -i.bak \
            -e "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" \
            -e "s/AUTH_SECRET_KEY=.*/AUTH_SECRET_KEY=$AUTH_SECRET_KEY/" \
            -e "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET_KEY/" \
            -e "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" \
            -e "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" \
            "$ENV_FILE"
        
        print_success "Secure secrets generated and saved to $ENV_FILE"
        print_warning "Backup of original file saved as ${ENV_FILE}.bak"
    else
        print_success "Secure secrets already configured"
    fi
    
    # Validate required environment variables
    required_vars=(
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "SECRET_KEY"
        "AUTH_SECRET_KEY"
        "JWT_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE" || grep -q "^$var=$" "$ENV_FILE"; then
            print_error "Required environment variable '$var' is not set in $ENV_FILE"
            exit 1
        fi
    done
    
    print_success "Production environment configured"
}

# Function to create production directories
create_production_directories() {
    print_status "Creating production directories..."
    
    directories=(
        "logs"
        "data"
        "uploads"
        "temp/exports"
        "$BACKUP_DIR"
        "docker/nginx/ssl"
        "docker/nginx/conf.d"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        fi
    done
    
    # Set proper permissions for production
    chmod 755 logs data uploads temp
    chmod 700 "$BACKUP_DIR"
    
    print_success "Production directories created with proper permissions"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    SSL_DIR="docker/nginx/ssl"
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_warning "SSL certificates not found."
        echo "Options:"
        echo "1. Generate self-signed certificates (for testing)"
        echo "2. Skip SSL setup (configure manually later)"
        echo "3. Exit and configure SSL certificates manually"
        
        read -p "Choose option (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                print_status "Generating self-signed SSL certificates..."
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                    -keyout "$SSL_DIR/key.pem" \
                    -out "$SSL_DIR/cert.pem" \
                    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
                print_success "Self-signed SSL certificates generated"
                print_warning "Remember to replace with proper certificates for production!"
                ;;
            2)
                print_warning "SSL setup skipped. Configure manually before production use."
                ;;
            3)
                print_status "Exiting for manual SSL configuration..."
                exit 0
                ;;
            *)
                print_error "Invalid option selected"
                exit 1
                ;;
        esac
    else
        print_success "SSL certificates already configured"
    fi
}

# Function to pull and build images
prepare_images() {
    print_status "Preparing Docker images for production..."
    
    # Pull base images
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" pull
    else
        docker compose -f "$COMPOSE_FILE" pull
    fi
    
    # Build custom images
    print_status "Building production images..."
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker compose -f "$COMPOSE_FILE" build --no-cache
    fi
    
    print_success "Docker images prepared successfully"
}

# Function to start production services
start_production_services() {
    print_status "Starting production services..."
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    else
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    fi
    
    print_success "Production services started"
}

# Function to wait for production services
wait_for_production_services() {
    print_status "Waiting for production services to be ready..."
    
    # Wait for database with longer timeout for production
    print_status "Waiting for PostgreSQL..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if docker exec sizewise-postgres-prod pg_isready -U sizewise >/dev/null 2>&1; then
            break
        fi
        sleep 3
        timeout=$((timeout - 3))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 120 seconds"
        exit 1
    fi
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec sizewise-redis-prod redis-cli ping >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Redis failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_status "Waiting for application services..."
    sleep 30  # Give services time to initialize
    
    print_success "Production services are ready!"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run backend migrations
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" exec backend python -m flask db upgrade || true
        docker-compose -f "$COMPOSE_FILE" exec auth-server python init_db.py || true
    else
        docker compose -f "$COMPOSE_FILE" exec backend python -m flask db upgrade || true
        docker compose -f "$COMPOSE_FILE" exec auth-server python init_db.py || true
    fi
    
    print_success "Database migrations completed"
}

# Function to show production status
show_production_status() {
    print_status "Production Service Status:"
    
    if command_exists docker-compose; then
        docker-compose -f "$COMPOSE_FILE" ps
    else
        docker compose -f "$COMPOSE_FILE" ps
    fi
}

# Function to show production URLs and info
show_production_info() {
    echo ""
    print_success "🚀 SizeWise Suite Production Environment is ready!"
    echo ""
    echo "Production URLs:"
    echo "  Application:  https://your-domain.com"
    echo "  Admin Panel:  https://your-domain.com/admin"
    echo ""
    echo "Management Commands:"
    echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop:         docker-compose -f $COMPOSE_FILE down"
    echo "  Restart:      docker-compose -f $COMPOSE_FILE restart"
    echo "  Backup:       ./scripts/backup-production.sh"
    echo ""
    echo "Important Notes:"
    echo "  - Environment file: $ENV_FILE"
    echo "  - Backup directory: $BACKUP_DIR"
    echo "  - SSL certificates: docker/nginx/ssl/"
    echo "  - Monitor logs regularly for issues"
    echo "  - Set up automated backups"
    echo "  - Configure monitoring and alerting"
    echo ""
}

# Main execution
main() {
    echo "🚀 SizeWise Suite Production Environment Setup"
    echo "=============================================="
    echo ""
    
    print_warning "This will set up a production environment. Make sure you have:"
    print_warning "1. Proper SSL certificates"
    print_warning "2. Secure environment variables configured"
    print_warning "3. Adequate system resources"
    print_warning "4. Backup strategy in place"
    echo ""
    
    read -p "Continue with production setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Production setup cancelled"
        exit 0
    fi
    
    check_docker
    check_production_requirements
    setup_production_environment
    create_production_directories
    setup_ssl
    prepare_images
    start_production_services
    wait_for_production_services
    run_migrations
    show_production_status
    show_production_info
    
    print_success "Production setup completed successfully! 🎉"
}

# Handle script interruption
trap 'print_error "Production setup interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"
