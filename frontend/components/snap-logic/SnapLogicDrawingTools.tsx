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
            <motion.button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                status.isActive 
                  ? "bg-blue-500 text-white shadow-md" 
                  : "bg-transparent text-gray-600"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${tool.label} (${tool.shortcut})\n${tool.description}`}
            >
              <Icon size={20} />
              
              {/* Snap logic indicator */}
              {status.isSnapSupported && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                  status.isSnapActive ? "bg-green-500" : "bg-gray-400"
                )} />
              )}
              
              {/* Drawing indicator */}
              {status.isDrawing && (
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-blue-300"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
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
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-700">Enable Snap Logic</label>
                <button
                  onClick={handleSnapLogicToggle}
                  className={cn(
                    "relative w-8 h-4 rounded-full transition-colors duration-200",
                    drawingState.snapLogicEnabled ? "bg-blue-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                    drawingState.snapLogicEnabled ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Show snap indicators */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-700">Show Indicators</label>
                <button
                  onClick={() => setShowSnapIndicators(!drawingState.showSnapIndicators)}
                  className={cn(
                    "relative w-8 h-4 rounded-full transition-colors duration-200",
                    drawingState.showSnapIndicators ? "bg-blue-500" : "bg-gray-300"
                  )}
                  disabled={!drawingState.snapLogicEnabled}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                    drawingState.showSnapIndicators ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Show snap legend */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-700">Show Legend</label>
                <button
                  onClick={() => setShowSnapLegend(!drawingState.showSnapLegend)}
                  className={cn(
                    "relative w-8 h-4 rounded-full transition-colors duration-200",
                    drawingState.showSnapLegend ? "bg-blue-500" : "bg-gray-300"
                  )}
                  disabled={!drawingState.snapLogicEnabled}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                    drawingState.showSnapLegend ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Magnetic snapping */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-700">Magnetic Snap</label>
                <button
                  onClick={() => setMagneticSnapping(!drawingState.magneticSnapping)}
                  className={cn(
                    "relative w-8 h-4 rounded-full transition-colors duration-200",
                    drawingState.magneticSnapping ? "bg-blue-500" : "bg-gray-300"
                  )}
                  disabled={!drawingState.snapLogicEnabled}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                    drawingState.magneticSnapping ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>
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
