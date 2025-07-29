# Technology Stack

This document provides a comprehensive overview of the technologies, frameworks, and tools used in SizeWise Suite, including the rationale behind each choice and their role in the overall architecture.

## Core Technology Stack

### Frontend Technologies

#### **Next.js 15 with React 19**
- **Purpose**: Primary web application framework
- **Version**: Next.js 15.x, React 19.x
- **Key Features**:
  - App Router for modern routing patterns
  - Server-side rendering (SSR) for performance
  - Built-in API routes for backend integration
  - Excellent TypeScript support
  - Automatic code splitting and optimization

#### **TypeScript**
- **Purpose**: Type safety and developer experience
- **Version**: 5.x
- **Benefits**:
  - Compile-time error detection
  - Enhanced IDE support and autocomplete
  - Better code documentation and maintainability
  - Improved refactoring capabilities

#### **Tailwind CSS**
- **Purpose**: Utility-first CSS framework
- **Version**: 3.x
- **Features**:
  - Rapid UI development with utility classes
  - Consistent design system
  - Built-in responsive design utilities
  - Custom animations and glass effects
  - Optimized production builds with purging

#### **Three.js**
- **Purpose**: 3D graphics and interactive workspace
- **Version**: Latest stable
- **Applications**:
  - Interactive 3D workspace visualization
  - Duct system 3D modeling
  - Real-time rendering and manipulation
  - Export capabilities for 3D models

### Backend Technologies

#### **Python Flask**
- **Purpose**: Backend API and calculation engine
- **Version**: Python 3.9+, Flask 2.x
- **Responsibilities**:
  - HVAC calculation algorithms
  - Standards compliance validation
  - Data persistence and management
  - PDF export generation
  - Authentication and authorization

#### **SQLite/PostgreSQL**
- **Purpose**: Data persistence
- **Development**: SQLite for local development
- **Production**: PostgreSQL for scalability
- **Features**:
  - Project and calculation data storage
  - User authentication data
  - Standards and reference data

### State Management

#### **Zustand**
- **Purpose**: Client-side state management
- **Version**: 4.x
- **Benefits**:
  - Lightweight (~2KB) with minimal boilerplate
  - Excellent TypeScript support
  - Simple API with good performance
  - Easy testing and debugging
- **Store Organization**:
  - `authStore`: User authentication state
  - `projectStore`: Project management state
  - `canvasStore`: 3D workspace state
  - `calculationStore`: Calculation results and parameters

### UI and Design System

#### **Glassmorphism Components**
- **Purpose**: Modern glass-effect UI design
- **Implementation**: Custom React components with Tailwind CSS
- **Components**:
  - `GlassEffect`: Base glass wrapper component
  - `GlassButton`: Interactive glass buttons
  - `GlassCard`: Content containers with glass effect
  - `GlassDock`: Icon dock navigation
  - `GlassFilter`: SVG filter effects

#### **React Hook Form**
- **Purpose**: Form state management and validation
- **Version**: 7.x
- **Features**:
  - Performant form handling with minimal re-renders
  - Built-in validation support
  - Easy integration with TypeScript
  - Excellent developer experience

### Development Tools

#### **Testing Framework**
- **Unit Testing**: Jest with React Testing Library
- **E2E Testing**: Playwright (upgraded from Cypress)
- **Component Testing**: Storybook for component development
- **Coverage**: Istanbul for code coverage reporting

#### **Code Quality**
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Type Checking**: TypeScript compiler
- **Pre-commit Hooks**: Husky for automated quality checks

#### **Build and Development**
- **Package Manager**: npm (primary), yarn (alternative)
- **Build Tool**: Next.js built-in webpack configuration
- **Development Server**: Next.js dev server with hot reload
- **Environment Management**: dotenv for configuration

## Standards and Compliance

### HVAC Standards Integration
- **SMACNA**: Sheet Metal and Air Conditioning Contractors' National Association
- **NFPA**: National Fire Protection Association codes
- **ASHRAE**: American Society of Heating, Refrigerating and Air-Conditioning Engineers

### Implementation
- Standards data embedded in calculation engines
- Real-time compliance validation
- Automated code checking and warnings
- Reference documentation integration

## Progressive Web App (PWA)

### Offline-First Architecture
- **Service Worker**: Custom service worker for caching
- **Storage**: IndexedDB for offline data persistence
- **Sync**: Background sync for data synchronization
- **Manifest**: PWA manifest for app installation

### Features
- Complete offline functionality
- App-like installation experience
- Push notifications (future feature)
- Background processing capabilities

## Performance Optimizations

### Frontend Performance
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: webpack-bundle-analyzer
- **Caching**: Aggressive caching strategies
- **Lazy Loading**: Component and route lazy loading

### Calculation Performance
- **Debouncing**: 250ms debouncing for real-time calculations
- **Web Workers**: Heavy calculations in background threads
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtualization**: Virtual scrolling for large datasets

## Security

### Authentication and Authorization
- **JWT Tokens**: JSON Web Tokens for stateless authentication
- **Secure Storage**: HttpOnly cookies for token storage
- **CORS**: Cross-Origin Resource Sharing configuration
- **Input Validation**: Server-side and client-side validation
- **Rate Limiting**: API rate limiting for abuse prevention

### Data Protection
- **HTTPS**: SSL/TLS encryption for all communications
- **Input Sanitization**: XSS prevention measures
- **SQL Injection**: Parameterized queries and ORM usage
- **Environment Variables**: Secure configuration management

## Deployment and Infrastructure

### Development Environment
- **Local Development**: Next.js dev server + Flask dev server
- **Docker**: Containerized development environment
- **Hot Reload**: Automatic code reloading during development
- **Environment Parity**: Consistent dev/staging/production environments

### Production Deployment
- **Frontend**: Vercel (primary) or Docker containers
- **Backend**: Docker containers with orchestration
- **Database**: Managed PostgreSQL service
- **CDN**: Global content delivery network
- **Monitoring**: Application performance monitoring

### CI/CD Pipeline
- **Version Control**: Git with GitHub
- **Automated Testing**: GitHub Actions for CI/CD
- **Code Quality**: Automated linting and testing
- **Deployment**: Automated deployment on merge
- **Rollback**: Quick rollback capabilities

## Development Dependencies

### Frontend Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "three": "^0.160.0",
  "zustand": "^4.0.0",
  "@react-three/fiber": "^8.0.0",
  "react-hook-form": "^7.0.0"
}
```

### Backend Dependencies
```python
Flask==2.3.3
SQLAlchemy==2.0.23
Pydantic==2.5.0
PyJWT==2.8.0
python-dotenv==1.0.0
pytest==7.4.3
```

### Development Tools
```json
{
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "playwright": "^1.40.0",
  "husky": "^8.0.0"
}
```

## Architecture Decisions

### Key Design Choices

#### **Monorepo vs Multi-repo**
- **Decision**: Monorepo structure
- **Rationale**: Simplified development workflow, shared dependencies, easier coordination
- **Trade-offs**: Larger repository size, but better developer experience

#### **Client-Side vs Server-Side Calculations**
- **Decision**: Hybrid approach with client-side primary, server-side fallback
- **Rationale**: Better performance and offline capability
- **Implementation**: Debounced client calculations with server validation

#### **Database Choice**
- **Decision**: SQLite for development, PostgreSQL for production
- **Rationale**: Simple development setup, production scalability
- **Migration**: Automated migration scripts for environment consistency

## Future Technology Considerations

### Planned Upgrades
- **React Server Components**: Evaluate for performance improvements
- **WebAssembly**: Consider for intensive calculations
- **GraphQL**: Evaluate for complex data fetching needs
- **Micro-frontends**: Consider for large-scale feature development

### Scalability Preparations
- **Horizontal Scaling**: Stateless architecture for easy scaling
- **Caching Layer**: Redis for session and calculation caching
- **Load Balancing**: Application load balancer configuration
- **Database Sharding**: Preparation for data partitioning

---

*This technology stack is designed to provide a robust, scalable, and maintainable foundation for SizeWise Suite. All technology choices are regularly reviewed and updated based on project needs and industry best practices.*
