/**
 * Touch Optimized UI Components
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Touch-optimized UI components with larger touch targets, haptic feedback,
 * and touch-specific visual indicators for mobile and tablet devices.
 * 
 * @fileoverview Touch-optimized UI components for snap logic system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, 
  Square, 
  Circle, 
  Move, 
  MousePointer,
  Zap,
  Settings,
  Hand,
  Smartphone,
  RotateCcw,
  RotateCw,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingTool } from '@/types/air-duct-sizer';

/**
 * Props for TouchOptimizedDrawingTools component
 */
interface TouchOptimizedDrawingToolsProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  isSnapLogicActive: boolean;
  isSnapOverrideActive: boolean;
  onSnapToggle: () => void;
  className?: string;
}

/**
 * Touch-optimized drawing tools with larger targets
 */
export const TouchOptimizedDrawingTools: React.FC<TouchOptimizedDrawingToolsProps> = ({
  currentTool,
  onToolChange,
  isSnapLogicActive,
  isSnapOverrideActive,
  onSnapToggle,
  className
}) => {
  const [showGestureHelp, setShowGestureHelp] = useState(false);

  const tools = [
    { id: 'select' as DrawingTool, icon: MousePointer, label: 'Select' },
    { id: 'pencil' as DrawingTool, icon: Pencil, label: 'Draw' },
    { id: 'room' as DrawingTool, icon: Square, label: 'Room' },
    { id: 'duct' as DrawingTool, icon: Circle, label: 'Duct' },
    { id: 'equipment' as DrawingTool, icon: Zap, label: 'Equipment' }
  ];

  const handleToolSelect = useCallback((tool: DrawingTool) => {
    // Haptic feedback for tool selection
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onToolChange(tool);
  }, [onToolChange]);

  const handleSnapToggle = useCallback(() => {
    // Haptic feedback for snap toggle
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onSnapToggle();
  }, [onSnapToggle]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Touch-optimized tool buttons */}
      <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border p-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;
          
          return (
            <motion.button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200",
                "hover:bg-gray-100 focus:outline-none focus:ring-3 focus:ring-blue-500/50",
                "touch-manipulation", // Optimize for touch
                isActive 
                  ? "bg-blue-500 text-white shadow-lg" 
                  : "bg-transparent text-gray-600"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ minHeight: '64px', minWidth: '64px' }} // Ensure minimum touch target size
            >
              <Icon size={24} />
              <span className="text-xs font-medium mt-1">{tool.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
        
        {/* Snap logic toggle */}
        <div className="border-t border-gray-200 pt-3 mt-2">
          <motion.button
            onClick={handleSnapToggle}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200",
              "hover:bg-gray-100 focus:outline-none focus:ring-3 focus:ring-blue-500/50",
              "touch-manipulation",
              isSnapLogicActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Hand size={20} />
            <span className="text-xs font-medium mt-1">Snap</span>
            
            {/* Override indicator */}
            {isSnapOverrideActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Gesture help button */}
      <motion.button
        onClick={() => setShowGestureHelp(!showGestureHelp)}
        className="flex items-center justify-center w-16 h-12 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-500/20 transition-colors duration-200 touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Info size={20} />
      </motion.button>

      {/* Gesture help overlay */}
      <AnimatePresence>
        {showGestureHelp && (
          <TouchGestureHelp onClose={() => setShowGestureHelp(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Touch gesture help overlay
 */
interface TouchGestureHelpProps {
  onClose: () => void;
}

const TouchGestureHelp: React.FC<TouchGestureHelpProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Touch Gestures</h3>
        </div>

        <div className="space-y-4">
          {/* Long press */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hand size={16} className="text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Long Press</div>
              <div className="text-sm text-gray-600">Hold to override snap logic</div>
            </div>
          </div>

          {/* Two finger pan */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Move size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Two Finger Pan</div>
              <div className="text-sm text-gray-600">Drag with two fingers to pan view</div>
            </div>
          </div>

          {/* Swipe gestures */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <RotateCcw size={16} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Swipe Left/Right</div>
              <div className="text-sm text-gray-600">Two finger swipe for undo/redo</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 touch-manipulation"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  );
};

/**
 * Touch-optimized snap indicators with larger targets
 */
interface TouchSnapIndicatorProps {
  position: { x: number; y: number };
  type: 'endpoint' | 'centerline' | 'midpoint' | 'intersection';
  isActive: boolean;
  size?: number;
  opacity?: number;
}

export const TouchSnapIndicator: React.FC<TouchSnapIndicatorProps> = ({
  position,
  type,
  isActive,
  size = 20, // Larger default size for touch
  opacity = 0.8
}) => {
  const colors = {
    endpoint: '#ef4444',
    centerline: '#3b82f6',
    midpoint: '#10b981',
    intersection: '#f59e0b'
  };

  const shapes = {
    endpoint: 'rounded-full',
    centerline: 'rounded-sm',
    midpoint: 'rounded-sm transform rotate-45',
    intersection: 'rounded-sm'
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.3 : 1, 
        opacity: isActive ? Math.min(1, opacity + 0.3) : opacity 
      }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        "absolute pointer-events-none border-2 border-white shadow-lg",
        shapes[type]
      )}
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        backgroundColor: colors[type],
        zIndex: isActive ? 1000 : 100
      }}
    >
      {/* Pulse animation for active state */}
      {isActive && (
        <motion.div
          className={cn("absolute inset-0 border-2 border-white", shapes[type])}
          style={{ backgroundColor: colors[type] }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

/**
 * Touch-optimized context menu with larger touch targets
 */
interface TouchContextMenuProps {
  snapPoints: any[];
  position: { x: number; y: number };
  visible: boolean;
  onSelect: (snapPoint: any) => void;
  onClose: () => void;
}

export const TouchContextMenu: React.FC<TouchContextMenuProps> = ({
  snapPoints,
  position,
  visible,
  onSelect,
  onClose
}) => {
  if (!visible || snapPoints.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute z-50 bg-white rounded-2xl shadow-2xl border py-2 min-w-48"
        style={{
          left: Math.max(10, Math.min(position.x, window.innerWidth - 200)),
          top: Math.max(10, Math.min(position.y, window.innerHeight - 200))
        }}
      >
        <div className="px-4 py-3 text-sm font-semibold text-gray-500 border-b">
          Multiple Snap Points
        </div>
        {snapPoints.map((snapPoint, index) => (
          <button
            key={snapPoint.id || index}
            onClick={() => {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(25);
              }
              onSelect(snapPoint);
            }}
            className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-3 touch-manipulation"
            style={{ minHeight: '56px' }} // Larger touch target
          >
            <div
              className="w-4 h-4 border-2 border-solid flex-shrink-0 rounded-sm"
              style={{
                backgroundColor: {
                  endpoint: '#ef4444',
                  centerline: '#3b82f6',
                  midpoint: '#10b981',
                  intersection: '#f59e0b'
                }[snapPoint.type] || '#6b7280'
              }}
            />
            <div>
              <div className="font-medium capitalize">{snapPoint.type}</div>
              {snapPoint.elementType && (
                <div className="text-sm text-gray-500">
                  {snapPoint.elementType}
                </div>
              )}
            </div>
          </button>
        ))}
        <div className="border-t">
          <button
            onClick={() => {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(25);
              }
              onClose();
            }}
            className="w-full px-4 py-4 text-left text-gray-500 hover:bg-gray-50 touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
