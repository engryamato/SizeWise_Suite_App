/**
 * Snap Logic 3D Integration
 * SizeWise Suite - Advanced Visualization Priority Group
 * 
 * Seamless integration between 3D visualization and existing snap logic system,
 * enabling 3D snap points, centerline-to-3D conversion, and bidirectional editing
 * for professional HVAC engineering workflows. Provides real-time synchronization
 * between 2D design and 3D visualization with professional-grade accuracy.
 * 
 * @fileoverview Snap logic 3D integration and synchronization system
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import * as THREE from 'three';
import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { DuctDimensions, DuctShape } from '../standards/SMACNAValidator';
import { SnapLogicManager } from '../SnapLogicManager';
import { SnapPoint } from '@/types/air-duct-sizer';
import { Renderer3D } from './3DRenderer';
import { Scene3D, SceneLayer } from './Scene3D';
import { Camera3D } from './Camera3D';
import { MeshGenerator, HVACComponentType, MeshGenerationParams } from './MeshGenerator';
import { FabricationMaterial } from '../export/VanPackerExporter';

/**
 * 3D snap point types
 */
export enum SnapPoint3DType {
  VERTEX = 'vertex',
  EDGE_MIDPOINT = 'edge_midpoint',
  FACE_CENTER = 'face_center',
  OBJECT_CENTER = 'object_center',
  GRID_POINT = 'grid_point',
  SURFACE_POINT = 'surface_point',
  INTERSECTION = 'intersection',
  PROJECTION = 'projection'
}

/**
 * 3D snap point data
 */
export interface SnapPoint3D {
  id: string;
  type: SnapPoint3DType;
  position: THREE.Vector3;
  normal?: THREE.Vector3;
  objectId?: string;
  metadata: Record<string, any>;
  priority: number;
  isVisible: boolean;
}

/**
 * Centerline to 3D conversion result
 */
export interface CenterlineTo3DResult {
  success: boolean;
  meshes: THREE.Mesh[];
  snapPoints: SnapPoint3D[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalLength: number;
    totalVolume: number;
    totalWeight: number;
    componentCount: number;
  };
}

/**
 * 3D to centerline conversion result
 */
export interface ThreeDToCenterlineResult {
  success: boolean;
  centerlines: Centerline[];
  dimensions: DuctDimensions[];
  shapes: DuctShape[];
  errors: string[];
  warnings: string[];
}

/**
 * Synchronization configuration
 */
export interface SyncConfig {
  enableRealTimeSync: boolean;
  syncInterval: number; // milliseconds
  autoGenerate3D: boolean;
  preserveUserEdits: boolean;
  validateOnSync: boolean;
  showSyncIndicators: boolean;
  conflictResolution: 'manual' | 'auto_2d' | 'auto_3d';
}

/**
 * Default synchronization configuration
 */
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enableRealTimeSync: true,
  syncInterval: 500,
  autoGenerate3D: true,
  preserveUserEdits: true,
  validateOnSync: true,
  showSyncIndicators: true,
  conflictResolution: 'manual'
};

/**
 * Snap Logic 3D Integration manager
 */
export class SnapLogic3DIntegration {
  private config: SyncConfig;
  private snapLogicManager: SnapLogicManager;
  private renderer3D: Renderer3D;
  private scene3D: Scene3D;
  private camera3D: Camera3D;
  private meshGenerator: MeshGenerator;
  
  // 3D snap points
  private snapPoints3D: Map<string, SnapPoint3D> = new Map();
  private snapPointObjects: Map<string, THREE.Object3D> = new Map();
  
  // Synchronization state
  private lastSyncTime: number = 0;
  private syncInProgress: boolean = false;
  private pendingChanges: Set<string> = new Set();
  
  // Conversion mappings
  private centerlineTo3DMap: Map<string, string[]> = new Map(); // centerline ID -> 3D object IDs
  private threeDToCenterlineMap: Map<string, string> = new Map(); // 3D object ID -> centerline ID
  
  // Event callbacks
  private onSyncComplete: ((result: any) => void) | null = null;
  private onConflictDetected: ((conflict: any) => void) | null = null;

  constructor(
    snapLogicManager: SnapLogicManager,
    renderer3D: Renderer3D,
    scene3D: Scene3D,
    camera3D: Camera3D,
    config?: Partial<SyncConfig>
  ) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.snapLogicManager = snapLogicManager;
    this.renderer3D = renderer3D;
    this.scene3D = scene3D;
    this.camera3D = camera3D;
    this.meshGenerator = new MeshGenerator();
    
    this.initializeIntegration();
  }

  /**
   * Initialize 3D integration
   */
  private initializeIntegration(): void {
    // Set up event listeners for snap logic changes
    this.setupSnapLogicListeners();
    
    // Initialize 3D snap point system
    this.initialize3DSnapPoints();
    
    // Start synchronization if enabled
    if (this.config.enableRealTimeSync) {
      this.startRealTimeSync();
    }
  }

  /**
   * Set up snap logic event listeners
   */
  private setupSnapLogicListeners(): void {
    // Listen for centerline changes
    // Note: These would be actual event listeners in the real implementation
    console.log('Setting up snap logic listeners for 3D integration');
  }

  /**
   * Initialize 3D snap point system
   */
  private initialize3DSnapPoints(): void {
    // Create 3D snap point visualization layer
    this.scene3D.setLayerVisibility(SceneLayer.HELPERS, true);
  }

  /**
   * Start real-time synchronization
   */
  private startRealTimeSync(): void {
    const syncLoop = () => {
      if (this.config.enableRealTimeSync && !this.syncInProgress) {
        const now = Date.now();
        if (now - this.lastSyncTime >= this.config.syncInterval) {
          this.performSync();
        }
      }
      requestAnimationFrame(syncLoop);
    };
    syncLoop();
  }

  /**
   * Convert centerlines to 3D geometry
   */
  async convertCenterlinesTo3D(
    centerlines: Centerline[],
    ductDimensions: DuctDimensions[],
    ductShapes: DuctShape[],
    material: FabricationMaterial = FabricationMaterial.GALVANIZED_STEEL,
    gauge: number = 24
  ): Promise<CenterlineTo3DResult> {
    const result: CenterlineTo3DResult = {
      success: true,
      meshes: [],
      snapPoints: [],
      errors: [],
      warnings: [],
      metadata: {
        totalLength: 0,
        totalVolume: 0,
        totalWeight: 0,
        componentCount: 0
      }
    };

    try {
      for (let i = 0; i < centerlines.length; i++) {
        const centerline = centerlines[i];
        const dimensions = ductDimensions[i] || { width: 12, height: 8 };
        const shape = ductShapes[i] || DuctShape.RECTANGULAR;

        // Determine component type from centerline
        const componentType = this.determineComponentType(centerline);
        
        // Generate mesh parameters
        const meshParams: MeshGenerationParams = {
          componentType,
          dimensions,
          shape,
          material,
          gauge,
          quality: 'high' as any,
          generateInterior: true,
          generateInsulation: false,
          customParameters: this.extractCustomParameters(centerline)
        };

        // Generate 3D mesh
        const generatedMesh = this.meshGenerator.generateMesh(meshParams);
        
        // Position mesh based on centerline
        this.positionMeshFromCenterline(generatedMesh.exterior, centerline);
        
        // Add to scene
        this.scene3D.addObject(generatedMesh.exterior, {
          id: `mesh_${centerline.id}`,
          name: `Duct ${i + 1}`,
          type: componentType,
          layer: SceneLayer.DUCTWORK,
          visibility: 'visible' as any,
          selectable: true,
          userData: {
            centerlineId: centerline.id,
            meshMetadata: generatedMesh.metadata
          }
        });

        // Store mapping
        this.centerlineTo3DMap.set(centerline.id, [`mesh_${centerline.id}`]);
        this.threeDToCenterlineMap.set(`mesh_${centerline.id}`, centerline.id);

        // Generate 3D snap points
        const snapPoints = this.generate3DSnapPoints(generatedMesh.exterior, centerline.id);
        result.snapPoints.push(...snapPoints);

        // Update result metadata
        result.meshes.push(generatedMesh.exterior);
        result.metadata.totalLength += generatedMesh.metadata.centerline.length;
        result.metadata.totalVolume += generatedMesh.metadata.volume;
        result.metadata.totalWeight += generatedMesh.metadata.weight;
        result.metadata.componentCount++;
      }

      // Add snap points to 3D scene
      this.add3DSnapPointsToScene(result.snapPoints);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown conversion error');
    }

    return result;
  }

  /**
   * Convert 3D geometry back to centerlines
   */
  async convert3DToCenterlines(objectIds: string[]): Promise<ThreeDToCenterlineResult> {
    const result: ThreeDToCenterlineResult = {
      success: true,
      centerlines: [],
      dimensions: [],
      shapes: [],
      errors: [],
      warnings: []
    };

    try {
      for (const objectId of objectIds) {
        const object = this.scene3D.getObject(objectId);
        const metadata = this.scene3D.getObjectMetadata(objectId);
        
        if (!object || !metadata) {
          result.warnings.push(`Object ${objectId} not found`);
          continue;
        }

        // Extract centerline from 3D object
        const centerline = this.extractCenterlineFrom3D(object, metadata);
        const dimensions = this.extractDimensionsFrom3D(object, metadata);
        const shape = this.extractShapeFrom3D(object, metadata);

        if (centerline) {
          result.centerlines.push(centerline);
          result.dimensions.push(dimensions);
          result.shapes.push(shape);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown conversion error');
    }

    return result;
  }

  /**
   * Determine component type from centerline
   */
  private determineComponentType(centerline: Centerline): HVACComponentType {
    switch (centerline.type) {
      case 'straight':
        return HVACComponentType.STRAIGHT_DUCT;
      case 'arc':
        // Determine elbow angle
        const angle = this.calculateElbowAngle(centerline);
        if (Math.abs(angle - 90) < 5) {
          return HVACComponentType.ELBOW_90;
        } else if (Math.abs(angle - 45) < 5) {
          return HVACComponentType.ELBOW_45;
        } else {
          return HVACComponentType.ELBOW_CUSTOM;
        }
      case 'segmented':
        return HVACComponentType.STRAIGHT_DUCT; // Treat as multiple straight sections
      default:
        return HVACComponentType.STRAIGHT_DUCT;
    }
  }

  /**
   * Calculate elbow angle from centerline
   */
  private calculateElbowAngle(centerline: Centerline): number {
    if (centerline.points.length < 3) return 90;
    
    const start = new THREE.Vector3(centerline.points[0].x, centerline.points[0].y, 0);
    const middle = new THREE.Vector3(centerline.points[1].x, centerline.points[1].y, 0);
    const end = new THREE.Vector3(centerline.points[2].x, centerline.points[2].y, 0);
    
    const v1 = start.sub(middle).normalize();
    const v2 = end.sub(middle).normalize();
    
    return v1.angleTo(v2) * 180 / Math.PI;
  }

  /**
   * Extract custom parameters from centerline
   */
  private extractCustomParameters(centerline: Centerline): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (centerline.type === 'straight') {
      const length = this.calculateCenterlineLength(centerline);
      params.length = length;
    } else if (centerline.type === 'arc') {
      params.radius = centerline.radius || 12;
      params.angle = this.calculateElbowAngle(centerline);
    }
    
    return params;
  }

  /**
   * Calculate centerline length
   */
  private calculateCenterlineLength(centerline: Centerline): number {
    let totalLength = 0;
    
    for (let i = 0; i < centerline.points.length - 1; i++) {
      const p1 = centerline.points[i];
      const p2 = centerline.points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalLength;
  }

  /**
   * Position 3D mesh based on centerline
   */
  private positionMeshFromCenterline(mesh: THREE.Mesh, centerline: Centerline): void {
    if (centerline.points.length === 0) return;
    
    // Calculate centerline center
    const center = new THREE.Vector3();
    centerline.points.forEach(point => {
      center.add(new THREE.Vector3(point.x, point.y, 0));
    });
    center.divideScalar(centerline.points.length);
    
    // Position mesh at centerline center
    mesh.position.copy(center);
    
    // Orient mesh based on centerline direction
    if (centerline.points.length >= 2) {
      const start = new THREE.Vector3(centerline.points[0].x, centerline.points[0].y, 0);
      const end = new THREE.Vector3(centerline.points[centerline.points.length - 1].x, centerline.points[centerline.points.length - 1].y, 0);
      const direction = end.sub(start).normalize();
      
      // Calculate rotation to align with direction
      const up = new THREE.Vector3(0, 0, 1);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      mesh.setRotationFromQuaternion(quaternion);
    }
  }

  /**
   * Generate 3D snap points from mesh
   */
  private generate3DSnapPoints(mesh: THREE.Mesh, centerlineId: string): SnapPoint3D[] {
    const snapPoints: SnapPoint3D[] = [];
    
    // Get mesh geometry
    const geometry = mesh.geometry;
    if (!geometry.attributes.position) return snapPoints;
    
    const positions = geometry.attributes.position.array;
    const vertices: THREE.Vector3[] = [];
    
    // Extract vertices
    for (let i = 0; i < positions.length; i += 3) {
      vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    
    // Generate vertex snap points
    vertices.forEach((vertex, index) => {
      const worldPosition = vertex.clone().applyMatrix4(mesh.matrixWorld);
      
      snapPoints.push({
        id: `snap3d_${centerlineId}_vertex_${index}`,
        type: SnapPoint3DType.VERTEX,
        position: worldPosition,
        objectId: `mesh_${centerlineId}`,
        metadata: { centerlineId, vertexIndex: index },
        priority: 1,
        isVisible: true
      });
    });
    
    // Generate face center snap points
    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const v1 = vertices[indices[i]];
        const v2 = vertices[indices[i + 1]];
        const v3 = vertices[indices[i + 2]];
        
        const faceCenter = new THREE.Vector3()
          .add(v1)
          .add(v2)
          .add(v3)
          .divideScalar(3)
          .applyMatrix4(mesh.matrixWorld);
        
        snapPoints.push({
          id: `snap3d_${centerlineId}_face_${i / 3}`,
          type: SnapPoint3DType.FACE_CENTER,
          position: faceCenter,
          objectId: `mesh_${centerlineId}`,
          metadata: { centerlineId, faceIndex: i / 3 },
          priority: 2,
          isVisible: false // Hidden by default
        });
      }
    }
    
    // Generate object center snap point
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const objectCenter = boundingBox.getCenter(new THREE.Vector3());
    
    snapPoints.push({
      id: `snap3d_${centerlineId}_center`,
      type: SnapPoint3DType.OBJECT_CENTER,
      position: objectCenter,
      objectId: `mesh_${centerlineId}`,
      metadata: { centerlineId },
      priority: 3,
      isVisible: true
    });
    
    return snapPoints;
  }

  /**
   * Add 3D snap points to scene
   */
  private add3DSnapPointsToScene(snapPoints: SnapPoint3D[]): void {
    snapPoints.forEach(snapPoint => {
      this.snapPoints3D.set(snapPoint.id, snapPoint);
      
      if (snapPoint.isVisible) {
        const visual = this.create3DSnapPointVisual(snapPoint);
        this.snapPointObjects.set(snapPoint.id, visual);
        this.scene3D.addObject(visual, {
          id: `visual_${snapPoint.id}`,
          name: `Snap Point ${snapPoint.type}`,
          type: 'snap_point',
          layer: SceneLayer.HELPERS,
          visibility: 'visible' as any,
          selectable: false,
          userData: { snapPointId: snapPoint.id }
        });
      }
    });
  }

  /**
   * Create 3D snap point visual
   */
  private create3DSnapPointVisual(snapPoint: SnapPoint3D): THREE.Object3D {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    
    switch (snapPoint.type) {
      case SnapPoint3DType.VERTEX:
        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        break;
      case SnapPoint3DType.FACE_CENTER:
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        break;
      case SnapPoint3DType.OBJECT_CENTER:
        geometry = new THREE.OctahedronGeometry(1);
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        break;
      default:
        geometry = new THREE.SphereGeometry(0.3, 6, 6);
        material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(snapPoint.position);
    
    return mesh;
  }

  /**
   * Extract centerline from 3D object
   */
  private extractCenterlineFrom3D(object: THREE.Object3D, metadata: any): Centerline | null {
    const centerlineId = metadata.userData?.centerlineId;
    if (!centerlineId) return null;
    
    // Get original centerline from metadata or reconstruct from geometry
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Create simplified centerline (in real implementation, this would be more sophisticated)
    const centerline: Centerline = {
      id: centerlineId,
      type: 'straight',
      points: [
        { x: center.x - size.z / 2, y: center.y },
        { x: center.x + size.z / 2, y: center.y }
      ],
      isComplete: true,
      isSMACNACompliant: true,
      warnings: [],
      metadata: {
        totalLength: size.z,
        segmentCount: 1,
        hasArcs: false,
        createdAt: new Date(),
        lastModified: new Date()
      }
    };
    
    return centerline;
  }

  /**
   * Extract dimensions from 3D object
   */
  private extractDimensionsFrom3D(object: THREE.Object3D, metadata: any): DuctDimensions {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const size = boundingBox.getSize(new THREE.Vector3());
    
    return {
      width: size.x,
      height: size.y
    };
  }

  /**
   * Extract shape from 3D object
   */
  private extractShapeFrom3D(object: THREE.Object3D, metadata: any): DuctShape {
    // Determine shape from geometry or metadata
    return metadata.userData?.shape || DuctShape.RECTANGULAR;
  }

  /**
   * Perform synchronization between 2D and 3D
   */
  private async performSync(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    this.lastSyncTime = Date.now();
    
    try {
      // Check for pending changes
      if (this.pendingChanges.size > 0) {
        // Process pending changes
        await this.processPendingChanges();
        this.pendingChanges.clear();
      }
      
      // Validate synchronization if enabled
      if (this.config.validateOnSync) {
        await this.validateSynchronization();
      }
      
      // Trigger completion callback
      if (this.onSyncComplete) {
        this.onSyncComplete({ success: true, timestamp: this.lastSyncTime });
      }
      
    } catch (error) {
      console.error('Synchronization error:', error);
      if (this.onSyncComplete) {
        this.onSyncComplete({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process pending changes
   */
  private async processPendingChanges(): Promise<void> {
    // Implementation would process actual changes
    console.log('Processing pending changes:', Array.from(this.pendingChanges));
  }

  /**
   * Validate synchronization
   */
  private async validateSynchronization(): Promise<void> {
    // Implementation would validate that 2D and 3D are in sync
    console.log('Validating synchronization');
  }

  /**
   * Get 3D snap points near position
   */
  get3DSnapPointsNear(position: THREE.Vector3, radius: number = 5): SnapPoint3D[] {
    const nearbyPoints: SnapPoint3D[] = [];
    
    this.snapPoints3D.forEach(snapPoint => {
      const distance = position.distanceTo(snapPoint.position);
      if (distance <= radius) {
        nearbyPoints.push(snapPoint);
      }
    });
    
    // Sort by distance and priority
    nearbyPoints.sort((a, b) => {
      const distA = position.distanceTo(a.position);
      const distB = position.distanceTo(b.position);
      
      if (Math.abs(distA - distB) < 0.1) {
        return a.priority - b.priority;
      }
      return distA - distB;
    });
    
    return nearbyPoints;
  }

  /**
   * Set synchronization callback
   */
  onSynchronizationComplete(callback: (result: any) => void): void {
    this.onSyncComplete = callback;
  }

  /**
   * Set conflict detection callback
   */
  onConflictDetection(callback: (conflict: any) => void): void {
    this.onConflictDetected = callback;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (!this.config.enableRealTimeSync) {
      this.syncInProgress = false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Get synchronization statistics
   */
  getSyncStatistics(): {
    lastSyncTime: number;
    syncInProgress: boolean;
    pendingChanges: number;
    total3DObjects: number;
    totalSnapPoints: number;
  } {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      pendingChanges: this.pendingChanges.size,
      total3DObjects: this.centerlineTo3DMap.size,
      totalSnapPoints: this.snapPoints3D.size
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.syncInProgress = false;
    this.pendingChanges.clear();
    
    // Remove 3D snap point visuals
    this.snapPointObjects.forEach(object => {
      this.renderer3D.getScene().remove(object);
    });
    this.snapPointObjects.clear();
    this.snapPoints3D.clear();
    
    // Clear mappings
    this.centerlineTo3DMap.clear();
    this.threeDToCenterlineMap.clear();
  }
}
