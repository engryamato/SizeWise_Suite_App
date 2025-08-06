/**
 * 3D Scene Management System
 * SizeWise Suite - Advanced Visualization Priority Group
 * 
 * Comprehensive 3D scene management for HVAC visualization with object
 * hierarchy, spatial organization, and performance optimization. Manages
 * 3D objects, groups, layers, and scene graph for professional engineering
 * applications with real-time ductwork visualization and interaction.
 * 
 * @fileoverview 3D scene management and organization system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import * as THREE from 'three';
import { Renderer3D, MaterialType } from './3DRenderer';

/**
 * Scene layer types for organization
 */
export enum SceneLayer {
  BACKGROUND = 'background',
  STRUCTURE = 'structure',
  DUCTWORK = 'ductwork',
  EQUIPMENT = 'equipment',
  ANNOTATIONS = 'annotations',
  HELPERS = 'helpers',
  UI_OVERLAY = 'ui_overlay'
}

/**
 * Object visibility states
 */
export enum VisibilityState {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  TRANSPARENT = 'transparent',
  WIREFRAME = 'wireframe'
}

/**
 * Scene object metadata
 */
export interface SceneObjectMetadata {
  id: string;
  name: string;
  type: string;
  layer: SceneLayer;
  visibility: VisibilityState;
  selectable: boolean;
  userData: Record<string, any>;
  boundingBox?: THREE.Box3;
  centerPoint?: THREE.Vector3;
}

/**
 * Scene configuration
 */
export interface Scene3DConfig {
  enableLayers: boolean;
  enableLOD: boolean;
  enableInstancing: boolean;
  maxObjects: number;
  cullingDistance: number;
  lodDistances: number[];
  defaultVisibility: Record<SceneLayer, boolean>;
  selectionColor: string;
  highlightColor: string;
}

/**
 * Default scene configuration
 */
const DEFAULT_SCENE_CONFIG: Scene3DConfig = {
  enableLayers: true,
  enableLOD: true,
  enableInstancing: true,
  maxObjects: 10000,
  cullingDistance: 1000,
  lodDistances: [50, 100, 200],
  defaultVisibility: {
    [SceneLayer.BACKGROUND]: true,
    [SceneLayer.STRUCTURE]: true,
    [SceneLayer.DUCTWORK]: true,
    [SceneLayer.EQUIPMENT]: true,
    [SceneLayer.ANNOTATIONS]: true,
    [SceneLayer.HELPERS]: false,
    [SceneLayer.UI_OVERLAY]: true
  },
  selectionColor: '#ffff00',
  highlightColor: '#ff6600'
};

/**
 * 3D Scene manager class
 */
export class Scene3D {
  private config: Scene3DConfig;
  private renderer: Renderer3D;
  private scene: THREE.Scene;
  
  // Layer management
  private layers: Map<SceneLayer, THREE.Group> = new Map();
  private layerVisibility: Map<SceneLayer, boolean> = new Map();
  
  // Object management
  private objects: Map<string, THREE.Object3D> = new Map();
  private objectMetadata: Map<string, SceneObjectMetadata> = new Map();
  private selectedObjects: Set<string> = new Set();
  private highlightedObjects: Set<string> = new Set();
  
  // Performance optimization
  private lodGroups: Map<string, THREE.LOD> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Spatial indexing
  private octree: Map<string, THREE.Box3> = new Map();
  private spatialGrid: Map<string, string[]> = new Map();

  constructor(renderer: Renderer3D, config?: Partial<Scene3DConfig>) {
    this.config = { ...DEFAULT_SCENE_CONFIG, ...config };
    this.renderer = renderer;
    this.scene = renderer.getScene();
    
    this.initializeLayers();
    this.initializePerformanceOptimization();
  }

  /**
   * Initialize scene layers
   */
  private initializeLayers(): void {
    Object.values(SceneLayer).forEach(layer => {
      const group = new THREE.Group();
      group.name = layer;
      group.userData = { layer };
      
      this.layers.set(layer, group);
      this.layerVisibility.set(layer, this.config.defaultVisibility[layer]);
      
      group.visible = this.config.defaultVisibility[layer];
      this.scene.add(group);
    });
  }

  /**
   * Initialize performance optimization systems
   */
  private initializePerformanceOptimization(): void {
    // Set up frustum culling
    this.setupFrustumCulling();
    
    // Initialize spatial indexing
    this.initializeSpatialIndexing();
  }

  /**
   * Set up frustum culling
   */
  private setupFrustumCulling(): void {
    const camera = this.renderer.getCamera();
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Initialize spatial indexing
   */
  private initializeSpatialIndexing(): void {
    // Initialize spatial grid for efficient object queries
    const gridSize = 50; // 50 unit grid cells
    for (let x = -500; x <= 500; x += gridSize) {
      for (let y = -500; y <= 500; y += gridSize) {
        for (let z = -500; z <= 500; z += gridSize) {
          const key = `${x}_${y}_${z}`;
          this.spatialGrid.set(key, []);
        }
      }
    }
  }

  /**
   * Add object to scene
   */
  addObject(
    object: THREE.Object3D,
    metadata: Omit<SceneObjectMetadata, 'boundingBox' | 'centerPoint'>
  ): void {
    // Calculate bounding box and center point
    const boundingBox = new THREE.Box3().setFromObject(object);
    const centerPoint = boundingBox.getCenter(new THREE.Vector3());

    const fullMetadata: SceneObjectMetadata = {
      ...metadata,
      boundingBox,
      centerPoint
    };

    // Store object and metadata
    this.objects.set(metadata.id, object);
    this.objectMetadata.set(metadata.id, fullMetadata);

    // Add to appropriate layer
    const layer = this.layers.get(metadata.layer);
    if (layer) {
      layer.add(object);
    } else {
      this.scene.add(object);
    }

    // Set up LOD if enabled
    if (this.config.enableLOD) {
      this.setupLOD(metadata.id, object);
    }

    // Add to spatial index
    this.addToSpatialIndex(metadata.id, boundingBox);

    // Set initial visibility
    object.visible = this.layerVisibility.get(metadata.layer) ?? true;
    
    // Set user data
    object.userData = {
      id: metadata.id,
      metadata: fullMetadata
    };
  }

  /**
   * Remove object from scene
   */
  removeObject(id: string): void {
    const object = this.objects.get(id);
    const metadata = this.objectMetadata.get(id);

    if (!object || !metadata) return;

    // Remove from layer
    const layer = this.layers.get(metadata.layer);
    if (layer) {
      layer.remove(object);
    } else {
      this.scene.remove(object);
    }

    // Remove from LOD
    const lodGroup = this.lodGroups.get(id);
    if (lodGroup) {
      lodGroup.parent?.remove(lodGroup);
      this.lodGroups.delete(id);
    }

    // Remove from spatial index
    this.removeFromSpatialIndex(id);

    // Remove from selections
    this.selectedObjects.delete(id);
    this.highlightedObjects.delete(id);

    // Clean up
    this.objects.delete(id);
    this.objectMetadata.delete(id);

    // Dispose of geometry and materials
    this.disposeObject(object);
  }

  /**
   * Set up Level of Detail (LOD) for object
   */
  private setupLOD(id: string, object: THREE.Object3D): void {
    const lod = new THREE.LOD();
    
    // Add different detail levels
    lod.addLevel(object, 0); // Full detail
    
    // Create simplified versions for different distances
    this.config.lodDistances.forEach((distance, index) => {
      const simplifiedObject = this.createSimplifiedObject(object, index + 1);
      lod.addLevel(simplifiedObject, distance);
    });

    this.lodGroups.set(id, lod);
    
    // Replace object with LOD group
    const metadata = this.objectMetadata.get(id);
    if (metadata) {
      const layer = this.layers.get(metadata.layer);
      if (layer) {
        layer.remove(object);
        layer.add(lod);
      }
    }
  }

  /**
   * Create simplified object for LOD
   */
  private createSimplifiedObject(object: THREE.Object3D, level: number): THREE.Object3D {
    const simplified = object.clone();
    
    // Simplify based on level
    simplified.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Reduce geometry complexity
        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          // Simplify geometry (placeholder - would use actual simplification algorithm)
          const simplificationFactor = Math.pow(0.5, level);
          // Apply simplification...
        }
        
        // Use simpler materials for distant objects
        if (level > 1) {
          child.material = this.renderer.getMaterial(MaterialType.WIREFRAME);
        }
      }
    });

    return simplified;
  }

  /**
   * Add object to spatial index
   */
  private addToSpatialIndex(id: string, boundingBox: THREE.Box3): void {
    this.octree.set(id, boundingBox);
    
    // Add to spatial grid
    const min = boundingBox.min;
    const max = boundingBox.max;
    const gridSize = 50;
    
    for (let x = Math.floor(min.x / gridSize) * gridSize; x <= max.x; x += gridSize) {
      for (let y = Math.floor(min.y / gridSize) * gridSize; y <= max.y; y += gridSize) {
        for (let z = Math.floor(min.z / gridSize) * gridSize; z <= max.z; z += gridSize) {
          const key = `${x}_${y}_${z}`;
          const cell = this.spatialGrid.get(key);
          if (cell) {
            cell.push(id);
          }
        }
      }
    }
  }

  /**
   * Remove object from spatial index
   */
  private removeFromSpatialIndex(id: string): void {
    const boundingBox = this.octree.get(id);
    if (!boundingBox) return;

    this.octree.delete(id);
    
    // Remove from spatial grid
    this.spatialGrid.forEach((cell, key) => {
      const index = cell.indexOf(id);
      if (index !== -1) {
        cell.splice(index, 1);
      }
    });
  }

  /**
   * Get objects in region
   */
  getObjectsInRegion(region: THREE.Box3): string[] {
    const results: string[] = [];
    
    this.octree.forEach((boundingBox, id) => {
      if (region.intersectsBox(boundingBox)) {
        results.push(id);
      }
    });
    
    return results;
  }

  /**
   * Get objects near point
   */
  getObjectsNearPoint(point: THREE.Vector3, radius: number): string[] {
    const sphere = new THREE.Sphere(point, radius);
    const results: string[] = [];
    
    this.octree.forEach((boundingBox, id) => {
      if (sphere.intersectsBox(boundingBox)) {
        results.push(id);
      }
    });
    
    return results;
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layer: SceneLayer, visible: boolean): void {
    this.layerVisibility.set(layer, visible);
    const layerGroup = this.layers.get(layer);
    if (layerGroup) {
      layerGroup.visible = visible;
    }
  }

  /**
   * Get layer visibility
   */
  getLayerVisibility(layer: SceneLayer): boolean {
    return this.layerVisibility.get(layer) ?? true;
  }

  /**
   * Set object visibility
   */
  setObjectVisibility(id: string, state: VisibilityState): void {
    const object = this.objects.get(id);
    const metadata = this.objectMetadata.get(id);
    
    if (!object || !metadata) return;

    metadata.visibility = state;

    switch (state) {
      case VisibilityState.VISIBLE:
        object.visible = true;
        this.restoreOriginalMaterial(object);
        break;
      case VisibilityState.HIDDEN:
        object.visible = false;
        break;
      case VisibilityState.TRANSPARENT:
        object.visible = true;
        this.applyTransparentMaterial(object);
        break;
      case VisibilityState.WIREFRAME:
        object.visible = true;
        this.applyWireframeMaterial(object);
        break;
    }
  }

  /**
   * Select objects
   */
  selectObjects(ids: string[]): void {
    // Clear previous selection
    this.clearSelection();
    
    // Add new selection
    ids.forEach(id => {
      this.selectedObjects.add(id);
      this.applySelectionHighlight(id);
    });

    // Update renderer highlights
    const objects = ids.map(id => this.objects.get(id)).filter(Boolean) as THREE.Object3D[];
    this.renderer.highlightObjects(objects);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedObjects.forEach(id => {
      this.removeSelectionHighlight(id);
    });
    this.selectedObjects.clear();
    this.renderer.clearHighlights();
  }

  /**
   * Highlight objects
   */
  highlightObjects(ids: string[]): void {
    // Clear previous highlights
    this.clearHighlights();
    
    // Add new highlights
    ids.forEach(id => {
      this.highlightedObjects.add(id);
      this.applyHighlight(id);
    });
  }

  /**
   * Clear highlights
   */
  clearHighlights(): void {
    this.highlightedObjects.forEach(id => {
      this.removeHighlight(id);
    });
    this.highlightedObjects.clear();
  }

  /**
   * Apply selection highlight
   */
  private applySelectionHighlight(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original material
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        
        // Apply selection material
        const selectionMaterial = child.material.clone();
        if (selectionMaterial instanceof THREE.MeshStandardMaterial) {
          selectionMaterial.emissive.setHex(0xffff00);
          selectionMaterial.emissiveIntensity = 0.3;
        }
        child.material = selectionMaterial;
      }
    });
  }

  /**
   * Remove selection highlight
   */
  private removeSelectionHighlight(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    });
  }

  /**
   * Apply highlight
   */
  private applyHighlight(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        
        const highlightMaterial = child.material.clone();
        if (highlightMaterial instanceof THREE.MeshStandardMaterial) {
          highlightMaterial.emissive.setHex(0xff6600);
          highlightMaterial.emissiveIntensity = 0.2;
        }
        child.material = highlightMaterial;
      }
    });
  }

  /**
   * Remove highlight
   */
  private removeHighlight(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    });
  }

  /**
   * Apply transparent material
   */
  private applyTransparentMaterial(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = this.renderer.getMaterial(MaterialType.TRANSPARENT);
      }
    });
  }

  /**
   * Apply wireframe material
   */
  private applyWireframeMaterial(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = this.renderer.getMaterial(MaterialType.WIREFRAME);
      }
    });
  }

  /**
   * Restore original material
   */
  private restoreOriginalMaterial(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    });
  }

  /**
   * Update scene (called each frame)
   */
  update(): void {
    // Update frustum culling
    this.setupFrustumCulling();
    
    // Update LOD objects
    this.lodGroups.forEach(lod => {
      lod.update(this.renderer.getCamera());
    });
    
    // Perform frustum culling
    if (this.config.enableLOD) {
      this.performFrustumCulling();
    }
  }

  /**
   * Perform frustum culling
   */
  private performFrustumCulling(): void {
    this.objects.forEach((object, id) => {
      const metadata = this.objectMetadata.get(id);
      if (!metadata?.boundingBox) return;

      const inFrustum = this.frustum.intersectsBox(metadata.boundingBox);
      object.visible = inFrustum && (this.layerVisibility.get(metadata.layer) ?? true);
    });
  }

  /**
   * Dispose of object resources
   */
  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Get object by ID
   */
  getObject(id: string): THREE.Object3D | undefined {
    return this.objects.get(id);
  }

  /**
   * Get object metadata
   */
  getObjectMetadata(id: string): SceneObjectMetadata | undefined {
    return this.objectMetadata.get(id);
  }

  /**
   * Get all objects in layer
   */
  getObjectsInLayer(layer: SceneLayer): string[] {
    const results: string[] = [];
    this.objectMetadata.forEach((metadata, id) => {
      if (metadata.layer === layer) {
        results.push(id);
      }
    });
    return results;
  }

  /**
   * Get selected objects
   */
  getSelectedObjects(): string[] {
    return Array.from(this.selectedObjects);
  }

  /**
   * Get highlighted objects
   */
  getHighlightedObjects(): string[] {
    return Array.from(this.highlightedObjects);
  }

  /**
   * Get scene statistics
   */
  getStatistics(): {
    totalObjects: number;
    visibleObjects: number;
    selectedObjects: number;
    highlightedObjects: number;
    layerCounts: Record<SceneLayer, number>;
  } {
    const layerCounts = {} as Record<SceneLayer, number>;
    Object.values(SceneLayer).forEach(layer => {
      layerCounts[layer] = this.getObjectsInLayer(layer).length;
    });

    let visibleObjects = 0;
    this.objects.forEach(object => {
      if (object.visible) visibleObjects++;
    });

    return {
      totalObjects: this.objects.size,
      visibleObjects,
      selectedObjects: this.selectedObjects.size,
      highlightedObjects: this.highlightedObjects.size,
      layerCounts
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Scene3DConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Scene3DConfig {
    return { ...this.config };
  }

  /**
   * Dispose of scene resources
   */
  dispose(): void {
    // Dispose of all objects
    this.objects.forEach(object => {
      this.disposeObject(object);
    });

    // Clear all data structures
    this.objects.clear();
    this.objectMetadata.clear();
    this.selectedObjects.clear();
    this.highlightedObjects.clear();
    this.lodGroups.clear();
    this.instancedMeshes.clear();
    this.octree.clear();
    this.spatialGrid.clear();

    // Clear layers
    this.layers.forEach(layer => {
      this.scene.remove(layer);
    });
    this.layers.clear();
    this.layerVisibility.clear();
  }
}
