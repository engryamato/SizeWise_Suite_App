/**
 * Parametric 3D Mesh System for Duct Fittings
 * Main export file for all 3D fitting functionality
 */

// Core interfaces and types
export * from './fitting-interfaces';
export * from './smacna-gauge-tables';

// Generators
export { ElbowGenerator } from './generators/elbow-generator';
export { TransitionGenerator } from './generators/transition-generator';

// Main factory
export { FittingFactory, fittingFactory } from './fitting-factory';

// Material system
export { MaterialSystem, materialSystem } from './material-system';

// Validation system
export { ValidationSystem, validationSystem } from './validation-system';

// ============================================================================
// REFACTORED PARAMETRIC SYSTEM
// ============================================================================

// New parametric generators
export { createRoundElbow, createRectangularSquareThroatElbow } from './generators/elbow-generator';

// Fitting registry and auto-selection system
export * from './fitting-registry';
export * from './duct-node';
export * from './auto-select-fitting';

// React components
export { FittingSelector } from '../../components/3d/FittingSelector';
export { FittingViewer } from '../../components/3d/FittingViewer';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { fittingFactory, FittingType } from '@/lib/3d-fittings';
 * 
 * // Generate an elbow fitting
 * const elbow = await fittingFactory.generateElbow({
 *   diameter: 12,
 *   bendRadius: 18,
 *   angle: 90,
 *   material: 'galvanized_steel',
 *   gauge: '26'
 * });
 * 
 * // Add to Three.js scene
 * scene.add(elbow.mesh);
 * ```
 */

/**
 * System capabilities:
 * 
 * ✅ SMACNA-compliant gauge tables (30-14 gauge range)
 * ✅ Three material types: galvanized steel, aluminum, stainless steel
 * ✅ Parametric elbow generator with CSG-style hollow mesh creation
 * ✅ Parametric transition/reducer generator
 * ✅ Advanced material system with metallic shaders
 * ✅ Comprehensive validation system with SMACNA compliance
 * ✅ React UI components for fitting selection and 3D visualization
 * ✅ Cost estimation and material usage calculations
 * ✅ Performance optimization and airflow analysis
 * 
 * 🚧 Planned additions:
 * - Wye fitting generator
 * - Tee fitting generator
 * - Straight duct generator
 * - Cap/end fitting generator
 * - Advanced CSG operations for complex geometries
 * - Texture mapping and advanced materials
 * - Export to CAD formats (STEP, STL)
 * - Integration with HVAC calculation systems
 */
