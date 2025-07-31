import { useRef, useCallback, useEffect } from 'react';
import { Camera, Vector3, PerspectiveCamera, OrthographicCamera } from 'three';
import { ViewCubeOrientation } from '@/components/ui/ViewCube';
import { VIEWCUBE_ORIENTATIONS } from '@/lib/viewcube/orientations';
import { calculateCameraPosition } from '@/lib/viewcube/utils';

// Legacy ViewType for backward compatibility
export type ViewType = ViewCubeOrientation;

export interface CameraPosition {
  position: Vector3;
  target: Vector3;
  up?: Vector3;
}

export interface CameraControllerOptions {
  animationDuration?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
}

export const useCameraController = (
  camera: Camera | null,
  options: CameraControllerOptions = {}
) => {
  const {
    animationDuration = 1000,
    enableDamping = true,
    dampingFactor = 0.05,
    enableZoom = true,
    enablePan = true,
    enableRotate = true
  } = options;

  const animationRef = useRef<number | null>(null);
  const startPosition = useRef<Vector3>(new Vector3());
  const startTarget = useRef<Vector3>(new Vector3());
  const targetPosition = useRef<Vector3>(new Vector3());
  const targetLookAt = useRef<Vector3>(new Vector3());
  const animationStartTime = useRef<number>(0);

  // Get camera position for any ViewCube orientation
  const getViewPosition = useCallback((view: ViewType): CameraPosition => {
    const distance = 50;
    const orientationData = VIEWCUBE_ORIENTATIONS[view];

    if (!orientationData) {
      // Fallback to isometric if orientation not found
      const isoData = VIEWCUBE_ORIENTATIONS['isometric'];
      return {
        position: isoData.position.clone().multiplyScalar(distance),
        target: new Vector3(0, 0, 0)
      };
    }

    // Use the orientation's predefined position scaled to our distance
    const position = orientationData.position.clone().multiplyScalar(distance);
    const target = new Vector3(0, 0, 0);

    // Special handling for top/bottom views to maintain proper up vector
    let up: Vector3 | undefined;
    if (view === 'top') {
      up = new Vector3(0, 0, -1);
    } else if (view === 'bottom') {
      up = new Vector3(0, 0, 1);
    }

    return { position, target, up };
  }, []);

  // Smooth camera animation
  const animateCamera = useCallback((
    fromPos: Vector3,
    toPos: Vector3,
    fromTarget: Vector3,
    toTarget: Vector3,
    duration: number = animationDuration,
    onComplete?: () => void
  ) => {
    if (!camera) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startPosition.current.copy(fromPos);
    targetPosition.current.copy(toPos);
    startTarget.current.copy(fromTarget);
    targetLookAt.current.copy(toTarget);
    animationStartTime.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - animationStartTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate position
      const currentPos = new Vector3().lerpVectors(
        startPosition.current,
        targetPosition.current,
        easeProgress
      );

      // Interpolate target
      const currentTarget = new Vector3().lerpVectors(
        startTarget.current,
        targetLookAt.current,
        easeProgress
      );

      // Update camera
      camera.position.copy(currentPos);
      camera.lookAt(currentTarget);
      // @ts-ignore
      camera.updateProjectionMatrix && camera.updateProjectionMatrix();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [camera, animationDuration]);

  // Set camera to specific view
  const setView = useCallback((view: ViewType, animated: boolean = true) => {
    if (!camera) return;

    const viewPosition = getViewPosition(view);
    const currentPos = camera.position.clone();
    const currentTarget = new Vector3(0, 0, 0); // Assume looking at origin

    if (animated) {
      animateCamera(
        currentPos,
        viewPosition.position,
        currentTarget,
        viewPosition.target
      );
    } else {
      camera.position.copy(viewPosition.position);
      camera.lookAt(viewPosition.target);
      if (viewPosition.up) {
        camera.up.copy(viewPosition.up);
      }
      // @ts-ignore
      camera.updateProjectionMatrix && camera.updateProjectionMatrix();
    }
  }, [camera, getViewPosition, animateCamera]);

  // Reset camera to default isometric view
  const resetView = useCallback(() => {
    setView('isometric', true);
  }, [setView]);

  // Fit camera to show all objects in scene
  const fitToScreen = useCallback((
    boundingBox?: { min: Vector3; max: Vector3 },
    padding: number = 1.2
  ) => {
    if (!camera) return;

    // Default bounding box if none provided
    const box = boundingBox || {
      min: new Vector3(-10, -10, -10),
      max: new Vector3(10, 10, 10)
    };

    const center = new Vector3().addVectors(box.min, box.max).multiplyScalar(0.5);
    const size = new Vector3().subVectors(box.max, box.min);
    const maxDim = Math.max(size.x, size.y, size.z);

    let distance = maxDim * padding;

    if (camera instanceof PerspectiveCamera) {
      const fov = camera.fov * (Math.PI / 180);
      distance = maxDim / (2 * Math.tan(fov / 2)) * padding;
    }

    // Maintain current view direction but adjust distance
    const direction = new Vector3().subVectors(camera.position, center).normalize();
    const newPosition = center.clone().add(direction.multiplyScalar(distance));

    animateCamera(
      camera.position.clone(),
      newPosition,
      center.clone(),
      center.clone()
    );
  }, [camera, animateCamera]);

  // Get current view type based on camera position
  const getCurrentView = useCallback((): ViewType => {
    if (!camera) return 'isometric';

    const position = camera.position.clone().normalize();
    const threshold = 0.8;

    // Check for orthogonal views
    if (Math.abs(position.z) > threshold) {
      return position.z > 0 ? 'front' : 'back';
    }
    if (Math.abs(position.x) > threshold) {
      return position.x > 0 ? 'right' : 'left';
    }
    if (Math.abs(position.y) > threshold) {
      return position.y > 0 ? 'top' : 'bottom';
    }

    // Check for isometric views
    const isometricThreshold = 0.4;
    if (
      Math.abs(position.x) > isometricThreshold &&
      Math.abs(position.y) > isometricThreshold &&
      Math.abs(position.z) > isometricThreshold
    ) {
      if (position.y > 0.6) return 'front-top-right';
      if (position.y < -0.6) return 'front-bottom-right';
      return 'isometric';
    }

    return 'perspective';
  }, [camera]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    setView,
    resetView,
    fitToScreen,
    getCurrentView,
    getViewPosition,
    animateCamera,
    isAnimating: animationRef.current !== null
  };
};
