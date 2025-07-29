# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and solutions for SizeWise Suite across all platforms and deployment scenarios.

## Quick Diagnostics

### System Health Check

```bash
# Check all services status
npm run health:check

# Verify system requirements
npm run system:check

# Test database connectivity
npm run db:test

# Validate configuration
npm run config:validate
```

### Service Status Commands

```bash
# Frontend health check
curl http://localhost:3000/api/health

# Backend API health check  
curl http://localhost:5000/api/health

# Authentication server health check
curl http://localhost:5001/api/health

# Database connectivity test
npm run db:ping
```

## Common Issues and Solutions

### 🚀 Application Startup Issues

#### Issue: Application Won't Start

**Symptoms:**
- Application fails to launch
- Splash screen appears but app doesn't load
- Error messages during startup

**Diagnostic Steps:**
1. Check system requirements
2. Verify all dependencies are installed
3. Check for port conflicts
4. Review startup logs

**Solutions:**

**Missing Dependencies:**
```bash
# Reinstall all dependencies
npm install
cd backend && pip install -r requirements.txt
cd auth-server && pip install -r requirements.txt

# Clear cache and reinstall
npm run clean:all
npm install
```

**Port Conflicts:**
```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :5001  # Auth server

# Kill conflicting processes
kill -9 <PID>

# Or use different ports
PORT=3001 npm run dev
```

**Permission Issues:**
```bash
# Fix file permissions (macOS/Linux)
chmod -R 755 .
sudo chown -R $USER:$USER .

# Windows: Run as Administrator
```

#### Issue: Database Connection Failures

**Symptoms:**
- "Database connection failed" errors
- Authentication not working
- Project data not loading

**Diagnostic Steps:**
```bash
# Test database connectivity
npm run db:test

# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

**Solutions:**

**Database Not Running:**
```bash
# Start database service
docker-compose up -d postgres

# Or start all services
npm run docker:up
```

**Connection String Issues:**
```bash
# Check environment variables
echo $DATABASE_URL

# Reset to default (development)
export DATABASE_URL="postgresql://sizewise:password@localhost:5432/sizewise_dev"
```

**Database Corruption:**
```bash
# Reset development database
npm run db:reset

# Restore from backup
npm run db:restore backup_file.sql
```

### 🔐 Authentication Issues

#### Issue: Login Failures

**Symptoms:**
- "Invalid credentials" errors with correct password
- Login page redirects in loops
- Session expires immediately

**Diagnostic Steps:**
```bash
# Test auth server directly
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check JWT token validity
npm run auth:verify-token <token>
```

**Solutions:**

**Token Issues:**
```bash
# Clear stored tokens
localStorage.clear()  # In browser console

# Reset JWT secrets
npm run auth:reset-secrets
```

**Session Problems:**
```bash
# Clear session data
npm run auth:clear-sessions

# Restart auth server
npm run auth:restart
```

#### Issue: Tier/Permission Problems

**Symptoms:**
- Features not available despite correct tier
- "Access denied" errors
- Incorrect feature flags

**Solutions:**
```bash
# Refresh user tier status
npm run auth:refresh-tier <user_id>

# Reset feature flags
npm run features:reset <user_id>

# Check tier configuration
npm run auth:check-tier <user_id>
```

### 🧮 Calculation Issues

#### Issue: Calculation Errors

**Symptoms:**
- "Calculation failed" errors
- Incorrect results
- Infinite loading on calculations

**Diagnostic Steps:**
```bash
# Test calculation engine directly
curl -X POST http://localhost:5000/api/calculations/air-duct \
  -H "Content-Type: application/json" \
  -d '{"airflow":1000,"duct_type":"rectangular","friction_rate":0.08}'

# Check calculation logs
npm run logs:calculations
```

**Solutions:**

**Input Validation Errors:**
- Verify all required parameters are provided
- Check parameter ranges and units
- Ensure numeric values are properly formatted

**Standards Data Issues:**
```bash
# Refresh standards database
npm run standards:refresh

# Validate standards data
npm run standards:validate
```

**Memory Issues:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Clear calculation cache
npm run cache:clear:calculations
```

### 🎨 UI and Performance Issues

#### Issue: Slow 3D Rendering

**Symptoms:**
- Laggy 3D workspace interactions
- Frame rate drops
- Browser freezing

**Solutions:**

**Graphics Optimization:**
```javascript
// Reduce 3D quality in settings
{
  "graphics": {
    "quality": "medium",
    "antialiasing": false,
    "shadows": false,
    "maxSegments": 100
  }
}
```

**Browser Optimization:**
- Enable hardware acceleration in browser settings
- Close unnecessary browser tabs
- Update graphics drivers
- Use Chrome or Firefox for best performance

**System Resources:**
```bash
# Check system resources
top  # Linux/macOS
taskmgr  # Windows

# Close resource-heavy applications
# Increase available RAM
```

#### Issue: UI Layout Problems

**Symptoms:**
- Panels not displaying correctly
- Responsive layout issues
- Glass effects not working

**Solutions:**

**Browser Compatibility:**
- Use supported browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Clear browser cache and cookies
- Disable browser extensions that might interfere

**CSS Issues:**
```bash
# Rebuild CSS
npm run build:css

# Clear style cache
npm run cache:clear:styles
```

### 📁 File and Export Issues

#### Issue: Export Failures

**Symptoms:**
- PDF generation fails
- Excel exports are corrupted
- Export process hangs

**Diagnostic Steps:**
```bash
# Test export functionality
npm run test:exports

# Check export logs
npm run logs:exports

# Verify disk space
df -h  # Linux/macOS
dir  # Windows
```

**Solutions:**

**Disk Space Issues:**
```bash
# Clean temporary files
npm run clean:temp

# Clear export cache
npm run cache:clear:exports
```

**Permission Issues:**
```bash
# Fix export directory permissions
chmod 755 exports/
mkdir -p exports/temp
```

**Memory Issues:**
```bash
# Increase export memory limit
export EXPORT_MEMORY_LIMIT=2048

# Process exports in smaller batches
```

#### Issue: Project File Corruption

**Symptoms:**
- Projects won't open
- Data loss or corruption
- "Invalid project file" errors

**Solutions:**

**File Recovery:**
```bash
# Attempt automatic repair
npm run project:repair <project_file>

# Restore from backup
npm run project:restore <backup_file>

# Export data from corrupted file
npm run project:extract-data <project_file>
```

**Prevention:**
```bash
# Enable automatic backups
npm run backup:enable

# Set backup frequency
npm run backup:schedule daily
```

### 🌐 Network and Connectivity Issues

#### Issue: API Connection Problems

**Symptoms:**
- "Network error" messages
- Timeouts on API calls
- Intermittent connectivity

**Diagnostic Steps:**
```bash
# Test network connectivity
ping api.sizewise-suite.com

# Check DNS resolution
nslookup api.sizewise-suite.com

# Test API endpoints
curl -I https://api.sizewise-suite.com/health
```

**Solutions:**

**Firewall Issues:**
- Allow SizeWise Suite through firewall
- Check corporate proxy settings
- Verify ports 80, 443, 3000, 5000, 5001 are open

**DNS Issues:**
```bash
# Flush DNS cache
sudo dscacheutil -flushcache  # macOS
ipconfig /flushdns  # Windows
sudo systemctl restart systemd-resolved  # Linux
```

**Proxy Configuration:**
```bash
# Set proxy environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1
```

## Platform-Specific Issues

### Windows Issues

#### Issue: PowerShell Execution Policy
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: Long Path Names
```cmd
# Enable long path support
git config --system core.longpaths true
```

### macOS Issues

#### Issue: Gatekeeper Blocking App
```bash
# Allow app through Gatekeeper
sudo spctl --master-disable
# Or right-click app and select "Open"
```

#### Issue: Permission Denied Errors
```bash
# Fix permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Linux Issues

#### Issue: Missing System Dependencies
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential python3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel
```

## Docker-Specific Issues

### Container Issues

#### Issue: Container Won't Start
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs <service_name>

# Restart specific service
docker-compose restart <service_name>
```

#### Issue: Port Binding Errors
```bash
# Check port usage
docker port <container_name>

# Stop conflicting containers
docker stop $(docker ps -q)

# Use different ports
docker-compose -f docker-compose.override.yml up
```

### Volume and Data Issues

#### Issue: Data Persistence Problems
```bash
# Check volume mounts
docker volume ls
docker volume inspect <volume_name>

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

## Performance Optimization

### System Performance

#### Memory Optimization
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
npm run monitor:memory
```

#### Database Performance
```bash
# Optimize database
npm run db:optimize

# Rebuild indexes
npm run db:reindex

# Update statistics
npm run db:analyze
```

### Application Performance

#### Frontend Optimization
```javascript
// Reduce bundle size
{
  "optimization": {
    "splitChunks": {
      "chunks": "all",
      "maxSize": 244000
    }
  }
}
```

#### Backend Optimization
```python
# Enable caching
CACHE_TYPE = 'redis'
CACHE_REDIS_URL = 'redis://localhost:6379'

# Optimize database queries
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}
```

## Getting Help

### Log Collection

#### Collect All Logs
```bash
# Generate support bundle
npm run support:bundle

# Collect specific logs
npm run logs:collect --service=backend --level=error --since=1h
```

#### Log Locations
- **Frontend**: `logs/frontend.log`
- **Backend**: `logs/backend.log`
- **Auth Server**: `logs/auth.log`
- **Database**: `logs/postgres.log`

### Support Channels

#### Self-Service
1. **Knowledge Base**: [docs.sizewise-suite.com](https://docs.sizewise-suite.com)
2. **Community Forum**: [community.sizewise-suite.com](https://community.sizewise-suite.com)
3. **Video Tutorials**: [tutorials.sizewise-suite.com](https://tutorials.sizewise-suite.com)

#### Direct Support
- **Free Users**: Community forum only
- **Premium Users**: support@sizewise-suite.com
- **Enterprise**: Dedicated support representative
- **Emergency**: +1-800-SIZEWISE (critical issues only)

### Before Contacting Support

1. **Try Basic Solutions**: Restart application, clear cache, check internet
2. **Collect Information**: Error messages, steps to reproduce, system info
3. **Check Status Page**: [status.sizewise-suite.com](https://status.sizewise-suite.com)
4. **Search Documentation**: Many issues have documented solutions
5. **Prepare Details**: Version numbers, operating system, error logs

---

*This troubleshooting guide is regularly updated based on user feedback and common support requests. For the most current information, visit our online documentation.*
