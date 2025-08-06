---
type: "agent_requested"
description: "SizeWise Suite Development Guidelines"
---

# SizeWise Suite - Development Guidelines

## Project Overview
SizeWise Suite is a comprehensive HVAC design application featuring advanced centerline drawing, magnetic snapping, and professional ductwork design tools. The application is built with Next.js, TypeScript, and includes sophisticated snap logic systems for professional engineering workflows.

## Core Architecture Principles

### 1. Snap Logic System
- **Centerline Drawing**: Professional centerline drawing with magnetic snapping
- **Spatial Indexing**: QuadTree-based spatial indexing for performance
- **Touch Gesture Support**: Professional touch gesture recognition for tablets and touch devices
- **SMACNA Compliance**: Full SMACNA standards validation and compliance checking
- **Performance Optimization**: Caching, spatial indexing, and performance monitoring

### 2. Error Handling & Validation
- **Comprehensive Error Handling**: Production-ready error handling with recovery strategies
- **Input Validation**: Complete input validation and sanitization for all user interactions
- **Edge Case Management**: Robust handling of overlapping points, invalid geometry, and degenerate cases
- **Debug Collection**: Advanced debug data collection and performance monitoring

### 3. Professional HVAC Features
- **SMACNA Standards**: Detailed SMACNA standards validation with radius ratios and pressure drop calculations
- **Fitting Intelligence**: Advanced fitting recommendations and branch analysis
- **Professional UI**: Touch-optimized UI components for professional engineering workflows
- **Offline-First**: Hybrid authentication system with offline-first functionality

## Development Standards

### Code Quality
- **TypeScript**: Full TypeScript implementation with strict type checking
- **JSDoc Documentation**: Comprehensive JSDoc documentation for all public APIs
- **Error Handling**: All functions must include proper error handling and validation
- **Performance**: All operations must be optimized for real-time professional use

### Architecture Patterns
- **Modular Design**: Clear separation of concerns with modular architecture
- **Manager Classes**: Central manager classes for system coordination (SnapLogicManager, TouchGestureHandler, etc.)
- **Utility Classes**: Reusable utility classes for validation, sanitization, and calculations
- **Integration Points**: Clear integration points between systems with proper error handling

### File Organization
```
frontend/lib/snap-logic/
├── system/           # Core system components
├── utils/            # Utility functions and classes
├── components/       # React components
├── standards/        # SMACNA and other standards
├── examples/         # Integration examples
└── index.ts         # Main exports
```

## Implementation Guidelines

### 1. Always Follow Established Patterns
- Use existing architectural patterns from completed systems
- Maintain consistency with error handling and validation approaches
- Follow the established naming conventions and file organization

### 2. Professional Engineering Focus
- All features must be suitable for professional HVAC engineering workflows
- Maintain precision and accuracy required for engineering calculations
- Include proper units, tolerances, and engineering standards compliance

### 3. Touch Device Optimization
- All UI components must be touch-optimized with minimum 44px touch targets
- Include haptic feedback for professional touch interactions
- Provide visual feedback for touch gestures and interactions

### 4. Error Handling Integration
- All new code must integrate with the existing ErrorHandler system
- Use ValidationUtils for all input validation
- Include proper error recovery and graceful degradation

### 5. Performance Considerations
- All operations must be optimized for real-time use
- Include performance monitoring and metrics collection
- Use caching and spatial indexing where appropriate

## Current System Status

### ✅ Completed Systems (100%)
1. **Core Snap Logic System** - Complete snap logic with spatial indexing
2. **Performance Optimization** - Caching, spatial indexing, performance monitoring
3. **Advanced Fitting Intelligence** - Fitting recommendations and branch analysis
4. **Touch Gesture Implementation** - Professional touch gesture support
5. **Debug Mode Implementation** - Comprehensive debug collection and monitoring
6. **Comprehensive Error Handling** - Production-ready error handling framework

### 🚧 In Progress
- **Advanced SMACNA Validation** - Detailed SMACNA standards implementation

### 📋 Planned
- **AI-Powered Suggestions** - Machine learning-based design suggestions

## Integration Requirements

### Error Handling
```typescript
// All new code must integrate with ErrorHandler
const errorHandler = new ErrorHandler();
try {
  // Operation
} catch (error) {
  errorHandler.handleError(new SnapLogicError(message, category, severity, context));
}
```

### Validation
```typescript
// All inputs must be validated
const validation = ValidationUtils.validatePoint2D(point, 'operation context');
if (!validation.isValid) {
  throw ValidationUtils.createValidationError(validation, 'context', 'operation');
}
```

### Touch Optimization
```typescript
// All UI components must be touch-optimized
<TouchOptimizedButton
  size={isTouchDevice ? 'lg' : 'md'}
  enableHapticFeedback={true}
  enableTouchFeedback={true}
  aria-label="Professional action description"
/>
```

## Quality Standards

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Input validation is included
- [ ] Touch optimization is considered
- [ ] Performance is optimized
- [ ] Documentation is complete
- [ ] Integration tests are included

### Professional Standards
- [ ] SMACNA compliance where applicable
- [ ] Engineering precision and accuracy
- [ ] Professional UI/UX standards
- [ ] Accessibility compliance (WCAG)
- [ ] Cross-platform compatibility

## Testing Requirements

### Unit Testing
- All utility functions must have unit tests
- All validation functions must be tested
- All calculation functions must be tested with edge cases

### Integration Testing
- All manager classes must have integration tests
- All error handling paths must be tested
- All touch gesture interactions must be tested

### Performance Testing
- All real-time operations must be performance tested
- Memory usage must be monitored and tested
- Large dataset handling must be tested

## Deployment Considerations

### Production Readiness
- All error handling must be production-ready
- All performance optimizations must be enabled
- All debug collection must be configurable
- All security measures must be implemented

### Professional Environment
- Must work in professional engineering environments
- Must handle large, complex HVAC designs
- Must maintain precision for engineering calculations
- Must provide reliable, consistent performance
