# System Architecture - Air Duct Sizer

_Last updated: 2025-07-13_  
_Maintainer: Development Team_

---

## Overview

This document describes the high-level system architecture, data flow, and component interactions for the Air Duct Sizer tool.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Canvas Layer  │  │  UI Components  │  │  Auth System    │ │
│  │  (React-Konva)  │  │  (React/Tailwind)│  │  (JWT)          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ State Management│  │ Calculation     │  │ Export System   │ │
│  │   (Zustand)     │  │ Engine (Client) │  │ (react-pdf)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Flask)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Routes    │  │  Authentication │  │  Validation     │ │
│  │   (Flask)       │  │  (JWT)          │  │  (Schemas)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Calculation     │  │  Export Engine  │  │  Data Storage   │ │
│  │ Engine (Server) │  │  (Puppeteer)    │  │  (JSON Files)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Components

#### 1. Canvas Layer (React-Konva)
**Purpose**: Interactive drawing interface for rooms and duct segments

**Key Components**:
- `CanvasContainer`: Main canvas wrapper with zoom/pan controls
- `Room`: Interactive room rectangles with resize handles
- `DuctSegment`: Draggable duct lines with connection points
- `Grid`: Background grid with snap-to-grid functionality
- `SelectionBox`: Multi-select and group operations

**State Management**:
- Canvas viewport (zoom, pan, selection)
- Drawing objects (rooms, segments, equipment)
- Interaction state (drawing mode, selected objects)

#### 2. UI Components (React/Tailwind)
**Purpose**: User interface panels and controls

**Key Components**:
- `Sidebar`: Project properties and object property panels
- `Toolbar`: Drawing tools and mode selection
- `OnboardingWizard`: New project setup flow
- `ExportDialog`: Export options and preview
- `AuthForms`: Login/register components

#### 3. State Management (Zustand)
**Purpose**: Application state coordination

**Stores**:
- `projectStore`: Project data, rooms, segments, equipment
- `uiStore`: UI state, selected objects, active panels
- `authStore`: User authentication and tier information
- `calculationStore`: Calculation results and validation warnings

#### 4. Calculation Engine (Client-Side)
**Purpose**: Real-time SMACNA calculations for immediate feedback

**Components**:
- `AirDuctCalculator`: Core calculation logic (existing)
- `ValidationEngine`: Real-time validation and warnings
- `UnitsConverter`: Imperial/metric unit conversions
- `CalculationWorker`: Web Worker for heavy calculations (future)

---

## Data Flow Architecture

### 1. User Interaction Flow

```
User Action → Canvas Event → State Update → Calculation → UI Update
     ↓              ↓             ↓            ↓          ↓
  Mouse/Touch → Konva Handler → Zustand → Calculator → Re-render
```

### 2. Real-Time Calculation Flow

```
Drawing Change → Debounced Trigger → Client Calculation → Validation → UI Feedback
      ↓               ↓                    ↓              ↓         ↓
   Room Resize → 250ms Delay → Size/Velocity Calc → Warnings → Color/Badge Update
```

### 3. Project Save/Load Flow

```
Auto-save → State Serialization → Local Storage → Background Sync → Server Storage
   ↓              ↓                    ↓              ↓              ↓
Every 30s → JSON Format → Browser Cache → API Call → Database/File
```

---

## Authentication & Authorization

### JWT Token Flow

```
Login → Server Validation → JWT Token → Client Storage → API Requests
  ↓           ↓                ↓            ↓              ↓
Email/Pass → Database Check → Sign Token → localStorage → Authorization Header
```

### Feature Gating Implementation

```
User Action → Tier Check → Feature Gate → Allow/Block → UI Feedback
     ↓           ↓            ↓            ↓           ↓
Draw Room → Check Limits → Free: 3 max → Block/Allow → Modal/Success
```

---

## Performance Architecture

### Client-Side Optimization

1. **Canvas Performance**:
   - Object pooling for frequently created/destroyed elements
   - Viewport culling for large projects
   - Layer separation for static vs dynamic content

2. **Calculation Performance**:
   - Debounced calculations (250ms)
   - Memoization of expensive calculations
   - Web Workers for complex projects (future)

3. **State Management**:
   - Selective subscriptions to prevent unnecessary re-renders
   - Immutable updates with structural sharing
   - Lazy loading of non-critical data

### Server-Side Optimization

1. **API Performance**:
   - Response caching for static data (materials, standards)
   - Request rate limiting per user tier
   - Compression for large responses

2. **Export Performance**:
   - Async processing for large exports
   - Queue system for Pro users
   - CDN delivery for generated files

---

## Data Storage Architecture

### Client-Side Storage

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Zustand Store  │    │  Local Storage  │    │  IndexedDB      │
│  (Runtime)      │    │  (Persistence)  │    │  (Large Data)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • UI State      │    │ • User Prefs    │    │ • Project Files │
│ • Selections    │    │ • Auth Tokens   │    │ • Calculation   │
│ • Temp Data     │    │ • Recent Files  │    │   Cache         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Server-Side Storage

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Data     │    │  Project Files  │    │  Static Data    │
│  (Database)     │    │  (File System)  │    │  (CDN/Cache)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User Accounts │    │ • Project JSON  │    │ • Material Data │
│ • Subscriptions │    │ • Export Files  │    │ • Standard      │
│ • Usage Stats   │    │ • Backups       │    │   Tables        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Error Handling Architecture

### Client-Side Error Handling

1. **Canvas Errors**: Graceful degradation with user notification
2. **Calculation Errors**: Non-blocking warnings with fallback values
3. **Network Errors**: Retry logic with offline mode support
4. **Validation Errors**: Real-time feedback with correction suggestions

### Server-Side Error Handling

1. **API Errors**: Structured error responses with error codes
2. **Calculation Errors**: Fallback to default values with warnings
3. **Authentication Errors**: Clear messaging with re-auth flow
4. **Export Errors**: Queue retry with user notification

---

## Security Architecture

### Client-Side Security

1. **Input Validation**: All user inputs validated before processing
2. **XSS Prevention**: Sanitized rendering of user-generated content
3. **Token Management**: Secure storage and automatic refresh
4. **Feature Gating**: UI-level restrictions with server validation

### Server-Side Security

1. **Authentication**: JWT token validation on all protected routes
2. **Authorization**: Tier-based access control for Pro features
3. **Input Validation**: Schema validation for all API inputs
4. **Rate Limiting**: Per-user and per-endpoint rate limits

---

## Deployment Architecture

### Development Environment
- Local development with hot reload
- Docker containers for consistent environment
- Mock data for offline development

### Production Environment
- Frontend: Vercel with global CDN
- Backend: Cloud hosting with auto-scaling
- Database: Managed database service
- File Storage: Cloud storage with CDN

---

## Monitoring & Analytics

### Performance Monitoring
- Client-side performance metrics
- API response times and error rates
- Canvas rendering performance
- User interaction analytics

### Business Metrics
- Feature usage by tier
- Export generation statistics
- User engagement metrics
- Conversion tracking (Free to Pro)

---

*This document provides the architectural foundation for the Air Duct Sizer implementation. Update it as the system evolves and new components are added.*
