# Post-Migration Quick Start Guide

**Updated:** July 23, 2025  
**For:** SizeWise Suite v0.1.0 (Post Frontend Migration)

---

## 🚀 Quick Start Commands

### Development Environment
```bash
# Start everything (recommended for development)
npm run start:dev          # Backend (5000) + Frontend (3001)

# Or start services individually
npm run start:backend      # Flask backend on port 5000
npm run dev                # Next.js frontend on port 3001
```

### Production Build
```bash
npm run build              # Build Next.js for production
npm run start              # Start Next.js production server
```

### Testing
```bash
npm run test               # Run Jest unit tests
npm run test:e2e           # Run Playwright E2E tests
npm run test:backend       # Run Python backend tests
```

---

## 📁 New Project Structure

```
SizeWise_Suite_App/
├── frontend/              # 🆕 Next.js app (was frontend-nextjs/)
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and hooks
│   └── tests/            # Frontend tests
├── backend/              # Flask API (unchanged)
├── core/                 # Calculation modules (unchanged)
└── docs/                 # Documentation (updated)
```

---

## 🔄 What Changed

### ✅ What's New
- **Single Frontend:** Only Next.js (no more Vite frontend)
- **Simplified Commands:** One set of npm scripts
- **Modern Stack:** Next.js 15.4.2 + React 19.1.0 + TypeScript
- **Clean Dependencies:** 814 packages removed

### ❌ What's Removed
- **Old Frontend:** `frontend/` directory (Vite-based)
- **Vite Config:** `vite.config.js` file
- **Old Scripts:** `npm run dev` (old), `npm run build` (old)
- **Duplicate Dependencies:** Vite, workbox, legacy plugins

### 🔄 What's Unchanged
- **Backend API:** All Flask endpoints work the same
- **HVAC Calculations:** All calculation logic preserved
- **Core Features:** Air duct sizing, PDF import, 3D workspace

---

## 🛠️ Development Workflow

### Before Migration
```bash
# Old workflow (no longer works)
npm run dev              # Started Vite frontend (port 5173)
npm run dev:nextjs       # Started Next.js frontend (port 3000)
npm run start:backend    # Started Flask backend (port 5000)
```

### After Migration
```bash
# New simplified workflow
npm run start:dev        # Starts both backend + frontend
npm run dev              # Starts Next.js frontend (port 3001)
npm run start:backend    # Starts Flask backend (port 5000)
```

---

## 🌐 Port Configuration

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Flask Backend** | 5000 | http://localhost:5000 | ✅ Active |
| **Next.js Frontend** | 3001 | http://localhost:3001 | ✅ Active |
| ~~Vite Frontend~~ | ~~5173~~ | ~~http://localhost:5173~~ | ❌ Removed |

---

## 🧪 Testing Guide

### Unit Tests
```bash
npm run test              # Run all Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
```

### E2E Tests
```bash
npm run test:e2e          # Run Playwright tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run in headed mode
```

### Backend Tests
```bash
npm run test:backend      # Run Python tests
npm run test:all          # Run all tests (frontend + backend + e2e)
```

---

## 🔧 Code Quality

### Linting and Formatting
```bash
npm run lint              # Check code style
npm run lint:fix          # Fix code style issues
npm run type-check        # TypeScript type checking
```

### Pre-commit Checks
- ESLint validation
- TypeScript compilation
- Prettier formatting
- Test execution

---

## 📦 Dependencies

### Frontend Dependencies (in frontend/package.json)
- **Next.js 15.4.2** - React framework
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Three.js** - 3D graphics
- **React-Konva** - 2D drawing

### Root Dependencies (in package.json)
- **Concurrently** - Run multiple commands
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🚨 Common Issues and Solutions

### Issue: "Port 3000 is in use"
**Solution:** Next.js automatically uses port 3001 when 3000 is busy. This is normal.

### Issue: "Module not found" errors
**Solution:** Run `npm install` in both root and frontend directories:
```bash
npm install                # Install root dependencies
npm run install:frontend   # Install frontend dependencies
```

### Issue: Backend API not responding
**Solution:** Ensure backend is running:
```bash
npm run start:backend      # Start Flask backend
curl http://localhost:5000/api/health  # Test backend
```

### Issue: Frontend not loading
**Solution:** Check frontend development server:
```bash
npm run dev                # Start Next.js frontend
# Visit http://localhost:3001
```

---

## 🔄 Migration Rollback (Emergency)

If you need to rollback to the dual frontend setup:

```bash
# Checkout backup branch
git checkout backup-old-frontend
git checkout -b restore-dual-frontend

# Reinstall old dependencies
npm install

# Test old workflow
npm run dev              # Should start Vite (port 5173)
npm run dev:nextjs       # Should start Next.js (port 3000)
npm run start:backend    # Should start Flask (port 5000)
```

---

## 📚 Additional Resources

- [Frontend Migration Completion](../architecture/frontend-migration-completion.md)
- [Development Setup Guide](../architecture/development-setup.md)
- [Technology Decisions](../architecture/technology-decisions.md)
- [API Specification](../architecture/api-specification.md)

---

## 🆘 Getting Help

### Documentation
- Check `docs/` directory for comprehensive guides
- Review `MIGRATION_COMPLETION_REPORT.md` for detailed migration info

### Troubleshooting
1. Ensure all dependencies are installed
2. Check that ports 5000 and 3001 are available
3. Verify backend and frontend start independently
4. Check browser console for errors

### Emergency Contacts
- **Technical Issues:** Development Team
- **Migration Questions:** See migration documentation
- **Rollback Needed:** Use backup branch `backup-old-frontend`

---

**Quick Start Status: ✅ READY**  
**Migration Status: ✅ COMPLETE**  
**Development Workflow: ✅ SIMPLIFIED**
