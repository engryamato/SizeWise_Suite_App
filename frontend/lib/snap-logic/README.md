# Snap Logic System

A comprehensive centerline drawing and magnetic snapping system for SizeWise Suite HVAC applications.

## Overview

The Snap Logic System provides intelligent snapping functionality for HVAC centerline drawing with:

- **Magnetic Snapping**: Automatic cursor attraction to snap points
- **Priority Hierarchy**: Endpoints > Centerlines > Midpoints > Intersections
- **Visual Feedback**: Adaptive indicators with zoom-level scaling
- **SMACNA Compliance**: Real-time validation against SMACNA standards
- **3D Conversion**: Transform centerlines into 3D ductwork geometry
- **Mid-span Branching**: Add branches anywhere along centerlines

## 🎯 **Current Status: v1.0 Complete**

✅ **Core Implementation Complete** - All fundamental snap logic features have been successfully implemented and are ready for production use.

### **Implemented Features**

- ✅ **Core Snap Logic**: Priority-based snap detection with magnetic attraction
- ✅ **Centerline Drawing**: Arc-based and segmented centerlines with SMACNA validation
- ✅ **Visual Feedback**: Adaptive indicators with zoom scaling and context menus
- ✅ **3D Conversion**: Complete "Build Ductwork" functionality
- ✅ **Mid-span Branching**: Intelligent fitting suggestions (tee, wye, cross)
- ✅ **UI Integration**: React components and hooks for seamless integration
- ✅ **TypeScript Support**: Comprehensive type definitions and JSDoc documentation

### **Planned Enhancements**

🚧 **High Priority** (Next 1-2 weeks)
- Touch gesture support for mobile/tablet devices
- Debug mode with visual overlay and performance metrics
- Results/Warnings Bar integration for UI consistency

🔄 **Medium Priority** (Next 2-4 weeks)
- Performance optimization with spatial indexing
- Advanced fitting intelligence with AI recommendations
- Comprehensive error handling and edge case management

📋 **Low Priority** (Future releases)
- VanPacker integration for fabrication workflows
- Advanced SMACNA validation with engineering reports
- AI-powered design optimization suggestions

## Quick Start

### Basic Usage with React Hook

```typescript
import { useSnapLogic, SnapLogicCanvas } from '@/lib/snap-logic';

const DrawingComponent = () => {
  const snapLogic = useSnapLogic({
    snap: { enabled: true, snapThreshold: 15 },
    drawing: { defaultType: 'arc', validateSMACNA: true }
  });

  return (
    <SnapLogicCanvas
      rooms={rooms}
      segments={segments}
      equipment={equipment}
      viewport={viewport}
      onCanvasClick={snapLogic.handleClick}
      onCursorMove={snapLogic.handleCursorMovement}
    />
  );
};
```

### Manual System Setup

```typescript
import { SnapLogicSystem } from '@/lib/snap-logic';

const snapSystem = new SnapLogicSystem({
  snap: {
    enabled: true,
    snapThreshold: 15,
    magneticThreshold: 25
  },
  drawing: {
    defaultType: 'arc',
    autoSnap: true,
    validateSMACNA: true
  }
});

// Set drawing tool
snapSystem.setCurrentTool('pencil');

// Handle mouse events
snapSystem.handleClick({ x: 100, y: 100 });
snapSystem.handleCursorMovement({ x: 105, y: 98 }, viewport);
```

## 🏗️ **Architecture & Module Structure**

The snap logic system follows a modular architecture designed for maintainability and scalability:

### **Current Module Structure (v1.0)**

```
frontend/lib/snap-logic/
├── SnapLogicManager.ts          # Core snap detection and priority management
├── SnapPointGenerator.ts        # Snap point creation for HVAC elements
├── CenterlineUtils.ts           # Centerline operations and SMACNA validation
├── CenterlineDrawingManager.ts  # Drawing state management and events
├── MagneticSnappingIntegration.ts # Cursor attraction and modifier keys
├── MidSpanBranchingManager.ts   # Branch functionality and fitting suggestions
├── CenterlineTo3DConverter.ts   # 3D conversion and geometry generation
├── SnapLogicSystem.ts           # Main system coordinator
├── index.ts                     # Public API exports
└── README.md                    # Documentation
```

### **Planned Refactored Structure (v2.0)**

```
frontend/lib/snap-logic/
├── core/                        # Core snap logic
│   ├── SnapLogicManager.ts
│   ├── SnapPointGenerator.ts
│   ├── SpatialIndex.ts          # 🚧 Performance optimization
│   └── types.ts
├── drawing/                     # Drawing functionality
│   ├── CenterlineDrawingManager.ts
│   ├── CenterlineUtils.ts
│   └── DrawingState.ts
├── magnetic/                    # Magnetic snapping
│   ├── MagneticSnappingIntegration.ts
│   ├── TouchGestureHandler.ts   # 🚧 Touch support
│   └── ModifierKeyHandler.ts
├── branching/                   # Mid-span branching
│   ├── MidSpanBranchingManager.ts
│   ├── FittingAI.ts            # 🔄 AI recommendations
│   └── SMACNAValidation.ts
├── conversion/                  # 3D conversion
│   ├── CenterlineTo3DConverter.ts
│   ├── FittingInsertion.ts
│   └── GeometryUtils.ts
├── system/                      # System coordination
│   ├── SnapLogicSystem.ts
│   ├── EventManager.ts
│   ├── ErrorHandler.ts         # 🔄 Error handling
│   └── DebugCollector.ts       # 🚧 Debug mode
└── utils/                       # Shared utilities
    ├── MathUtils.ts
    ├── PerformanceOptimizer.ts  # 🔄 Performance
    └── Constants.ts
```

**Legend**: ✅ Complete | 🚧 High Priority | 🔄 Medium Priority | 📋 Low Priority

## Core Components

### SnapLogicManager

Core snap point detection and priority management.

```typescript
const snapManager = new SnapLogicManager({
  enabled: true,
  snapThreshold: 15,
  magneticThreshold: 25
});

// Add snap points
snapManager.addSnapPoint({
  id: 'room1_corner_0',
  type: 'endpoint',
  position: { x: 100, y: 100 },
  priority: 1,
  elementId: 'room1',
  elementType: 'room'
});

// Find closest snap point
const result = snapManager.findClosestSnapPoint({ x: 105, y: 98 });
```

### CenterlineDrawingManager

Manages centerline creation with real-time validation.

```typescript
const drawingManager = new CenterlineDrawingManager(snapManager, {
  defaultType: 'arc',
  autoSnap: true,
  validateSMACNA: true
});

// Start drawing
const centerline = drawingManager.startDrawing({ x: 100, y: 100 });

// Add points
drawingManager.addPoint({ x: 200, y: 100 });
drawingManager.addPoint({ x: 200, y: 200 });

// Complete
const completed = drawingManager.completeDrawing();
```

### MagneticSnappingIntegration

Provides cursor attraction and modifier key handling.

```typescript
const magneticIntegration = new MagneticSnappingIntegration(snapManager, {
  attractionThreshold: 30,
  attractionStrength: 0.6,
  modifierBehavior: {
    ctrl: 'disable',
    alt: 'precision',
    shift: 'override'
  }
});

// Process cursor movement
const result = magneticIntegration.processCursorMovement(
  { x: 105, y: 98 },
  viewport
);
```

## Snap Point Types

### Priority Hierarchy

1. **Endpoints** (Priority 1): Room corners, segment ends, equipment connections
2. **Centerline Points** (Priority 2): Points along centerlines, room centers
3. **Midpoints** (Priority 3): Midpoints of segments and room sides
4. **Intersections** (Priority 4): Line intersections, complex junctions

### Visual Indicators

- **Endpoints**: Red circles
- **Centerlines**: Blue squares
- **Midpoints**: Green diamonds
- **Intersections**: Amber crosses

## SMACNA Compliance

The system validates centerlines against SMACNA standards:

- **Minimum radius ratios**: R/D ≥ 1.5 for round ducts
- **Segment lengths**: Minimum 12" segments
- **Angle deviations**: ±5° from standard angles
- **Branch angles**: 30° to 90° range

```typescript
// Validation warnings are automatically generated
const centerline = CenterlineUtils.createCenterline('cl1', 'arc');
const validation = CenterlineUtils.validateSMACNACompliance(centerline);

if (!validation.isCompliant) {
  console.log('Warnings:', validation.warnings);
}
```

## 3D Conversion

Convert centerlines to 3D ductwork geometry:

```typescript
const converter = new CenterlineTo3DConverter({
  defaultDuctShape: 'rectangular',
  defaultDimensions: { rectangular: { width: 12, height: 8 } },
  autoInsertFittings: true
});

const result = converter.convertCenterlinesToDuctwork(centerlines, branchPoints);

if (result.success) {
  console.log(`Created ${result.ductSegments.length} segments`);
  console.log(`Created ${result.fittings.length} fittings`);
}
```

## Mid-span Branching

Add branches at any point along centerlines:

```typescript
const branchingManager = new MidSpanBranchingManager();

// Create branch point
const branchPoint = branchingManager.createBranchPoint(
  'centerline1',
  { x: 150, y: 100 },
  0, // segment index
  0.5, // position along segment (0-1)
  45 // branch angle
);

// Get fitting suggestion
const suggestion = branchingManager.suggestFittingType(branchPoint);
console.log(`Suggested fitting: ${suggestion.fittingType}`);
```

## Configuration Options

### Snap Configuration

```typescript
interface SnapConfig {
  enabled: boolean;
  snapThreshold: number; // pixels
  magneticThreshold: number; // pixels
  showVisualFeedback: boolean;
  showSnapLegend: boolean;
  modifierKeys: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
  };
}
```

### Drawing Configuration

```typescript
interface CenterlineDrawingConfig {
  mode: 'point-to-point' | 'continuous' | 'arc-guided';
  defaultType: 'arc' | 'segmented';
  autoSnap: boolean;
  showPreview: boolean;
  validateSMACNA: boolean;
  minSegmentLength: number;
  maxPoints: number;
}
```

## Keyboard Shortcuts

- **Ctrl**: Disable snapping temporarily
- **Alt**: Precision mode (reduced attraction)
- **Shift**: Override snap priority
- **Tab**: Toggle arc/segmented centerline type
- **Esc**: Cancel current drawing
- **Enter**: Complete current drawing
- **Backspace**: Remove last point

## Events

The system emits events for integration:

```typescript
snapSystem.on('drawing_started', (data) => {
  console.log('Started drawing:', data.centerline);
});

snapSystem.on('drawing_completed', (data) => {
  console.log('Completed centerline:', data.centerline);
});

snapSystem.on('validation_warning', (data) => {
  console.log('SMACNA warnings:', data.warnings);
});

snapSystem.on('ductwork_built', (data) => {
  console.log('Built ductwork:', data.stats);
});
```

## Best Practices

1. **Enable SMACNA validation** for professional compliance
2. **Use arc-based centerlines** for accurate pressure drop calculations
3. **Set appropriate snap thresholds** based on zoom levels
4. **Provide visual feedback** for better user experience
5. **Handle modifier keys** for power user workflows
6. **Validate before 3D conversion** to catch issues early

## Troubleshooting

### Common Issues

1. **Snapping not working**: Check if snap logic is enabled and tool supports snapping
2. **Performance issues**: Reduce snap point density or increase thresholds
3. **SMACNA warnings**: Review centerline geometry and adjust as needed
4. **3D conversion fails**: Ensure centerlines are complete and valid

### Debug Mode

Enable debug logging:

```typescript
const snapSystem = new SnapLogicSystem(config);
const stats = snapSystem.getSnapStatistics();
console.log('Snap points:', stats.totalSnapPoints);
console.log('Current snap distance:', stats.lastSnapDistance);
```

## Integration with Existing Components

The snap logic system integrates seamlessly with existing SizeWise Suite components:

- **Canvas components**: Add snap logic overlay
- **Drawing tools**: Enhanced with magnetic snapping
- **UI stores**: Snap configuration management
- **3D visualization**: Automatic ductwork generation
- **HVAC calculations**: Real-time flow analysis

## 🔧 **Development & Testing**

### **Testing Strategy**

The snap logic system includes comprehensive testing at multiple levels:

```typescript
// Unit Tests
describe('SnapLogicManager', () => {
  it('should find closest snap point within threshold', () => {
    // Test implementation
  });

  it('should respect priority hierarchy', () => {
    // Test implementation
  });
});

// Integration Tests
describe('SnapLogicSystem Integration', () => {
  it('should complete full drawing workflow', async () => {
    const system = new SnapLogicSystem();
    system.setCurrentTool('pencil');
    system.handleClick({ x: 100, y: 100 });
    const result = system.buildDuctwork();
    expect(result.success).toBe(true);
  });
});

// Performance Tests
describe('Performance', () => {
  it('should handle 1000+ snap points efficiently', () => {
    // Performance benchmarks
  });
});
```

### **Contributing Guidelines**

When contributing to the snap logic system:

1. **Follow the modular architecture** - Keep components focused and loosely coupled
2. **Maintain SMACNA compliance** - All HVAC-related functionality must follow standards
3. **Add comprehensive tests** - Unit, integration, and performance tests required
4. **Update documentation** - Keep README and JSDoc comments current
5. **Consider offline-first** - Ensure functionality works without network connectivity

### **Performance Considerations**

- **Spatial Indexing**: Use QuadTree for projects with 1000+ snap points
- **Caching**: Implement intelligent caching for frequently accessed snap results
- **Debouncing**: Batch updates during rapid user interactions
- **Memory Management**: Clean up event listeners and dispose of resources properly

### **Debugging & Troubleshooting**

Enable debug mode for detailed system information:

```typescript
// Enable debug logging
const system = new SnapLogicSystem({ debug: true });

// Get system statistics
const stats = system.getSnapStatistics();
console.log('Snap points:', stats.totalSnapPoints);
console.log('Performance:', stats.averageSnapTime);

// Access debug overlay (planned feature)
// Press Ctrl+Alt+D or access via settings menu
```

### **Migration Guide**

When upgrading from v1.0 to future versions:

1. **v1.0 → v1.1** (Touch Support): No breaking changes, new touch features added
2. **v1.1 → v2.0** (Refactored Architecture): Module imports may change, see migration guide
3. **v2.0+** (AI Features): Optional AI features, existing functionality preserved

For more detailed examples and API documentation, see the individual component files.
