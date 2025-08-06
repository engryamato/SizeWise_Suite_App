// Type definitions for Air Duct Sizer based on data-models-schemas.md

export interface Project {
  id?: string
  project_name: string
  user_name?: string
  contractor_name?: string
  project_location: string
  codes: string[]
  computational_properties?: ComputationalProperties
  rooms: Room[]
  segments: Segment[]
  equipment: Equipment[]
  plan_pdf?: string
  plan_scale?: number
  created_at: string
  last_modified: string
}

export interface ComputationalProperties {
  default_velocity: number
  pressure_class: string
  altitude: number
  r_value: number
  friction_rate: number
  [key: string]: any // Allow for additional properties
}

export interface Room {
  room_id: string
  name: string
  function?: string
  dimensions: {
    length: number
    width: number
    height: number
  }
  area?: number
  airflow?: number
  outlets?: Outlet[]
  // Canvas-specific properties
  x?: number
  y?: number
  selected?: boolean
}

export interface Segment {
  segment_id: string
  type: 'straight' | 'elbow' | 'branch' | 'reducer' | 'tee'
  material: string
  size: {
    width?: number
    height?: number
    diameter?: number
  }
  length: number
  airflow?: number
  velocity?: number
  pressure_loss?: number
  warnings: Warning[]
  // Canvas-specific properties
  points?: number[] // [x1, y1, x2, y2] for lines
  selected?: boolean
  connected_rooms?: string[] // Room IDs this segment connects
}

export interface Equipment {
  equipment_id: string
  type: string
  manufacturer?: string
  model?: string
  catalog_data?: Record<string, any>
  airflow: number
  static_pressure?: number
  // Canvas-specific properties
  x?: number
  y?: number
  selected?: boolean
}

export interface Outlet {
  outlet_id: string
  type: 'supply' | 'return' | 'exhaust'
  size: {
    width?: number
    height?: number
    diameter?: number
  }
  airflow: number
  x?: number
  y?: number
}

export interface Warning {
  warning_id: string
  rule_id: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  source_id: string
  code_ref?: string
}

// Canvas-specific types
export interface CanvasViewport {
  x: number
  y: number
  scale: number
}

export interface CanvasGrid {
  size: number
  visible: boolean
  snapEnabled: boolean
}

export interface SelectionBox {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
}

// Drawing tool types
export type DrawingTool = 'select' | 'room' | 'duct' | 'equipment' | 'pan' | 'scale' | 'pencil'

export interface DrawingState {
  tool: DrawingTool
  isDrawing: boolean
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
}

// Snap Logic Types
export type SnapPointType = 'endpoint' | 'centerline' | 'midpoint' | 'intersection'

export interface SnapPoint {
  id: string
  type: SnapPointType
  position: { x: number; y: number }
  priority: number // 1 = highest (endpoints), 4 = lowest (intersections)
  elementId: string // ID of the element this snap point belongs to
  elementType: 'room' | 'segment' | 'equipment' | 'centerline'
  distance?: number // Distance from cursor/target point
  metadata?: {
    segmentIndex?: number // For centerline points
    isStart?: boolean // For endpoints
    isEnd?: boolean // For endpoints
    intersectionElements?: string[] // For intersection points
  }
}

export interface SnapResult {
  snapPoint: SnapPoint | null
  distance: number
  isSnapped: boolean
  visualFeedback: {
    showIndicator: boolean
    indicatorType: SnapPointType
    opacity: number
    size: number
  }
}

export interface SnapConfig {
  enabled: boolean
  snapThreshold: number // pixels
  magneticThreshold: number // pixels for magnetic attraction
  showVisualFeedback: boolean
  showSnapLegend: boolean
  priorityOverride?: SnapPointType // Override priority hierarchy
  modifierKeys: {
    ctrl: boolean
    alt: boolean
    shift: boolean
  }
}

// Centerline Types
export type CenterlineType = 'arc' | 'segmented'

export interface CenterlinePoint {
  x: number
  y: number
  isControlPoint?: boolean // For arc-based centerlines
  tangent?: { x: number; y: number } // Tangent vector for smooth curves
}

export interface Centerline {
  id: string
  type: CenterlineType
  points: CenterlinePoint[]
  isComplete: boolean
  isSMACNACompliant: boolean
  warnings: string[]
  radius?: number // For arc-type centerlines
  width?: number // Duct width
  height?: number // Duct height
  metadata: {
    totalLength: number
    segmentCount: number
    hasArcs: boolean
    createdAt: Date
    lastModified: Date
  }
}

export interface CenterlineDrawingState {
  isActive: boolean
  currentCenterline: Centerline | null
  previewPoint: CenterlinePoint | null
  snapTarget: SnapPoint | null
}

// Calculation types
export interface CalculationInput {
  airflow: number
  duct_type: 'round' | 'rectangular'
  friction_rate: number
  units: 'imperial' | 'metric'
  material?: string
  insulation?: boolean
}

export interface CalculationResult {
  success: boolean
  input_data: CalculationInput
  results?: {
    width?: number
    height?: number
    diameter?: number
    area: number
    velocity: number
    pressure_loss: number
    equivalent_diameter?: number
    hydraulic_diameter?: number
    aspect_ratio?: number
  }
  compliance?: Record<string, any>
  warnings: string[]
  errors: string[]
  metadata?: Record<string, any>
}

// User and authentication types
export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'pro' | 'enterprise' | 'super_admin' | 'trial' | 'premium'
  company?: string
  subscription_expires?: string
  created_at: string
  updated_at?: string
  permissions?: string[]
  is_super_admin?: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// UI State types
export interface UIState {
  sidebarOpen: boolean
  activePanel: 'project' | 'room' | 'segment' | 'equipment' | null
  selectedObjects: string[]
  showGrid: boolean
  snapToGrid: boolean
  zoom: number
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  timestamp: number
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json' | 'bom'
  includeDrawing: boolean
  includeCalculations: boolean
  includeWarnings: boolean
}

export interface ExportResult {
  success: boolean
  exportId: string
  downloadUrl?: string
  error?: string
}

// Material and reference data types
export interface Material {
  id: string
  name: string
  roughness: number
  description: string
}

export interface Standard {
  code: string
  name: string
  version: string
  description: string
}

// Tier limits
export interface TierLimits {
  maxRooms: number
  maxSegments: number
  maxProjects: number
  canEditComputationalProperties: boolean
  canExportWithoutWatermark: boolean
  canUseSimulation: boolean
  canUseCatalog: boolean
}

// Essential geometric types for snap logic
export interface Point2D {
  x: number
  y: number
}

// Additional properties for Equipment interface
export interface EquipmentDimensions {
  width: number
  height: number
  depth: number
}

// Enhanced Equipment interface with missing properties
export interface EnhancedEquipment extends Equipment {
  dimensions?: EquipmentDimensions
  isSource?: boolean
  isTerminal?: boolean
}
