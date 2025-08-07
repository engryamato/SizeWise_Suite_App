/**
 * Memory Manager for Three.js Components
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Comprehensive memory leak detection and prevention system for 3D visualization.
 */

import * as THREE from 'three';

export interface MemoryStats {
  geometries: number;
  materials: number;
  textures: number;
  programs: number;
  totalMemoryMB: number;
  timestamp: number;
}

export interface DisposableResource {
  dispose(): void;
  uuid?: string;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private trackedResources = new WeakMap<DisposableResource, string>();
  private resourceRegistry = new Map<string, DisposableResource>();
  private memorySnapshots: MemoryStats[] = [];
  private maxSnapshots = 100;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.setupMemoryMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Track a disposable resource for memory management
   */
  track<T extends DisposableResource>(resource: T, name?: string): T {
    const resourceName = name || `${resource.constructor.name}_${Date.now()}`;
    this.trackedResources.set(resource, resourceName);
    this.resourceRegistry.set(resourceName, resource);
    return resource;
  }

  /**
   * Safely dispose of a resource and remove from tracking
   */
  dispose(resource: DisposableResource): void {
    try {
      if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
      
      const name = this.trackedResources.get(resource);
      if (name) {
        this.resourceRegistry.delete(name);
        this.trackedResources.delete(resource);
      }
    } catch (error) {
      console.warn('Error disposing resource:', error);
    }
  }

  /**
   * Dispose of all tracked resources
   */
  disposeAll(): void {
    const resources = Array.from(this.resourceRegistry.values());
    resources.forEach(resource => this.dispose(resource));
    this.resourceRegistry.clear();
  }

  /**
   * Safely dispose of Three.js mesh with all its components
   */
  disposeMesh(mesh: THREE.Mesh | THREE.Object3D): void {
    if (!mesh) return;

    // Traverse and dispose all children first
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose geometry
        if (child.geometry) {
          this.dispose(child.geometry);
        }

        // Dispose materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.dispose(material));
          } else {
            this.dispose(child.material);
          }
        }

        // Dispose textures in materials
        this.disposeMaterialTextures(child.material);
      }
    });

    // Remove from parent
    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
  }

  /**
   * Dispose of textures in materials
   */
  private disposeMaterialTextures(material: THREE.Material | THREE.Material[]): void {
    const materials = Array.isArray(material) ? material : [material];
    
    materials.forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial || 
          mat instanceof THREE.MeshBasicMaterial ||
          mat instanceof THREE.MeshPhongMaterial) {
        
        // Dispose common texture properties
        const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 
                             'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];
        
        textureProps.forEach(prop => {
          const texture = (mat as any)[prop];
          if (texture && texture.dispose) {
            this.dispose(texture);
          }
        });
      }
    });
  }

  /**
   * Clean up WebGL renderer resources
   */
  disposeRenderer(renderer: THREE.WebGLRenderer): void {
    if (!renderer) return;

    try {
      // Dispose render targets
      renderer.getRenderTarget()?.dispose();
      
      // Clear WebGL context
      renderer.dispose();
      
      // Force context loss for complete cleanup
      const gl = renderer.getContext();
      if (gl && gl.getExtension('WEBGL_lose_context')) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch (error) {
      console.warn('Error disposing renderer:', error);
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const info = THREE.WebGLRenderer.prototype.info || { memory: {}, render: {} };
    
    return {
      geometries: (info.memory && 'geometries' in info.memory && typeof info.memory.geometries === 'number') ? info.memory.geometries : 0,
      materials: (info.memory && 'materials' in info.memory && typeof info.memory.materials === 'number') ? info.memory.materials : 0,
      textures: (info.memory && 'textures' in info.memory && typeof info.memory.textures === 'number') ? info.memory.textures : 0,
      programs: (info && 'programs' in info && Array.isArray(info.programs)) ? info.programs.length : 0,
      totalMemoryMB: this.estimateMemoryUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Estimate total memory usage in MB
   */
  private estimateMemoryUsage(): number {
    let totalBytes = 0;
    
    // Estimate based on tracked resources
    this.resourceRegistry.forEach(resource => {
      if (resource instanceof THREE.BufferGeometry) {
        totalBytes += this.estimateGeometryMemory(resource);
      } else if (resource instanceof THREE.Texture) {
        totalBytes += this.estimateTextureMemory(resource);
      }
    });
    
    return totalBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * Estimate geometry memory usage
   */
  private estimateGeometryMemory(geometry: THREE.BufferGeometry): number {
    let bytes = 0;
    
    Object.values(geometry.attributes).forEach(attribute => {
      bytes += attribute.array.byteLength;
    });
    
    if (geometry.index) {
      bytes += geometry.index.array.byteLength;
    }
    
    return bytes;
  }

  /**
   * Estimate texture memory usage
   */
  private estimateTextureMemory(texture: THREE.Texture): number {
    if (!texture.image) return 0;
    
    const width = texture.image.width || 512;
    const height = texture.image.height || 512;
    const channels = 4; // RGBA
    const bytesPerChannel = 1; // 8-bit
    
    return width * height * channels * bytesPerChannel;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      this.memorySnapshots.push(stats);
      
      // Keep only recent snapshots
      if (this.memorySnapshots.length > this.maxSnapshots) {
        this.memorySnapshots.shift();
      }
      
      // Check for memory leaks
      this.detectMemoryLeaks();
    }, intervalMs);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.memorySnapshots.length < 10) return;
    
    const recent = this.memorySnapshots.slice(-10);
    const growthRate = this.calculateMemoryGrowthRate(recent);
    
    // Alert if memory growth exceeds 10MB/hour
    const maxGrowthRateMBPerHour = 10;
    if (growthRate > maxGrowthRateMBPerHour) {
      console.warn(`Memory leak detected: ${growthRate.toFixed(2)} MB/hour growth rate`);
      this.triggerGarbageCollection();
    }
  }

  /**
   * Calculate memory growth rate in MB/hour
   */
  private calculateMemoryGrowthRate(snapshots: MemoryStats[]): number {
    if (snapshots.length < 2) return 0;
    
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    
    const memoryDiff = last.totalMemoryMB - first.totalMemoryMB;
    const timeDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60); // hours
    
    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }

  /**
   * Trigger garbage collection if available
   */
  triggerGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Setup memory monitoring for development
   */
  private setupMemoryMonitoring(): void {
    if (process.env.NODE_ENV === 'development') {
      // Monitor memory in development
      this.startMonitoring(10000); // Every 10 seconds
      
      // Add global cleanup function
      if (typeof window !== 'undefined') {
        (window as any).memoryManager = this;
      }
    }
  }

  /**
   * Get memory usage report
   */
  getMemoryReport(): {
    current: MemoryStats;
    history: MemoryStats[];
    growthRate: number;
    trackedResources: number;
  } {
    const current = this.getMemoryStats();
    const growthRate = this.memorySnapshots.length >= 2 
      ? this.calculateMemoryGrowthRate(this.memorySnapshots.slice(-10))
      : 0;
    
    return {
      current,
      history: this.memorySnapshots.slice(-20), // Last 20 snapshots
      growthRate,
      trackedResources: this.resourceRegistry.size
    };
  }

  /**
   * Force cleanup of unused resources
   */
  forceCleanup(): void {
    this.triggerGarbageCollection();
    
    // Clean up any orphaned resources
    const toRemove: string[] = [];
    this.resourceRegistry.forEach((resource, name) => {
      try {
        // Check if resource is still valid
        if (!resource || typeof resource.dispose !== 'function') {
          toRemove.push(name);
        }
      } catch (error) {
        toRemove.push(name);
      }
    });
    
    toRemove.forEach(name => this.resourceRegistry.delete(name));
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
