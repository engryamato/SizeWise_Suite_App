# SizeWise Suite - Comprehensive Documentation

Welcome to the SizeWise Suite documentation. This comprehensive guide covers all aspects of the advanced HVAC design and analysis platform, including new architectural enhancements, collaboration features, AI optimization, and analytics capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Features](#features)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [Support](#support)

## 🏗️ Overview

SizeWise Suite is a cutting-edge HVAC design and analysis platform that combines traditional engineering calculations with modern web technologies, real-time collaboration, AI-powered optimization, and comprehensive analytics.

### Key Capabilities

- **HVAC Calculations**: Air duct sizing, load calculations, equipment sizing
- **Real-time Collaboration**: Multi-user design sessions with operational transformation
- **AI Optimization**: Machine learning-powered system optimization and recommendations
- **Advanced Analytics**: Comprehensive performance monitoring and reporting
- **Offline-First**: Full functionality without internet connectivity
- **Microservices Architecture**: Scalable, enterprise-ready infrastructure
- **Production Monitoring**: Real-time system health and performance tracking

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand with advanced patterns
- **UI Components**: Custom component library with glassmorphism design
- **Real-time**: Socket.IO for collaboration
- **AI/ML**: ONNX.js for browser-based machine learning
- **Offline Storage**: IndexedDB with Dexie.js
- **Testing**: Jest, React Testing Library, Playwright

#### Backend
- **Framework**: FastAPI with Python 3.11
- **Databases**: PostgreSQL (primary), MongoDB (documents), Redis (cache)
- **Real-time**: WebSocket with aiohttp
- **Monitoring**: Prometheus metrics, custom monitoring system
- **Microservices**: Service mesh, distributed caching, load balancing
- **Testing**: pytest with comprehensive coverage

## 🏛️ Architecture

### System Architecture

The SizeWise Suite follows a modern microservices architecture with clear separation of concerns:

**Frontend Layer**
- React application with TypeScript
- Component library with glassmorphism design
- Advanced state management with Zustand
- Real-time collaboration services
- AI/ML optimization services

**API Gateway**
- Load balancer for traffic distribution
- Service mesh for microservice communication
- Authentication and authorization
- Rate limiting and security

**Backend Services**
- HVAC calculation engine
- Real-time collaboration engine
- AI optimization service
- Analytics and monitoring engine
- Production monitoring system

**Data Layer**
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching and sessions
- File storage for assets

### Key Architectural Patterns

1. **Microservices Architecture**: Modular, scalable service design
2. **Event-Driven Architecture**: Real-time updates and notifications
3. **CQRS Pattern**: Separate read/write operations for performance
4. **Circuit Breaker**: Fault tolerance and resilience
5. **Offline-First**: Local storage with synchronization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- MongoDB 7.0+
- Redis 7.0+
- Docker (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/engryamato/SizeWise_Suite_App.git
   cd SizeWise_Suite_App
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Copy environment templates
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   
   # Update database URLs and secrets
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ✨ Features

### Core HVAC Calculations

#### Air Duct Sizing
Calculate optimal duct dimensions based on:
- Room area and CFM requirements
- Duct material properties
- Pressure class specifications
- Velocity constraints

```typescript
const result = await calculateAirDuct({
  roomArea: 500,
  cfmRequired: 2000,
  ductMaterial: 'galvanized_steel',
  pressureClass: 'low'
});
```

#### Load Calculations
Comprehensive heating and cooling load analysis:
- Building envelope analysis
- Occupancy and equipment loads
- Climate zone considerations
- Detailed load breakdown

#### Equipment Sizing
Size HVAC equipment based on calculated loads:
- Air handlers and fans
- Heating equipment (furnaces, heat pumps)
- Cooling equipment (AC units, chillers)
- Safety factor applications

### Real-time Collaboration

#### Multi-user Design Sessions
- Real-time cursor tracking
- Operational transformation for conflict resolution
- User presence indicators
- Document locking mechanisms

```typescript
const collaboration = useCollaboration();

// Initialize collaboration
await collaboration.initialize({
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  color: '#3B82F6'
});

// Join project room
await collaboration.joinRoom('project-456');
```

#### Conflict Resolution
Advanced operational transformation ensures data consistency:
- Automatic conflict detection
- Intelligent merge strategies
- Version history tracking
- Rollback capabilities

### AI-Powered Optimization

#### Energy Efficiency Analysis
Machine learning models analyze system performance:
- Energy consumption prediction
- Efficiency optimization recommendations
- Equipment sizing optimization
- Environmental impact analysis

```typescript
const aiService = new AIOptimizationService();

const recommendations = await aiService.optimizeSystem({
  hvacSystem: currentSystem,
  buildingData: buildingInfo,
  environmentalData: climateData,
  operationalData: usagePatterns
});
```

#### Predictive Analytics
- Anomaly detection in system performance
- Predictive maintenance recommendations
- Cost-benefit analysis
- ROI calculations

### Advanced Analytics Dashboard

#### Performance Metrics
- Real-time system performance monitoring
- Energy efficiency tracking
- Cost analysis and savings
- Compliance monitoring

#### Interactive Visualizations
- Energy consumption trends
- Performance radar charts
- Cost breakdown analysis
- Compliance status tracking

#### Reporting Engine
- Automated report generation
- Custom report templates
- Export capabilities (PDF, Excel)
- Scheduled reporting

### Offline-First Architecture

#### Local Data Storage
- IndexedDB for project data
- Service worker for offline functionality
- Background synchronization
- Conflict resolution on reconnection

#### Hybrid Authentication
- JWT token management
- Offline authentication caching
- Automatic token refresh
- Secure credential storage

## 📚 API Reference

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### HVAC Calculation Endpoints

#### POST /api/calculations/air-duct
Calculate air duct sizing.

**Request:**
```json
{
  "room_area": 500,
  "cfm_required": 2000,
  "duct_material": "galvanized_steel",
  "pressure_class": "low"
}
```

**Response:**
```json
{
  "duct_size": {
    "width": 14,
    "height": 10
  },
  "velocity": 800,
  "pressure_drop": 0.08,
  "material": "galvanized_steel",
  "calculation_id": "calc_123"
}
```

#### POST /api/calculations/load
Calculate heating and cooling loads.

**Request:**
```json
{
  "building_area": 5000,
  "occupancy": 50,
  "building_type": "office",
  "climate_zone": "zone_4a"
}
```

**Response:**
```json
{
  "heating_load": 125000,
  "cooling_load": 170000,
  "sensible_load": 127500,
  "latent_load": 42500,
  "breakdown": {
    "walls": 37500,
    "windows": 25000,
    "roof": 31250,
    "infiltration": 18750,
    "occupancy": 20000
  }
}
```

### Project Management Endpoints

#### GET /api/projects
List user projects.

#### POST /api/projects
Create new project.

#### GET /api/projects/{project_id}
Get project details.

#### PUT /api/projects/{project_id}
Update project.

#### DELETE /api/projects/{project_id}
Delete project.

### Collaboration Endpoints

#### WebSocket /ws/collaboration/{room_id}
Real-time collaboration WebSocket connection.

**Events:**
- `user_joined`: User joins collaboration session
- `user_left`: User leaves collaboration session
- `cursor_move`: User cursor position update
- `document_change`: Document modification
- `operation_transform`: Operational transformation event

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get dashboard analytics data.

#### GET /api/analytics/energy
Get energy consumption analytics.

#### GET /api/analytics/performance
Get system performance metrics.

#### GET /api/analytics/compliance
Get compliance status and reports.

## 🛠️ Development Guide

### Project Structure

```
SizeWise_Suite_App/
├── frontend/                 # React frontend application
│   ├── components/          # Reusable UI components
│   ├── lib/                # Utilities and services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and business logic services
│   │   └── utils/          # Utility functions
│   ├── pages/              # Next.js pages (if using Next.js)
│   └── styles/             # CSS and styling files
├── backend/                 # Python FastAPI backend
│   ├── api/                # API route handlers
│   ├── core/               # Core business logic
│   ├── database/           # Database models and services
│   ├── monitoring/         # Monitoring and metrics
│   ├── microservices/      # Microservice components
│   └── collaboration/      # Real-time collaboration
├── tests/                  # Comprehensive test suite
│   ├── frontend/           # Frontend unit tests
│   ├── backend/            # Backend unit tests
│   ├── integration/        # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                   # Documentation
├── docker/                 # Docker configuration
└── .github/               # GitHub Actions workflows
```

### Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Implement feature with tests
   - Update documentation
   - Submit pull request

2. **Code Quality**
   - ESLint and Prettier for frontend
   - Black and isort for backend
   - Type checking with TypeScript/mypy
   - Pre-commit hooks

3. **Testing Strategy**
   - Unit tests for all new code
   - Integration tests for API endpoints
   - E2E tests for critical user flows
   - Performance tests for optimization

### Environment Configuration

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sizewise
MONGODB_URL=mongodb://localhost:27017/sizewise
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
ENVIRONMENT=development
```

## 🚀 Deployment

### Production Deployment

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    depends_on:
      - postgres
      - mongodb
      - redis
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sizewise
      POSTGRES_USER: sizewise
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  
  mongodb:
    image: mongo:7
    
  redis:
    image: redis:7
```

#### Kubernetes Deployment
See `k8s/` directory for Kubernetes manifests.

### Environment-Specific Configurations

#### Staging
- Reduced resource allocation
- Test data seeding
- Debug logging enabled

#### Production
- High availability setup
- Performance monitoring
- Security hardening
- Backup strategies

## 🧪 Testing

### Running Tests

#### Frontend Tests
```bash
cd frontend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all
```

#### Backend Tests
```bash
cd backend

# Unit tests
pytest tests/backend/ -v

# Integration tests
pytest tests/integration/ -v

# Performance tests
pytest tests/performance/ -v

# All tests with coverage
pytest --cov=./ --cov-report=html
```

### Test Coverage Requirements

- **Unit Tests**: 90% code coverage
- **Integration Tests**: 80% API coverage
- **E2E Tests**: 100% critical path coverage

### Performance Benchmarks

- **Page Load Time**: < 3 seconds
- **HVAC Calculation Time**: < 5 seconds
- **API Response Time**: < 500ms
- **Memory Usage**: < 512MB per user session

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards

- Follow TypeScript/Python style guides
- Write comprehensive tests
- Update documentation
- Use conventional commits

### Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Request code review
4. Address feedback
5. Merge after approval

## 📞 Support

### Documentation
- [API Reference](./api-reference.md)
- [Architecture Guide](./architecture.md)
- [User Manual](./user-manual.md)
- [Troubleshooting](./troubleshooting.md)

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: General questions and ideas
- Wiki: Community-contributed documentation

### Professional Support
For enterprise support and consulting:
- Email: support@sizewise.com
- Documentation: [Enterprise Guide](./enterprise.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- HVAC engineering community for domain expertise
- Open source contributors and maintainers
- Beta testers and early adopters

---

*Last updated: January 2024*
