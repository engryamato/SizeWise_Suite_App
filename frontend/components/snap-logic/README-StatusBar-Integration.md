# Results/Warnings Bar Integration

## Overview

The Results/Warnings Bar Integration replaces the floating Build Ductwork button with an integrated status bar that provides comprehensive system status, validation warnings, and progress tracking for Build Ductwork operations.

## Components

### SnapLogicStatusBar

Enhanced status bar that integrates Build Ductwork functionality with the existing SizeWise Suite Results/Warnings Bar.

**Features:**
- Build Ductwork button with progress tracking
- Real-time snap logic status display
- Validation warnings integration
- Debug mode indicators
- Touch device optimization
- Expandable snap point details

**Usage:**
```typescript
import { SnapLogicStatusBar } from '@/lib/snap-logic';

<SnapLogicStatusBar
  snapLogic={snapLogic}
  systemSummary={systemSummary}
  warnings={warnings}
  buildProgress={snapLogic.buildProgress}
  onBuildDuctwork={handleBuildDuctwork}
  onWarningClick={handleWarningClick}
/>
```

### SnapLogicWithStatusBar

Complete integration component that combines SnapLogicCanvas with SnapLogicStatusBar.

**Usage:**
```typescript
import { SnapLogicWithStatusBar } from '@/lib/snap-logic';

<SnapLogicWithStatusBar
  rooms={rooms}
  segments={segments}
  equipment={equipment}
  onCanvasClick={handleCanvasClick}
  onBuildComplete={handleBuildComplete}
  systemSummary={systemSummary}
  warnings={warnings}
/>
```

### BuildDuctworkProgressTracker

Progress tracking system for Build Ductwork operations.

**Features:**
- Step-by-step progress tracking
- Estimated completion time
- Customizable build steps
- Real-time progress callbacks
- Error handling and recovery

**Usage:**
```typescript
import { BuildDuctworkProgressTracker } from '@/lib/snap-logic';

const progressTracker = new BuildDuctworkProgressTracker();

progressTracker.onProgress((progress) => {
  console.log(`Step: ${progress.currentStep}, Progress: ${progress.progress}%`);
});

await progressTracker.trackBuildOperation(async (tracker) => {
  tracker.updateStep('Validating centerlines', 0);
  // ... validation logic ...
  tracker.updateStep('Converting to 3D', 50);
  // ... conversion logic ...
  tracker.updateStep('Complete', 100);
});
```

## Migration from Floating Button

### Before (Floating Button)
```typescript
// Old implementation with floating button
<SnapLogicCanvas
  rooms={rooms}
  segments={segments}
  equipment={equipment}
  onCanvasClick={handleCanvasClick}
/>
// Build Ductwork button was floating in bottom-right corner
```

### After (Integrated Status Bar)
```typescript
// New implementation with integrated status bar
<SnapLogicWithStatusBar
  rooms={rooms}
  segments={segments}
  equipment={equipment}
  onCanvasClick={handleCanvasClick}
  onBuildComplete={handleBuildComplete}
  systemSummary={systemSummary}
  warnings={warnings}
/>
// Build Ductwork button is now in the status bar
```

## Progress Tracking

### Build Steps

Default build steps with progress tracking:

1. **Validating Centerlines** (0-15%) - Checking centerline integrity and SMACNA compliance
2. **Preprocessing Data** (15-30%) - Preparing centerline data for 3D conversion
3. **Creating Segments** (30-60%) - Converting centerlines to duct segments
4. **Generating Fittings** (60-80%) - Creating fittings and connections
5. **Optimizing Geometry** (80-95%) - Optimizing 3D geometry and connections
6. **Finalizing Build** (95-100%) - Completing build and generating results

### Custom Progress Steps

```typescript
const customSteps = [
  {
    id: 'validation',
    name: 'Custom Validation',
    description: 'Custom validation step',
    estimatedDuration: 1000,
    weight: 0.3
  },
  {
    id: 'conversion',
    name: 'Custom Conversion',
    description: 'Custom conversion step',
    estimatedDuration: 2000,
    weight: 0.7
  }
];

const progressTracker = new BuildDuctworkProgressTracker(customSteps);
```

## Status Bar Features

### System Status Display

- **Active Tool**: Current drawing tool (pencil, duct, room, equipment)
- **Centerlines Count**: Number of drawn centerlines
- **Touch Override**: Indicates when touch override is active
- **Debug Mode**: Shows when debug mode is enabled

### Build Ductwork Integration

- **Conditional Display**: Button only appears when centerlines exist
- **Progress Tracking**: Real-time progress bar during build operations
- **Status Indicators**: Visual feedback for build status
- **Error Handling**: Comprehensive error display and recovery

### Validation Warnings

- **Warning Count**: Display total number of warnings
- **Warning Types**: Support for error, warning, and info types
- **Click Handling**: Navigate to specific warnings
- **Integration**: Combines snap logic warnings with system warnings

### Expandable Details

- **Snap Points**: Total count and breakdown by type
- **Branch Points**: Number of branch points
- **Current Snap**: Active snap point type
- **Touch Device**: Touch device detection status

## TypeScript Types

### BuildDuctworkProgress
```typescript
interface BuildDuctworkProgress {
  status: 'idle' | 'building' | 'success' | 'error';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  estimatedTimeRemaining?: number; // seconds
}
```

### SystemSummary
```typescript
interface SystemSummary {
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
  systemEfficiency: number;
  totalElements: number;
  lastCalculation: Date;
}
```

## Integration with Existing UI

### AirDuctSizerStatusBar Compatibility

The new SnapLogicStatusBar is designed to work alongside or replace the existing AirDuctSizerStatusBar:

```typescript
// Option 1: Replace existing status bar
<SnapLogicStatusBar
  snapLogic={snapLogic}
  systemSummary={systemSummary}
  warnings={warnings}
/>

// Option 2: Use alongside existing status bar
<div>
  <AirDuctSizerStatusBar {...existingProps} />
  <SnapLogicStatusBar {...snapLogicProps} />
</div>
```

### Warning Panel Integration

Warnings from the snap logic system are automatically merged with existing system warnings:

```typescript
import { StatusBarUtils } from '@/lib/snap-logic';

const mergedWarnings = StatusBarUtils.mergeWarnings(
  systemWarnings,
  snapLogicWarnings
);

const complianceStatus = StatusBarUtils.calculateCompliance(mergedWarnings);
```

## Best Practices

### 1. Progress Feedback
Always provide progress feedback for long-running build operations:

```typescript
const handleBuildDuctwork = async () => {
  try {
    const result = await snapLogic.buildDuctworkWithProgress();
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### 2. Warning Management
Implement proper warning click handling:

```typescript
const handleWarningClick = (warning: ValidationWarning) => {
  // Navigate to warning location
  // Show warning details
  // Provide resolution options
};
```

### 3. System Summary Updates
Keep system summary synchronized with snap logic state:

```typescript
useEffect(() => {
  setSystemSummary(prev => ({
    ...prev,
    complianceStatus: calculateCompliance(warnings),
    totalElements: snapLogic.centerlines.length,
    lastCalculation: new Date()
  }));
}, [snapLogic.centerlines, warnings]);
```

### 4. Touch Device Optimization
Ensure proper touch device handling:

```typescript
// Status bar automatically adapts for touch devices
// Larger touch targets and touch-specific interactions
// Haptic feedback integration
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all status bar controls
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **High Contrast**: Support for high contrast themes
- **Focus Management**: Proper focus handling for interactive elements

## Performance Considerations

- **Progress Throttling**: Progress updates are throttled to prevent excessive re-renders
- **Memory Management**: Automatic cleanup of progress trackers and event listeners
- **Efficient Updates**: Only re-render components when necessary
- **Debounced Operations**: User interactions are debounced to prevent rapid-fire operations
