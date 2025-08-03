/**
 * HVAC Memory Profiler
 * SizeWise Suite - Phase 4: Performance Optimization
 * 
 * Specialized memory profiling for HVAC 3D components and calculations
 */

import * as THREE from 'three';
import { memoryManager } from './memory-manager';

export interface HVACMemoryProfile {
  ductSegments: number;
  fittings: number;
  equipment: number;
  totalGeometries: number;
  totalMaterials: number;
  totalTextures: number;
  estimatedMemoryMB: number;
  timestamp: number;
  details: {
    ductMemoryMB: number;
    fittingMemoryMB: number;
    equipmentMemoryMB: number;
    materialMemoryMB: number;
    textureMemoryMB: number;
  };
}

export interface MemoryLeakReport {
  isLeakDetected: boolean;
  growthRateMBPerHour: number;
  problematicComponents: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class HVACMemoryProfiler {
  private profiles: HVACMemoryProfile[] = [];
  private maxProfiles = 50;
  private isProfileActive = false;
  private profileInterval?: NodeJS.Timeout;

  /**
   * Start profiling HVAC memory usage
   */
  startProfiling(intervalMs: number = 10000): void {
    if (this.isProfileActive) return;
    
    this.isProfileActive = true;
    this.profileInterval = setInterval(() => {
      const profile = this.captureProfile();
      this.profiles.push(profile);
      
      // Keep only recent profiles
      if (this.profiles.length > this.maxProfiles) {
        this.profiles.shift();
      }
      
      // Check for leaks
      const leakReport = this.detectLeaks();
      if (leakReport.isLeakDetected) {
        this.handleMemoryLeak(leakReport);
      }
    }, intervalMs);
  }

  /**
   * Stop profiling
   */
  stopProfiling(): void {
    if (this.profileInterval) {
      clearInterval(this.profileInterval);
      this.profileInterval = undefined;
    }
    this.isProfileActive = false;
  }

  /**
   * Capture current memory profile
   */
  captureProfile(): HVACMemoryProfile {
    const scene = this.getCurrentScene();
    const analysis = this.analyzeScene(scene);
    
    return {
      ductSegments: analysis.ductSegments,
      fittings: analysis.fittings,
      equipment: analysis.equipment,
      totalGeometries: analysis.totalGeometries,
      totalMaterials: analysis.totalMaterials,
      totalTextures: analysis.totalTextures,
      estimatedMemoryMB: analysis.estimatedMemoryMB,
      timestamp: Date.now(),
      details: {
        ductMemoryMB: analysis.ductMemoryMB,
        fittingMemoryMB: analysis.fittingMemoryMB,
        equipmentMemoryMB: analysis.equipmentMemoryMB,
        materialMemoryMB: analysis.materialMemoryMB,
        textureMemoryMB: analysis.textureMemoryMB
      }
    };
  }

  /**
   * Analyze Three.js scene for HVAC components
   */
  private analyzeScene(scene: THREE.Scene | null) {
    const analysis = {
      ductSegments: 0,
      fittings: 0,
      equipment: 0,
      totalGeometries: 0,
      totalMaterials: 0,
      totalTextures: 0,
      estimatedMemoryMB: 0,
      ductMemoryMB: 0,
      fittingMemoryMB: 0,
      equipmentMemoryMB: 0,
      materialMemoryMB: 0,
      textureMemoryMB: 0
    };

    if (!scene) return analysis;

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Categorize by userData or naming convention
        const category = this.categorizeHVACObject(object);
        
        // Count geometries
        if (object.geometry) {
          geometries.add(object.geometry);
          const memoryMB = this.estimateGeometryMemory(object.geometry);
          
          switch (category) {
            case 'duct':
              analysis.ductSegments++;
              analysis.ductMemoryMB += memoryMB;
              break;
            case 'fitting':
              analysis.fittings++;
              analysis.fittingMemoryMB += memoryMB;
              break;
            case 'equipment':
              analysis.equipment++;
              analysis.equipmentMemoryMB += memoryMB;
              break;
          }
        }

        // Count materials and textures
        if (object.material) {
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach(material => {
            materials.add(material);
            this.extractTextures(material, textures);
          });
        }
      }
    });

    analysis.totalGeometries = geometries.size;
    analysis.totalMaterials = materials.size;
    analysis.totalTextures = textures.size;

    // Calculate material memory
    materials.forEach(material => {
      analysis.materialMemoryMB += this.estimateMaterialMemory(material);
    });

    // Calculate texture memory
    textures.forEach(texture => {
      analysis.textureMemoryMB += this.estimateTextureMemory(texture);
    });

    analysis.estimatedMemoryMB = 
      analysis.ductMemoryMB + 
      analysis.fittingMemoryMB + 
      analysis.equipmentMemoryMB + 
      analysis.materialMemoryMB + 
      analysis.textureMemoryMB;

    return analysis;
  }

  /**
   * Categorize HVAC objects based on userData or naming
   */
  private categorizeHVACObject(object: THREE.Object3D): 'duct' | 'fitting' | 'equipment' | 'other' {
    const userData = object.userData;
    const name = object.name.toLowerCase();

    if (userData.type === 'duct' || name.includes('duct') || name.includes('segment')) {
      return 'duct';
    }
    if (userData.type === 'fitting' || name.includes('fitting') || name.includes('elbow') || name.includes('transition')) {
      return 'fitting';
    }
    if (userData.type === 'equipment' || name.includes('equipment') || name.includes('unit') || name.includes('fan')) {
      return 'equipment';
    }
    return 'other';
  }

  /**
   * Extract textures from material
   */
  private extractTextures(material: THREE.Material, textureSet: Set<THREE.Texture>): void {
    if (material instanceof THREE.MeshStandardMaterial || 
        material instanceof THREE.MeshBasicMaterial ||
        material instanceof THREE.MeshPhongMaterial) {
      
      const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 
                           'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];
      
      textureProps.forEach(prop => {
        const texture = (material as any)[prop];
        if (texture instanceof THREE.Texture) {
          textureSet.add(texture);
        }
      });
    }
  }

  /**
   * Estimate geometry memory usage in MB
   */
  private estimateGeometryMemory(geometry: THREE.BufferGeometry): number {
    let bytes = 0;
    
    Object.values(geometry.attributes).forEach(attribute => {
      bytes += attribute.array.byteLength;
    });
    
    if (geometry.index) {
      bytes += geometry.index.array.byteLength;
    }
    
    return bytes / (1024 * 1024);
  }

  /**
   * Estimate material memory usage in MB
   */
  private estimateMaterialMemory(material: THREE.Material): number {
    // Base material overhead
    return 0.001; // ~1KB per material
  }

  /**
   * Estimate texture memory usage in MB
   */
  private estimateTextureMemory(texture: THREE.Texture): number {
    if (!texture.image) return 0;
    
    const width = texture.image.width || 512;
    const height = texture.image.height || 512;
    const channels = 4; // RGBA
    const bytesPerChannel = 1; // 8-bit
    
    return (width * height * channels * bytesPerChannel) / (1024 * 1024);
  }

  /**
   * Get current Three.js scene (implementation depends on app structure)
   */
  private getCurrentScene(): THREE.Scene | null {
    // This would need to be implemented based on how scenes are managed
    // For now, return null and handle gracefully
    return null;
  }

  /**
   * Detect memory leaks based on profile history
   */
  detectLeaks(): MemoryLeakReport {
    if (this.profiles.length < 5) {
      return {
        isLeakDetected: false,
        growthRateMBPerHour: 0,
        problematicComponents: [],
        recommendations: [],
        severity: 'low'
      };
    }

    const recent = this.profiles.slice(-10);
    const growthRate = this.calculateGrowthRate(recent);
    const problematicComponents = this.identifyProblematicComponents(recent);
    
    const isLeakDetected = growthRate > 10; // 10MB/hour threshold
    const severity = this.calculateSeverity(growthRate);
    const recommendations = this.generateRecommendations(growthRate, problematicComponents);

    return {
      isLeakDetected,
      growthRateMBPerHour: growthRate,
      problematicComponents,
      recommendations,
      severity
    };
  }

  /**
   * Calculate memory growth rate in MB/hour
   */
  private calculateGrowthRate(profiles: HVACMemoryProfile[]): number {
    if (profiles.length < 2) return 0;
    
    const first = profiles[0];
    const last = profiles[profiles.length - 1];
    
    const memoryDiff = last.estimatedMemoryMB - first.estimatedMemoryMB;
    const timeDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60); // hours
    
    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }

  /**
   * Identify components with unusual memory growth
   */
  private identifyProblematicComponents(profiles: HVACMemoryProfile[]): string[] {
    const problematic: string[] = [];
    
    if (profiles.length < 2) return problematic;
    
    const first = profiles[0];
    const last = profiles[profiles.length - 1];
    
    // Check each component type for unusual growth
    const ductGrowth = last.details.ductMemoryMB - first.details.ductMemoryMB;
    const fittingGrowth = last.details.fittingMemoryMB - first.details.fittingMemoryMB;
    const equipmentGrowth = last.details.equipmentMemoryMB - first.details.equipmentMemoryMB;
    const materialGrowth = last.details.materialMemoryMB - first.details.materialMemoryMB;
    const textureGrowth = last.details.textureMemoryMB - first.details.textureMemoryMB;
    
    if (ductGrowth > 5) problematic.push('Duct Segments');
    if (fittingGrowth > 5) problematic.push('Fittings');
    if (equipmentGrowth > 5) problematic.push('Equipment');
    if (materialGrowth > 2) problematic.push('Materials');
    if (textureGrowth > 10) problematic.push('Textures');
    
    return problematic;
  }

  /**
   * Calculate severity based on growth rate
   */
  private calculateSeverity(growthRate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (growthRate > 50) return 'critical';
    if (growthRate > 25) return 'high';
    if (growthRate > 10) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(growthRate: number, problematicComponents: string[]): string[] {
    const recommendations: string[] = [];
    
    if (growthRate > 10) {
      recommendations.push('Consider implementing object pooling for frequently created/destroyed objects');
      recommendations.push('Review geometry disposal patterns in component unmount handlers');
    }
    
    if (problematicComponents.includes('Textures')) {
      recommendations.push('Implement texture atlasing to reduce texture count');
      recommendations.push('Use texture compression and mipmapping');
    }
    
    if (problematicComponents.includes('Materials')) {
      recommendations.push('Share materials between similar objects');
      recommendations.push('Dispose materials when no longer needed');
    }
    
    if (problematicComponents.includes('Duct Segments')) {
      recommendations.push('Implement LOD (Level of Detail) for distant duct segments');
      recommendations.push('Use instanced rendering for repeated duct geometries');
    }
    
    return recommendations;
  }

  /**
   * Handle detected memory leak
   */
  private handleMemoryLeak(report: MemoryLeakReport): void {
    console.warn('Memory leak detected in HVAC components:', report);
    
    if (report.severity === 'critical') {
      // Force cleanup
      memoryManager.forceCleanup();
    }
    
    // Emit event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hvac-memory-leak', { detail: report }));
    }
  }

  /**
   * Get profiling report
   */
  getReport(): {
    currentProfile: HVACMemoryProfile | null;
    profileHistory: HVACMemoryProfile[];
    leakReport: MemoryLeakReport;
    isProfileActive: boolean;
  } {
    return {
      currentProfile: this.profiles[this.profiles.length - 1] || null,
      profileHistory: this.profiles.slice(-20), // Last 20 profiles
      leakReport: this.detectLeaks(),
      isProfileActive: this.isProfileActive
    };
  }

  /**
   * Clear profile history
   */
  clearHistory(): void {
    this.profiles = [];
  }
}

// Export singleton instance
export const hvacMemoryProfiler = new HVACMemoryProfiler();
