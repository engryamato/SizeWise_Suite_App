/**
 * 3D Material System for Duct Fittings
 * Advanced material appearance system with proper metallic shaders
 */

import * as THREE from 'three';
import { MaterialType, MATERIAL_PROPERTIES } from './smacna-gauge-tables';

export interface MaterialConfig {
  color: number;
  metalness: number;
  roughness: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  normalScale?: number;
  bumpScale?: number;
}

export interface MaterialTextures {
  diffuse?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  metalness?: THREE.Texture;
  bump?: THREE.Texture;
  envMap?: THREE.Texture | THREE.CubeTexture;
  aoMap?: THREE.Texture;
}

export class MaterialSystem {
  private materials: Map<string, THREE.Material>;
  private textures: Map<string, MaterialTextures>;
  private envMap: THREE.CubeTexture | null = null;

  constructor() {
    this.materials = new Map();
    this.textures = new Map();
    this.initializeBaseMaterials();
  }

  /**
   * Initialize base materials for all material types
   */
  private initializeBaseMaterials(): void {
    // Galvanized Steel
    this.createMaterial('galvanized_steel', {
      color: 0xc0c0c0,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.2
    });

    // Aluminum
    this.createMaterial('aluminum', {
      color: 0xb8c6db,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.2,
      clearcoat: 0.05,
      clearcoatRoughness: 0.1
    });

    // Stainless Steel
    this.createMaterial('stainless_steel', {
      color: 0xe8e8e8,
      metalness: 0.95,
      roughness: 0.1,
      envMapIntensity: 1.5,
      clearcoat: 0.2,
      clearcoatRoughness: 0.05
    });

    // Weathered variants
    this.createWeatheredVariants();
    
    // Painted variants
    this.createPaintedVariants();
  }

  /**
   * Create weathered material variants
   */
  private createWeatheredVariants(): void {
    this.createMaterial('galvanized_steel_weathered', {
      color: 0x9a9a9a,
      metalness: 0.6,
      roughness: 0.5,
      envMapIntensity: 0.7
    });

    this.createMaterial('aluminum_weathered', {
      color: 0xa0a8b5,
      metalness: 0.7,
      roughness: 0.4,
      envMapIntensity: 0.8
    });

    this.createMaterial('stainless_steel_weathered', {
      color: 0xd0d0d0,
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0
    });
  }

  /**
   * Create painted material variants
   */
  private createPaintedVariants(): void {
    // White painted
    this.createMaterial('painted_white', {
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.6,
      envMapIntensity: 0.3
    });

    // Gray painted
    this.createMaterial('painted_gray', {
      color: 0x808080,
      metalness: 0.1,
      roughness: 0.5,
      envMapIntensity: 0.4
    });

    // Black painted
    this.createMaterial('painted_black', {
      color: 0x2a2a2a,
      metalness: 0.2,
      roughness: 0.4,
      envMapIntensity: 0.5
    });
  }

  /**
   * Create a material with the given configuration
   */
  createMaterial(name: string, config: MaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: config.metalness,
      roughness: config.roughness,
      emissive: config.emissive || 0x000000,
      emissiveIntensity: config.emissiveIntensity || 0,
      opacity: config.opacity || 1,
      transparent: config.transparent || false,
      envMapIntensity: config.envMapIntensity || 1,
      side: THREE.DoubleSide // Important for hollow fittings
    });

    // Apply environment map if available
    if (this.envMap) {
      material.envMap = this.envMap;
    }

    // Apply textures if available
    const textures = this.textures.get(name);
    if (textures) {
      this.applyTextures(material, textures);
    }

    this.materials.set(name, material);
    return material;
  }

  /**
   * Apply textures to a material
   */
  private applyTextures(material: THREE.MeshStandardMaterial, textures: MaterialTextures): void {
    if (textures.diffuse) {
      material.map = textures.diffuse;
    }
    if (textures.normal) {
      material.normalMap = textures.normal;
      material.normalScale = new THREE.Vector2(1, 1);
    }
    if (textures.roughness) {
      material.roughnessMap = textures.roughness;
    }
    if (textures.metalness) {
      material.metalnessMap = textures.metalness;
    }
    if (textures.bump) {
      material.bumpMap = textures.bump;
      material.bumpScale = 0.1;
    }
    if (textures.aoMap) {
      material.aoMap = textures.aoMap;
      material.aoMapIntensity = 1.0;
    }
    if (textures.envMap) {
      material.envMap = textures.envMap as any;
    }
  }

  /**
   * Get material by name
   */
  getMaterial(name: string): THREE.Material | undefined {
    return this.materials.get(name);
  }

  /**
   * Get material for a specific material type
   */
  getMaterialForType(materialType: MaterialType, variant?: string): THREE.Material {
    const materialName = variant ? `${materialType}_${variant}` : materialType;
    const material = this.materials.get(materialName);
    
    if (!material) {
      // Fallback to base material
      return this.materials.get(materialType) || this.createDefaultMaterial();
    }
    
    return material;
  }

  /**
   * Create a default fallback material
   */
  private createDefaultMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.5,
      roughness: 0.5
    });
  }

  /**
   * Set environment map for all materials
   */
  setEnvironmentMap(envMap: THREE.CubeTexture): void {
    this.envMap = envMap;
    
    // Apply to all existing materials
    this.materials.forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMap = envMap;
        material.needsUpdate = true;
      }
    });
  }

  /**
   * Load and set textures for a material
   */
  async loadTextures(materialName: string, texturePaths: Partial<Record<keyof MaterialTextures, string>>): Promise<void> {
    const loader = new THREE.TextureLoader();
    const textures: MaterialTextures = {};

    // Load all textures
    const loadPromises = Object.entries(texturePaths).map(async ([type, path]) => {
      if (path) {
        try {
          const texture = await loader.loadAsync(path);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 4); // Adjust based on fitting size
          textures[type as keyof MaterialTextures] = texture;
        } catch (error) {
          console.warn(`Failed to load texture ${type} for ${materialName}:`, error);
        }
      }
    });

    await Promise.all(loadPromises);
    
    // Store textures
    this.textures.set(materialName, textures);
    
    // Apply to existing material if it exists
    const material = this.materials.get(materialName);
    if (material instanceof THREE.MeshStandardMaterial) {
      this.applyTextures(material, textures);
      material.needsUpdate = true;
    }
  }

  /**
   * Create a custom material variant
   */
  createCustomMaterial(name: string, baseMaterial: MaterialType, overrides: Partial<MaterialConfig>): THREE.MeshStandardMaterial {
    const baseConfig = MATERIAL_PROPERTIES[baseMaterial];
    const config: MaterialConfig = {
      color: baseConfig.color,
      metalness: baseConfig.metalness,
      roughness: baseConfig.roughness,
      ...overrides
    };

    return this.createMaterial(name, config);
  }

  /**
   * Update material properties
   */
  updateMaterial(name: string, updates: Partial<MaterialConfig>): void {
    const material = this.materials.get(name);
    if (material instanceof THREE.MeshStandardMaterial) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key in material && value !== undefined) {
          (material as any)[key] = value;
        }
      });
      material.needsUpdate = true;
    }
  }

  /**
   * Clone a material with modifications
   */
  cloneMaterial(sourceName: string, targetName: string, modifications?: Partial<MaterialConfig>): THREE.Material | null {
    const source = this.materials.get(sourceName);
    if (!source) return null;

    const cloned = source.clone();
    
    if (modifications && cloned instanceof THREE.MeshStandardMaterial) {
      Object.entries(modifications).forEach(([key, value]) => {
        if (key in cloned && value !== undefined) {
          (cloned as any)[key] = value;
        }
      });
    }

    this.materials.set(targetName, cloned);
    return cloned;
  }

  /**
   * Get all available material names
   */
  getAvailableMaterials(): string[] {
    return Array.from(this.materials.keys());
  }

  /**
   * Dispose of all materials and textures
   */
  dispose(): void {
    this.materials.forEach((material) => {
      material.dispose();
    });
    
    this.textures.forEach((textureSet) => {
      Object.values(textureSet).forEach((texture) => {
        if (texture) {
          texture.dispose();
        }
      });
    });

    this.materials.clear();
    this.textures.clear();
  }

  /**
   * Create material presets for different environments
   */
  static createEnvironmentPresets() {
    return {
      indoor: {
        envMapIntensity: 0.8,
        roughnessAdjustment: 0.1
      },
      outdoor: {
        envMapIntensity: 1.2,
        roughnessAdjustment: 0.2
      },
      industrial: {
        envMapIntensity: 0.6,
        roughnessAdjustment: 0.3
      }
    };
  }
}

// Export singleton instance
export const materialSystem = new MaterialSystem();
