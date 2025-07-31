import { Vector3, Quaternion, Euler } from 'three';
import { ViewCubeOrientation, ViewCubeOrientationData } from './config';

// Helper function to create quaternion from euler angles
const createQuaternion = (x: number, y: number, z: number): Quaternion => {
  return new Quaternion().setFromEuler(new Euler(x * Math.PI / 180, y * Math.PI / 180, z * Math.PI / 180));
};

// Helper function to create camera position at specified distance
const createCameraPosition = (x: number, y: number, z: number, distance: number = 15): Vector3 => {
  return new Vector3(x, y, z).normalize().multiplyScalar(distance);
};

// All 26 ViewCube orientations with precise mathematical definitions
export const VIEWCUBE_ORIENTATIONS: Record<ViewCubeOrientation, ViewCubeOrientationData> = {
  // === FACE ORIENTATIONS (6) ===
  'front': {
    id: 'front',
    label: 'Front',
    type: 'face',
    position: createCameraPosition(0, 0, 1),
    quaternion: createQuaternion(0, 0, 0),
    euler: new Euler(0, 0, 0),
    cameraDistance: 15,
    description: 'Front orthographic view',
    cssTransform: 'translate3d(0, 0, 48px)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },
  
  'back': {
    id: 'back',
    label: 'Back',
    type: 'face',
    position: createCameraPosition(0, 0, -1),
    quaternion: createQuaternion(0, 180, 0),
    euler: new Euler(0, Math.PI, 0),
    cameraDistance: 15,
    description: 'Back orthographic view',
    cssTransform: 'translate3d(0, 0, -48px) rotateY(180deg)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },
  
  'right': {
    id: 'right',
    label: 'Right',
    type: 'face',
    position: createCameraPosition(1, 0, 0),
    quaternion: createQuaternion(0, 90, 0),
    euler: new Euler(0, Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Right orthographic view',
    cssTransform: 'translate3d(48px, 0, 0) rotateY(90deg)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },
  
  'left': {
    id: 'left',
    label: 'Left',
    type: 'face',
    position: createCameraPosition(-1, 0, 0),
    quaternion: createQuaternion(0, -90, 0),
    euler: new Euler(0, -Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Left orthographic view',
    cssTransform: 'translate3d(-48px, 0, 0) rotateY(-90deg)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },
  
  'top': {
    id: 'top',
    label: 'Top',
    type: 'face',
    position: createCameraPosition(0, 1, 0),
    quaternion: createQuaternion(-90, 0, 0),
    euler: new Euler(-Math.PI / 2, 0, 0),
    cameraDistance: 15,
    description: 'Top orthographic view',
    cssTransform: 'translate3d(0, -48px, 0) rotateX(90deg)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },
  
  'bottom': {
    id: 'bottom',
    label: 'Bottom',
    type: 'face',
    position: createCameraPosition(0, -1, 0),
    quaternion: createQuaternion(90, 0, 0),
    euler: new Euler(Math.PI / 2, 0, 0),
    cameraDistance: 15,
    description: 'Bottom orthographic view',
    cssTransform: 'translate3d(0, 48px, 0) rotateX(-90deg)',
    hitRegion: { type: 'face', size: { width: 96, height: 96 }, offset: { x: 0, y: 0 } }
  },

  // === EDGE ORIENTATIONS (12) ===
  'front-top': {
    id: 'front-top',
    label: 'Front-Top',
    type: 'edge',
    position: createCameraPosition(0, 0.707, 0.707),
    quaternion: createQuaternion(-45, 0, 0),
    euler: new Euler(-Math.PI / 4, 0, 0),
    cameraDistance: 15,
    description: 'Front-top edge view',
    cssTransform: 'translate3d(0, -24px, 24px) rotateX(45deg)',
    hitRegion: { type: 'edge', size: { width: 96, height: 12 }, offset: { x: 0, y: -42 } }
  },
  
  'front-bottom': {
    id: 'front-bottom',
    label: 'Front-Bottom',
    type: 'edge',
    position: createCameraPosition(0, -0.707, 0.707),
    quaternion: createQuaternion(45, 0, 0),
    euler: new Euler(Math.PI / 4, 0, 0),
    cameraDistance: 15,
    description: 'Front-bottom edge view',
    cssTransform: 'translate3d(0, 24px, 24px) rotateX(-45deg)',
    hitRegion: { type: 'edge', size: { width: 96, height: 12 }, offset: { x: 0, y: 42 } }
  },
  
  'front-left': {
    id: 'front-left',
    label: 'Front-Left',
    type: 'edge',
    position: createCameraPosition(-0.707, 0, 0.707),
    quaternion: createQuaternion(0, -45, 0),
    euler: new Euler(0, -Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-left edge view',
    cssTransform: 'translate3d(-24px, 0, 24px) rotateY(-45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: -42, y: 0 } }
  },
  
  'front-right': {
    id: 'front-right',
    label: 'Front-Right',
    type: 'edge',
    position: createCameraPosition(0.707, 0, 0.707),
    quaternion: createQuaternion(0, 45, 0),
    euler: new Euler(0, Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-right edge view',
    cssTransform: 'translate3d(24px, 0, 24px) rotateY(45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: 42, y: 0 } }
  },

  'back-top': {
    id: 'back-top',
    label: 'Back-Top',
    type: 'edge',
    position: createCameraPosition(0, 0.707, -0.707),
    quaternion: createQuaternion(-45, 180, 0),
    euler: new Euler(-Math.PI / 4, Math.PI, 0),
    cameraDistance: 15,
    description: 'Back-top edge view',
    cssTransform: 'translate3d(0, -24px, -24px) rotateX(45deg) rotateY(180deg)',
    hitRegion: { type: 'edge', size: { width: 96, height: 12 }, offset: { x: 0, y: -42 } }
  },

  'back-bottom': {
    id: 'back-bottom',
    label: 'Back-Bottom',
    type: 'edge',
    position: createCameraPosition(0, -0.707, -0.707),
    quaternion: createQuaternion(45, 180, 0),
    euler: new Euler(Math.PI / 4, Math.PI, 0),
    cameraDistance: 15,
    description: 'Back-bottom edge view',
    cssTransform: 'translate3d(0, 24px, -24px) rotateX(-45deg) rotateY(180deg)',
    hitRegion: { type: 'edge', size: { width: 96, height: 12 }, offset: { x: 0, y: 42 } }
  },

  'back-left': {
    id: 'back-left',
    label: 'Back-Left',
    type: 'edge',
    position: createCameraPosition(-0.707, 0, -0.707),
    quaternion: createQuaternion(0, -135, 0),
    euler: new Euler(0, -3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-left edge view',
    cssTransform: 'translate3d(-24px, 0, -24px) rotateY(-135deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: -42, y: 0 } }
  },

  'back-right': {
    id: 'back-right',
    label: 'Back-Right',
    type: 'edge',
    position: createCameraPosition(0.707, 0, -0.707),
    quaternion: createQuaternion(0, 135, 0),
    euler: new Euler(0, 3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-right edge view',
    cssTransform: 'translate3d(24px, 0, -24px) rotateY(135deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: 42, y: 0 } }
  },

  'top-left': {
    id: 'top-left',
    label: 'Top-Left',
    type: 'edge',
    position: createCameraPosition(-0.707, 0.707, 0),
    quaternion: createQuaternion(-45, -90, 0),
    euler: new Euler(-Math.PI / 4, -Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Top-left edge view',
    cssTransform: 'translate3d(-24px, -24px, 0) rotateY(-90deg) rotateX(45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: -42, y: 0 } }
  },

  'top-right': {
    id: 'top-right',
    label: 'Top-Right',
    type: 'edge',
    position: createCameraPosition(0.707, 0.707, 0),
    quaternion: createQuaternion(-45, 90, 0),
    euler: new Euler(-Math.PI / 4, Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Top-right edge view',
    cssTransform: 'translate3d(24px, -24px, 0) rotateY(90deg) rotateX(45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: 42, y: 0 } }
  },

  'bottom-left': {
    id: 'bottom-left',
    label: 'Bottom-Left',
    type: 'edge',
    position: createCameraPosition(-0.707, -0.707, 0),
    quaternion: createQuaternion(45, -90, 0),
    euler: new Euler(Math.PI / 4, -Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Bottom-left edge view',
    cssTransform: 'translate3d(-24px, 24px, 0) rotateY(-90deg) rotateX(-45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: -42, y: 0 } }
  },

  'bottom-right': {
    id: 'bottom-right',
    label: 'Bottom-Right',
    type: 'edge',
    position: createCameraPosition(0.707, -0.707, 0),
    quaternion: createQuaternion(45, 90, 0),
    euler: new Euler(Math.PI / 4, Math.PI / 2, 0),
    cameraDistance: 15,
    description: 'Bottom-right edge view',
    cssTransform: 'translate3d(24px, 24px, 0) rotateY(90deg) rotateX(-45deg)',
    hitRegion: { type: 'edge', size: { width: 12, height: 96 }, offset: { x: 42, y: 0 } }
  },

  // === CORNER ORIENTATIONS (8) ===
  'front-top-left': {
    id: 'front-top-left',
    label: 'FTL',
    type: 'corner',
    position: createCameraPosition(-0.577, 0.577, 0.577),
    quaternion: createQuaternion(-35.26, -45, 0),
    euler: new Euler(-35.26 * Math.PI / 180, -Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-top-left corner isometric view',
    cssTransform: 'translate3d(-17px, -17px, 17px) rotateY(-45deg) rotateX(35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: -40, y: -40 } }
  },

  'front-top-right': {
    id: 'front-top-right',
    label: 'FTR',
    type: 'corner',
    position: createCameraPosition(0.577, 0.577, 0.577),
    quaternion: createQuaternion(-35.26, 45, 0),
    euler: new Euler(-35.26 * Math.PI / 180, Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-top-right corner isometric view',
    cssTransform: 'translate3d(17px, -17px, 17px) rotateY(45deg) rotateX(35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: 40, y: -40 } }
  },

  'front-bottom-left': {
    id: 'front-bottom-left',
    label: 'FBL',
    type: 'corner',
    position: createCameraPosition(-0.577, -0.577, 0.577),
    quaternion: createQuaternion(35.26, -45, 0),
    euler: new Euler(35.26 * Math.PI / 180, -Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-bottom-left corner isometric view',
    cssTransform: 'translate3d(-17px, 17px, 17px) rotateY(-45deg) rotateX(-35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: -40, y: 40 } }
  },

  'front-bottom-right': {
    id: 'front-bottom-right',
    label: 'FBR',
    type: 'corner',
    position: createCameraPosition(0.577, -0.577, 0.577),
    quaternion: createQuaternion(35.26, 45, 0),
    euler: new Euler(35.26 * Math.PI / 180, Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Front-bottom-right corner isometric view',
    cssTransform: 'translate3d(17px, 17px, 17px) rotateY(45deg) rotateX(-35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: 40, y: 40 } }
  },

  'back-top-left': {
    id: 'back-top-left',
    label: 'BTL',
    type: 'corner',
    position: createCameraPosition(-0.577, 0.577, -0.577),
    quaternion: createQuaternion(-35.26, -135, 0),
    euler: new Euler(-35.26 * Math.PI / 180, -3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-top-left corner isometric view',
    cssTransform: 'translate3d(-17px, -17px, -17px) rotateY(-135deg) rotateX(35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: -40, y: -40 } }
  },

  'back-top-right': {
    id: 'back-top-right',
    label: 'BTR',
    type: 'corner',
    position: createCameraPosition(0.577, 0.577, -0.577),
    quaternion: createQuaternion(-35.26, 135, 0),
    euler: new Euler(-35.26 * Math.PI / 180, 3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-top-right corner isometric view',
    cssTransform: 'translate3d(17px, -17px, -17px) rotateY(135deg) rotateX(35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: 40, y: -40 } }
  },

  'back-bottom-left': {
    id: 'back-bottom-left',
    label: 'BBL',
    type: 'corner',
    position: createCameraPosition(-0.577, -0.577, -0.577),
    quaternion: createQuaternion(35.26, -135, 0),
    euler: new Euler(35.26 * Math.PI / 180, -3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-bottom-left corner isometric view',
    cssTransform: 'translate3d(-17px, 17px, -17px) rotateY(-135deg) rotateX(-35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: -40, y: 40 } }
  },

  'back-bottom-right': {
    id: 'back-bottom-right',
    label: 'BBR',
    type: 'corner',
    position: createCameraPosition(0.577, -0.577, -0.577),
    quaternion: createQuaternion(35.26, 135, 0),
    euler: new Euler(35.26 * Math.PI / 180, 3 * Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Back-bottom-right corner isometric view',
    cssTransform: 'translate3d(17px, 17px, -17px) rotateY(135deg) rotateX(-35.26deg)',
    hitRegion: { type: 'corner', size: { width: 16, height: 16 }, offset: { x: 40, y: 40 } }
  },

  // === SPECIAL VIEWS (2) ===
  'isometric': {
    id: 'isometric',
    label: 'ISO',
    type: 'special',
    position: createCameraPosition(0.577, 0.577, 0.577),
    quaternion: createQuaternion(-35.26, 45, 0),
    euler: new Euler(-35.26 * Math.PI / 180, Math.PI / 4, 0),
    cameraDistance: 15,
    description: 'Standard isometric view',
    cssTransform: 'translate3d(17px, -17px, 17px) rotateY(45deg) rotateX(35.26deg)',
    hitRegion: { type: 'corner', size: { width: 20, height: 20 }, offset: { x: 35, y: -35 } }
  },

  'perspective': {
    id: 'perspective',
    label: 'PERSP',
    type: 'special',
    position: createCameraPosition(0.8, 0.6, 0.8),
    quaternion: createQuaternion(-30, 50, 0),
    euler: new Euler(-30 * Math.PI / 180, 50 * Math.PI / 180, 0),
    cameraDistance: 18,
    description: 'Perspective view',
    cssTransform: 'translate3d(20px, -15px, 20px) rotateY(50deg) rotateX(30deg)',
    hitRegion: { type: 'corner', size: { width: 20, height: 20 }, offset: { x: 30, y: -30 } }
  }
};
