/**
 * 3D Rendering System Core
 * SizeWise Suite - Advanced Visualization Priority Group
 * 
 * Comprehensive 3D rendering engine with WebGL/Three.js integration for
 * professional HVAC visualization. Provides camera controls, lighting systems,
 * material rendering, and performance optimization for enterprise-scale
 * engineering applications with real-time 3D ductwork visualization.
 * 
 * @fileoverview 3D rendering engine core system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

/**
 * 3D rendering quality levels
 */
export enum RenderQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

/**
 * 3D view modes
 */
export enum ViewMode {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic',
  ISOMETRIC = 'isometric',
  TOP = 'top',
  FRONT = 'front',
  SIDE = 'side'
}

/**
 * Material types for HVAC components
 */
export enum MaterialType {
  GALVANIZED_STEEL = 'galvanized_steel',
  STAINLESS_STEEL = 'stainless_steel',
  ALUMINUM = 'aluminum',
  INSULATION = 'insulation',
  FLEXIBLE_DUCT = 'flexible_duct',
  TRANSPARENT = 'transparent',
  WIREFRAME = 'wireframe'
}

/**
 * 3D renderer configuration
 */
export interface Renderer3DConfig {
  quality: RenderQuality;
  enableShadows: boolean;
  enableAntialiasing: boolean;
  enablePostProcessing: boolean;
  maxLights: number;
  shadowMapSize: number;
  pixelRatio: number;
  backgroundColor: string;
  fogEnabled: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  performance: {
    enableLOD: boolean;
    enableFrustumCulling: boolean;
    enableOcclusion: boolean;
    maxDrawCalls: number;
  };
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  enableControls: boolean;
  controlsConfig: {
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    enablePan: boolean;
    enableRotate: boolean;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
  };
}

/**
 * Lighting configuration
 */
export interface LightingConfig {
  ambient: {
    enabled: boolean;
    color: string;
    intensity: number;
  };
  directional: {
    enabled: boolean;
    color: string;
    intensity: number;
    position: THREE.Vector3;
    castShadow: boolean;
    shadowMapSize: number;
  };
  point: {
    enabled: boolean;
    lights: Array<{
      color: string;
      intensity: number;
      position: THREE.Vector3;
      distance: number;
      decay: number;
    }>;
  };
  hemisphere: {
    enabled: boolean;
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
}

/**
 * Default 3D renderer configuration
 */
const DEFAULT_RENDERER_CONFIG: Renderer3DConfig = {
  quality: RenderQuality.HIGH,
  enableShadows: true,
  enableAntialiasing: true,
  enablePostProcessing: true,
  maxLights: 8,
  shadowMapSize: 2048,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  backgroundColor: '#f5f5f5',
  fogEnabled: true,
  fogColor: '#f5f5f5',
  fogNear: 100,
  fogFar: 1000,
  performance: {
    enableLOD: true,
    enableFrustumCulling: true,
    enableOcclusion: false,
    maxDrawCalls: 1000
  }
};

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 75,
  near: 0.1,
  far: 2000,
  position: new THREE.Vector3(50, 50, 50),
  target: new THREE.Vector3(0, 0, 0),
  enableControls: true,
  controlsConfig: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    minDistance: 5,
    maxDistance: 500,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI
  }
};

/**
 * Default lighting configuration
 */
const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    enabled: true,
    color: '#404040',
    intensity: 0.4
  },
  directional: {
    enabled: true,
    color: '#ffffff',
    intensity: 1.0,
    position: new THREE.Vector3(50, 100, 50),
    castShadow: true,
    shadowMapSize: 2048
  },
  point: {
    enabled: false,
    lights: []
  },
  hemisphere: {
    enabled: true,
    skyColor: '#87CEEB',
    groundColor: '#8B4513',
    intensity: 0.3
  }
};

/**
 * 3D Renderer class
 */
export class Renderer3D {
  private config: Renderer3DConfig;
  private cameraConfig: CameraConfig;
  private lightingConfig: LightingConfig;
  
  // Three.js core objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  
  // Post-processing
  private composer: EffectComposer | null = null;
  private outlinePass: OutlinePass | null = null;
  
  // Lighting
  private lights: Map<string, THREE.Light> = new Map();
  
  // Materials
  private materials: Map<MaterialType, THREE.Material> = new Map();
  
  // Performance tracking
  private stats: {
    frameCount: number;
    lastFrameTime: number;
    averageFPS: number;
    drawCalls: number;
    triangles: number;
  } = {
    frameCount: 0,
    lastFrameTime: 0,
    averageFPS: 0,
    drawCalls: 0,
    triangles: 0
  };

  constructor(
    container: HTMLElement,
    config?: Partial<Renderer3DConfig>,
    cameraConfig?: Partial<CameraConfig>,
    lightingConfig?: Partial<LightingConfig>
  ) {
    this.config = { ...DEFAULT_RENDERER_CONFIG, ...config };
    this.cameraConfig = { ...DEFAULT_CAMERA_CONFIG, ...cameraConfig };
    this.lightingConfig = { ...DEFAULT_LIGHTING_CONFIG, ...lightingConfig };

    // Initialize Three.js components
    this.initializeScene();
    this.initializeCamera();
    this.initializeRenderer(container);
    this.initializeLighting();
    this.initializeMaterials();
    this.initializeControls();
    this.initializePostProcessing();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Initialize the 3D scene
   */
  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Add fog if enabled
    if (this.config.fogEnabled) {
      this.scene.fog = new THREE.Fog(
        this.config.fogColor,
        this.config.fogNear,
        this.config.fogFar
      );
    }

    // Add coordinate system helper (for debugging)
    if (process.env.NODE_ENV === 'development') {
      const axesHelper = new THREE.AxesHelper(10);
      this.scene.add(axesHelper);
    }
  }

  /**
   * Initialize the camera
   */
  private initializeCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );

    this.camera.position.copy(this.cameraConfig.position);
    this.camera.lookAt(this.cameraConfig.target);
  }

  /**
   * Initialize the WebGL renderer
   */
  private initializeRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.enableAntialiasing,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.config.pixelRatio);

    // Enable shadows if configured
    if (this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Set quality-based settings
    this.applyQualitySettings();

    container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize lighting system
   */
  private initializeLighting(): void {
    // Ambient light
    if (this.lightingConfig.ambient.enabled) {
      const ambientLight = new THREE.AmbientLight(
        this.lightingConfig.ambient.color,
        this.lightingConfig.ambient.intensity
      );
      this.scene.add(ambientLight);
      this.lights.set('ambient', ambientLight);
    }

    // Directional light
    if (this.lightingConfig.directional.enabled) {
      const directionalLight = new THREE.DirectionalLight(
        this.lightingConfig.directional.color,
        this.lightingConfig.directional.intensity
      );
      
      directionalLight.position.copy(this.lightingConfig.directional.position);
      directionalLight.castShadow = this.lightingConfig.directional.castShadow;
      
      if (directionalLight.castShadow) {
        directionalLight.shadow.mapSize.width = this.lightingConfig.directional.shadowMapSize;
        directionalLight.shadow.mapSize.height = this.lightingConfig.directional.shadowMapSize;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
      }

      this.scene.add(directionalLight);
      this.lights.set('directional', directionalLight);
    }

    // Hemisphere light
    if (this.lightingConfig.hemisphere.enabled) {
      const hemisphereLight = new THREE.HemisphereLight(
        this.lightingConfig.hemisphere.skyColor,
        this.lightingConfig.hemisphere.groundColor,
        this.lightingConfig.hemisphere.intensity
      );
      this.scene.add(hemisphereLight);
      this.lights.set('hemisphere', hemisphereLight);
    }

    // Point lights
    if (this.lightingConfig.point.enabled) {
      this.lightingConfig.point.lights.forEach((lightConfig, index) => {
        const pointLight = new THREE.PointLight(
          lightConfig.color,
          lightConfig.intensity,
          lightConfig.distance,
          lightConfig.decay
        );
        pointLight.position.copy(lightConfig.position);
        this.scene.add(pointLight);
        this.lights.set(`point_${index}`, pointLight);
      });
    }
  }

  /**
   * Initialize materials for HVAC components
   */
  private initializeMaterials(): void {
    // Galvanized steel material
    this.materials.set(MaterialType.GALVANIZED_STEEL, new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0
    }));

    // Stainless steel material
    this.materials.set(MaterialType.STAINLESS_STEEL, new THREE.MeshStandardMaterial({
      color: 0xE5E5E5,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.2
    }));

    // Aluminum material
    this.materials.set(MaterialType.ALUMINUM, new THREE.MeshStandardMaterial({
      color: 0xD3D3D3,
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 0.8
    }));

    // Insulation material
    this.materials.set(MaterialType.INSULATION, new THREE.MeshLambertMaterial({
      color: 0xFFE4B5,
      transparent: true,
      opacity: 0.8
    }));

    // Flexible duct material
    this.materials.set(MaterialType.FLEXIBLE_DUCT, new THREE.MeshPhongMaterial({
      color: 0x696969,
      shininess: 30,
      transparent: true,
      opacity: 0.9
    }));

    // Transparent material
    this.materials.set(MaterialType.TRANSPARENT, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    }));

    // Wireframe material
    this.materials.set(MaterialType.WIREFRAME, new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    }));
  }

  /**
   * Initialize camera controls
   */
  private initializeControls(): void {
    if (!this.cameraConfig.enableControls) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    const controlsConfig = this.cameraConfig.controlsConfig;
    this.controls.enableDamping = controlsConfig.enableDamping;
    this.controls.dampingFactor = controlsConfig.dampingFactor;
    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.enablePan = controlsConfig.enablePan;
    this.controls.enableRotate = controlsConfig.enableRotate;
    this.controls.minDistance = controlsConfig.minDistance;
    this.controls.maxDistance = controlsConfig.maxDistance;
    this.controls.minPolarAngle = controlsConfig.minPolarAngle;
    this.controls.maxPolarAngle = controlsConfig.maxPolarAngle;

    this.controls.target.copy(this.cameraConfig.target);
    this.controls.update();
  }

  /**
   * Initialize post-processing effects
   */
  private initializePostProcessing(): void {
    if (!this.config.enablePostProcessing) return;

    this.composer = new EffectComposer(this.renderer);

    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Outline pass for selection highlighting
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.outlinePass.edgeStrength = 3.0;
    this.outlinePass.edgeGlow = 0.0;
    this.outlinePass.edgeThickness = 1.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.visibleEdgeColor.set('#ffff00');
    this.outlinePass.hiddenEdgeColor.set('#190a05');
    this.composer.addPass(this.outlinePass);

    // FXAA anti-aliasing pass
    if (this.config.enableAntialiasing) {
      const fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.material.uniforms['resolution'].value.x = 1 / window.innerWidth;
      fxaaPass.material.uniforms['resolution'].value.y = 1 / window.innerHeight;
      this.composer.addPass(fxaaPass);
    }
  }

  /**
   * Apply quality-based settings
   */
  private applyQualitySettings(): void {
    switch (this.config.quality) {
      case RenderQuality.LOW:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
        this.config.shadowMapSize = 512;
        break;
      case RenderQuality.MEDIUM:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.config.shadowMapSize = 1024;
        break;
      case RenderQuality.HIGH:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.config.shadowMapSize = 2048;
        break;
      case RenderQuality.ULTRA:
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.config.shadowMapSize = 4096;
        break;
    }
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const animate = (time: number) => {
      requestAnimationFrame(animate);

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Update performance stats
      this.updatePerformanceStats(time);

      // Render scene
      if (this.composer && this.config.enablePostProcessing) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate(0);
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(time: number): void {
    this.stats.frameCount++;
    
    if (this.stats.lastFrameTime > 0) {
      const deltaTime = time - this.stats.lastFrameTime;
      const fps = 1000 / deltaTime;
      this.stats.averageFPS = (this.stats.averageFPS * 0.9) + (fps * 0.1);
    }
    
    this.stats.lastFrameTime = time;
    this.stats.drawCalls = this.renderer.info.render.calls;
    this.stats.triangles = this.renderer.info.render.triangles;
  }

  /**
   * Add object to scene
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Get material by type
   */
  getMaterial(type: MaterialType): THREE.Material {
    const material = this.materials.get(type);
    if (!material) {
      throw new Error(`Material type ${type} not found`);
    }
    return material.clone();
  }

  /**
   * Set view mode
   */
  setViewMode(mode: ViewMode): void {
    switch (mode) {
      case ViewMode.PERSPECTIVE:
        // Already in perspective mode
        break;
      case ViewMode.ORTHOGRAPHIC:
        // Switch to orthographic camera
        // Implementation would require camera replacement
        break;
      case ViewMode.ISOMETRIC:
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        break;
      case ViewMode.TOP:
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);
        break;
      case ViewMode.FRONT:
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);
        break;
      case ViewMode.SIDE:
        this.camera.position.set(100, 0, 0);
        this.camera.lookAt(0, 0, 0);
        break;
    }

    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * Highlight objects (for selection)
   */
  highlightObjects(objects: THREE.Object3D[]): void {
    if (this.outlinePass) {
      this.outlinePass.selectedObjects = objects;
    }
  }

  /**
   * Clear highlights
   */
  clearHighlights(): void {
    if (this.outlinePass) {
      this.outlinePass.selectedObjects = [];
    }
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Renderer3DConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyQualitySettings();
  }

  /**
   * Get current configuration
   */
  getConfig(): Renderer3DConfig {
    return { ...this.config };
  }

  /**
   * Get scene reference
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera reference
   */
  getCamera(): THREE.Camera {
    return this.camera;
  }

  /**
   * Get renderer reference
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Dispose of materials
    this.materials.forEach(material => material.dispose());
    this.materials.clear();

    // Dispose of renderer
    this.renderer.dispose();

    // Dispose of controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Clear scene
    this.scene.clear();
  }
}
