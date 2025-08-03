/**
 * Canvas3D Controls Component
 * SizeWise Suite - Phase 5: Architecture Modernization
 * 
 * Camera and interaction controls extracted from Canvas3D.tsx
 */

"use client";

import React, { useRef, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { useCameraController } from '@/lib/hooks/useCameraController';
import { CameraState } from '../types/Canvas3DTypes';

interface Canvas3DControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  target?: Vector3;
  onCameraChange?: (position: Vector3, target: Vector3) => void;
  onControlStart?: () => void;
  onControlEnd?: () => void;
}

// Enhanced orbit controls with custom functionality
const EnhancedOrbitControls: React.FC<Canvas3DControlsProps> = ({
  enablePan = true,
  enableZoom = true,
  enableRotate = true,
  dampingFactor = 0.05,
  minDistance = 1,
  maxDistance = 100,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI,
  autoRotate = false,
  autoRotateSpeed = 2.0,
  target,
  onCameraChange,
  onControlStart,
  onControlEnd
}) => {
  const controlsRef = useRef<any>();
  const { camera } = useThree();
  const lastCameraState = useRef<CameraState>({
    position: camera.position.clone(),
    target: new Vector3(),
    zoom: camera.zoom
  });

  // Handle camera change events
  const handleChange = useCallback(() => {
    if (controlsRef.current && onCameraChange) {
      const controls = controlsRef.current;
      const newPosition = camera.position.clone();
      const newTarget = controls.target.clone();
      
      // Only trigger callback if position or target changed significantly
      const positionChanged = newPosition.distanceTo(lastCameraState.current.position) > 0.01;
      const targetChanged = newTarget.distanceTo(lastCameraState.current.target) > 0.01;
      
      if (positionChanged || targetChanged) {
        onCameraChange(newPosition, newTarget);
        lastCameraState.current = {
          position: newPosition,
          target: newTarget,
          zoom: camera.zoom
        };
      }
    }
  }, [camera, onCameraChange]);

  // Handle control start
  const handleControlStart = useCallback(() => {
    if (onControlStart) {
      onControlStart();
    }
  }, [onControlStart]);

  // Handle control end
  const handleControlEnd = useCallback(() => {
    if (onControlEnd) {
      onControlEnd();
    }
  }, [onControlEnd]);

  // Update target if provided
  React.useEffect(() => {
    if (controlsRef.current && target) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [target]);

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableRotate={enableRotate}
      enableDamping={true}
      dampingFactor={dampingFactor}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      onChange={handleChange}
      onStart={handleControlStart}
      onEnd={handleControlEnd}
    />
  );
};

// Camera animation controller
interface CameraAnimationProps {
  targetPosition?: Vector3;
  targetLookAt?: Vector3;
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

const CameraAnimation: React.FC<CameraAnimationProps> = ({
  targetPosition,
  targetLookAt,
  duration = 1000,
  easing = (t: number) => t * t * (3 - 2 * t), // Smooth step
  onComplete
}) => {
  const { camera } = useThree();
  const animationRef = useRef<{
    startTime: number;
    startPosition: Vector3;
    startLookAt: Vector3;
    isAnimating: boolean;
  } | null>(null);

  // Initialize animation
  React.useEffect(() => {
    if (targetPosition || targetLookAt) {
      animationRef.current = {
        startTime: Date.now(),
        startPosition: camera.position.clone(),
        startLookAt: new Vector3(0, 0, 0), // Get current look-at from controls if available
        isAnimating: true
      };
    }
  }, [targetPosition, targetLookAt, camera]);

  // Animation frame
  useFrame(() => {
    if (!animationRef.current?.isAnimating) return;

    const elapsed = Date.now() - animationRef.current.startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    if (targetPosition) {
      camera.position.lerpVectors(
        animationRef.current.startPosition,
        targetPosition,
        easedProgress
      );
    }

    if (targetLookAt) {
      // Update camera look-at if needed
      camera.lookAt(
        animationRef.current.startLookAt.clone().lerp(targetLookAt, easedProgress)
      );
    }

    if (progress >= 1) {
      animationRef.current.isAnimating = false;
      if (onComplete) {
        onComplete();
      }
    }
  });

  return null;
};

// Predefined camera positions
export const CAMERA_PRESETS = {
  ISOMETRIC: {
    position: new Vector3(10, 10, 10),
    target: new Vector3(0, 0, 0)
  },
  TOP: {
    position: new Vector3(0, 20, 0),
    target: new Vector3(0, 0, 0)
  },
  FRONT: {
    position: new Vector3(0, 0, 20),
    target: new Vector3(0, 0, 0)
  },
  SIDE: {
    position: new Vector3(20, 0, 0),
    target: new Vector3(0, 0, 0)
  },
  PERSPECTIVE: {
    position: new Vector3(15, 8, 15),
    target: new Vector3(0, 0, 0)
  }
};

// Camera preset controller
interface CameraPresetControllerProps {
  preset?: keyof typeof CAMERA_PRESETS;
  onPresetChange?: (preset: keyof typeof CAMERA_PRESETS) => void;
}

const CameraPresetController: React.FC<CameraPresetControllerProps> = ({
  preset,
  onPresetChange
}) => {
  const { camera } = useThree();
  const [currentPreset, setCurrentPreset] = React.useState<keyof typeof CAMERA_PRESETS | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Apply preset
  const applyPreset = useCallback((presetName: keyof typeof CAMERA_PRESETS) => {
    const presetData = CAMERA_PRESETS[presetName];
    if (!presetData) return;

    setIsAnimating(true);
    setCurrentPreset(presetName);
    
    if (onPresetChange) {
      onPresetChange(presetName);
    }
  }, [onPresetChange]);

  // Handle preset prop changes
  React.useEffect(() => {
    if (preset && preset !== currentPreset && !isAnimating) {
      applyPreset(preset);
    }
  }, [preset, currentPreset, isAnimating, applyPreset]);

  return (
    <>
      {currentPreset && (
        <CameraAnimation
          targetPosition={CAMERA_PRESETS[currentPreset].position}
          targetLookAt={CAMERA_PRESETS[currentPreset].target}
          duration={1000}
          onComplete={() => setIsAnimating(false)}
        />
      )}
    </>
  );
};

// Main Canvas3D Controls component
export const Canvas3DControls: React.FC<Canvas3DControlsProps & {
  preset?: keyof typeof CAMERA_PRESETS;
  onPresetChange?: (preset: keyof typeof CAMERA_PRESETS) => void;
  animationDuration?: number;
  children?: React.ReactNode;
}> = ({
  preset,
  onPresetChange,
  animationDuration = 1000,
  children,
  ...controlProps
}) => {
  return (
    <>
      {/* Enhanced Orbit Controls */}
      <EnhancedOrbitControls {...controlProps} />
      
      {/* Camera Preset Controller */}
      <CameraPresetController
        preset={preset}
        onPresetChange={onPresetChange}
      />
      
      {/* Additional children */}
      {children}
    </>
  );
};

// Camera utilities
export const CameraUtils = {
  /**
   * Calculate optimal camera position to frame objects
   */
  calculateFramingPosition: (
    objects: Array<{ position: Vector3; size?: Vector3 }>,
    camera: any,
    padding: number = 1.2
  ): { position: Vector3; target: Vector3 } => {
    if (objects.length === 0) {
      return {
        position: new Vector3(10, 10, 10),
        target: new Vector3(0, 0, 0)
      };
    }

    // Calculate bounding box
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);

    objects.forEach(obj => {
      const size = obj.size || new Vector3(1, 1, 1);
      const halfSize = size.clone().multiplyScalar(0.5);
      
      min.min(obj.position.clone().sub(halfSize));
      max.max(obj.position.clone().add(halfSize));
    });

    // Calculate center and size
    const center = min.clone().add(max).multiplyScalar(0.5);
    const size = max.clone().sub(min);
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Calculate camera distance
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDimension / 2) / Math.tan(fov / 2) * padding;

    // Position camera at optimal distance
    const position = center.clone().add(new Vector3(distance, distance, distance));

    return {
      position,
      target: center
    };
  },

  /**
   * Get camera state
   */
  getCameraState: (camera: any, controls?: any): CameraState => {
    return {
      position: camera.position.clone(),
      target: controls?.target?.clone() || new Vector3(),
      zoom: camera.zoom
    };
  },

  /**
   * Set camera state
   */
  setCameraState: (camera: any, controls: any, state: CameraState) => {
    camera.position.copy(state.position);
    camera.zoom = state.zoom;
    if (controls?.target) {
      controls.target.copy(state.target);
      controls.update();
    }
  },

  /**
   * Animate camera to state
   */
  animateToState: (
    camera: any,
    controls: any,
    targetState: CameraState,
    duration: number = 1000,
    onComplete?: () => void
  ) => {
    // This would be implemented with a proper animation system
    // For now, just set the state directly
    CameraUtils.setCameraState(camera, controls, targetState);
    if (onComplete) {
      setTimeout(onComplete, duration);
    }
  }
};
