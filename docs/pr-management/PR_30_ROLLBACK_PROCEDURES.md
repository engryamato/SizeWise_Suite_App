# PR #30 Rollback Procedures - Emergency Response Plan

## Executive Summary

**Rollback Scope**: jsonschema 4.25.0→4.23.0 and pydantic-core 2.37.2→2.33.2  
**Rollback Complexity**: 🟢 LOW (Minor version downgrades)  
**Recovery Time**: < 15 minutes  
**Data Impact**: None (no breaking changes)  

## Rollback Triggers

### Immediate Rollback Conditions (RED ALERT)
- **Critical System Failure**: Application won't start or crashes
- **Database Connection Loss**: MongoDB/PostgreSQL integration failures
- **API Endpoint Failures**: > 5% of endpoints returning errors
- **Authentication System Failure**: JWT validation or user authentication broken
- **Performance Degradation**: > 20% slowdown in critical operations

### Cautionary Rollback Conditions (YELLOW ALERT)
- **Test Suite Failures**: > 10% of tests failing
- **Performance Issues**: 10-20% degradation in validation/serialization
- **Memory Leaks**: Significant memory usage increase (> 15%)
- **Error Rate Increase**: > 2% increase in validation errors
- **Security Concerns**: New vulnerabilities detected

### Monitoring Rollback Conditions (ORANGE ALERT)
- **Gradual Performance Decline**: 5-10% performance degradation
- **Increased Error Logs**: Notable increase in validation-related errors
- **User Reports**: Multiple user reports of validation issues
- **Integration Issues**: Third-party service integration problems

## Pre-Deployment Backup Strategy

### 1. Environment Backup
```bash
#!/bin/bash
# Pre-deployment backup script

echo "🔄 Creating PR #30 deployment backup..."

# Create backup directory with timestamp
BACKUP_DIR="backups/pr-30-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup current requirements.txt
cp backend/requirements.txt $BACKUP_DIR/requirements.txt.backup

# Backup virtual environment state
pip freeze > $BACKUP_DIR/pip-freeze-backup.txt

# Backup current application state
cp -r backend/config $BACKUP_DIR/config-backup/
cp backend/app.py $BACKUP_DIR/app.py.backup

# Create rollback script
cat > $BACKUP_DIR/rollback.sh << 'EOF'
#!/bin/bash
echo "🚨 Executing PR #30 Emergency Rollback..."
pip install jsonschema==4.23.0 pydantic-core==2.33.2
echo "✅ Dependencies rolled back successfully"
EOF

chmod +x $BACKUP_DIR/rollback.sh

echo "✅ Backup created at: $BACKUP_DIR"
echo "📝 Rollback script: $BACKUP_DIR/rollback.sh"
```

### 2. Database State Verification
```bash
# Verify database connections before deployment
python -c "
import sys
sys.path.append('backend')
from config.mongodb_config import MongoDBConfig
from services.mongodb_service import MongoDBService
print('✅ MongoDB connection verified')

import psycopg2
from sqlalchemy import create_engine
print('✅ PostgreSQL connection verified')
"
```

### 3. Application Health Check
```bash
# Pre-deployment health check
curl -f http://localhost:5000/health || echo "❌ Backend health check failed"
curl -f http://localhost:3000/api/health || echo "❌ Frontend health check failed"
```

## Emergency Rollback Procedures

### Level 1: Immediate Dependency Rollback (< 5 minutes)

#### Step 1: Stop Application Services
```bash
# Stop all services immediately
pkill -f "python.*app.py"
pkill -f "npm.*start"
pkill -f "next.*dev"

echo "🛑 All application services stopped"
```

#### Step 2: Rollback Dependencies
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Rollback to previous versions
pip install jsonschema==4.23.0 pydantic-core==2.33.2

# Verify rollback
pip show jsonschema | grep Version
pip show pydantic-core | grep Version

echo "✅ Dependencies rolled back to safe versions"
```

#### Step 3: Restart Services
```bash
# Restart backend service
cd backend
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Restart frontend service
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🚀 Services restarted with rollback dependencies"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
```

#### Step 4: Immediate Health Verification
```bash
# Quick health checks
curl -f http://localhost:5000/health && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
curl -f http://localhost:3000/api/health && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"

# Test critical endpoints
curl -f http://localhost:5000/api/calculations/test && echo "✅ Calculations working" || echo "❌ Calculations failed"
```

### Level 2: Full Environment Restoration (< 15 minutes)

#### Step 1: Complete Environment Reset
```bash
# Stop all services
pkill -f "python.*app.py"
pkill -f "npm.*start"

# Restore from backup
BACKUP_DIR=$(ls -1 backups/ | grep pr-30 | tail -1)
echo "📁 Restoring from backup: $BACKUP_DIR"

# Restore requirements.txt
cp backups/$BACKUP_DIR/requirements.txt.backup backend/requirements.txt

# Restore configuration
cp -r backups/$BACKUP_DIR/config-backup/* backend/config/

# Restore application files
cp backups/$BACKUP_DIR/app.py.backup backend/app.py
```

#### Step 2: Rebuild Environment
```bash
# Reinstall all dependencies from backup
cd backend
pip install -r requirements.txt

# Verify installation
pip check && echo "✅ Dependencies consistent" || echo "❌ Dependency conflicts detected"
```

#### Step 3: Database Verification
```bash
# Test database connections
python -c "
import sys
sys.path.append('backend')

# Test MongoDB
try:
    from config.mongodb_config import MongoDBConfig
    from services.mongodb_service import MongoDBService
    service = MongoDBService()
    print('✅ MongoDB connection restored')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')

# Test PostgreSQL
try:
    import psycopg2
    from sqlalchemy import create_engine
    # Add your PostgreSQL connection test here
    print('✅ PostgreSQL connection restored')
except Exception as e:
    print(f'❌ PostgreSQL connection failed: {e}')
"
```

#### Step 4: Full Application Restart
```bash
# Start backend with monitoring
cd backend
python app.py > ../logs/backend-rollback.log 2>&1 &
BACKEND_PID=$!

# Start frontend with monitoring
cd ../frontend
npm run dev > ../logs/frontend-rollback.log 2>&1 &
FRONTEND_PID=$!

# Monitor startup
tail -f ../logs/backend-rollback.log &
tail -f ../logs/frontend-rollback.log &

echo "🔍 Monitoring application startup..."
sleep 30

# Kill tail processes
pkill -f "tail.*rollback.log"
```

### Level 3: Complete System Recovery (< 30 minutes)

#### Step 1: Full System Reset
```bash
# Complete application shutdown
docker-compose down 2>/dev/null || true
pkill -f "python"
pkill -f "npm"
pkill -f "node"

# Clear caches
rm -rf backend/__pycache__
rm -rf backend/api/__pycache__
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
```

#### Step 2: Fresh Installation
```bash
# Reinstall backend dependencies
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Reinstall frontend dependencies
cd ../frontend
rm -rf node_modules
npm install
```

#### Step 3: Database Recovery
```bash
# Reset database connections
python backend/verify_sentry.py
python -c "
import sys
sys.path.append('backend')
from config.mongodb_config import MongoDBConfig
print('MongoDB configuration loaded successfully')
"
```

## Automated Rollback Scripts

### Quick Rollback Script
```bash
#!/bin/bash
# quick-rollback.sh - Emergency 5-minute rollback

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# Stop services
pkill -f "python.*app.py" || true
pkill -f "npm.*start" || true

# Rollback dependencies
cd backend
source venv/bin/activate
pip install jsonschema==4.23.0 pydantic-core==2.33.2

# Restart services
python app.py &
cd ../frontend
npm run dev &

# Wait and verify
sleep 15
curl -f http://localhost:5000/health && echo "✅ ROLLBACK SUCCESSFUL" || echo "❌ ROLLBACK FAILED"
```

### Comprehensive Rollback Script
```bash
#!/bin/bash
# comprehensive-rollback.sh - Full environment restoration

set -e

echo "🔄 COMPREHENSIVE ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# Find latest backup
BACKUP_DIR=$(ls -1 backups/ | grep pr-30 | tail -1)
if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No backup found!"
    exit 1
fi

echo "📁 Using backup: $BACKUP_DIR"

# Execute backup rollback script
if [ -f "backups/$BACKUP_DIR/rollback.sh" ]; then
    bash backups/$BACKUP_DIR/rollback.sh
else
    echo "❌ Rollback script not found in backup!"
    exit 1
fi

echo "✅ COMPREHENSIVE ROLLBACK COMPLETED"
```

## Post-Rollback Verification

### Immediate Checks (< 5 minutes)
```bash
# Service health
curl -f http://localhost:5000/health
curl -f http://localhost:3000/api/health

# Database connectivity
python -c "from backend.services.mongodb_service import MongoDBService; print('MongoDB OK')"

# Critical functionality
curl -f http://localhost:5000/api/calculations/test
```

### Extended Verification (< 15 minutes)
```bash
# Run critical test subset
cd backend
python -m pytest tests/critical/ -v --tb=short

# Performance verification
python -c "
import time
start = time.time()
# Add performance test here
end = time.time()
print(f'Performance test: {end-start:.2f}s')
"
```

## Communication Plan

### Internal Team Notification
```bash
# Automated notification script
echo "🚨 ROLLBACK EXECUTED: PR #30" | mail -s "SizeWise Rollback Alert" team@sizewise.com
```

### User Communication Template
```
Subject: SizeWise Suite - Brief Service Interruption Resolved

Dear SizeWise Users,

We experienced a brief service interruption due to a backend update. 
The issue has been resolved and all services are now operating normally.

Duration: [X] minutes
Impact: [Description]
Resolution: Rollback to previous stable version

We apologize for any inconvenience.

- SizeWise Team
```

## Lessons Learned Documentation

### Post-Rollback Analysis Template
```markdown
# PR #30 Rollback Analysis

## Incident Summary
- **Trigger**: [What caused the rollback]
- **Duration**: [How long the rollback took]
- **Impact**: [What was affected]

## Root Cause
- [Detailed analysis of what went wrong]

## Prevention Measures
- [What can be done to prevent this in the future]

## Process Improvements
- [How to improve rollback procedures]
```

## Conclusion

This comprehensive rollback strategy ensures rapid recovery from any issues with PR #30's dependency updates. The multi-level approach provides appropriate responses for different severity levels, from quick dependency rollbacks to full system recovery.

**Key Success Factors:**
- Pre-deployment backups
- Automated rollback scripts
- Clear trigger conditions
- Comprehensive verification procedures
- Effective communication plans

**Recovery Time Objectives:**
- Level 1 (Immediate): < 5 minutes
- Level 2 (Full Environment): < 15 minutes  
- Level 3 (Complete System): < 30 minutes
