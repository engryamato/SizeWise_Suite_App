"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'three';
import { 
  Home, 
  Maximize2,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewCubeOrientation, ViewCubeConfig, VIEWCUBE_SIZES } from '@/lib/viewcube/config';
import { VIEWCUBE_ORIENTATIONS } from '@/lib/viewcube/orientations';
import { useViewCubeController } from '@/lib/hooks/useViewCubeController';
import { getAdjacentOrientations, isOrthographicView } from '@/lib/viewcube/utils';

export interface ViewCubeProps {
  camera?: Camera | null;
  onViewChange?: (view: ViewCubeOrientation) => void;
  currentView?: ViewCubeOrientation;
  onResetView?: () => void;
  onFitToScreen?: () => void;
  className?: string;
  config?: Partial<ViewCubeConfig>;
}

// Re-export the comprehensive orientation type
export type { ViewCubeOrientation } from '@/lib/viewcube/config';

// Face component for rendering individual cube faces
interface CubeFaceProps {
  orientation: ViewCubeOrientation;
  isActive: boolean;
  isHovered: boolean;
  isClosest: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const CubeFace: React.FC<CubeFaceProps> = ({
  orientation,
  isActive,
  isHovered,
  isClosest,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const data = VIEWCUBE_ORIENTATIONS[orientation];
  if (!data) return null;

  const getStyleClasses = () => {
    const baseClasses = [
      "absolute flex items-center justify-center",
      "text-xs font-medium transition-all duration-200",
      "border cursor-pointer select-none"
    ];

    // Size based on type
    if (data.type === 'face') {
      baseClasses.push("w-full h-full");
    } else if (data.type === 'edge') {
      baseClasses.push("w-3 h-full", "text-[10px]");
    } else if (data.type === 'corner') {
      baseClasses.push("w-4 h-4 rounded-full", "text-[8px] font-bold");
    }

    // Color based on state
    if (isActive) {
      baseClasses.push(
        data.type === 'corner' 
          ? "bg-orange-500/50 text-orange-100 border-orange-400/80"
          : "bg-blue-500/40 text-blue-100 border-blue-400/60"
      );
    } else if (isHovered || isClosest) {
      baseClasses.push(
        data.type === 'corner'
          ? "bg-orange-500/40 text-orange-200 border-orange-400/70"
          : "bg-blue-500/30 text-blue-200 border-blue-400/50"
      );
    } else {
      baseClasses.push(
        data.type === 'corner'
          ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/50"
          : "bg-white/20 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-300 border-white/30 dark:border-neutral-600/30"
      );
    }

    return cn(baseClasses);
  };

  return (
    <motion.button
      className={getStyleClasses()}
      style={{
        transform: data.cssTransform,
        transformStyle: 'preserve-3d',
        ...data.hitRegion.size,
        top: data.hitRegion.offset.y,
        left: data.hitRegion.offset.x
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.98 }}
      title={`${data.label} - ${data.description}`}
    >
      {data.label}
    </motion.button>
  );
};

export const ViewCube: React.FC<ViewCubeProps> = ({
  camera,
  onViewChange,
  currentView = 'isometric',
  onResetView,
  onFitToScreen,
  className,
  config: userConfig = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredOrientation, setHoveredOrientation] = useState<ViewCubeOrientation | null>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  // Initialize ViewCube controller
  const controller = useViewCubeController({
    camera: camera || null,
    config: userConfig,
    onOrientationChange: useCallback((orientation: ViewCubeOrientation | null) => {
      if (orientation && onViewChange) {
        onViewChange(orientation);
      }
    }, [onViewChange]),
    onAnimationStart: () => {},
    onAnimationEnd: () => {}
  });

  const { config } = controller;
  const cubeSize = VIEWCUBE_SIZES[config.size];

  // Handle orientation click
  const handleOrientationClick = useCallback((orientation: ViewCubeOrientation) => {
    controller.setView(orientation, true);
  }, [controller]);

  // Handle drag events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!cubeRef.current) return;
    controller.startDrag(event, cubeRef.current);
  }, [controller]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!cubeRef.current) return;
    controller.updateDrag(event, cubeRef.current);
  }, [controller]);

  const handleMouseUp = useCallback(() => {
    controller.endDrag();
  }, [controller]);

  const handleReset = () => {
    controller.resetView();
    onResetView?.();
  };

  const handleFitToScreen = () => {
    controller.fitToScreen();
    onFitToScreen?.();
  };

  // Get all orientations to render
  const allOrientations = Object.keys(VIEWCUBE_ORIENTATIONS) as ViewCubeOrientation[];
  const faceOrientations = allOrientations.filter(o => VIEWCUBE_ORIENTATIONS[o].type === 'face');
  const edgeOrientations = allOrientations.filter(o => VIEWCUBE_ORIENTATIONS[o].type === 'edge');
  const cornerOrientations = allOrientations.filter(o => VIEWCUBE_ORIENTATIONS[o].type === 'corner');

  return (
    <div className={cn("fixed top-20 right-6 z-30", className)} data-component="view-cube">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-end space-y-3"
      >
        {/* Main View Cube */}
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={cn(
            "relative cursor-grab active:cursor-grabbing",
            "bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md",
            "border-2 transition-all duration-200",
            controller.isSnapped 
              ? "border-blue-400/60 shadow-blue-400/20" 
              : "border-dashed border-orange-400/60 shadow-orange-400/20",
            "rounded-xl shadow-lg",
            isHovered && "shadow-xl",
            controller.dragState.isDragging && "scale-105"
          )}
          style={{
            width: cubeSize.cube,
            height: cubeSize.cube,
            transformOrigin: 'center',
            perspective: '1000px'
          }}
        >
          {/* 3D Cube Container */}
          <motion.div
            ref={cubeRef}
            className="absolute inset-2 select-none"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: 'center'
            }}
          >
            {/* Render all face orientations */}
            {faceOrientations.map((orientation) => (
              <CubeFace
                key={orientation}
                orientation={orientation}
                isActive={controller.currentOrientation === orientation}
                isHovered={hoveredOrientation === orientation}
                isClosest={controller.closestOrientation === orientation}
                onClick={() => handleOrientationClick(orientation)}
                onMouseEnter={() => setHoveredOrientation(orientation)}
                onMouseLeave={() => setHoveredOrientation(null)}
              />
            ))}

            {/* Render edge orientations */}
            {edgeOrientations.map((orientation) => (
              <CubeFace
                key={orientation}
                orientation={orientation}
                isActive={controller.currentOrientation === orientation}
                isHovered={hoveredOrientation === orientation}
                isClosest={controller.closestOrientation === orientation}
                onClick={() => handleOrientationClick(orientation)}
                onMouseEnter={() => setHoveredOrientation(orientation)}
                onMouseLeave={() => setHoveredOrientation(null)}
              />
            ))}

            {/* Render corner orientations */}
            {cornerOrientations.map((orientation) => (
              <CubeFace
                key={orientation}
                orientation={orientation}
                isActive={controller.currentOrientation === orientation}
                isHovered={hoveredOrientation === orientation}
                isClosest={controller.closestOrientation === orientation}
                onClick={() => handleOrientationClick(orientation)}
                onMouseEnter={() => setHoveredOrientation(orientation)}
                onMouseLeave={() => setHoveredOrientation(null)}
              />
            ))}
          </motion.div>

          {/* Drag indicator */}
          <AnimatePresence>
            {controller.dragState.isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 border-2 border-dashed border-orange-400/80 rounded-xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Control Buttons */}
        <div className="flex flex-col space-y-2">
          <motion.button
            onClick={handleReset}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              "bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "hover:bg-white/20 dark:hover:bg-neutral-800/20",
              "text-neutral-700 dark:text-neutral-300"
            )}
            whileTap={{ scale: 0.95 }}
            title="Reset to default view"
          >
            <Home size={16} />
          </motion.button>

          <motion.button
            onClick={handleFitToScreen}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              "bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "hover:bg-white/20 dark:hover:bg-neutral-800/20",
              "text-neutral-700 dark:text-neutral-300"
            )}
            whileTap={{ scale: 0.95 }}
            title="Fit to screen"
          >
            <Maximize2 size={16} />
          </motion.button>

          {config.showCompass && (
            <motion.button
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md",
                "border border-white/20 dark:border-neutral-700/50",
                "text-neutral-700 dark:text-neutral-300"
              )}
              title="Compass"
            >
              <Compass size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
