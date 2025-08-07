'use client'

import React, { Suspense, lazy } from 'react'

// Dynamic imports for panel components
const DrawingToolFAB = lazy(() =>
  import('@/components/ui/DrawingToolFAB').then(module => ({
    default: module.DrawingToolFAB
  }))
);

const ContextPropertyPanel = lazy(() =>
  import('@/components/ui/ContextPropertyPanel').then(module => ({
    default: module.ContextPropertyPanel
  }))
);

const ModelSummaryPanel = lazy(() =>
  import('@/components/ui/ModelSummaryPanel').then(module => ({
    default: module.ModelSummaryPanel
  }))
);

const WarningPanel = lazy(() =>
  import('@/components/ui/WarningPanel').then(module => ({
    default: module.WarningPanel
  }))
);

const ViewCube = lazy(() => 
  import('@/components/ui/ViewCube').then(module => ({
    default: module.ViewCube
  }))
);

// Import types
import type { DrawingMode } from '@/components/ui/DrawingToolFAB'
import type { ElementProperties } from '@/components/ui/ContextPropertyPanel'
import type { ValidationWarning } from '@/components/ui/WarningPanel'
import type { SystemSummary } from './AirDuctSizerToolbar'

export interface AirDuctSizerPanelsProps {
  // Context Panel
  showContextPanel: boolean;
  selectedElement: ElementProperties | null;
  contextPanelPosition: { x: number; y: number };
  onCloseContextPanel: () => void;
  onElementUpdate: (elementId: string, updates: Partial<ElementProperties>) => void;

  // Model Summary Panel
  showModelSummary: boolean;
  onCloseModelSummary: () => void;
  systemSummary: SystemSummary;
  calculationResults: any;
  warnings: ValidationWarning[];

  // Drawing Tool FAB
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onPropertyPanelOpen?: () => void;

  className?: string;
}

export const AirDuctSizerPanels: React.FC<AirDuctSizerPanelsProps> = ({
  showContextPanel,
  selectedElement,
  contextPanelPosition,
  onCloseContextPanel,
  onElementUpdate,
  showModelSummary,
  onCloseModelSummary,
  systemSummary,
  calculationResults,
  warnings,
  drawingMode,
  onDrawingModeChange,
  onPropertyPanelOpen,
  className = ""
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Drawing Tool FAB - Bottom Left */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <Suspense fallback={
          <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-pulse" />
        }>
          <DrawingToolFAB
            drawingMode={drawingMode}
            onDrawingModeChange={onDrawingModeChange}
            onPropertyPanelOpen={onPropertyPanelOpen}
            ductProperties={{
              shape: 'rectangular',
              width: 8,
              height: 8,
              material: 'galvanized_steel',
              insulation: false,
              name: 'Default Duct',
              ductType: 'supply'
            }}
            onDuctPropertiesChange={(properties) => {
              // Handle duct properties change
              console.log('Duct properties changed:', properties);
            }}
          />
        </Suspense>
      </div>

      {/* ViewCube - Top Right */}
      <div className="absolute top-24 right-6 pointer-events-auto">
        <Suspense fallback={
          <div className="w-24 h-24 bg-neutral-500/20 rounded-lg animate-pulse" />
        }>
          <ViewCube
            onViewChange={(view) => {
              console.log('ViewCube view changed:', view);
            }}
          />
        </Suspense>
      </div>

      {/* Context Property Panel - Dynamic Position */}
      {showContextPanel && (
        <div 
          className="absolute pointer-events-auto z-50"
          style={{ 
            left: contextPanelPosition.x, 
            top: contextPanelPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Suspense fallback={
            <div className="w-80 h-96 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 rounded-lg animate-pulse" />
          }>
            <ContextPropertyPanel
              isVisible={showContextPanel}
              selectedElement={selectedElement}
              position={contextPanelPosition}
              onClose={onCloseContextPanel}
              onElementUpdate={onElementUpdate}
              onElementDelete={(id) => {
                console.log('Delete element:', id);
              }}
              onElementCopy={(id) => {
                console.log('Copy element:', id);
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Model Summary Panel - Right Side */}
      {showModelSummary && (
        <div className="absolute inset-y-0 right-0 pointer-events-auto">
          <Suspense fallback={
            <div className="w-96 h-full bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-l border-neutral-200 dark:border-neutral-700 animate-pulse" />
          }>
            <ModelSummaryPanel
              isOpen={showModelSummary}
              onClose={onCloseModelSummary}
              systemSummary={systemSummary}
              calculationResults={calculationResults}
              warnings={warnings}
              isCalculating={false}
              onRunCalculation={() => {
                console.log('Running HVAC calculations...');
                // TODO: Implement calculation logic
              }}
              onJumpToElement={(elementId) => {
                console.log('Jumping to element:', elementId);
                // TODO: Implement element navigation
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Warning Panel - Bottom Right */}
      {warnings.length > 0 && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <Suspense fallback={
            <div className="w-80 h-32 bg-yellow-500/20 rounded-lg animate-pulse" />
          }>
            <WarningPanel
              warnings={warnings}
              onWarningDismiss={(warningId) => {
                console.log('Dismissing warning:', warningId);
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};
