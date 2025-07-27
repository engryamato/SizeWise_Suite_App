# Docker Troubleshooting Guide

This guide covers common issues and solutions when working with the SizeWise Suite Docker environment.

## Quick Diagnostics

### Check System Status
```bash
# Docker system info
docker system info

# Check running containers
npm run docker:status

# Check Docker Compose services
docker-compose -f docker-compose.dev.yml ps

# View all logs
npm run docker:logs
```

### Health Check Commands
```bash
# Test all health endpoints
curl http://localhost:3000/api/health    # Frontend
curl http://localhost:5000/api/health    # Backend  
curl http://localhost:5001/api/health    # Auth Server

# Check database connectivity
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U sizewise
```

## Common Issues and Solutions

### 0. Frontend Containerization Issues (React 19)

#### Symptoms
- Frontend Docker build fails with dependency resolution errors
- Error: "ERESOLVE could not resolve" for React 19 dependencies
- Missing ARM64 binaries for rollup or other build tools
- @testing-library/react compatibility issues

#### Root Cause
React 19 is cutting-edge and some ecosystem packages haven't updated their peer dependencies yet:
- `@testing-library/react` only supports React 18
- `lucide-react@0.294.0` doesn't support React 19
- Some build tools lack ARM64 binaries

#### Solutions

**Option 1: Use Hybrid Development (RECOMMENDED)**
```bash
# Start only backend services in Docker
docker-compose up -d

# Run frontend locally
cd frontend && npm run dev
```

**Option 2: Downgrade to React 18 for Docker**
```bash
# Create Docker-specific package.json with React 18
# (Advanced users only - requires dependency management)
```

**Option 3: Wait for Ecosystem Updates**
- Monitor dependency updates for React 19 support
- Check @testing-library/react releases
- Update lucide-react to newer versions

#### Workaround Commands
```bash
# Force install with legacy peer deps (may cause issues)
npm install --legacy-peer-deps

# Use platform-specific builds
docker build --platform=linux/amd64 -f docker/frontend/Dockerfile .
```

### 1. Port Conflicts

#### Symptoms
- Error: "Port already in use"
- Services fail to start
- Connection refused errors

#### Diagnosis
```bash
# Check what's using specific ports
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :5001  # Auth Server
lsof -i :5432  # PostgreSQL
```

#### Solutions
```bash
# Option 1: Kill conflicting processes
kill -9 $(lsof -t -i:3000)

# Option 2: Change ports in docker-compose.dev.yml
# Edit the ports section for the conflicting service

# Option 3: Stop all Docker containers
docker stop $(docker ps -q)
```

### 2. Container Build Failures

#### Symptoms
- "Build failed" errors
- Missing dependencies
- Permission denied during build

#### Diagnosis
```bash
# Check build logs
docker-compose -f docker-compose.dev.yml build --no-cache

# Check Docker daemon
docker info
```

#### Solutions
```bash
# Clean rebuild all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# Clear Docker cache
docker system prune -a

# Fix permissions (Linux/macOS)
sudo chown -R $USER:$USER .
chmod +x scripts/docker-dev.sh
```

### 3. Database Connection Issues

#### Symptoms
- "Connection refused" to PostgreSQL
- Backend can't connect to database
- Database initialization errors

#### Diagnosis
```bash
# Check PostgreSQL container
docker-compose -f docker-compose.dev.yml logs postgres

# Test database connection
docker-compose -f docker-compose.dev.yml exec postgres psql -U sizewise -d sizewise_dev -c "SELECT 1;"
```

#### Solutions
```bash
# Restart PostgreSQL container
docker-compose -f docker-compose.dev.yml restart postgres

# Reset database completely
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres

# Check environment variables
cat .env | grep POSTGRES

# Manual database creation
docker-compose -f docker-compose.dev.yml exec postgres createdb -U sizewise sizewise_dev
```

### 4. Frontend Issues

#### Symptoms
- Next.js build failures
- Hot reloading not working
- Static files not loading

#### Diagnosis
```bash
# Check frontend logs
docker-compose -f docker-compose.dev.yml logs frontend

# Check Node.js version in container
docker-compose -f docker-compose.dev.yml exec frontend node --version
```

#### Solutions
```bash
# Clear Next.js cache
docker-compose -f docker-compose.dev.yml exec frontend rm -rf .next node_modules/.cache

# Rebuild frontend container
docker-compose -f docker-compose.dev.yml up --build frontend

# Check volume mounts
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app

# Restart with clean slate
docker-compose -f docker-compose.dev.yml down
docker volume rm sizewise_suite_app_node_modules 2>/dev/null || true
docker-compose -f docker-compose.dev.yml up --build
```

### 5. Backend API Issues

#### Symptoms
- Flask app won't start
- Import errors
- API endpoints returning 500 errors

#### Diagnosis
```bash
# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend

# Check Python environment
docker-compose -f docker-compose.dev.yml exec backend python --version
docker-compose -f docker-compose.dev.yml exec backend pip list
```

#### Solutions
```bash
# Restart backend container
docker-compose -f docker-compose.dev.yml restart backend

# Rebuild with fresh dependencies
docker-compose -f docker-compose.dev.yml build --no-cache backend

# Check file permissions
docker-compose -f docker-compose.dev.yml exec backend ls -la /app

# Manual dependency installation
docker-compose -f docker-compose.dev.yml exec backend pip install -r requirements.txt
```

### 6. Authentication Server Issues

#### Symptoms
- Auth endpoints not responding
- JWT token errors
- User registration/login failures

#### Diagnosis
```bash
# Check auth server logs
docker-compose -f docker-compose.dev.yml logs auth-server

# Test auth endpoint directly
curl -X POST http://localhost:5001/api/health
```

#### Solutions
```bash
# Restart auth server
docker-compose -f docker-compose.dev.yml restart auth-server

# Check environment variables
docker-compose -f docker-compose.dev.yml exec auth-server env | grep -E "(SECRET|JWT|DATABASE)"

# Reset auth database
docker-compose -f docker-compose.dev.yml exec postgres dropdb -U sizewise sizewise_auth_dev --if-exists
docker-compose -f docker-compose.dev.yml exec postgres createdb -U sizewise sizewise_auth_dev
```

### 7. Volume and File Permission Issues

#### Symptoms
- Files not syncing between host and container
- Permission denied errors
- Changes not reflected in containers

#### Diagnosis
```bash
# Check volume mounts
docker-compose -f docker-compose.dev.yml config

# Check file permissions
ls -la ./frontend ./backend ./auth-server
```

#### Solutions
```bash
# Fix ownership (Linux/macOS)
sudo chown -R $USER:$USER .

# Fix permissions
find . -type f -name "*.sh" -exec chmod +x {} \;

# Restart with volume recreation
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

### 8. Network Connectivity Issues

#### Symptoms
- Services can't communicate with each other
- CORS errors
- API calls failing

#### Diagnosis
```bash
# Check network configuration
docker network ls
docker network inspect sizewise_suite_app_sizewise-network

# Test inter-service connectivity
docker-compose -f docker-compose.dev.yml exec frontend curl http://backend:5000/api/health
```

#### Solutions
```bash
# Recreate network
docker-compose -f docker-compose.dev.yml down
docker network prune
docker-compose -f docker-compose.dev.yml up

# Check CORS configuration
grep -r "CORS_ORIGINS" .env backend/ auth-server/

# Update CORS origins in .env
echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://frontend:3000" >> .env
```

## Performance Issues

### Slow Container Startup

#### Solutions
```bash
# Use Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose -f docker-compose.dev.yml build

# Increase Docker resources (Docker Desktop)
# Settings → Resources → Advanced
# Increase CPU and Memory allocation

# Use multi-stage builds (already implemented)
# Optimize Dockerfile layers
```

### High Memory Usage

#### Diagnosis
```bash
# Check container resource usage
docker stats

# Check system resources
docker system df
```

#### Solutions
```bash
# Clean up unused resources
docker system prune -a

# Limit container memory in docker-compose.dev.yml
# Add under each service:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

## Environment-Specific Issues

### macOS Issues

#### File Watching Problems
```bash
# Increase file watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### Volume Performance
```bash
# Use delegated volume mounts for better performance
# In docker-compose.dev.yml, change:
# volumes:
#   - ./frontend:/app:delegated
```

### Windows Issues

#### Line Ending Problems
```bash
# Configure Git to handle line endings
git config --global core.autocrlf true

# Convert existing files
dos2unix scripts/docker-dev.sh
```

#### Path Issues
```bash
# Use forward slashes in paths
# Ensure Docker Desktop is using WSL 2 backend
```

### Linux Issues

#### Permission Problems
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix SELinux context (if applicable)
sudo setsebool -P container_manage_cgroup on
```

## Advanced Debugging

### Container Shell Access
```bash
# Access running containers
docker-compose -f docker-compose.dev.yml exec frontend /bin/bash
docker-compose -f docker-compose.dev.yml exec backend /bin/bash
docker-compose -f docker-compose.dev.yml exec postgres /bin/bash

# Start temporary debug container
docker run -it --rm --network sizewise_suite_app_sizewise-network node:18-alpine /bin/sh
```

### Log Analysis
```bash
# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f

# Filter logs by service
docker-compose -f docker-compose.dev.yml logs -f backend | grep ERROR

# Export logs to file
docker-compose -f docker-compose.dev.yml logs > debug.log
```

### Network Debugging
```bash
# Inspect network
docker network inspect sizewise_suite_app_sizewise-network

# Test connectivity between containers
docker-compose -f docker-compose.dev.yml exec frontend ping backend
docker-compose -f docker-compose.dev.yml exec backend ping postgres
```

## Getting Help

### Information to Provide
When asking for help, include:

1. **System Information**:
   ```bash
   docker --version
   docker-compose --version
   uname -a  # Linux/macOS
   ```

2. **Error Logs**:
   ```bash
   npm run docker:logs > error-logs.txt
   ```

3. **Configuration**:
   ```bash
   cat .env | grep -v PASSWORD | grep -v SECRET
   ```

4. **Container Status**:
   ```bash
   npm run docker:status
   ```

### Support Channels
1. Check this troubleshooting guide first
2. Search existing GitHub issues
3. Create a new GitHub issue with the information above
4. Ask in team chat with relevant logs

## Prevention Tips

### Regular Maintenance
```bash
# Weekly cleanup
docker system prune
docker volume prune

# Update base images
docker-compose -f docker-compose.dev.yml pull
docker-compose -f docker-compose.dev.yml up --build
```

### Best Practices
- Always use `npm run docker:stop` before shutting down
- Regularly backup important data
- Keep Docker Desktop updated
- Monitor disk space usage
- Use `.dockerignore` to exclude unnecessary files
