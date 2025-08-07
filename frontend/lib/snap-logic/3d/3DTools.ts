/**
 * Interactive 3D Visualization Tools
 * SizeWise Suite - Advanced Visualization Priority Group
 * 
 * Comprehensive interactive 3D tools including section views, measurement tools,
 * annotation systems, and real-time editing capabilities for professional HVAC
 * engineering workflows. Provides professional-grade 3D interaction and analysis
 * tools for ductwork visualization and design validation.
 * 
 * @fileoverview Interactive 3D visualization tools and utilities
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import * as THREE from 'three';
import { Renderer3D } from './3DRenderer';
import { Scene3D, SceneLayer } from './Scene3D';
import { Camera3D } from './Camera3D';

/**
 * 3D tool types
 */
export enum Tool3DType {
  SELECT = 'select',
  MEASURE_DISTANCE = 'measure_distance',
  MEASURE_ANGLE = 'measure_angle',
  MEASURE_AREA = 'measure_area',
  SECTION_VIEW = 'section_view',
  ANNOTATION = 'annotation',
  WALKTHROUGH = 'walkthrough',
  EXPLODED_VIEW = 'exploded_view',
  TRANSPARENCY = 'transparency',
  CLIPPING_PLANE = 'clipping_plane'
}

/**
 * Measurement types
 */
export enum MeasurementType {
  LINEAR = 'linear',
  ANGULAR = 'angular',
  AREA = 'area',
  VOLUME = 'volume',
  RADIUS = 'radius',
  DIAMETER = 'diameter'
}

/**
 * Measurement result
 */
export interface MeasurementResult {
  id: string;
  type: MeasurementType;
  value: number;
  unit: string;
  points: THREE.Vector3[];
  label: string;
  precision: number;
  metadata: Record<string, any>;
}

/**
 * Annotation data
 */
export interface Annotation3D {
  id: string;
  position: THREE.Vector3;
  text: string;
  type: 'note' | 'dimension' | 'warning' | 'specification';
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    borderColor: string;
    opacity: number;
  };
  attachedObjectId?: string;
  visible: boolean;
  metadata: Record<string, any>;
}

/**
 * Section view configuration
 */
export interface SectionViewConfig {
  id: string;
  name: string;
  plane: THREE.Plane;
  showCutSurface: boolean;
  cutSurfaceColor: string;
  showHatchPattern: boolean;
  hatchPattern: 'solid' | 'diagonal' | 'cross' | 'dots';
  enabled: boolean;
}

/**
 * 3D tools configuration
 */
export interface Tools3DConfig {
  enableMeasurements: boolean;
  enableAnnotations: boolean;
  enableSectionViews: boolean;
  measurementPrecision: number;
  annotationFontSize: number;
  selectionColor: string;
  highlightColor: string;
  measurementColor: string;
  annotationColor: string;
  sectionViewColor: string;
}

/**
 * Default 3D tools configuration
 */
const DEFAULT_TOOLS_CONFIG: Tools3DConfig = {
  enableMeasurements: true,
  enableAnnotations: true,
  enableSectionViews: true,
  measurementPrecision: 2,
  annotationFontSize: 14,
  selectionColor: '#ffff00',
  highlightColor: '#ff6600',
  measurementColor: '#00ff00',
  annotationColor: '#ffffff',
  sectionViewColor: '#ff0000'
};

/**
 * Interactive 3D tools manager
 */
export class Tools3D {
  private config: Tools3DConfig;
  private renderer: Renderer3D;
  private scene3D: Scene3D;
  private camera3D: Camera3D;
  
  // Current tool state
  private activeTool: Tool3DType = Tool3DType.SELECT;
  private isToolActive: boolean = false;
  
  // Measurements
  private measurements: Map<string, MeasurementResult> = new Map();
  private measurementObjects: Map<string, THREE.Group> = new Map();
  private currentMeasurement: {
    points: THREE.Vector3[];
    tempObjects: THREE.Object3D[];
  } | null = null;
  
  // Annotations
  private annotations: Map<string, Annotation3D> = new Map();
  private annotationObjects: Map<string, THREE.Group> = new Map();
  
  // Section views
  private sectionViews: Map<string, SectionViewConfig> = new Map();
  private clippingPlanes: THREE.Plane[] = [];
  
  // Selection
  private selectedObjects: Set<string> = new Set();
  private selectionBox: THREE.Box3Helper | null = null;
  
  // Raycaster for interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  constructor(
    renderer: Renderer3D,
    scene3D: Scene3D,
    camera3D: Camera3D,
    config?: Partial<Tools3DConfig>
  ) {
    this.config = { ...DEFAULT_TOOLS_CONFIG, ...config };
    this.renderer = renderer;
    this.scene3D = scene3D;
    this.camera3D = camera3D;
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    const canvas = this.renderer.getRenderer().domElement;
    
    canvas.addEventListener('click', this.onCanvasClick.bind(this));
    canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
    canvas.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  /**
   * Handle canvas click events
   */
  private onCanvasClick(event: MouseEvent): void {
    this.updateMousePosition(event);
    
    switch (this.activeTool) {
      case Tool3DType.SELECT:
        this.handleSelection();
        break;
      case Tool3DType.MEASURE_DISTANCE:
        this.handleDistanceMeasurement();
        break;
      case Tool3DType.MEASURE_ANGLE:
        this.handleAngleMeasurement();
        break;
      case Tool3DType.ANNOTATION:
        this.handleAnnotationPlacement();
        break;
      case Tool3DType.SECTION_VIEW:
        this.handleSectionViewPlacement();
        break;
    }
  }

  /**
   * Handle canvas mouse move events
   */
  private onCanvasMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);
    
    if (this.currentMeasurement && this.currentMeasurement.points.length > 0) {
      this.updateMeasurementPreview();
    }
  }

  /**
   * Handle keyboard events
   */
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.cancelCurrentOperation();
        break;
      case 'Delete':
        this.deleteSelected();
        break;
      case 'Enter':
        this.confirmCurrentOperation();
        break;
    }
  }

  /**
   * Update mouse position for raycasting
   */
  private updateMousePosition(event: MouseEvent): void {
    const canvas = this.renderer.getRenderer().domElement;
    const rect = canvas.getBoundingClientRect();
    
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Perform raycast to find intersections
   */
  private raycast(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera3D.getCamera());
    const scene = this.renderer.getScene();
    return this.raycaster.intersectObjects(scene.children, true);
  }

  /**
   * Set active tool
   */
  setActiveTool(tool: Tool3DType): void {
    this.cancelCurrentOperation();
    this.activeTool = tool;
    this.isToolActive = true;
  }

  /**
   * Handle object selection
   */
  private handleSelection(): void {
    const intersections = this.raycast();
    
    if (intersections.length > 0) {
      const object = intersections[0].object;
      const objectId = object.userData?.id;
      
      if (objectId) {
        if (this.selectedObjects.has(objectId)) {
          this.deselectObject(objectId);
        } else {
          this.selectObject(objectId);
        }
      }
    } else {
      this.clearSelection();
    }
  }

  /**
   * Select object
   */
  selectObject(objectId: string): void {
    this.selectedObjects.add(objectId);
    this.scene3D.selectObjects([objectId]);
    this.updateSelectionBox();
  }

  /**
   * Deselect object
   */
  deselectObject(objectId: string): void {
    this.selectedObjects.delete(objectId);
    this.updateSelectionBox();
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedObjects.clear();
    this.scene3D.clearSelection();
    this.hideSelectionBox();
  }

  /**
   * Update selection box
   */
  private updateSelectionBox(): void {
    if (this.selectedObjects.size === 0) {
      this.hideSelectionBox();
      return;
    }

    // Calculate combined bounding box
    const combinedBox = new THREE.Box3();
    this.selectedObjects.forEach(objectId => {
      const object = this.scene3D.getObject(objectId);
      if (object) {
        const objectBox = new THREE.Box3().setFromObject(object);
        combinedBox.union(objectBox);
      }
    });

    // Create or update selection box
    if (this.selectionBox) {
      this.renderer.getScene().remove(this.selectionBox);
    }

    this.selectionBox = new THREE.Box3Helper(combinedBox, new THREE.Color(this.config.selectionColor));
    this.renderer.getScene().add(this.selectionBox);
  }

  /**
   * Hide selection box
   */
  private hideSelectionBox(): void {
    if (this.selectionBox) {
      this.renderer.getScene().remove(this.selectionBox);
      this.selectionBox = null;
    }
  }

  /**
   * Handle distance measurement
   */
  private handleDistanceMeasurement(): void {
    const intersections = this.raycast();
    
    if (intersections.length > 0) {
      const point = intersections[0].point;
      
      if (!this.currentMeasurement) {
        this.currentMeasurement = {
          points: [point],
          tempObjects: []
        };
        this.createMeasurementPoint(point);
      } else if (this.currentMeasurement.points.length === 1) {
        this.currentMeasurement.points.push(point);
        this.completeMeasurement(MeasurementType.LINEAR);
      }
    }
  }

  /**
   * Handle angle measurement
   */
  private handleAngleMeasurement(): void {
    const intersections = this.raycast();
    
    if (intersections.length > 0) {
      const point = intersections[0].point;
      
      if (!this.currentMeasurement) {
        this.currentMeasurement = {
          points: [point],
          tempObjects: []
        };
        this.createMeasurementPoint(point);
      } else if (this.currentMeasurement.points.length < 3) {
        this.currentMeasurement.points.push(point);
        this.createMeasurementPoint(point);
        
        if (this.currentMeasurement.points.length === 3) {
          this.completeMeasurement(MeasurementType.ANGULAR);
        }
      }
    }
  }

  /**
   * Create measurement point visual
   */
  private createMeasurementPoint(point: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: this.config.measurementColor });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    
    this.renderer.getScene().add(sphere);
    this.currentMeasurement?.tempObjects.push(sphere);
  }

  /**
   * Update measurement preview
   */
  private updateMeasurementPreview(): void {
    if (!this.currentMeasurement || this.currentMeasurement.points.length === 0) return;
    
    const intersections = this.raycast();
    if (intersections.length === 0) return;
    
    const currentPoint = intersections[0].point;
    const lastPoint = this.currentMeasurement.points[this.currentMeasurement.points.length - 1];
    
    // Remove previous preview line
    const previewLine = this.currentMeasurement.tempObjects.find(obj => obj.userData.isPreview);
    if (previewLine) {
      this.renderer.getScene().remove(previewLine);
      const index = this.currentMeasurement.tempObjects.indexOf(previewLine);
      this.currentMeasurement.tempObjects.splice(index, 1);
    }
    
    // Create new preview line
    const geometry = new THREE.BufferGeometry().setFromPoints([lastPoint, currentPoint]);
    const material = new THREE.LineBasicMaterial({ 
      color: this.config.measurementColor,
      opacity: 0.5,
      transparent: true
    });
    const line = new THREE.Line(geometry, material);
    line.userData.isPreview = true;
    
    this.renderer.getScene().add(line);
    this.currentMeasurement.tempObjects.push(line);
  }

  /**
   * Complete measurement
   */
  private completeMeasurement(type: MeasurementType): void {
    if (!this.currentMeasurement) return;
    
    const points = this.currentMeasurement.points;
    let value: number;
    let unit: string;
    let label: string;
    
    switch (type) {
      case MeasurementType.LINEAR:
        value = points[0].distanceTo(points[1]);
        unit = 'inches';
        label = `${value.toFixed(this.config.measurementPrecision)}"`;
        break;
      case MeasurementType.ANGULAR:
        const v1 = new THREE.Vector3().subVectors(points[0], points[1]);
        const v2 = new THREE.Vector3().subVectors(points[2], points[1]);
        value = v1.angleTo(v2) * 180 / Math.PI;
        unit = 'degrees';
        label = `${value.toFixed(this.config.measurementPrecision)}°`;
        break;
      default:
        return;
    }
    
    const measurement: MeasurementResult = {
      id: this.generateId(),
      type,
      value,
      unit,
      points: [...points],
      label,
      precision: this.config.measurementPrecision,
      metadata: {}
    };
    
    this.measurements.set(measurement.id, measurement);
    this.createMeasurementVisual(measurement);
    this.clearCurrentMeasurement();
  }

  /**
   * Create measurement visual
   */
  private createMeasurementVisual(measurement: MeasurementResult): void {
    const group = new THREE.Group();
    
    // Create measurement line(s)
    if (measurement.type === MeasurementType.LINEAR) {
      const geometry = new THREE.BufferGeometry().setFromPoints(measurement.points);
      const material = new THREE.LineBasicMaterial({ color: this.config.measurementColor });
      const line = new THREE.Line(geometry, material);
      group.add(line);
    } else if (measurement.type === MeasurementType.ANGULAR) {
      // Create angle arc
      const center = measurement.points[1];
      const v1 = new THREE.Vector3().subVectors(measurement.points[0], center).normalize();
      const v2 = new THREE.Vector3().subVectors(measurement.points[2], center).normalize();
      
      const radius = 5;
      const angle = v1.angleTo(v2);
      const segments = Math.max(8, Math.floor(angle * 16 / Math.PI));
      
      const arcPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentAngle = angle * t;
        const direction = v1.clone().lerp(v2, t).normalize();
        arcPoints.push(center.clone().add(direction.multiplyScalar(radius)));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const material = new THREE.LineBasicMaterial({ color: this.config.measurementColor });
      const arc = new THREE.Line(geometry, material);
      group.add(arc);
    }
    
    // Create label
    this.createMeasurementLabel(measurement, group);
    
    this.measurementObjects.set(measurement.id, group);
    this.renderer.getScene().add(group);
  }

  /**
   * Create measurement label
   */
  private createMeasurementLabel(measurement: MeasurementResult, group: THREE.Group): void {
    // Create text sprite for label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = this.config.annotationFontSize;
    
    context.font = `${fontSize}px Arial`;
    const textWidth = context.measureText(measurement.label).width;
    
    canvas.width = textWidth + 20;
    canvas.height = fontSize + 10;
    
    context.fillStyle = this.config.measurementColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = `${fontSize}px Arial`;
    context.fillText(measurement.label, 10, fontSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    // Position label at midpoint
    const midpoint = new THREE.Vector3();
    measurement.points.forEach(point => midpoint.add(point));
    midpoint.divideScalar(measurement.points.length);
    sprite.position.copy(midpoint);
    sprite.scale.set(canvas.width / 10, canvas.height / 10, 1);
    
    group.add(sprite);
  }

  /**
   * Handle annotation placement
   */
  private handleAnnotationPlacement(): void {
    const intersections = this.raycast();
    
    if (intersections.length > 0) {
      const point = intersections[0].point;
      const objectId = intersections[0].object.userData?.id;
      
      this.createAnnotation(point, 'New Annotation', objectId);
    }
  }

  /**
   * Create annotation
   */
  createAnnotation(
    position: THREE.Vector3,
    text: string,
    attachedObjectId?: string,
    type: Annotation3D['type'] = 'note'
  ): string {
    const annotation: Annotation3D = {
      id: this.generateId(),
      position: position.clone(),
      text,
      type,
      style: {
        fontSize: this.config.annotationFontSize,
        color: this.config.annotationColor,
        backgroundColor: '#000000',
        borderColor: '#ffffff',
        opacity: 0.8
      },
      attachedObjectId,
      visible: true,
      metadata: {}
    };
    
    this.annotations.set(annotation.id, annotation);
    this.createAnnotationVisual(annotation);
    
    return annotation.id;
  }

  /**
   * Create annotation visual
   */
  private createAnnotationVisual(annotation: Annotation3D): void {
    const group = new THREE.Group();
    
    // Create text sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fontSize = annotation.style.fontSize;
    
    context.font = `${fontSize}px Arial`;
    const lines = annotation.text.split('\n');
    const maxWidth = Math.max(...lines.map(line => context.measureText(line).width));
    
    canvas.width = maxWidth + 20;
    canvas.height = (fontSize + 5) * lines.length + 10;
    
    // Draw background
    context.fillStyle = annotation.style.backgroundColor;
    context.globalAlpha = annotation.style.opacity;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = annotation.style.borderColor;
    context.lineWidth = 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = annotation.style.color;
    context.globalAlpha = 1;
    context.font = `${fontSize}px Arial`;
    lines.forEach((line, index) => {
      context.fillText(line, 10, fontSize + (fontSize + 5) * index);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(annotation.position);
    sprite.scale.set(canvas.width / 10, canvas.height / 10, 1);
    
    group.add(sprite);
    
    // Create connection line if attached to object
    if (annotation.attachedObjectId) {
      const object = this.scene3D.getObject(annotation.attachedObjectId);
      if (object) {
        const objectCenter = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
        const geometry = new THREE.BufferGeometry().setFromPoints([objectCenter, annotation.position]);
        const material = new THREE.LineBasicMaterial({ 
          color: annotation.style.borderColor,
          opacity: 0.5,
          transparent: true
        });
        const line = new THREE.Line(geometry, material);
        group.add(line);
      }
    }
    
    this.annotationObjects.set(annotation.id, group);
    this.renderer.getScene().add(group);
  }

  /**
   * Handle section view placement
   */
  private handleSectionViewPlacement(): void {
    const intersections = this.raycast();
    
    if (intersections.length > 0) {
      const point = intersections[0].point;
      const normal = intersections[0].face?.normal || new THREE.Vector3(0, 1, 0);
      
      this.createSectionView(point, normal);
    }
  }

  /**
   * Create section view
   */
  createSectionView(point: THREE.Vector3, normal: THREE.Vector3): string {
    const sectionView: SectionViewConfig = {
      id: this.generateId(),
      name: `Section ${this.sectionViews.size + 1}`,
      plane: new THREE.Plane(normal.normalize(), -point.dot(normal)),
      showCutSurface: true,
      cutSurfaceColor: this.config.sectionViewColor,
      showHatchPattern: true,
      hatchPattern: 'diagonal',
      enabled: true
    };
    
    this.sectionViews.set(sectionView.id, sectionView);
    this.updateClippingPlanes();
    
    return sectionView.id;
  }

  /**
   * Update clipping planes
   */
  private updateClippingPlanes(): void {
    this.clippingPlanes = [];
    
    this.sectionViews.forEach(sectionView => {
      if (sectionView.enabled) {
        this.clippingPlanes.push(sectionView.plane);
      }
    });
    
    // Apply clipping planes to all materials in the scene
    this.renderer.getScene().traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            material.clippingPlanes = this.clippingPlanes;
          });
        } else {
          object.material.clippingPlanes = this.clippingPlanes;
        }
      }
    });
    
    // Enable clipping planes in renderer
    this.renderer.getRenderer().localClippingEnabled = this.clippingPlanes.length > 0;
  }

  /**
   * Cancel current operation
   */
  private cancelCurrentOperation(): void {
    this.clearCurrentMeasurement();
    this.isToolActive = false;
  }

  /**
   * Confirm current operation
   */
  private confirmCurrentOperation(): void {
    if (this.currentMeasurement && this.currentMeasurement.points.length >= 2) {
      if (this.activeTool === Tool3DType.MEASURE_DISTANCE) {
        this.completeMeasurement(MeasurementType.LINEAR);
      } else if (this.activeTool === Tool3DType.MEASURE_ANGLE && this.currentMeasurement.points.length >= 3) {
        this.completeMeasurement(MeasurementType.ANGULAR);
      }
    }
  }

  /**
   * Clear current measurement
   */
  private clearCurrentMeasurement(): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.tempObjects.forEach(obj => {
        this.renderer.getScene().remove(obj);
      });
      this.currentMeasurement = null;
    }
  }

  /**
   * Delete selected items
   */
  private deleteSelected(): void {
    // Delete selected measurements
    this.measurements.forEach((measurement, id) => {
      if (this.selectedObjects.has(id)) {
        this.deleteMeasurement(id);
      }
    });
    
    // Delete selected annotations
    this.annotations.forEach((annotation, id) => {
      if (this.selectedObjects.has(id)) {
        this.deleteAnnotation(id);
      }
    });
    
    this.clearSelection();
  }

  /**
   * Delete measurement
   */
  deleteMeasurement(id: string): void {
    const measurementObject = this.measurementObjects.get(id);
    if (measurementObject) {
      this.renderer.getScene().remove(measurementObject);
      this.measurementObjects.delete(id);
    }
    this.measurements.delete(id);
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(id: string): void {
    const annotationObject = this.annotationObjects.get(id);
    if (annotationObject) {
      this.renderer.getScene().remove(annotationObject);
      this.annotationObjects.delete(id);
    }
    this.annotations.delete(id);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): MeasurementResult[] {
    return Array.from(this.measurements.values());
  }

  /**
   * Get all annotations
   */
  getAnnotations(): Annotation3D[] {
    return Array.from(this.annotations.values());
  }

  /**
   * Get all section views
   */
  getSectionViews(): SectionViewConfig[] {
    return Array.from(this.sectionViews.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Tools3DConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Tools3DConfig {
    return { ...this.config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearCurrentMeasurement();
    this.clearSelection();
    
    // Remove all measurement objects
    this.measurementObjects.forEach(object => {
      this.renderer.getScene().remove(object);
    });
    this.measurementObjects.clear();
    this.measurements.clear();
    
    // Remove all annotation objects
    this.annotationObjects.forEach(object => {
      this.renderer.getScene().remove(object);
    });
    this.annotationObjects.clear();
    this.annotations.clear();
    
    // Clear section views
    this.sectionViews.clear();
    this.clippingPlanes = [];
    this.updateClippingPlanes();
  }
}
