/**
 * Snap Logic Drawing Tools
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Enhanced drawing tools component with integrated snap logic functionality.
 * Provides pencil tool for centerline drawing with visual feedback.
 */

"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, 
  Square, 
  Circle, 
  Move, 
  MousePointer,
  Zap,
  Eye,
  EyeOff,
  Grid3X3,
  Settings,
  Target,
  Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingTool } from '@/types/air-duct-sizer';
import { useUIStore } from '@/stores/ui-store';
import { useSnapLogic } from '@/lib/hooks/useSnapLogic';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { TouchOptimizedToggle } from './TouchOptimizedToggle';
import { TouchGestureHandler } from '@/lib/snap-logic/system/TouchGestureHandler';

/**
 * Props for SnapLogicDrawingTools component
 */
interface SnapLogicDrawingToolsProps {
  onToolChange?: (tool: DrawingTool) => void;
  className?: string;
}

/**
 * Tool configuration
 */
interface ToolConfig {
  id: DrawingTool;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  shortcut?: string;
  snapLogicSupported: boolean;
}

/**
 * Available drawing tools
 */
const DRAWING_TOOLS: ToolConfig[] = [
  {
    id: 'select',
    icon: MousePointer,
    label: 'Select',
    description: 'Select and move objects',
    shortcut: 'V',
    snapLogicSupported: false
  },
  {
    id: 'pencil',
    icon: Pencil,
    label: 'Pencil',
    description: 'Draw centerlines with snap logic',
    shortcut: 'P',
    snapLogicSupported: true
  },
  {
    id: 'room',
    icon: Square,
    label: 'Room',
    description: 'Draw rooms and spaces',
    shortcut: 'R',
    snapLogicSupported: true
  },
  {
    id: 'duct',
    icon: Circle,
    label: 'Duct',
    description: 'Draw duct segments',
    shortcut: 'D',
    snapLogicSupported: true
  },
  {
    id: 'equipment',
    icon: Zap,
    label: 'Equipment',
    description: 'Place HVAC equipment',
    shortcut: 'E',
    snapLogicSupported: true
  }
];

/**
 * Main drawing tools component with snap logic integration
 */
export const SnapLogicDrawingTools: React.FC<SnapLogicDrawingToolsProps> = ({
  onToolChange,
  className
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  React.useEffect(() => {
    setIsTouchDevice(TouchGestureHandler.isTouchDevice());
  }, []);
  
  // UI store
  const {
    drawingState,
    setDrawingTool,
    setSnapLogicEnabled,
    setShowSnapIndicators,
    setShowSnapLegend,
    setMagneticSnapping
  } = useUIStore();

  // Snap logic hook
  const {
    isActive: snapLogicActive,
    isDrawing,
    currentTool,
    setCurrentTool,
    activate: activateSnapLogic,
    deactivate: deactivateSnapLogic
  } = useSnapLogic({
    autoActivateOnPencil: true,
    enableKeyboardShortcuts: true
  });

  /**
   * Handle tool selection
   */
  const handleToolSelect = useCallback((tool: DrawingTool) => {
    setDrawingTool(tool);
    setCurrentTool(tool);
    onToolChange?.(tool);
  }, [setDrawingTool, setCurrentTool, onToolChange]);

  /**
   * Handle snap logic toggle
   */
  const handleSnapLogicToggle = useCallback(() => {
    const newEnabled = !drawingState.snapLogicEnabled;
    setSnapLogicEnabled(newEnabled);
    
    if (newEnabled && currentTool === 'pencil') {
      activateSnapLogic();
    } else if (!newEnabled) {
      deactivateSnapLogic();
    }
  }, [drawingState.snapLogicEnabled, setSnapLogicEnabled, currentTool, activateSnapLogic, deactivateSnapLogic]);

  /**
   * Get tool status
   */
  const getToolStatus = (tool: ToolConfig) => {
    const isActive = drawingState.tool === tool.id;
    const isSnapSupported = tool.snapLogicSupported;
    const isSnapActive = snapLogicActive && isSnapSupported;
    
    return {
      isActive,
      isSnapSupported,
      isSnapActive,
      isDrawing: isDrawing && isActive
    };
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main tool buttons */}
      <div className="flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-2">
        {DRAWING_TOOLS.map((tool) => {
          const status = getToolStatus(tool);
          const Icon = tool.icon;

          return (
            <div key={tool.id} className="relative">
              <TouchOptimizedButton
                onClick={() => handleToolSelect(tool.id)}
                variant={status.isActive ? 'primary' : 'ghost'}
                size={isTouchDevice ? 'lg' : 'md'}
                enableHapticFeedback={true}
                hapticPattern={status.isActive ? 'medium' : 'light'}
                enableTouchFeedback={true}
                showPressedState={true}
                aria-label={`${tool.label} tool - ${tool.description}`}
                className={cn(
                  "relative flex items-center justify-center rounded-lg transition-all duration-200",
                  isTouchDevice ? "w-14 h-14" : "w-12 h-12",
                  status.isActive
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                )}
                icon={<Icon size={isTouchDevice ? 24 : 20} />}
              >
                <Icon size={isTouchDevice ? 24 : 20} />
              </TouchOptimizedButton>

              {/* Snap logic indicator */}
              {status.isSnapSupported && (
                <div className={cn(
                  "absolute -top-1 -right-1 rounded-full border-2 border-white",
                  isTouchDevice ? "w-4 h-4" : "w-3 h-3",
                  status.isSnapActive ? "bg-green-500" : "bg-gray-400"
                )} />
              )}

              {/* Drawing indicator */}
              {status.isDrawing && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-lg border-2 border-blue-300 pointer-events-none",
                    isTouchDevice && "border-4"
                  )}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Touch device tooltip */}
              {isTouchDevice && status.isActive && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {tool.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Settings button */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
              "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
              showSettings ? "bg-gray-200 text-gray-800" : "text-gray-600"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Snap Logic Settings"
          >
            <Settings size={18} />
          </motion.button>
        </div>
      </div>

      {/* Snap logic settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-3 min-w-48"
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Snap Logic Settings</h4>
            
            <div className="space-y-3">
              {/* Snap logic enabled */}
              <TouchOptimizedToggle
                checked={drawingState.snapLogicEnabled}
                onChange={handleSnapLogicToggle}
                size={isTouchDevice ? 'md' : 'sm'}
                enableHapticFeedback={true}
                enableTouchFeedback={true}
                label="Enable Snap Logic"
                aria-label="Toggle snap logic system"
                id="snap-logic-toggle"
              />

              {/* Show snap indicators */}
              <TouchOptimizedToggle
                checked={drawingState.showSnapIndicators}
                onChange={(checked) => setShowSnapIndicators(checked)}
                size={isTouchDevice ? 'md' : 'sm'}
                enableHapticFeedback={true}
                enableTouchFeedback={true}
                disabled={!drawingState.snapLogicEnabled}
                label="Show Indicators"
                aria-label="Toggle snap point indicators"
                id="snap-indicators-toggle"
              />

              {/* Show snap legend */}
              <TouchOptimizedToggle
                checked={drawingState.showSnapLegend}
                onChange={(checked) => setShowSnapLegend(checked)}
                size={isTouchDevice ? 'md' : 'sm'}
                enableHapticFeedback={true}
                enableTouchFeedback={true}
                disabled={!drawingState.snapLogicEnabled}
                label="Show Legend"
                aria-label="Toggle snap legend display"
                id="snap-legend-toggle"
              />

              {/* Magnetic snapping */}
              <TouchOptimizedToggle
                checked={drawingState.magneticSnapping}
                onChange={(checked) => setMagneticSnapping(checked)}
                size={isTouchDevice ? 'md' : 'sm'}
                enableHapticFeedback={true}
                enableTouchFeedback={true}
                disabled={!drawingState.snapLogicEnabled}
                label="Magnetic Snap"
                aria-label="Toggle magnetic snapping"
                id="magnetic-snap-toggle"
              />
            </div>

            {/* Status indicators */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  snapLogicActive ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>
                  {snapLogicActive ? 'Snap Logic Active' : 'Snap Logic Inactive'}
                </span>
              </div>
              
              {isDrawing && (
                <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Drawing Centerline</span>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Shortcuts:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Ctrl: Disable snap</div>
                <div>Tab: Toggle arc/segmented</div>
                <div>Esc: Cancel drawing</div>
                <div>Enter: Complete drawing</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
