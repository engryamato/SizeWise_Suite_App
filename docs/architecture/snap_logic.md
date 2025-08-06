# Centerline Drawing Instructions for Augment

# Centerline Drawing in SizeWise Suite

The following instructions detail how to effectively work with centerlines in the SizeWise Suite HVAC snap logic system.

## Fundamental Principles

- **Centerline as Source of Truth:** Centerlines serve as the geometric foundation for all fitting and duct shapes in the system.
- **Arched vs. Segmented:** Round elbows use true arched (curved) centerlines by default, not segmented approximations.
- **Standards Compliance:** All centerlines adhere to SMACNA/NFPA/ASHRAE standards for proper representation.

## Drawing Centerlines

### Activation & Basic Drawing

- Toggle the **Pencil Tool ON** to begin drawing centerlines.
- Left-click to place points and create centerline segments.
- Right-click to pan the view at any time while drawing.
- For round elbows, curved arcs will be generated automatically based on connection points.

### Centerline Types & Toggling

<aside>

You can toggle between centerline representation types:

- **Arc-based centerlines:** Default for SMACNA-compliant elbows (required for accurate pressure drop calculations)
- **Segmented representations:** Available as user override for special fabrication workflows
</aside>

Note: When using segmented approximations, the system will display warnings if they fall outside of code compliance parameters.

## Magnetic Snapping System

### Endpoint Snapping

- All fittings and ducts have magnetic endpoints regardless of length.
- Endpoints automatically attract your cursor when drawing nearby (hover on desktop, tap on touch devices).
- Visual feedback appears when approaching snap points.
- Use modifier keys (Ctrl/Alt/Shift on desktop) or long-press (on touch devices) to override default snap behavior.

### Snap Priority Hierarchy

The system calculates the closest snap point using this priority order:

1. Endpoints (highest priority)
2. Centerline points
3. Midpoints
4. Intersections

When multiple snap types coincide or are at equal distances, the system:

- Uses the higher priority snap type by default
- Displays a context menu for manual selection if ambiguous
- Highlights the last-used snap type for consistency in rapid workflows

### Visual Feedback

- Different snap types show distinct visual indicators.
- Indicators adapt opacity based on zoom level and drawing density.
- For overlapping snap types, both are shown with the higher-priority type appearing larger/brighter.
- Toggle the snap legend via toolbar or keyboard shortcut to see explanation of colors/shapes.

## Creating Mid-span Branches

- You can add branches at any point along existing centerlines.
- When snapping to an intersection point while holding a modifier key, the system will propose appropriate multi-way fittings (e.g., double wye).
- If endpoints/centerlines are within a defined threshold, the system may prompt "Suggest Wye?" (requires confirmation).

## Converting Centerlines to 3D

After drawing your centerlines:

- Click the "Build Ductwork" button in the Results/Warnings Bar.
- All centerlines will be extruded into 3D duct/fitting geometry using default or user-set properties.
- Fittings are automatically inserted at each relevant node.
- The system will warn of any open/unconnected lines, overlaps, or code violations.

## Troubleshooting & Tips

- **Undo/Redo:** All snap actions (connections, branches, placement) support undo/redo (Ctrl+Z/Y or touch gestures).
- **Fitting Suggestions:** The system provides intelligent fitting suggestions but never auto-triggers them without confirmation.
- **Warnings:** If centerline types are not code-compliant for selected fittings, export-time warnings will appear with "fabricator notes" in the BOM.
- **Debug Mode:** For advanced troubleshooting, press Ctrl+Alt+D (desktop) or access via settings menu (touch).

<aside>

**Best Practice:** When creating centerlines for VanPacker integration, include a centerline sketch with drawing requests to speed up turnaround times.

</aside>

## Centerline Drawing Quick Reference

| **Action** | **Desktop** | **Touch** |
| --- | --- | --- |
| Begin drawing | Toggle Pencil ON, left-click | Toggle Pencil ON, tap |
| Pan while drawing | Right-click and drag | Two-finger gesture |
| Override snap priority | Hold Ctrl/Alt/Shift | Long-press |
| Undo action | Ctrl+Z | Two-finger swipe left |
| Toggle snap legend | Keyboard shortcut | Toolbar button |
| Build 3D from centerlines | Click "Build Ductwork" | Tap "Build Ductwork" |

## Implementation Status & Roadmap

### ✅ **Completed Features (v1.0)**

The SizeWise Suite snap logic system has been successfully implemented with the following core features:

#### **Core Snap Logic System**
- ✅ Magnetic endpoint snapping with priority hierarchy
- ✅ Visual feedback with adaptive opacity and zoom scaling
- ✅ Snap point generation for rooms, segments, equipment, and centerlines
- ✅ Priority-based snap detection (endpoints → centerlines → midpoints → intersections)

#### **Centerline Drawing**
- ✅ Pencil tool with arc-based and segmented centerlines
- ✅ Real-time SMACNA compliance validation
- ✅ Drawing state management with preview points
- ✅ Keyboard shortcuts and modifier key support

#### **3D Conversion & Integration**
- ✅ "Build Ductwork" functionality for centerline-to-3D conversion
- ✅ Automatic fitting insertion at direction changes and branch points
- ✅ Integration with existing HVAC calculation engine
- ✅ Mid-span branching with intelligent fitting suggestions

#### **UI/UX Components**
- ✅ React-based snap visual feedback system
- ✅ Enhanced drawing tools with snap configuration
- ✅ Canvas integration with mouse event handling
- ✅ TypeScript type system and comprehensive documentation

### 🚧 **Planned Enhancements**

#### **High Priority (Next 1-2 weeks)**

**Touch Gesture Implementation**
- Long-press for snap override on touch devices
- Two-finger gestures for pan/zoom operations
- Swipe gestures for undo/redo functionality
- Touch-optimized UI components with larger targets

**Debug Mode Implementation**
- Visual overlay showing snap points and system state
- Performance metrics and troubleshooting information
- Accessible via Ctrl+Alt+D (desktop) or settings menu (touch)

**Results/Warnings Bar Integration**
- Move "Build Ductwork" from floating button to integrated UI bar
- Enhanced validation warnings display
- Progress indicators for 3D conversion process

#### **Medium Priority (Next 2-4 weeks)**

**Performance Optimization**
- Spatial indexing (QuadTree) for large-scale projects
- Intelligent caching system for snap results
- Debounced updates and batch processing
- Performance monitoring and optimization recommendations

**Advanced Fitting Intelligence**
- AI-powered fitting recommendations for complex scenarios
- Support for double wye, cross, and multi-way fittings
- Enhanced SMACNA compliance validation
- User confirmation dialogs with visual previews

**Comprehensive Error Handling**
- Robust error handling framework with custom error types
- Edge case handlers for overlapping points and invalid geometry
- Input validation and sanitization across all user interactions
- Graceful degradation for production reliability

#### **Low Priority (Future Releases)**

**VanPacker Integration**
- Centerline sketch export for fabrication workflows
- BOM generation with fabricator notes
- Integration with existing fabrication systems

**Advanced SMACNA Validation**
- Detailed standards checking with specific code references
- Professional engineering compliance reports
- Enhanced pressure drop calculations and analysis

**AI-Powered Suggestions**
- Machine learning models for optimal ductwork design
- Energy efficiency recommendations
- Intelligent system optimization suggestions

### 📋 **Implementation Timeline**

```
Phase 1 (Weeks 1-2): High Priority Features
├── Touch Gesture Implementation (5 days)
├── Debug Mode Implementation (2 days)
└── Results/Warnings Bar Integration (2 days)

Phase 2 (Weeks 3-6): Medium Priority Features
├── Performance Optimization (10 days)
├── Advanced Fitting Intelligence (10 days)
└── Comprehensive Error Handling (7 days)

Phase 3 (Months 2-3): Low Priority Features
├── VanPacker Integration (2 weeks)
├── Advanced SMACNA Validation (1 week)
└── AI-Powered Suggestions (4-6 weeks)
```

### 🔧 **Technical Architecture**

The snap logic system follows a modular architecture with clear separation of concerns:

```
frontend/lib/snap-logic/
├── core/                    # Core snap detection and management
├── drawing/                 # Centerline drawing functionality
├── magnetic/                # Magnetic snapping and cursor attraction
├── branching/               # Mid-span branching and fitting suggestions
├── conversion/              # 3D conversion and geometry generation
├── system/                  # System coordination and event management
└── utils/                   # Shared utilities and helpers
```

This architecture ensures maintainability, testability, and scalability for enterprise-level HVAC design workflows.
