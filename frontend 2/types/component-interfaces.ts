/**



<<<<<<<
 * Shared Component Interfaces

=======
import React from 'react';

import {

  Project,

  Room,

  Segment,

  Equipment,

  User,

  CanvasViewport,

  CanvasGrid,

  DrawingTool,

  DrawingState,

  CalculationInput,

  CalculationResult,

  Warning,

  Notification,

  ExportOptions,

  ExportResult,

  TierLimits

} from './air-duct-sizer';

// Define UserTier type based on User interface

export type UserTier = 'free' | 'pro' | 'enterprise' | 'super_admin';

>>>>>>>


 * 



 * Standardized TypeScript interfaces for component props that integrate with



 * existing schemas and service layer types. Supports both Phase 1 (offline)



 * and Phase 2 (SaaS) requirements with tier-based feature gating.



 * 



 * @see docs/refactoring/component-architecture-specification.md



 * @see frontend/types/air-duct-sizer.ts



 */







import React from 'react';



import {



  Project,



  Room,



  Segment,



  Equipment,



  User,



  CanvasViewport,



  CanvasGrid,



  DrawingTool,



  DrawingState,



  CalculationInput,



  CalculationResult,



  Warning,



  Notification,



  ExportOptions,



  ExportResult,



  TierLimits



} from './air-duct-sizer';



import { UserTier } from '../lib/repositories/interfaces/UserRepository';







// =============================================================================



// Validation Types



// =============================================================================







export interface ValidationResult {



  isValid: boolean;



  errors: string[];



  warnings: string[];



}







// =============================================================================



// Base Component Interfaces



// =============================================================================







/**



 * Base props for all components



 */



export interface BaseComponentProps {



  /** Custom CSS classes */



  className?: string;



  /** Test identifier for automated testing */



  testId?: string;



  /** Disable component interactions */



  disabled?: boolean;



  /** Component children */



  children?: React.ReactNode;



}







/**



 * Props for components that display data



 */



export interface DataComponentProps<T> extends BaseComponentProps {



  /** Primary data for the component */



  data: T;



  /** Loading state indicator */



  loading?: boolean;



  /** Error message if data loading failed */



  error?: string;



}







/**



 * Props for interactive components that handle user actions



 */



export interface InteractiveComponentProps<T, A> extends DataComponentProps<T> {



  /** Handler for user actions */



  onAction: (action: A) => void;



  /** Error handler for action failures */



  onError?: (error: Error) => void;



  /** Success handler for completed actions */



  onSuccess?: (result?: any) => void;



}







/**



 * Props for components with feature gating



 */



export interface FeatureGatedProps extends BaseComponentProps {



  /** Feature flag name */



  feature: string;



  /** Required tier for feature access */



  requiredTier?: UserTier;



  /** User ID for tier checking */



  userId?: string;



  /** Fallback content when feature is not available */



  fallback?: React.ReactNode;



  /** Show upgrade prompt when feature is locked */



  showUpgradePrompt?: boolean;



  /** Custom upgrade prompt component */



  upgradePrompt?: React.ReactNode;



  /** Callback when upgrade is clicked */



  onUpgradeClick?: () => void;



}







// =============================================================================



// Layout Component Interfaces



// =============================================================================







/**



 * App Shell component props



 */



export interface AppShellProps extends BaseComponentProps {



  /** Current user information */



  user?: User;



  /** Whether to show minimal layout (auth pages) */



  minimal?: boolean;



  /** Custom header component */



  header?: React.ReactNode;



  /** Custom sidebar component */



  sidebar?: React.ReactNode;



  /** Custom status bar component */



  statusBar?: React.ReactNode;



}







/**



 * Header component props



 */



export interface HeaderProps extends BaseComponentProps {



  /** Current user information */



  user?: User;



  /** Number of unread notifications */



  notificationCount?: number;



  /** Theme toggle handler */



  onThemeToggle?: () => void;



  /** Current theme state */



  isDarkMode?: boolean;



  /** Mobile menu toggle handler */



  onMobileMenuToggle?: () => void;



  /** Whether mobile menu is open */



  isMobileMenuOpen?: boolean;



}







/**



 * Sidebar component props



 */



export interface SidebarProps extends BaseComponentProps {



  /** Whether sidebar is open */



  isOpen: boolean;



  /** Active panel type */



  activePanel: 'project' | 'room' | 'segment' | 'equipment' | null;



  /** Currently selected object IDs */



  selectedObjects: string[];



  /** Sidebar close handler */



  onClose: () => void;



  /** Panel change handler */



  onPanelChange: (panel: 'project' | 'room' | 'segment' | 'equipment' | null) => void;



  /** Object selection handler */



  onObjectSelect: (ids: string[]) => void;



}







/**



 * Status bar component props



 */



export interface StatusBarProps extends BaseComponentProps {



  /** Online connection status */



  isOnline: boolean;



  /** Server connection status */



  isConnectedToServer: boolean;



  /** Project save status */



  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';



  /** Last save timestamp */



  lastSaved?: Date;



  /** Grid visibility state */



  gridEnabled: boolean;



  /** Snap to grid state */



  snapEnabled: boolean;



  /** Current zoom level */



  zoomLevel: number;



  /** Grid toggle handler */



  onGridToggle: () => void;



  /** Snap toggle handler */



  onSnapToggle: () => void;



  /** Zoom handlers */



  onZoomIn: () => void;



  onZoomOut: () => void;



  onZoomReset: () => void;



  /** Current user name */



  userName?: string;



  /** Current project name */



  projectName?: string;



  /** Calculation status */



  calculationStatus?: 'idle' | 'running' | 'complete' | 'error';



  /** Warning and error counts */



  warningCount?: number;



  errorCount?: number;



}







// =============================================================================



// Canvas Component Interfaces



// =============================================================================







/**



 * Canvas container component props



 */



export interface CanvasContainerProps extends BaseComponentProps {



  /** Canvas dimensions */



  width: number;



  height: number;



  /** Current viewport state */



  viewport: CanvasViewport;



  /** Grid configuration */



  grid: CanvasGrid;



  /** Drawing state */



  drawingState: DrawingState;



  /** Selected object IDs */



  selectedObjects: string[];



  /** Viewport change handler */



  onViewportChange: (viewport: CanvasViewport) => void;



  /** Object selection handler */



  onObjectSelect: (ids: string[]) => void;



  /** Object update handler */



  onObjectUpdate: (id: string, updates: any) => void;



  /** Drawing tool change handler */



  onDrawingToolChange: (tool: DrawingTool) => void;



}







/**



 * Canvas object component props (base for rooms, segments, equipment)



 */



export interface CanvasObjectProps<T> extends BaseComponentProps {



  /** Object data */



  object: T;



  /** Whether object is selected */



  selected: boolean;



  /** Whether object is being edited */



  editing?: boolean;



  /** Current viewport for coordinate transformation */



  viewport: CanvasViewport;



  /** Object selection handler */



  onSelect: (id: string, multiSelect?: boolean) => void;



  /** Object update handler */



  onUpdate: (id: string, updates: Partial<T>) => void;



  /** Object delete handler */



  onDelete?: (id: string) => void;



}







/**



 * Drawing tools component props



 */



export interface DrawingToolsProps extends BaseComponentProps {



  /** Currently active tool */



  activeTool: DrawingTool;



  /** Available tools */



  availableTools: DrawingTool[];



  /** Tool change handler */



  onToolChange: (tool: DrawingTool) => void;



  /** Tool settings */



  toolSettings?: Record<string, any>;



  /** Tool settings change handler */



  onToolSettingsChange?: (settings: Record<string, any>) => void;



}







// =============================================================================



// Property Panel Interfaces



// =============================================================================







/**



 * Project panel component props



 */



export interface ProjectPanelProps extends DataComponentProps<Project> {



  /** Project update handler */



  onProjectUpdate: (updates: Partial<Project>) => void;



  /** Project save handler */



  onProjectSave: () => void;



  /** Project export handler */



  onProjectExport: (options: ExportOptions) => void;



  /** Current user tier for feature gating */



  userTier: UserTier;



  /** Tier limits for current user */



  tierLimits: TierLimits;



}







/**



 * Object panel component props (for rooms, segments, equipment)



 */



export interface ObjectPanelProps<T> extends DataComponentProps<T> {



  /** Object type identifier */



  objectType: 'room' | 'segment' | 'equipment';



  /** Object update handler */



  onObjectUpdate: (updates: Partial<T>) => void;



  /** Object delete handler */



  onObjectDelete: () => void;



  /** Calculation trigger handler */



  onCalculate?: () => void;



  /** Current calculation results */



  calculationResults?: CalculationResult;



  /** Validation results */



  validationResults?: ValidationResult;



  /** Current warnings */



  warnings?: Warning[];



}







/**



 * Calculation panel component props



 */



export interface CalculationPanelProps extends BaseComponentProps {



  /** Calculation inputs */



  inputs: CalculationInput;



  /** Calculation results */



  results?: CalculationResult;



  /** Validation results */



  validation?: ValidationResult;



  /** Loading state */



  calculating: boolean;



  /** Input change handler */



  onInputChange: (inputs: CalculationInput) => void;



  /** Calculate handler */



  onCalculate: () => void;



  /** Results export handler */



  onExportResults?: () => void;



  /** User tier for feature gating */



  userTier: UserTier;



}







/**



 * Validation panel component props



 */



export interface ValidationPanelProps extends BaseComponentProps {



  /** Validation results */



  results: ValidationResult[];



  /** Current warnings */



  warnings: Warning[];



  /** Validation refresh handler */



  onRefresh: () => void;



  /** Warning dismiss handler */



  onDismissWarning: (warningId: string) => void;



  /** Standards configuration */



  enabledStandards: string[];



  /** Standards configuration change handler */



  onStandardsChange: (standards: string[]) => void;



}







// =============================================================================



// Service Integration Interfaces



// =============================================================================







/**



 * Service hook return type



 */



export interface ServiceHookResult<T> {



  /** Service instance */



  service: T;



  /** Loading state */



  loading: boolean;



  /** Error state */



  error: string | null;



  /** Retry function for failed operations */



  retry: () => void;



}







/**



 * Project service hook interface



 */



export interface ProjectServiceHook extends ServiceHookResult<any> {



  /** Load project by ID */



  loadProject: (id: string) => Promise<Project | null>;



  /** Save current project */



  saveProject: (project: Project) => Promise<void>;



  /** Create new project */



  createProject: (data: Partial<Project>) => Promise<Project>;



  /** Delete project */



  deleteProject: (id: string) => Promise<void>;



  /** List user projects */



  listProjects: (userId: string) => Promise<Project[]>;



}







/**



 * Calculation service hook interface



 */



export interface CalculationServiceHook extends ServiceHookResult<any> {



  /** Calculate duct sizing */



  calculateDuctSizing: (inputs: CalculationInput) => Promise<CalculationResult>;



  /** Validate calculation results */



  validateResults: (results: CalculationResult) => Promise<ValidationResult>;



  /** Get calculation history */



  getCalculationHistory: (projectId: string) => Promise<CalculationResult[]>;



}







/**



 * Export service hook interface



 */



export interface ExportServiceHook extends ServiceHookResult<any> {



  /** Export project */



  exportProject: (projectId: string, options: ExportOptions) => Promise<ExportResult>;



  /** Get export status */



  getExportStatus: (exportId: string) => Promise<ExportResult>;



  /** Download export */



  downloadExport: (exportId: string) => Promise<Blob>;



}







/**



 * Tier service hook interface



 */



export interface TierServiceHook extends ServiceHookResult<any> {



  /** Get current user tier */



  getCurrentTier: () => Promise<UserTier>;



  /** Check feature access */



  hasFeatureAccess: (feature: string) => Promise<boolean>;



  /** Get tier limits */



  getTierLimits: () => Promise<TierLimits>;



  /** Upgrade tier */



  upgradeTier: (newTier: UserTier) => Promise<void>;



}







// =============================================================================



// Form and Input Interfaces



// =============================================================================







/**



 * Form field component props



 */



export interface FormFieldProps extends BaseComponentProps {



  /** Field label */



  label: string;



  /** Field name/identifier */



  name: string;



  /** Field value */



  value: any;



  /** Value change handler */



  onChange: (value: any) => void;



  /** Field validation error */



  error?: string;



  /** Field help text */



  helpText?: string;



  /** Whether field is required */



  required?: boolean;



  /** Field placeholder */



  placeholder?: string;



}







/**



 * Notification component props



 */



export interface NotificationProps extends BaseComponentProps {



  /** Notification data */



  notification: Notification;



  /** Dismiss handler */



  onDismiss: (id: string) => void;



  /** Action handler */



  onAction?: (id: string, action: string) => void;



}







// =============================================================================



// Action Types for Interactive Components



// =============================================================================







/**



 * Project actions



 */



export type ProjectAction = 



  | { type: 'update'; payload: Partial<Project> }



  | { type: 'save' }



  | { type: 'export'; payload: ExportOptions }



  | { type: 'delete' };







/**



 * Canvas actions



 */



export type CanvasAction =



  | { type: 'select'; payload: { ids: string[]; multiSelect?: boolean } }



  | { type: 'update'; payload: { id: string; updates: any } }



  | { type: 'delete'; payload: { ids: string[] } }



  | { type: 'viewport'; payload: CanvasViewport }



  | { type: 'tool'; payload: DrawingTool };







/**



 * Calculation actions



 */



export type CalculationAction =



  | { type: 'input'; payload: CalculationInput }



  | { type: 'calculate' }



  | { type: 'validate' }



  | { type: 'export' };







/**



 * Validation actions



 */



export type ValidationAction =



  | { type: 'refresh' }



  | { type: 'dismiss'; payload: string }



  | { type: 'standards'; payload: string[] };



