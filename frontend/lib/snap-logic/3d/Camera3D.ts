/**
 * 3D Camera Control System
 * SizeWise Suite - Advanced Visualization Priority Group
 * 
 * Advanced 3D camera control system with multiple view modes, smooth
 * transitions, and professional engineering camera behaviors. Provides
 * perspective and orthographic cameras, preset views, animation system,
 * and touch/mouse controls for professional HVAC visualization workflows.
 * 
 * @fileoverview 3D camera control and view management system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Camera types
 */
export enum CameraType {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic'
}

/**
 * Preset camera views
 */
export enum CameraPreset {
  ISOMETRIC = 'isometric',
  TOP = 'top',
  FRONT = 'front',
  BACK = 'back',
  LEFT = 'left',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  PERSPECTIVE_DEFAULT = 'perspective_default'
}

/**
 * Camera animation types
 */
export enum AnimationType {
  LINEAR = 'linear',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out',
  BOUNCE = 'bounce'
}

/**
 * Camera view state
 */
export interface CameraViewState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  up: THREE.Vector3;
  zoom: number;
  fov?: number; // For perspective camera
  left?: number; // For orthographic camera
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Camera animation configuration
 */
export interface CameraAnimation {
  from: CameraViewState;
  to: CameraViewState;
  duration: number; // milliseconds
  type: AnimationType;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Camera control configuration
 */
export interface Camera3DConfig {
  type: CameraType;
  fov: number;
  near: number;
  far: number;
  orthographicSize: number;
  enableControls: boolean;
  enableAnimation: boolean;
  animationDuration: number;
  controls: {
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    enablePan: boolean;
    enableRotate: boolean;
    zoomSpeed: number;
    panSpeed: number;
    rotateSpeed: number;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
  };
  presets: Record<CameraPreset, CameraViewState>;
}

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: Camera3DConfig = {
  type: CameraType.PERSPECTIVE,
  fov: 75,
  near: 0.1,
  far: 2000,
  orthographicSize: 100,
  enableControls: true,
  enableAnimation: true,
  animationDuration: 1000,
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    zoomSpeed: 1.0,
    panSpeed: 1.0,
    rotateSpeed: 1.0,
    minDistance: 5,
    maxDistance: 500,
    minZoom: 0.1,
    maxZoom: 10,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  },
  presets: {
    [CameraPreset.ISOMETRIC]: {
      position: new THREE.Vector3(50, 50, 50),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.TOP]: {
      position: new THREE.Vector3(0, 100, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 0, -1),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.FRONT]: {
      position: new THREE.Vector3(0, 0, 100),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.BACK]: {
      position: new THREE.Vector3(0, 0, -100),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.LEFT]: {
      position: new THREE.Vector3(-100, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.RIGHT]: {
      position: new THREE.Vector3(100, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.BOTTOM]: {
      position: new THREE.Vector3(0, -100, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 0, 1),
      zoom: 1,
      fov: 75
    },
    [CameraPreset.PERSPECTIVE_DEFAULT]: {
      position: new THREE.Vector3(75, 75, 75),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      zoom: 1,
      fov: 75
    }
  }
};

/**
 * 3D Camera controller class
 */
export class Camera3D {
  private config: Camera3DConfig;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private controls: OrbitControls | null = null;
  private renderer: THREE.WebGLRenderer;
  
  // Animation system
  private currentAnimation: CameraAnimation | null = null;
  private animationStartTime: number = 0;
  
  // View state management
  private viewHistory: CameraViewState[] = [];
  private currentViewIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(
    renderer: THREE.WebGLRenderer,
    config?: Partial<Camera3DConfig>
  ) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
    this.renderer = renderer;
    
    this.initializeCamera();
    this.initializeControls();
  }

  /**
   * Initialize camera based on type
   */
  private initializeCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    
    if (this.config.type === CameraType.PERSPECTIVE) {
      this.camera = new THREE.PerspectiveCamera(
        this.config.fov,
        aspect,
        this.config.near,
        this.config.far
      );
    } else {
      const size = this.config.orthographicSize;
      this.camera = new THREE.OrthographicCamera(
        -size * aspect,
        size * aspect,
        size,
        -size,
        this.config.near,
        this.config.far
      );
    }

    // Set initial position
    const defaultPreset = this.config.presets[CameraPreset.PERSPECTIVE_DEFAULT];
    this.applyViewState(defaultPreset, false);
  }

  /**
   * Initialize camera controls
   */
  private initializeControls(): void {
    if (!this.config.enableControls) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    const controlsConfig = this.config.controls;
    this.controls.enableDamping = controlsConfig.enableDamping;
    this.controls.dampingFactor = controlsConfig.dampingFactor;
    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.enablePan = controlsConfig.enablePan;
    this.controls.enableRotate = controlsConfig.enableRotate;
    this.controls.zoomSpeed = controlsConfig.zoomSpeed;
    this.controls.panSpeed = controlsConfig.panSpeed;
    this.controls.rotateSpeed = controlsConfig.rotateSpeed;
    this.controls.minDistance = controlsConfig.minDistance;
    this.controls.maxDistance = controlsConfig.maxDistance;
    this.controls.minPolarAngle = controlsConfig.minPolarAngle;
    this.controls.maxPolarAngle = controlsConfig.maxPolarAngle;
    this.controls.minAzimuthAngle = controlsConfig.minAzimuthAngle;
    this.controls.maxAzimuthAngle = controlsConfig.maxAzimuthAngle;

    // Set zoom limits for orthographic camera
    if (this.camera instanceof THREE.OrthographicCamera) {
      this.controls.minZoom = controlsConfig.minZoom;
      this.controls.maxZoom = controlsConfig.maxZoom;
    }

    this.controls.update();
  }

  /**
   * Switch camera type
   */
  switchCameraType(type: CameraType): void {
    if (this.config.type === type) return;

    // Save current view state
    const currentState = this.getCurrentViewState();
    
    // Update config
    this.config.type = type;
    
    // Dispose old camera
    this.camera = null as any;
    
    // Initialize new camera
    this.initializeCamera();
    
    // Reinitialize controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    this.initializeControls();
    
    // Restore view state
    this.applyViewState(currentState, false);
  }

  /**
   * Set camera to preset view
   */
  setPresetView(preset: CameraPreset, animate: boolean = true): void {
    const viewState = this.config.presets[preset];
    if (!viewState) {
      console.warn(`Camera preset ${preset} not found`);
      return;
    }

    this.setViewState(viewState, animate);
  }

  /**
   * Set camera view state
   */
  setViewState(viewState: CameraViewState, animate: boolean = true): void {
    if (animate && this.config.enableAnimation) {
      this.animateToViewState(viewState);
    } else {
      this.applyViewState(viewState, true);
    }
  }

  /**
   * Animate to view state
   */
  private animateToViewState(targetState: CameraViewState): void {
    const currentState = this.getCurrentViewState();
    
    const animation: CameraAnimation = {
      from: currentState,
      to: targetState,
      duration: this.config.animationDuration,
      type: AnimationType.EASE_IN_OUT
    };

    this.startAnimation(animation);
  }

  /**
   * Start camera animation
   */
  startAnimation(animation: CameraAnimation): void {
    this.currentAnimation = animation;
    this.animationStartTime = performance.now();
  }

  /**
   * Stop current animation
   */
  stopAnimation(): void {
    if (this.currentAnimation?.onComplete) {
      this.currentAnimation.onComplete();
    }
    this.currentAnimation = null;
  }

  /**
   * Update camera (called each frame)
   */
  update(): void {
    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Update animation
    if (this.currentAnimation) {
      this.updateAnimation();
    }
  }

  /**
   * Update camera animation
   */
  private updateAnimation(): void {
    if (!this.currentAnimation) return;

    const elapsed = performance.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.currentAnimation.duration, 1);
    
    // Apply easing function
    const easedProgress = this.applyEasing(progress, this.currentAnimation.type);
    
    // Interpolate view state
    const interpolatedState = this.interpolateViewStates(
      this.currentAnimation.from,
      this.currentAnimation.to,
      easedProgress
    );
    
    // Apply interpolated state
    this.applyViewState(interpolatedState, false);
    
    // Call update callback
    if (this.currentAnimation.onUpdate) {
      this.currentAnimation.onUpdate(progress);
    }
    
    // Check if animation is complete
    if (progress >= 1) {
      if (this.currentAnimation.onComplete) {
        this.currentAnimation.onComplete();
      }
      this.currentAnimation = null;
    }
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, type: AnimationType): number {
    switch (type) {
      case AnimationType.LINEAR:
        return t;
      case AnimationType.EASE_IN:
        return t * t;
      case AnimationType.EASE_OUT:
        return 1 - (1 - t) * (1 - t);
      case AnimationType.EASE_IN_OUT:
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case AnimationType.BOUNCE:
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      default:
        return t;
    }
  }

  /**
   * Interpolate between view states
   */
  private interpolateViewStates(
    from: CameraViewState,
    to: CameraViewState,
    t: number
  ): CameraViewState {
    return {
      position: from.position.clone().lerp(to.position, t),
      target: from.target.clone().lerp(to.target, t),
      up: from.up.clone().lerp(to.up, t).normalize(),
      zoom: THREE.MathUtils.lerp(from.zoom, to.zoom, t),
      fov: from.fov && to.fov ? THREE.MathUtils.lerp(from.fov, to.fov, t) : to.fov,
      left: from.left && to.left ? THREE.MathUtils.lerp(from.left, to.left, t) : to.left,
      right: from.right && to.right ? THREE.MathUtils.lerp(from.right, to.right, t) : to.right,
      top: from.top && to.top ? THREE.MathUtils.lerp(from.top, to.top, t) : to.top,
      bottom: from.bottom && to.bottom ? THREE.MathUtils.lerp(from.bottom, to.bottom, t) : to.bottom
    };
  }

  /**
   * Apply view state to camera
   */
  private applyViewState(viewState: CameraViewState, saveToHistory: boolean): void {
    this.camera.position.copy(viewState.position);
    this.camera.up.copy(viewState.up);
    this.camera.lookAt(viewState.target);
    this.camera.zoom = viewState.zoom;

    if (this.camera instanceof THREE.PerspectiveCamera && viewState.fov) {
      this.camera.fov = viewState.fov;
    }

    if (this.camera instanceof THREE.OrthographicCamera) {
      if (viewState.left !== undefined) this.camera.left = viewState.left;
      if (viewState.right !== undefined) this.camera.right = viewState.right;
      if (viewState.top !== undefined) this.camera.top = viewState.top;
      if (viewState.bottom !== undefined) this.camera.bottom = viewState.bottom;
    }

    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.copy(viewState.target);
      this.controls.update();
    }

    if (saveToHistory) {
      this.saveToHistory(viewState);
    }
  }

  /**
   * Get current view state
   */
  getCurrentViewState(): CameraViewState {
    const state: CameraViewState = {
      position: this.camera.position.clone(),
      target: this.controls ? this.controls.target.clone() : new THREE.Vector3(),
      up: this.camera.up.clone(),
      zoom: this.camera.zoom
    };

    if (this.camera instanceof THREE.PerspectiveCamera) {
      state.fov = this.camera.fov;
    }

    if (this.camera instanceof THREE.OrthographicCamera) {
      state.left = this.camera.left;
      state.right = this.camera.right;
      state.top = this.camera.top;
      state.bottom = this.camera.bottom;
    }

    return state;
  }

  /**
   * Save view state to history
   */
  private saveToHistory(viewState: CameraViewState): void {
    // Remove any views after current index
    this.viewHistory = this.viewHistory.slice(0, this.currentViewIndex + 1);
    
    // Add new view state
    this.viewHistory.push(viewState);
    this.currentViewIndex = this.viewHistory.length - 1;
    
    // Limit history size
    if (this.viewHistory.length > this.maxHistorySize) {
      this.viewHistory.shift();
      this.currentViewIndex--;
    }
  }

  /**
   * Go back in view history
   */
  goBack(): boolean {
    if (this.currentViewIndex > 0) {
      this.currentViewIndex--;
      const viewState = this.viewHistory[this.currentViewIndex];
      this.applyViewState(viewState, false);
      return true;
    }
    return false;
  }

  /**
   * Go forward in view history
   */
  goForward(): boolean {
    if (this.currentViewIndex < this.viewHistory.length - 1) {
      this.currentViewIndex++;
      const viewState = this.viewHistory[this.currentViewIndex];
      this.applyViewState(viewState, false);
      return true;
    }
    return false;
  }

  /**
   * Focus on object or point
   */
  focusOn(target: THREE.Vector3 | THREE.Object3D, distance?: number): void {
    let targetPosition: THREE.Vector3;
    
    if (target instanceof THREE.Vector3) {
      targetPosition = target;
    } else {
      // Calculate bounding box center
      const box = new THREE.Box3().setFromObject(target);
      targetPosition = box.getCenter(new THREE.Vector3());
      
      // Calculate appropriate distance if not provided
      if (!distance) {
        const size = box.getSize(new THREE.Vector3());
        distance = Math.max(size.x, size.y, size.z) * 2;
      }
    }

    // Calculate camera position
    const currentPosition = this.camera.position.clone();
    const direction = currentPosition.sub(targetPosition).normalize();
    const newPosition = targetPosition.clone().add(direction.multiplyScalar(distance || 50));

    const viewState: CameraViewState = {
      position: newPosition,
      target: targetPosition,
      up: this.camera.up.clone(),
      zoom: this.camera.zoom,
      fov: this.camera instanceof THREE.PerspectiveCamera ? this.camera.fov : undefined
    };

    this.setViewState(viewState, true);
  }

  /**
   * Fit objects in view
   */
  fitObjectsInView(objects: THREE.Object3D[]): void {
    if (objects.length === 0) return;

    // Calculate combined bounding box
    const box = new THREE.Box3();
    objects.forEach(object => {
      const objectBox = new THREE.Box3().setFromObject(object);
      box.union(objectBox);
    });

    // Calculate center and size
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate distance based on camera type
    let distance: number;
    if (this.camera instanceof THREE.PerspectiveCamera) {
      distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
    } else {
      distance = maxDim;
    }

    this.focusOn(center, distance * 1.2); // Add 20% padding
  }

  /**
   * Resize camera
   */
  resize(width: number, height: number): void {
    const aspect = width / height;
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
    } else {
      const size = this.config.orthographicSize;
      this.camera.left = -size * aspect;
      this.camera.right = size * aspect;
      this.camera.top = size;
      this.camera.bottom = -size;
    }
    
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get camera reference
   */
  getCamera(): THREE.Camera {
    return this.camera;
  }

  /**
   * Get controls reference
   */
  getControls(): OrbitControls | null {
    return this.controls;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Camera3DConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if camera type changed
    if (newConfig.type && newConfig.type !== this.config.type) {
      this.switchCameraType(newConfig.type);
    }
    
    // Update controls if configuration changed
    if (this.controls && newConfig.controls) {
      const controlsConfig = { ...this.config.controls, ...newConfig.controls };
      Object.assign(this.controls, controlsConfig);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Camera3DConfig {
    return { ...this.config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.controls) {
      this.controls.dispose();
    }
    this.stopAnimation();
    this.viewHistory = [];
  }
}
