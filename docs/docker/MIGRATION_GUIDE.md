# Migration Guide: From Local Development to Docker

This guide helps you migrate from the traditional local development setup to the new Docker-based development environment.

## Overview

The Docker migration provides several benefits:
- **Consistent Environment**: Same setup across all team members
- **Simplified Setup**: Single command to start all services
- **Isolated Dependencies**: No conflicts between project dependencies
- **Production Parity**: Development environment matches production

## ✅ **Production Deployment Status: VALIDATED**

**As of July 2025**, the Docker containerization has been successfully tested and validated for production deployment:

### **Production Testing Results**
- ✅ **All Backend Services**: PostgreSQL, Redis, Backend API, Auth Server, Nginx - all running successfully
- ✅ **Database Migrations**: Automatic database initialization and schema creation working
- ✅ **Authentication Flow**: Complete user registration and login validated in production mode
- ✅ **Load Balancing**: Nginx reverse proxy with rate limiting operational
- ✅ **Health Checks**: All containers healthy with proper monitoring
- ✅ **Backup Procedures**: Database backup and restore functionality validated
- ✅ **Security**: Production security headers and non-root users implemented

### **Recommended Architecture: Hybrid Solution**

Based on extensive testing, we recommend a **hybrid approach** for optimal development experience:

**✅ PRODUCTION-READY:**
- **Backend Services**: Fully containerized (PostgreSQL, Redis, Backend API, Auth Server, Nginx)
- **Frontend Development**: Local development with hot reloading

**🔄 FRONTEND CONTAINERIZATION STATUS:**
- **Current Challenge**: React 19 ecosystem compatibility issues
- **Affected Dependencies**: `@testing-library/react`, `lucide-react`, rollup ARM64 binaries
- **Alternative Solutions**: Available but require React 18 downgrade for Docker builds
- **Recommendation**: Use hybrid approach until React 19 ecosystem matures

## Pre-Migration Checklist

### 1. Backup Current Setup
```bash
# Backup your current database
cp data/sizewise-dev.db data/sizewise-dev.db.backup

# Backup environment files
cp .env .env.backup 2>/dev/null || echo "No .env file to backup"

# Backup any custom configurations
cp -r frontend/config frontend/config.backup 2>/dev/null || echo "No config to backup"
```

### 2. Document Current Configuration
Make note of:
- Custom environment variables
- Database modifications
- Port configurations
- Any custom scripts or workflows

## Migration Steps

### Step 1: Install Docker
1. Install Docker Desktop for your platform
2. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

### Step 2: Choose Your Development Approach

#### **Option A: Hybrid Development (RECOMMENDED)**
Best for active frontend development with React 19:

```bash
# 1. Start containerized backend services
docker-compose up -d

# 2. Start frontend locally (in separate terminal)
cd frontend
npm run dev

# 3. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Auth Server: http://localhost:5001
```

#### **Option B: Full Containerization**
For teams preferring complete containerization:

```bash
# Note: Requires React 18 compatibility adjustments
docker-compose -f docker-compose.full.yml up -d
```

### Step 3: Prepare Docker Environment
```bash
# Create Docker environment file
cp docker/.env.example .env

# Update with your current configuration
# Compare with your backed up .env file
```

### Step 3: Migrate Database Data

#### Option A: Fresh Start (Recommended)
```bash
# Let Docker create a fresh database
# Your existing SQLite data will remain in ./data/
npm run docker:dev
```

#### Option B: Migrate Existing Data
```bash
# Start PostgreSQL container only
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Export from SQLite (if you have existing data)
sqlite3 data/sizewise-dev.db .dump > data/sqlite_export.sql

# Import to PostgreSQL (manual process - adapt as needed)
# This requires custom migration scripts based on your schema
```

### Step 4: Update Development Workflow

#### Old Workflow
```bash
# Terminal 1: Backend
source .venv/bin/activate
python run_backend.py

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Auth Server
cd auth-server
python app.py
```

#### New Workflow
```bash
# Single command starts everything
npm run docker:dev

# Or use the script directly
./scripts/docker-dev.sh start
```

### Step 5: Update IDE Configuration

#### VS Code
Update `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "docker-compose -f docker-compose.dev.yml exec backend python",
  "python.terminal.activateEnvironment": false,
  "docker.defaultRegistryPath": "localhost:5000"
}
```

#### PyCharm
1. Go to Settings → Project → Python Interpreter
2. Add Docker Compose interpreter
3. Select `docker-compose.dev.yml`
4. Choose `backend` service

## Verification Steps

### 1. Service Health Checks
```bash
# Check all services are running
npm run docker:status

# Test health endpoints
curl http://localhost:3000/api/health    # Frontend
curl http://localhost:5000/api/health    # Backend
curl http://localhost:5001/api/health    # Auth Server
```

### 2. Database Connectivity
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U sizewise -d sizewise_dev

# List tables
\dt

# Exit
\q
```

### 3. Hot Reloading
1. Edit a frontend file → Browser should auto-refresh
2. Edit a backend file → Flask should restart automatically
3. Check logs: `npm run docker:logs`

### 4. Test API Endpoints
```bash
# Test backend API
curl http://localhost:5000/api/info

# Test auth endpoints
curl http://localhost:5001/api/health
```

## Common Migration Issues

### Port Conflicts
**Problem**: Ports 3000, 5000, 5001, or 5432 are already in use

**Solution**:
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 $(lsof -t -i:3000)

# Or change ports in docker-compose.dev.yml
```

### Permission Issues
**Problem**: Permission denied errors on Linux/macOS

**Solution**:
```bash
# Fix script permissions
chmod +x scripts/docker-dev.sh

# Fix file ownership
sudo chown -R $USER:$USER .
```

### Database Connection Errors
**Problem**: Backend can't connect to PostgreSQL

**Solution**:
```bash
# Check PostgreSQL container logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

### Frontend Build Issues
**Problem**: Next.js build fails in container

**Solution**:
```bash
# Clear Next.js cache
docker-compose -f docker-compose.dev.yml exec frontend rm -rf .next

# Rebuild frontend container
docker-compose -f docker-compose.dev.yml up --build frontend
```

## Rollback Plan

If you need to return to local development:

### 1. Stop Docker Services
```bash
npm run docker:stop
```

### 2. Restore Local Environment
```bash
# Restore backed up files
cp .env.backup .env
cp data/sizewise-dev.db.backup data/sizewise-dev.db

# Reactivate virtual environment
source .venv/bin/activate

# Start services locally
npm run start:dev
```

### 3. Update Configuration
- Restore any custom configurations
- Update IDE settings back to local Python interpreter

## Team Migration Strategy

### Phase 1: Individual Migration (Week 1)
- Each developer migrates their local environment
- Document any issues encountered
- Refine Docker configuration based on feedback

### Phase 2: Team Standardization (Week 2)
- Standardize on Docker development environment
- Update team documentation
- Conduct team training session

### Phase 3: CI/CD Integration (Week 3)
- Update CI/CD pipelines to use Docker
- Implement container-based testing
- Deploy production environment

## Benefits After Migration

### For Developers
- **Faster Setup**: New team members can start in minutes
- **Consistent Environment**: No more "works on my machine"
- **Easier Testing**: Full stack testing with single command
- **Better Isolation**: No dependency conflicts

### For the Project
- **Production Parity**: Development matches production
- **Scalability**: Easy to add new services
- **Deployment**: Simplified production deployment
- **Maintenance**: Easier to update dependencies

## Next Steps

After successful migration:
1. [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
2. [Electron Integration](./ELECTRON_DOCKER.md)
3. [Advanced Docker Configuration](./ADVANCED_DOCKER.md)

## Support

If you encounter issues during migration:
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review migration logs: `npm run docker:logs`
3. Ask for help in the team chat or create a GitHub issue
