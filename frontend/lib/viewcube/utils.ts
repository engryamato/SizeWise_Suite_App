import { Vector3, Quaternion, Euler, Camera } from 'three';
import { ViewCubeOrientation, ViewCubeOrientationData } from './config';
import { VIEWCUBE_ORIENTATIONS } from './orientations';

/**
 * Utility functions for ViewCube operations
 */

// Convert degrees to radians
export const degToRad = (degrees: number): number => degrees * Math.PI / 180;

// Convert radians to degrees
export const radToDeg = (radians: number): number => radians * 180 / Math.PI;

// Calculate angular distance between two quaternions in degrees
export const quaternionAngularDistance = (q1: Quaternion, q2: Quaternion): number => {
  const dot = Math.abs(q1.dot(q2));
  // Clamp to avoid numerical errors
  const clampedDot = Math.min(1, Math.max(-1, dot));
  return radToDeg(2 * Math.acos(clampedDot));
};

// Find the closest ViewCube orientation to a given quaternion
export const findClosestOrientation = (
  targetQuaternion: Quaternion,
  threshold: number = 15
): { orientation: ViewCubeOrientation | null; distance: number } => {
  let closestOrientation: ViewCubeOrientation | null = null;
  let minDistance = Infinity;

  for (const [key, data] of Object.entries(VIEWCUBE_ORIENTATIONS)) {
    const distance = quaternionAngularDistance(targetQuaternion, data.quaternion);
    if (distance < minDistance) {
      minDistance = distance;
      closestOrientation = key as ViewCubeOrientation;
    }
  }

  return {
    orientation: minDistance <= threshold ? closestOrientation : null,
    distance: minDistance
  };
};

// Extract camera orientation as quaternion
export const getCameraQuaternion = (camera: Camera): Quaternion => {
  const quaternion = new Quaternion();
  camera.getWorldQuaternion(quaternion);
  return quaternion;
};

// Calculate camera position for a given orientation and distance
export const calculateCameraPosition = (
  orientation: ViewCubeOrientation,
  distance: number = 15,
  target: Vector3 = new Vector3(0, 0, 0)
): Vector3 => {
  const data = VIEWCUBE_ORIENTATIONS[orientation];
  if (!data) {
    throw new Error(`Unknown orientation: ${orientation}`);
  }

  const direction = data.position.clone().normalize();
  return target.clone().add(direction.multiplyScalar(distance));
};

// Smooth quaternion interpolation (SLERP)
export const slerpQuaternions = (
  from: Quaternion,
  to: Quaternion,
  t: number
): Quaternion => {
  const result = new Quaternion();
  return result.slerpQuaternions(from, to, t);
};

// Easing function for smooth animations
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Check if a point is within a rectangular region
export const isPointInRegion = (
  point: { x: number; y: number },
  region: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= region.x &&
    point.x <= region.x + region.width &&
    point.y >= region.y &&
    point.y <= region.y + region.height
  );
};

// Convert mouse position to ViewCube local coordinates
export const mouseToViewCubeCoords = (
  mouseX: number,
  mouseY: number,
  cubeElement: HTMLElement
): { x: number; y: number } => {
  const rect = cubeElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  return {
    x: mouseX - centerX,
    y: mouseY - centerY
  };
};

// Arcball rotation calculation
export const calculateArcballRotation = (
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number },
  radius: number = 1
): Quaternion => {
  // Project 2D points onto sphere
  const projectToSphere = (x: number, y: number): Vector3 => {
    const length = Math.sqrt(x * x + y * y);
    if (length <= radius * 0.70710678118654752440) {
      // Inside sphere
      return new Vector3(x, y, Math.sqrt(radius * radius - length * length));
    } else {
      // On hyperbola
      const t = radius / 1.41421356237309504880;
      return new Vector3(x, y, t * t / length);
    }
  };

  const startVector = projectToSphere(startPoint.x / radius, startPoint.y / radius);
  const currentVector = projectToSphere(currentPoint.x / radius, currentPoint.y / radius);

  // Calculate rotation axis and angle
  const axis = new Vector3().crossVectors(startVector, currentVector);
  const angle = Math.acos(Math.max(-1, Math.min(1, startVector.dot(currentVector))));

  if (axis.length() === 0) {
    return new Quaternion(); // No rotation
  }

  axis.normalize();
  return new Quaternion().setFromAxisAngle(axis, angle);
};

// Get all orientations of a specific type
export const getOrientationsByType = (
  type: 'face' | 'edge' | 'corner' | 'special'
): ViewCubeOrientationData[] => {
  return Object.values(VIEWCUBE_ORIENTATIONS).filter(data => data.type === type);
};

// Check if an orientation is a standard orthographic view
export const isOrthographicView = (orientation: ViewCubeOrientation): boolean => {
  const orthographicViews: ViewCubeOrientation[] = [
    'front', 'back', 'left', 'right', 'top', 'bottom'
  ];
  return orthographicViews.includes(orientation);
};

// Get adjacent orientations for navigation arrows (only for face orientations)
export const getAdjacentOrientations = (
  orientation: ViewCubeOrientation
): { up?: ViewCubeOrientation; down?: ViewCubeOrientation; left?: ViewCubeOrientation; right?: ViewCubeOrientation } => {
  const adjacentMap: Partial<Record<ViewCubeOrientation, any>> = {
    'front': { up: 'top', down: 'bottom', left: 'left', right: 'right' },
    'back': { up: 'top', down: 'bottom', left: 'right', right: 'left' },
    'left': { up: 'top', down: 'bottom', left: 'back', right: 'front' },
    'right': { up: 'top', down: 'bottom', left: 'front', right: 'back' },
    'top': { up: 'back', down: 'front', left: 'left', right: 'right' },
    'bottom': { up: 'front', down: 'back', left: 'left', right: 'right' }
  };

  return adjacentMap[orientation] || {};
};

// Validate ViewCube configuration
export const validateViewCubeConfig = (config: any): boolean => {
  const requiredFields = ['size', 'position', 'opacity', 'enableDragging', 'enableSnapping'];
  return requiredFields.every(field => field in config);
};
