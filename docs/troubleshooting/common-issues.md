# SizeWise Suite - Troubleshooting Guide

**Version**: 2.0  
**Last Updated**: 2025-08-03  
**Scope**: Common issues and solutions for developers and users  

## Quick Diagnosis

### System Health Check
```bash
# Check if services are running
curl http://localhost:3000/api/health    # Frontend
curl http://localhost:5000/api/health    # Backend

# Check logs
npm run logs                             # Frontend logs
python -c "import logging; logging.info('Backend health check')"
```

### Common Symptoms and Quick Fixes

| Symptom | Quick Fix | Section |
|---------|-----------|---------|
| App won't start | Check dependencies | [Development Issues](#development-issues) |
| Authentication fails | Verify credentials/tokens | [Authentication Issues](#authentication-issues) |
| Calculations return errors | Check input validation | [HVAC Calculation Issues](#hvac-calculation-issues) |
| Slow performance | Check network/database | [Performance Issues](#performance-issues) |
| Build failures | Check TypeScript/dependencies | [Build Issues](#build-issues) |

## Development Issues

### Issue: Application Won't Start

#### Symptoms
- `npm run dev` fails
- Port already in use errors
- Module not found errors

#### Solutions

**1. Port Conflicts**
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process using port (Windows)
taskkill /PID <process_id> /F

# Use different port
npm run dev -- --port 3001
```

**2. Dependency Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Check for peer dependency issues
npm ls
```

**3. Environment Variables**
```bash
# Verify .env.local exists and has required variables
cat .env.local

# Required variables:
# NEXT_PUBLIC_API_URL=http://localhost:5000
# JWT_SECRET=your_secret_key
# DATABASE_URL=your_database_url
```

### Issue: TypeScript Compilation Errors

#### Symptoms
- Build fails with type errors
- IDE shows red squiggly lines
- `npm run type-check` fails

#### Solutions

**1. Type Definition Issues**
```typescript
// Add missing type definitions
npm install --save-dev @types/node @types/react

// Check tsconfig.json configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true
  }
}
```

**2. Import/Export Issues**
```typescript
// Use proper import syntax
import { ComponentName } from './ComponentName';
import type { TypeName } from './types/TypeName';

// Check for circular dependencies
npm run build -- --verbose
```

### Issue: Hot Reload Not Working

#### Solutions
```bash
# Restart development server
npm run dev

# Clear Next.js cache
rm -rf .next

# Check file watching limits (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Authentication Issues

### Issue: Login Fails

#### Symptoms
- "Invalid credentials" error
- Token validation fails
- Session expires immediately

#### Solutions

**1. Credential Verification**
```typescript
// Check user credentials in database
// Verify password hashing matches
const bcrypt = require('bcrypt');
const isValid = await bcrypt.compare(password, hashedPassword);
```

**2. JWT Token Issues**
```typescript
// Verify JWT secret configuration
const jwt = require('jsonwebtoken');
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

// Check token expiration
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Token expires:', new Date(decoded.exp * 1000));
```

**3. Session Management**
```typescript
// Clear browser storage
localStorage.clear();
sessionStorage.clear();

// Check session in AuthenticationManager
const session = AuthenticationManager.getCurrentSession();
console.log('Current session:', session);
```

### Issue: License Validation Fails

#### Symptoms
- "Invalid license" error
- Features not accessible
- Tier restrictions applied incorrectly

#### Solutions

**1. License Key Format**
```typescript
// Verify license key format
const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const isValidFormat = licensePattern.test(licenseKey);
```

**2. License Validation**
```typescript
// Check license validation logic
const result = await LicenseValidator.validateLicense(licenseKey);
console.log('License validation result:', result);
```

## HVAC Calculation Issues

### Issue: Calculation Errors

#### Symptoms
- "Calculation failed" errors
- Incorrect results
- NaN or undefined values

#### Solutions

**1. Input Validation**
```typescript
// Verify input parameters
const validateInput = (input) => {
  if (!input.airflow || input.airflow <= 0) {
    throw new Error('Airflow must be greater than 0');
  }
  if (!input.velocity || input.velocity <= 0) {
    throw new Error('Velocity must be greater than 0');
  }
};
```

**2. Calculation Logic**
```python
# Check calculation service
def calculate_duct_sizing(airflow, velocity):
    try:
        area = airflow / velocity
        if area <= 0:
            raise ValueError("Invalid area calculation")
        return area
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        raise
```

**3. Unit Conversions**
```typescript
// Verify unit conversions
const convertCFMtoM3S = (cfm) => cfm * 0.000471947;
const convertFPMtoMS = (fpm) => fpm * 0.00508;
```

### Issue: 3D Visualization Problems

#### Symptoms
- 3D models not rendering
- WebGL errors
- Performance issues with large models

#### Solutions

**1. WebGL Support**
```javascript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.error('WebGL not supported');
}
```

**2. Three.js Memory Management**
```javascript
// Proper cleanup
const dispose = () => {
  geometry.dispose();
  material.dispose();
  texture.dispose();
  renderer.dispose();
};
```

## Performance Issues

### Issue: Slow API Responses

#### Symptoms
- API calls take >2 seconds
- Timeout errors
- High server load

#### Solutions

**1. Database Optimization**
```sql
-- Check for missing indexes
EXPLAIN ANALYZE SELECT * FROM calculations WHERE user_id = ?;

-- Add indexes for common queries
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at);
```

**2. Caching Implementation**
```python
# Add Redis caching
import redis
cache = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_result(key):
    result = cache.get(key)
    if result:
        return json.loads(result)
    return None
```

**3. Query Optimization**
```python
# Optimize database queries
def get_user_calculations(user_id, limit=20):
    return db.session.query(Calculation)\
        .filter(Calculation.user_id == user_id)\
        .order_by(Calculation.created_at.desc())\
        .limit(limit)\
        .all()
```

### Issue: High Memory Usage

#### Symptoms
- Browser becomes unresponsive
- Memory leaks in development tools
- Application crashes

#### Solutions

**1. React Memory Leaks**
```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const subscription = api.subscribe(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**2. Large Data Handling**
```typescript
// Implement pagination for large datasets
const [data, setData] = useState([]);
const [page, setPage] = useState(1);

const loadMore = async () => {
  const newData = await api.getData({ page: page + 1 });
  setData(prev => [...prev, ...newData]);
  setPage(prev => prev + 1);
};
```

## Build Issues

### Issue: Build Failures

#### Symptoms
- `npm run build` fails
- TypeScript compilation errors
- Missing dependencies

#### Solutions

**1. Clean Build**
```bash
# Clean all build artifacts
rm -rf .next dist build node_modules
npm install
npm run build
```

**2. Dependency Resolution**
```bash
# Check for conflicting dependencies
npm ls --depth=0

# Update dependencies
npm update

# Fix peer dependency warnings
npm install --legacy-peer-deps
```

**3. Build Configuration**
```javascript
// next.config.js optimization
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeImages: true
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
    };
    return config;
  }
};
```

## Database Issues

### Issue: Connection Problems

#### Symptoms
- Database connection timeouts
- "Connection refused" errors
- Slow query performance

#### Solutions

**1. Connection Configuration**
```python
# Check database connection settings
DATABASE_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'sizewise',
    'user': 'username',
    'password': 'password',
    'pool_size': 10,
    'max_overflow': 20
}
```

**2. Connection Pool Management**
```python
# Implement proper connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

## Testing Issues

### Issue: Test Failures

#### Symptoms
- Tests fail unexpectedly
- Flaky test results
- Setup/teardown issues

#### Solutions

**1. Test Environment**
```bash
# Run tests with proper environment
NODE_ENV=test npm test

# Clear test database
npm run test:db:reset
```

**2. Mock Configuration**
```typescript
// Proper mocking setup
jest.mock('@/lib/auth/AuthenticationManager', () => ({
  getCurrentSession: jest.fn(() => mockSession),
  validateSession: jest.fn(() => true)
}));
```

## Deployment Issues

### Issue: Production Deployment Fails

#### Symptoms
- Build succeeds locally but fails in production
- Environment variable issues
- SSL/HTTPS problems

#### Solutions

**1. Environment Parity**
```bash
# Ensure production environment matches development
node --version  # Check Node.js version
npm --version   # Check npm version

# Verify environment variables
echo $NODE_ENV
echo $DATABASE_URL
```

**2. Production Build Testing**
```bash
# Test production build locally
npm run build
npm run start

# Check for production-specific issues
NODE_ENV=production npm run build
```

## Getting Help

### Debug Information Collection
When reporting issues, include:

```bash
# System information
node --version
npm --version
git --version

# Application logs
npm run logs > debug.log

# Error details
# - Full error message
# - Steps to reproduce
# - Expected vs actual behavior
# - Browser/environment details
```

### Support Channels
- **Documentation**: Check relevant docs first
- **GitHub Issues**: For bugs and feature requests
- **Team Chat**: For quick questions
- **Email Support**: For urgent production issues

### Escalation Process
1. **Self-service**: Check this troubleshooting guide
2. **Documentation**: Review relevant documentation
3. **Team Support**: Ask team members
4. **Technical Lead**: Escalate complex issues
5. **Emergency**: Contact on-call engineer for production issues

## Knowledge Base Search

### Quick Search Commands
```bash
# Search documentation
grep -r "keyword" docs/

# Search codebase for examples
grep -r "ComponentName" frontend/components/

# Find configuration files
find . -name "*.config.*" -type f
```

### Common Search Queries
- **Authentication issues**: Search for "auth", "login", "token"
- **Calculation problems**: Search for "hvac", "calculate", "validation"
- **Performance issues**: Search for "performance", "optimization", "cache"
- **Build problems**: Search for "build", "compile", "typescript"

---

**Remember**: Always check the logs first, and don't hesitate to ask for help when needed!
