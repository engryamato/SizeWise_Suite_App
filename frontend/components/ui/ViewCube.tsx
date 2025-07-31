"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  Home, 
  Maximize2,
  Eye,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ViewCubeProps {
  onViewChange?: (view: ViewType) => void;
  currentView?: ViewType;
  onResetView?: () => void;
  onFitToScreen?: () => void;
  className?: string;
}

export type ViewType = 
  | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
  | 'isometric' | 'isometric-top' | 'isometric-bottom'
  | 'perspective';

interface CubeFace {
  id: ViewType;
  label: string;
  position: string;
  rotation: { x: number; y: number; z: number };
  camera: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

const CUBE_FACES: CubeFace[] = [
  {
    id: 'front',
    label: 'Front',
    position: 'translate3d(0, 0, 50px)',
    rotation: { x: 0, y: 0, z: 0 },
    camera: { x: 0, y: 0, z: 100 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'back',
    label: 'Back',
    position: 'translate3d(0, 0, -50px) rotateY(180deg)',
    rotation: { x: 0, y: 180, z: 0 },
    camera: { x: 0, y: 0, z: -100 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'right',
    label: 'Right',
    position: 'translate3d(50px, 0, 0) rotateY(90deg)',
    rotation: { x: 0, y: 90, z: 0 },
    camera: { x: 100, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'left',
    label: 'Left',
    position: 'translate3d(-50px, 0, 0) rotateY(-90deg)',
    rotation: { x: 0, y: -90, z: 0 },
    camera: { x: -100, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'top',
    label: 'Top',
    position: 'translate3d(0, -50px, 0) rotateX(90deg)',
    rotation: { x: 90, y: 0, z: 0 },
    camera: { x: 0, y: 100, z: 0 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'bottom',
    label: 'Bottom',
    position: 'translate3d(0, 50px, 0) rotateX(-90deg)',
    rotation: { x: -90, y: 0, z: 0 },
    camera: { x: 0, y: -100, z: 0 },
    target: { x: 0, y: 0, z: 0 }
  }
];

const ISOMETRIC_VIEWS: CubeFace[] = [
  {
    id: 'isometric',
    label: 'ISO',
    position: 'translate3d(35px, -35px, 35px)',
    rotation: { x: -30, y: 45, z: 0 },
    camera: { x: 70, y: 70, z: 70 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'isometric-top',
    label: 'ISO↑',
    position: 'translate3d(35px, -35px, 35px)',
    rotation: { x: -45, y: 45, z: 0 },
    camera: { x: 50, y: 100, z: 50 },
    target: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'isometric-bottom',
    label: 'ISO↓',
    position: 'translate3d(35px, 35px, 35px)',
    rotation: { x: 45, y: 45, z: 0 },
    camera: { x: 50, y: -100, z: 50 },
    target: { x: 0, y: 0, z: 0 }
  }
];

export const ViewCube: React.FC<ViewCubeProps> = ({
  onViewChange,
  currentView = 'isometric',
  onResetView,
  onFitToScreen,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredFace, setHoveredFace] = useState<ViewType | null>(null);
  const [cubeRotation, setCubeRotation] = useState({ x: -30, y: 45, z: 0 });
  const cubeRef = useRef<HTMLDivElement>(null);

  // Update cube rotation based on current view
  useEffect(() => {
    const currentFace = [...CUBE_FACES, ...ISOMETRIC_VIEWS].find(face => face.id === currentView);
    if (currentFace) {
      setCubeRotation(currentFace.rotation);
    }
  }, [currentView]);

  const handleFaceClick = (face: CubeFace) => {
    onViewChange?.(face.id);
    setCubeRotation(face.rotation);
  };

  const handleReset = () => {
    onResetView?.();
    setCubeRotation({ x: -30, y: 45, z: 0 });
  };

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
          className={cn(
            "relative w-24 h-24",
            "bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md",
            "border border-white/20 dark:border-neutral-700/50",
            "rounded-xl shadow-lg transition-all duration-200",
            isHovered && "shadow-xl"
          )}
          style={{
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'center',
            perspective: '1000px'
          }}
        >
          {/* 3D Cube Container */}
          <motion.div
            ref={cubeRef}
            className="absolute inset-2"
            animate={{
              rotateX: cubeRotation.x,
              rotateY: cubeRotation.y,
              rotateZ: cubeRotation.z
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Cube Faces */}
            {CUBE_FACES.map((face) => (
              <motion.button
                key={face.id}
                className={cn(
                  "absolute w-full h-full flex items-center justify-center",
                  "text-xs font-medium transition-all duration-200",
                  "border border-white/30 dark:border-neutral-600/30",
                  "hover:bg-blue-500/30 hover:border-blue-400/50",
                  currentView === face.id 
                    ? "bg-blue-500/40 text-blue-100 border-blue-400/60" 
                    : "bg-white/20 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-300"
                )}
                style={{ transform: face.position }}
                onClick={() => handleFaceClick(face)}
                onMouseEnter={() => setHoveredFace(face.id)}
                onMouseLeave={() => setHoveredFace(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {face.label}
              </motion.button>
            ))}

            {/* Corner Isometric Views */}
            {ISOMETRIC_VIEWS.map((view, index) => (
              <motion.button
                key={view.id}
                className={cn(
                  "absolute w-4 h-4 flex items-center justify-center",
                  "text-xs font-bold transition-all duration-200 rounded-full",
                  "border border-orange-400/50",
                  "hover:bg-orange-500/40 hover:border-orange-400/70",
                  currentView === view.id 
                    ? "bg-orange-500/50 text-orange-100 border-orange-400/80" 
                    : "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                )}
                style={{
                  transform: view.position,
                  top: index === 0 ? '10%' : index === 1 ? '5%' : '85%',
                  right: index === 0 ? '10%' : index === 1 ? '5%' : '5%'
                }}
                onClick={() => handleFaceClick(view)}
                onMouseEnter={() => setHoveredFace(view.id)}
                onMouseLeave={() => setHoveredFace(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={`${view.label} View`}
              >
                {view.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredFace && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "absolute -bottom-8 left-1/2 -translate-x-1/2",
                  "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                  "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900",
                  "border border-neutral-700 dark:border-neutral-300"
                )}
              >
                {[...CUBE_FACES, ...ISOMETRIC_VIEWS].find(f => f.id === hoveredFace)?.label} View
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Control Buttons */}
        <div className="flex flex-col space-y-2">
          {/* Home/Reset View */}
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400"
            )}
            title="Reset to Home View"
          >
            <Home className="w-5 h-5" />
          </motion.button>

          {/* Fit to Screen */}
          <motion.button
            onClick={onFitToScreen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "text-neutral-700 dark:text-neutral-300 hover:text-green-600 dark:hover:text-green-400"
            )}
            title="Fit to Screen"
          >
            <Maximize2 className="w-5 h-5" />
          </motion.button>

          {/* View Compass */}
          <motion.div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "shadow-lg"
            )}
            animate={{ rotate: -cubeRotation.y }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            title="View Orientation Compass"
          >
            <Compass className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </motion.div>
        </div>

        {/* Current View Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            "bg-blue-500/20 text-blue-700 dark:text-blue-300",
            "border border-blue-500/30"
          )}
        >
          {[...CUBE_FACES, ...ISOMETRIC_VIEWS].find(f => f.id === currentView)?.label || 'Custom'} View
        </motion.div>
      </motion.div>
    </div>
  );
};
