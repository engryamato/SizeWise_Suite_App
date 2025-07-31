import { Vector3, Quaternion, Euler } from 'three';

export type ViewCubeOrientation = 
  // Face orientations (6)
  | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
  // Edge orientations (12)
  | 'front-top' | 'front-bottom' | 'front-left' | 'front-right'
  | 'back-top' | 'back-bottom' | 'back-left' | 'back-right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  // Corner orientations (8)
  | 'front-top-left' | 'front-top-right' | 'front-bottom-left' | 'front-bottom-right'
  | 'back-top-left' | 'back-top-right' | 'back-bottom-left' | 'back-bottom-right'
  // Special views
  | 'isometric' | 'perspective';

export interface ViewCubeOrientationData {
  id: ViewCubeOrientation;
  label: string;
  type: 'face' | 'edge' | 'corner' | 'special';
  position: Vector3;
  quaternion: Quaternion;
  euler: Euler;
  cameraDistance: number;
  description: string;
  // Visual properties for the cube face/region
  cssTransform: string;
  hitRegion: {
    type: 'face' | 'edge' | 'corner';
    size: { width: number; height: number };
    offset: { x: number; y: number };
  };
}

export interface ViewCubeConfig {
  // Visual settings
  size: 'tiny' | 'small' | 'normal' | 'large';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: {
    active: number;
    inactive: number;
  };
  
  // Behavior settings
  enableDragging: boolean;
  enableSnapping: boolean;
  snapThreshold: number; // degrees
  animationDuration: number; // milliseconds
  enableAnimations: boolean;
  
  // Camera settings
  keepUpright: boolean;
  fitToViewOnChange: boolean;
  defaultView: ViewCubeOrientation;
  
  // Advanced settings
  showCompass: boolean;
  showNavigationArrows: boolean;
  showRollControls: boolean;
  enableContextMenu: boolean;
}

// Default configuration following CAD industry standards
export const DEFAULT_VIEWCUBE_CONFIG: ViewCubeConfig = {
  size: 'normal',
  position: 'top-right',
  opacity: {
    active: 1.0,
    inactive: 0.6
  },
  enableDragging: true,
  enableSnapping: true,
  snapThreshold: 10, // degrees, matching Autodesk's default
  animationDuration: 500,
  enableAnimations: true,
  keepUpright: true,
  fitToViewOnChange: false,
  defaultView: 'isometric',
  showCompass: true,
  showNavigationArrows: true,
  showRollControls: true,
  enableContextMenu: true
};

// Size configurations
export const VIEWCUBE_SIZES = {
  tiny: { cube: 60, controls: 32 },
  small: { cube: 80, controls: 36 },
  normal: { cube: 96, controls: 40 },
  large: { cube: 120, controls: 48 }
};
