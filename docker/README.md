# SizeWise Suite Docker Deployment Guide

This guide provides comprehensive instructions for deploying the SizeWise Suite application using Docker and Docker Compose across different environments.

## 📋 Prerequisites

### System Requirements

**Minimum Requirements:**
- 4GB RAM
- 2 CPU cores
- 20GB free disk space
- Docker 24.0+ and Docker Compose 2.0+

**Recommended for Production:**
- 8GB+ RAM
- 4+ CPU cores
- 100GB+ SSD storage
- Load balancer (NGINX)
- SSL certificates

### Software Dependencies

- **Docker Engine 24.0+**
- **Docker Compose 2.0+**
- **Git** (for cloning the repository)

### Installation

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

#### Windows
```powershell
# Install Docker Desktop
winget install Docker.DockerDesktop

# Or download from: https://www.docker.com/products/docker-desktop
```

## 🚀 Quick Start

### Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/engryamato/SizeWise_Suite_App.git
   cd SizeWise_Suite_App
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   cp docker/.env.example docker/.env
   ```

3. **Start the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050/api
   - Auth API: http://localhost:5051/api
   - Database: localhost:5432

### Production Environment

1. **Set up production environment variables:**
   ```bash
   cp docker/.env.example docker/.env.prod
   # Edit docker/.env.prod with production values
   ```

2. **Start the production environment:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file docker/.env.prod up -d
   ```

3. **Access the application:**
   - Application: https://your-domain.com
   - Admin Panel: https://your-domain.com/admin

## 📁 Project Structure

```
SizeWise_Suite_App/
├── docker/                          # Docker configuration
│   ├── backend/Dockerfile          # Backend container
│   ├── frontend/Dockerfile         # Frontend container
│   ├── auth-server/Dockerfile      # Auth server container
│   ├── nginx/                      # NGINX configuration
│   ├── postgres/                   # PostgreSQL configuration
│   ├── redis/                      # Redis configuration
│   └── README.md                   # This file
├── docker-compose.dev.yml          # Development environment
├── docker-compose.prod.yml         # Production environment
├── .env.example                    # Environment template
└── docker/.env.example            # Docker-specific env template
```

## 🔧 Configuration

### Environment Variables

#### Core Application Variables
```bash
# Application Environment
NODE_ENV=development|production
FLASK_ENV=development|production

# Security Keys (CHANGE IN PRODUCTION!)
SECRET_KEY=your-backend-secret-key-min-32-chars
AUTH_SECRET_KEY=your-auth-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars

# Database Configuration
POSTGRES_DB=sizewise_suite
POSTGRES_USER=sizewise
POSTGRES_PASSWORD=your-secure-password
POSTGRES_AUTH_DB=sizewise_auth

# Redis Configuration
REDIS_PASSWORD=your-redis-password

# External Services
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_AUTH_URL=https://auth.your-domain.com/api
```

#### Development-Specific Variables
```bash
# Development URLs
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_AUTH_URL=http://localhost:5051/api

# Debug Settings
NEXT_PUBLIC_ENABLE_DEBUG=true
LOG_LEVEL=DEBUG
```

#### Production-Specific Variables
```bash
# Production URLs
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_AUTH_URL=https://auth.your-domain.com/api
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com

# Security Settings
LOG_LEVEL=INFO
SENTRY_ENVIRONMENT=production
```

## 🐳 Docker Services

### Frontend (Next.js)
- **Port:** 3000
- **Technology:** Next.js 15, React 19
- **Features:** Server-side rendering, static optimization
- **Health Check:** `/api/health`

### Backend API (Flask)
- **Port:** 5000 (exposed as 5050 in dev)
- **Technology:** Python 3.11, Flask
- **Features:** HVAC calculations, data processing
- **Health Check:** `/api/health`

### Authentication Server (Flask)
- **Port:** 5001 (exposed as 5051 in dev)
- **Technology:** Python 3.11, Flask
- **Features:** JWT authentication, MFA support
- **Health Check:** `/api/health`

### PostgreSQL Database
- **Port:** 5432
- **Version:** PostgreSQL 15
- **Features:** Primary data storage, auth data
- **Health Check:** `pg_isready`

### Redis Cache
- **Port:** 6379
- **Version:** Redis 7
- **Features:** Session storage, caching
- **Health Check:** `redis-cli ping`

### NGINX (Production Only)
- **Ports:** 80, 443
- **Features:** Load balancing, SSL termination
- **Health Check:** `/health`

## 📊 Monitoring and Logs

### Viewing Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 backend
```

### Health Checks
```bash
# Check service health
docker-compose -f docker-compose.dev.yml ps

# Manual health check
curl http://localhost:3000/api/health
curl http://localhost:5050/api/health
curl http://localhost:5051/api/health
```

### Resource Monitoring
```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 🔒 Security Considerations

### Development Environment
- Uses development certificates
- Debug mode enabled
- Relaxed CORS policies
- Default passwords (change immediately)

### Production Environment
- SSL/TLS encryption required
- Production-grade secrets
- Strict CORS policies
- Resource limits enforced
- Security headers enabled
- Regular security updates

### Best Practices
1. **Never use default passwords in production**
2. **Use environment-specific configuration files**
3. **Enable SSL/TLS for all external communications**
4. **Regularly update Docker images**
5. **Monitor logs for security events**
6. **Use secrets management for sensitive data**

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using port
sudo kill -9 $(lsof -t -i:3000)
```

#### Permission Issues
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# Reset Docker volumes
docker-compose down -v
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U sizewise -d sizewise_suite
```

#### Memory Issues
```bash
# Check container memory usage
docker stats --no-stream

# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > Increase limit
```

### Getting Help

1. **Check the logs first:**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

3. **Test individual services:**
   ```bash
   docker-compose up [service-name]
   ```

4. **Reset everything:**
   ```bash
   docker-compose down -v --remove-orphans
   docker system prune -a
   docker-compose up -d
   ```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SizeWise Suite API Documentation](../docs/api-reference.md)
- [Deployment Guide](../docs/deployment-guide.md)
- [Security Guide](../docs/security/README.md)

## 🤝 Contributing

When contributing Docker-related changes:

1. Test in both development and production configurations
2. Update documentation for any new services or configurations
3. Ensure cross-platform compatibility (Windows, macOS, Linux)
4. Follow security best practices
5. Update environment variable examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
