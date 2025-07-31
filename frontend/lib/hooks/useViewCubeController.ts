import { useRef, useCallback, useEffect, useState } from 'react';
import { Camera, Vector3, Quaternion } from 'three';
import { ViewCubeOrientation, ViewCubeConfig, DEFAULT_VIEWCUBE_CONFIG } from '../viewcube/config';
import { VIEWCUBE_ORIENTATIONS } from '../viewcube/orientations';
import {
  findClosestOrientation,
  getCameraQuaternion,
  calculateCameraPosition,
  slerpQuaternions,
  easeInOutCubic,
  calculateArcballRotation,
  mouseToViewCubeCoords
} from '../viewcube/utils';

export interface ViewCubeControllerOptions {
  camera: Camera | null;
  config?: Partial<ViewCubeConfig>;
  onOrientationChange?: (orientation: ViewCubeOrientation | null) => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export interface DragState {
  isDragging: boolean;
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  startQuaternion: Quaternion;
}

export const useViewCubeController = ({
  camera,
  config: userConfig = {},
  onOrientationChange,
  onAnimationStart,
  onAnimationEnd
}: ViewCubeControllerOptions) => {
  const config = { ...DEFAULT_VIEWCUBE_CONFIG, ...userConfig };
  
  // State
  const [currentOrientation, setCurrentOrientation] = useState<ViewCubeOrientation | null>(config.defaultView);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    startQuaternion: new Quaternion()
  });
  const [isSnapped, setIsSnapped] = useState(true);
  const [closestOrientation, setClosestOrientation] = useState<ViewCubeOrientation | null>(null);

  // Refs
  const animationRef = useRef<number | null>(null);
  const startQuaternion = useRef(new Quaternion());
  const targetQuaternion = useRef(new Quaternion());
  const startTime = useRef(0);

  // Update current orientation based on camera
  const updateCurrentOrientation = useCallback(() => {
    if (!camera) return;

    const cameraQuaternion = getCameraQuaternion(camera);
    const { orientation, distance } = findClosestOrientation(cameraQuaternion, config.snapThreshold);
    
    setClosestOrientation(orientation);
    
    // Only update current orientation if we're close enough and not dragging
    if (orientation && distance <= config.snapThreshold && !dragState.isDragging) {
      if (currentOrientation !== orientation) {
        setCurrentOrientation(orientation);
        onOrientationChange?.(orientation);
      }
      setIsSnapped(true);
    } else {
      setIsSnapped(false);
    }
  }, [camera, config.snapThreshold, currentOrientation, dragState.isDragging, onOrientationChange]);

  // Animate camera to target orientation
  const animateToOrientation = useCallback((
    targetOrientation: ViewCubeOrientation,
    duration: number = config.animationDuration
  ) => {
    if (!camera || isAnimating) return;

    const orientationData = VIEWCUBE_ORIENTATIONS[targetOrientation];
    if (!orientationData) return;

    setIsAnimating(true);
    onAnimationStart?.();

    // Calculate target position and quaternion
    const currentPosition = camera.position.clone();
    const currentQuaternion = getCameraQuaternion(camera);
    const targetPosition = calculateCameraPosition(targetOrientation, currentPosition.length());
    
    startQuaternion.current.copy(currentQuaternion);
    targetQuaternion.current.copy(orientationData.quaternion);
    startTime.current = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      // Interpolate position
      const newPosition = currentPosition.clone().lerp(targetPosition, easedProgress);
      camera.position.copy(newPosition);

      // Interpolate rotation
      const newQuaternion = slerpQuaternions(
        startQuaternion.current,
        targetQuaternion.current,
        easedProgress
      );
      camera.quaternion.copy(newQuaternion);

      // Apply "keep upright" rule if enabled
      if (config.keepUpright && targetOrientation !== 'bottom') {
        camera.up.set(0, 1, 0);
      }

      camera.updateMatrixWorld();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentOrientation(targetOrientation);
        onOrientationChange?.(targetOrientation);
        onAnimationEnd?.();
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [camera, config.animationDuration, config.keepUpright, isAnimating, onAnimationStart, onAnimationEnd, onOrientationChange]);

  // Set view to specific orientation
  const setView = useCallback((orientation: ViewCubeOrientation, animated: boolean = true) => {
    if (!camera) return;

    if (animated && config.enableAnimations) {
      animateToOrientation(orientation);
    } else {
      const orientationData = VIEWCUBE_ORIENTATIONS[orientation];
      if (!orientationData) return;

      const targetPosition = calculateCameraPosition(orientation, camera.position.length());
      camera.position.copy(targetPosition);
      camera.quaternion.copy(orientationData.quaternion);
      
      if (config.keepUpright && orientation !== 'bottom') {
        camera.up.set(0, 1, 0);
      }
      
      camera.updateMatrixWorld();
      setCurrentOrientation(orientation);
      onOrientationChange?.(orientation);
    }
  }, [camera, config.enableAnimations, config.keepUpright, animateToOrientation, onOrientationChange]);

  // Start drag operation
  const startDrag = useCallback((event: React.MouseEvent, cubeElement: HTMLElement) => {
    if (!camera || !config.enableDragging) return;

    const coords = mouseToViewCubeCoords(event.clientX, event.clientY, cubeElement);
    const cameraQuaternion = getCameraQuaternion(camera);

    setDragState({
      isDragging: true,
      startPoint: coords,
      currentPoint: coords,
      startQuaternion: cameraQuaternion.clone()
    });

    setIsSnapped(false);
  }, [camera, config.enableDragging]);

  // Update drag operation
  const updateDrag = useCallback((event: React.MouseEvent, cubeElement: HTMLElement) => {
    if (!dragState.isDragging || !camera) return;

    const coords = mouseToViewCubeCoords(event.clientX, event.clientY, cubeElement);
    
    // Calculate arcball rotation
    const rotation = calculateArcballRotation(dragState.startPoint, coords, 50);
    const newQuaternion = dragState.startQuaternion.clone().multiply(rotation);

    // Apply rotation to camera
    camera.quaternion.copy(newQuaternion);
    camera.updateMatrixWorld();

    // Check for snapping if enabled
    if (config.enableSnapping) {
      const { orientation, distance } = findClosestOrientation(newQuaternion, config.snapThreshold);
      if (orientation && distance <= config.snapThreshold) {
        const snapQuaternion = VIEWCUBE_ORIENTATIONS[orientation].quaternion;
        camera.quaternion.copy(snapQuaternion);
        setIsSnapped(true);
        setClosestOrientation(orientation);
      } else {
        setIsSnapped(false);
        setClosestOrientation(null);
      }
    }

    setDragState(prev => ({ ...prev, currentPoint: coords }));
  }, [dragState, camera, config.enableSnapping, config.snapThreshold]);

  // End drag operation
  const endDrag = useCallback(() => {
    if (!dragState.isDragging) return;

    setDragState({
      isDragging: false,
      startPoint: { x: 0, y: 0 },
      currentPoint: { x: 0, y: 0 },
      startQuaternion: new Quaternion()
    });

    // Update orientation after drag
    updateCurrentOrientation();
  }, [dragState.isDragging, updateCurrentOrientation]);

  // Reset to default view
  const resetView = useCallback(() => {
    setView(config.defaultView, true);
  }, [setView, config.defaultView]);

  // Fit camera to show all content
  const fitToScreen = useCallback(() => {
    if (!camera) return;
    
    // This would typically calculate bounds of all objects in scene
    // For now, we'll just reset to a reasonable distance
    const currentOrientation = getCurrentOrientation();
    if (currentOrientation) {
      const targetPosition = calculateCameraPosition(currentOrientation, 20);
      camera.position.copy(targetPosition);
      camera.updateMatrixWorld();
    }
  }, [camera]);

  // Get current orientation
  const getCurrentOrientation = useCallback((): ViewCubeOrientation | null => {
    return currentOrientation;
  }, [currentOrientation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    // State
    currentOrientation,
    isAnimating,
    isSnapped,
    closestOrientation,
    dragState,
    
    // Actions
    setView,
    resetView,
    fitToScreen,
    startDrag,
    updateDrag,
    endDrag,
    updateCurrentOrientation,
    getCurrentOrientation,
    
    // Utils
    config
  };
};
