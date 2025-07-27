# Docker Setup Guide for SizeWise Suite

This guide provides step-by-step instructions for setting up and running SizeWise Suite using Docker containers.

## Prerequisites

### Required Software
- **Docker Desktop** (version 4.0 or later)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
- **Docker Compose** (included with Docker Desktop)
- **Git** for cloning the repository

### System Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 10GB free space for Docker images and containers
- **CPU**: Multi-core processor recommended

## Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App

# Create environment file from template
cp docker/.env.example .env

# Make the Docker script executable
chmod +x scripts/docker-dev.sh
```

### 2. Configure Environment
Edit the `.env` file with your configuration:
```bash
# Required: Update these values
POSTGRES_PASSWORD=your_secure_password
SECRET_KEY=your_backend_secret_key
AUTH_SECRET_KEY=your_auth_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Optional: Update Sentry DSN if you have one
SENTRY_DSN=your_sentry_dsn_here
```

### 3. Start Development Environment
```bash
# Using npm script
npm run docker:dev

# Or using the script directly
./scripts/docker-dev.sh start
```

### 4. Verify Installation
Once all containers are running, verify the services:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health
- **Auth Server**: http://localhost:5001/api/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Service Architecture

### Container Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Auth Server   │
│   (Next.js)     │    │   (Flask)       │    │   (Flask)       │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐
         │   PostgreSQL    │    │     Redis       │
         │   Port: 5432    │    │   Port: 6379    │
         └─────────────────┘    └─────────────────┘
```

### Network Configuration
- All services communicate through the `sizewise-network` Docker network
- External access is provided through mapped ports
- Internal service discovery uses container names

## Development Workflow

### Starting Services
```bash
# Start all services
npm run docker:dev

# Start specific services
docker-compose -f docker-compose.dev.yml up frontend backend
```

### Viewing Logs
```bash
# All services
npm run docker:logs

# Specific service
./scripts/docker-dev.sh logs backend
```

### Running Tests
```bash
# All tests
npm run docker:test

# Frontend tests only
./scripts/docker-dev.sh test frontend

# Backend tests only
./scripts/docker-dev.sh test backend
```

### Accessing Container Shells
```bash
# Backend container
./scripts/docker-dev.sh shell backend

# Frontend container
./scripts/docker-dev.sh shell frontend

# Database container
./scripts/docker-dev.sh shell postgres
```

### Stopping Services
```bash
# Stop all services
npm run docker:stop

# Stop and remove volumes (clean slate)
npm run docker:cleanup
```

## Hot Reloading

### Frontend (Next.js)
- File changes are automatically detected
- Browser refreshes automatically
- Volume mount: `./frontend:/app`

### Backend (Flask)
- Flask debug mode enabled
- Automatic restart on file changes
- Volume mount: `./backend:/app/backend`

### Auth Server (Flask)
- Flask debug mode enabled
- Automatic restart on file changes
- Volume mount: `./auth-server:/app`

## Data Persistence

### Database Data
- PostgreSQL data persists in Docker volume `postgres_data`
- Data survives container restarts
- Use `docker:cleanup` to reset database

### Application Data
- Backend data files: `./data` directory
- Frontend uploads: `./frontend/public/uploads`
- Logs: Container-specific volumes

## Environment Variables

### Development (.env)
```bash
# Database
POSTGRES_DB=sizewise_dev
POSTGRES_USER=sizewise
POSTGRES_PASSWORD=sizewise_dev_password

# Application
SECRET_KEY=dev-secret-key
FLASK_ENV=development
FLASK_DEBUG=true

# URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_URL=http://localhost:5001

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Production
See `docker/.env.example` for production configuration template.

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Container Won't Start
```bash
# Check container logs
docker-compose -f docker-compose.dev.yml logs [service-name]

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

#### Database Connection Issues
```bash
# Check PostgreSQL container
docker-compose -f docker-compose.dev.yml exec postgres psql -U sizewise -d sizewise_dev

# Reset database
npm run docker:cleanup
npm run docker:dev
```

#### Permission Issues (Linux/macOS)
```bash
# Fix script permissions
chmod +x scripts/docker-dev.sh

# Fix file ownership
sudo chown -R $USER:$USER .
```

## Next Steps

- [Migration Guide](./MIGRATION_GUIDE.md) - Migrating from local development
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Production setup
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Electron Integration](./ELECTRON_DOCKER.md) - Desktop app with Docker

## Support

For issues and questions:
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review container logs: `npm run docker:logs`
3. Create an issue in the GitHub repository
