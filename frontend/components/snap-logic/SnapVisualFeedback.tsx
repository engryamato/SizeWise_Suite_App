/**
 * Snap Visual Feedback Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Provides visual indicators for snap points with adaptive opacity,
 * zoom-level adaptation, and different indicators for snap types.
 */

"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SnapPoint, 
  SnapResult, 
  SnapPointType 
} from '@/types/air-duct-sizer';
import { cn } from '@/lib/utils';

/**
 * Visual feedback configuration
 */
interface SnapVisualConfig {
  showIndicators: boolean;
  showLabels: boolean;
  adaptToZoom: boolean;
  baseSize: number;
  animationDuration: number;
  colors: Record<SnapPointType, string>;
  shapes: Record<SnapPointType, 'circle' | 'square' | 'diamond' | 'cross'>;
}

/**
 * Default visual configuration
 */
const DEFAULT_VISUAL_CONFIG: SnapVisualConfig = {
  showIndicators: true,
  showLabels: false,
  adaptToZoom: true,
  baseSize: 12,
  animationDuration: 0.2,
  colors: {
    endpoint: '#ef4444', // Red
    centerline: '#3b82f6', // Blue
    midpoint: '#10b981', // Green
    intersection: '#f59e0b' // Amber
  },
  shapes: {
    endpoint: 'circle',
    centerline: 'square',
    midpoint: 'diamond',
    intersection: 'cross'
  }
};

/**
 * Props for SnapVisualFeedback component
 */
interface SnapVisualFeedbackProps {
  snapPoints: SnapPoint[];
  activeSnapResult?: SnapResult;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  config?: Partial<SnapVisualConfig>;
  className?: string;
}

/**
 * Individual snap indicator component
 */
interface SnapIndicatorProps {
  snapPoint: SnapPoint;
  isActive: boolean;
  size: number;
  opacity: number;
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'cross';
  showLabel: boolean;
  animationDuration: number;
}

const SnapIndicator: React.FC<SnapIndicatorProps> = ({
  snapPoint,
  isActive,
  size,
  opacity,
  color,
  shape,
  showLabel,
  animationDuration
}) => {
  const renderShape = () => {
    const baseProps = {
      width: size,
      height: size,
      style: { 
        backgroundColor: shape === 'circle' || shape === 'square' ? color : 'transparent',
        borderColor: color,
        borderWidth: shape === 'cross' ? 0 : 2,
        opacity
      }
    };

    switch (shape) {
      case 'circle':
        return (
          <div
            {...baseProps}
            className="rounded-full border-2 border-solid"
          />
        );
      
      case 'square':
        return (
          <div
            {...baseProps}
            className="border-2 border-solid"
          />
        );
      
      case 'diamond':
        return (
          <div
            {...baseProps}
            className="border-2 border-solid transform rotate-45"
            style={{
              ...baseProps.style,
              backgroundColor: 'transparent'
            }}
          />
        );
      
      case 'cross':
        return (
          <div className="relative" style={{ width: size, height: size, opacity }}>
            <div
              className="absolute bg-current"
              style={{
                width: size,
                height: 2,
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                backgroundColor: color
              }}
            />
            <div
              className="absolute bg-current"
              style={{
                width: 2,
                height: size,
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                backgroundColor: color
              }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.2 : 1, 
        opacity: isActive ? Math.min(1, opacity + 0.3) : opacity 
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: animationDuration }}
      className="absolute pointer-events-none"
      style={{
        left: snapPoint.position.x - size / 2,
        top: snapPoint.position.y - size / 2,
        zIndex: isActive ? 1000 : 100
      }}
    >
      {renderShape()}
      
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
        >
          <div
            className="px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap"
            style={{ backgroundColor: color }}
          >
            {snapPoint.type}
            {snapPoint.metadata?.isStart && ' (start)'}
            {snapPoint.metadata?.isEnd && ' (end)'}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Main snap visual feedback component
 */
export const SnapVisualFeedback: React.FC<SnapVisualFeedbackProps> = ({
  snapPoints,
  activeSnapResult,
  viewport,
  config = {},
  className
}) => {
  const visualConfig = useMemo(() => ({
    ...DEFAULT_VISUAL_CONFIG,
    ...config
  }), [config]);

  // Calculate zoom-adapted sizes
  const adaptedSizes = useMemo(() => {
    const baseSize = visualConfig.baseSize;
    const zoomFactor = visualConfig.adaptToZoom ? Math.max(0.5, Math.min(2, 1 / viewport.scale)) : 1;
    
    return {
      normal: baseSize * zoomFactor,
      active: baseSize * zoomFactor * 1.2
    };
  }, [visualConfig.baseSize, visualConfig.adaptToZoom, viewport.scale]);

  // Filter visible snap points based on viewport
  const visibleSnapPoints = useMemo(() => {
    if (!visualConfig.showIndicators) return [];
    
    // Calculate viewport bounds
    const viewportBounds = {
      left: -viewport.x / viewport.scale,
      top: -viewport.y / viewport.scale,
      right: (-viewport.x + window.innerWidth) / viewport.scale,
      bottom: (-viewport.y + window.innerHeight) / viewport.scale
    };

    return snapPoints.filter(point => {
      const margin = adaptedSizes.active; // Add margin for partially visible indicators
      return point.position.x >= viewportBounds.left - margin &&
             point.position.x <= viewportBounds.right + margin &&
             point.position.y >= viewportBounds.top - margin &&
             point.position.y <= viewportBounds.bottom + margin;
    });
  }, [snapPoints, viewport, visualConfig.showIndicators, adaptedSizes.active]);

  if (!visualConfig.showIndicators) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <AnimatePresence>
        {visibleSnapPoints.map(snapPoint => {
          const isActive = activeSnapResult?.snapPoint?.id === snapPoint.id;
          const size = isActive ? adaptedSizes.active : adaptedSizes.normal;
          const opacity = isActive 
            ? Math.min(1, (activeSnapResult?.visualFeedback.opacity || 0.7) + 0.3)
            : 0.6;
          
          return (
            <SnapIndicator
              key={snapPoint.id}
              snapPoint={snapPoint}
              isActive={isActive}
              size={size}
              opacity={opacity}
              color={visualConfig.colors[snapPoint.type]}
              shape={visualConfig.shapes[snapPoint.type]}
              showLabel={visualConfig.showLabels && isActive}
              animationDuration={visualConfig.animationDuration}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

/**
 * Snap legend component
 */
interface SnapLegendProps {
  visible: boolean;
  config?: Partial<SnapVisualConfig>;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const SnapLegend: React.FC<SnapLegendProps> = ({
  visible,
  config = {},
  position = 'top-right',
  className
}) => {
  const visualConfig = useMemo(() => ({
    ...DEFAULT_VISUAL_CONFIG,
    ...config
  }), [config]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "absolute z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-3",
          positionClasses[position],
          className
        )}
      >
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Snap Points</h4>
        <div className="space-y-2">
          {Object.entries(visualConfig.colors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 border-2 border-solid flex-shrink-0"
                style={{
                  backgroundColor: visualConfig.shapes[type as SnapPointType] === 'circle' || 
                                  visualConfig.shapes[type as SnapPointType] === 'square' ? color : 'transparent',
                  borderColor: color,
                  borderRadius: visualConfig.shapes[type as SnapPointType] === 'circle' ? '50%' : '0',
                  transform: visualConfig.shapes[type as SnapPointType] === 'diamond' ? 'rotate(45deg)' : 'none'
                }}
              />
              <span className="text-xs text-gray-700 capitalize">
                {type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Hold Ctrl to disable snapping
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Context menu for ambiguous snap points
 */
interface SnapContextMenuProps {
  snapPoints: SnapPoint[];
  position: { x: number; y: number };
  visible: boolean;
  onSelect: (snapPoint: SnapPoint) => void;
  onClose: () => void;
  className?: string;
}

export const SnapContextMenu: React.FC<SnapContextMenuProps> = ({
  snapPoints,
  position,
  visible,
  onSelect,
  onClose,
  className
}) => {
  if (!visible || snapPoints.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "absolute z-50 bg-white rounded-lg shadow-lg border py-1 min-w-32",
          className
        )}
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
          Multiple Snap Points
        </div>
        {snapPoints.map(snapPoint => (
          <button
            key={snapPoint.id}
            onClick={() => onSelect(snapPoint)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <div
              className="w-2 h-2 border border-solid flex-shrink-0"
              style={{
                backgroundColor: DEFAULT_VISUAL_CONFIG.colors[snapPoint.type],
                borderColor: DEFAULT_VISUAL_CONFIG.colors[snapPoint.type],
                borderRadius: DEFAULT_VISUAL_CONFIG.shapes[snapPoint.type] === 'circle' ? '50%' : '0'
              }}
            />
            <span className="capitalize">{snapPoint.type}</span>
            {snapPoint.elementType && (
              <span className="text-xs text-gray-500">
                ({snapPoint.elementType})
              </span>
            )}
          </button>
        ))}
        <div className="border-t">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
