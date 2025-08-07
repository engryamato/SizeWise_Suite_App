/**
 * Enhanced Project Service
 * 
 * Comprehensive project management with database storage for projects, 
 * duct segments, and fitting segments. Integrates with the 3D fitting system.
 */

import { v4 as uuidv4 } from 'uuid';
import { Project, Segment } from '@/types/air-duct-sizer';
import { SizeWiseDatabase, ProjectSegment } from '@/lib/database/DexieDatabase';
import { DuctNode } from '@/lib/3d-fittings/duct-node';
import { FittingType } from '@/lib/3d-fittings/fitting-interfaces';
import { GaugeType, MaterialType } from '@/lib/3d-fittings/smacna-gauge-tables';

// =============================================================================
// Enhanced Segment Types
// =============================================================================

export interface EnhancedDuctSegment extends Segment {
  // Enhanced properties for 3D fitting integration
  ductNode?: DuctNode;
  material3D?: {
    type: MaterialType;
    gauge: GaugeType;
    finish?: 'standard' | 'painted' | 'weathered';
  };
  geometry3D?: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  connections?: {
    inlet?: string; // Connected segment ID
    outlet?: string; // Connected segment ID
  };
}

export interface EnhancedFittingSegment {
  segment_id: string;
  type: FittingType;
  name: string;
  ductShape: 'round' | 'rectangular' | 'oval';
  dimensions: {
    diameter?: number;
    width?: number;
    height?: number;
  };
  material: {
    type: MaterialType;
    gauge: GaugeType;
    finish?: 'standard' | 'painted' | 'weathered';
  };
  fittingParameters: Record<string, any>;
  geometry3D: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  connections: {
    inlet?: string;
    outlet?: string;
  };
  calculationData?: {
    pressureLoss?: number;
    velocity?: number;
    kFactor?: number;
  };
  validationResults?: {
    warnings: string[];
    recommendations: string[];
    complianceStatus: 'compliant' | 'warning' | 'error';
  };
}

export interface EnhancedProject extends Project {
  ductSegments?: EnhancedDuctSegment[];
  fittingSegments?: EnhancedFittingSegment[];
  projectSettings?: {
    units: 'imperial' | 'metric';
    defaultMaterial: MaterialType;
    defaultGauge: GaugeType;
    autoValidation: boolean;
    autoOptimization: boolean;
  };
}

// =============================================================================
// Enhanced Project Service
// =============================================================================

export class EnhancedProjectService {
  private db: SizeWiseDatabase;
  private currentUserId: string;

  constructor(db: SizeWiseDatabase, userId: string) {
    this.db = db;
    this.currentUserId = userId;
  }

  // =============================================================================
  // Project Management
  // =============================================================================

  async saveProject(project: EnhancedProject): Promise<void> {
    try {
      // Ensure project has required fields
      const projectToSave = {
        ...project,
        id: project.id || uuidv4(),
        last_modified: new Date().toISOString(),
        created_at: project.created_at || new Date().toISOString()
      };

      // Save main project data
      await this.db.createProject({
        uuid: projectToSave.id,
        project_name: projectToSave.project_name,
        user_name: this.currentUserId,
        project_location: projectToSave.project_location || '',
        codes: projectToSave.codes || [],
        created_at: projectToSave.created_at,
        last_modified: projectToSave.last_modified,
        rooms: projectToSave.rooms || [],
        segments: projectToSave.segments || [],
        equipment: projectToSave.equipment || [],
        computational_properties: projectToSave.computational_properties
      });

      // Save duct segments separately
      if (projectToSave.ductSegments && projectToSave.ductSegments.length > 0) {
        await this.saveDuctSegments(projectToSave.id, projectToSave.ductSegments);
      }

      // Save fitting segments separately
      if (projectToSave.fittingSegments && projectToSave.fittingSegments.length > 0) {
        await this.saveFittingSegments(projectToSave.id, projectToSave.fittingSegments);
      }

      console.log(`✅ Project saved successfully: ${projectToSave.project_name}`);
    } catch (error) {
      console.error('❌ Failed to save project:', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadProject(projectId: string): Promise<EnhancedProject | null> {
    try {
      // Load main project data
      const project = await this.db.getProject(projectId);
      if (!project) {
        return null;
      }

      // Load duct segments
      const ductSegments = await this.loadDuctSegments(projectId);

      // Load fitting segments
      const fittingSegments = await this.loadFittingSegments(projectId);

      return {
        ...project,
        id: project.uuid, // Use UUID as the string ID
        ductSegments,
        fittingSegments
      };
    } catch (error) {
      console.error('❌ Failed to load project:', error);
      throw new Error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // Duct Segment Management
  // =============================================================================

  async addDuctSegment(segment: EnhancedDuctSegment): Promise<void> {
    try {
      const segmentRecord: Omit<ProjectSegment, 'id' | 'lastModified' | 'syncStatus'> = {
        uuid: segment.segment_id,
        projectUuid: segment.segment_id.split('-')[0] || 'unknown', // Extract project ID from segment ID
        segmentType: 'duct',
        name: `Duct ${segment.segment_id}`,
        calculationData: {
          type: segment.type,
          material: segment.material,
          size: segment.size,
          length: segment.length,
          airflow: segment.airflow,
          velocity: segment.velocity,
          pressure_loss: segment.pressure_loss,
          warnings: segment.warnings
        },
        geometryData: {
          points: segment.points,
          geometry3D: segment.geometry3D,
          connections: segment.connections,
          ductNode: segment.ductNode ? {
            id: segment.ductNode.id,
            shapeType: segment.ductNode.shapeType,
            dimensions: segment.ductNode.dimensions,
            material: segment.ductNode.material,
            systemProperties: segment.ductNode.systemProperties,
            position: segment.ductNode.position,
            metadata: segment.ductNode.metadata
          } : null
        },
        validationResults: {
          warnings: segment.warnings || [],
          complianceStatus: segment.warnings?.length > 0 ? 'warning' : 'compliant'
        }
      };

      await this.db.saveProjectSegment(segmentRecord);
    } catch (error) {
      console.error('❌ Failed to add duct segment:', error);
      throw new Error(`Failed to add duct segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async saveDuctSegments(projectId: string, segments: EnhancedDuctSegment[]): Promise<void> {
    const segmentRecords: Omit<ProjectSegment, 'id' | 'lastModified' | 'syncStatus'>[] = segments.map(segment => ({
      uuid: segment.segment_id,
      projectUuid: projectId,
      segmentType: 'duct',
      name: `Duct ${segment.segment_id}`,
      calculationData: {
        type: segment.type,
        material: segment.material,
        size: segment.size,
        length: segment.length,
        airflow: segment.airflow,
        velocity: segment.velocity,
        pressure_loss: segment.pressure_loss,
        warnings: segment.warnings
      },
      geometryData: {
        points: segment.points,
        geometry3D: segment.geometry3D,
        connections: segment.connections,
        ductNode: segment.ductNode ? {
          id: segment.ductNode.id,
          shapeType: segment.ductNode.shapeType,
          dimensions: segment.ductNode.dimensions,
          material: segment.ductNode.material,
          systemProperties: segment.ductNode.systemProperties,
          position: segment.ductNode.position,
          metadata: segment.ductNode.metadata
        } : null
      },
      validationResults: {
        warnings: segment.warnings || [],
        complianceStatus: segment.warnings?.length > 0 ? 'warning' : 'compliant'
      }
    }));

    await this.db.bulkSaveProjectSegments(segmentRecords);
  }

  private async loadDuctSegments(projectId: string): Promise<EnhancedDuctSegment[]> {
    const segmentRecords = await this.db.getProjectSegmentsByType(projectId, 'duct');
    
    return segmentRecords.map(record => {
      const calculationData = record.calculationData || {};
      const geometryData = record.geometryData || {};
      
      return {
        segment_id: record.uuid,
        type: calculationData.type || 'straight',
        material: calculationData.material || 'galvanized_steel',
        size: calculationData.size || {},
        length: calculationData.length || 0,
        airflow: calculationData.airflow,
        velocity: calculationData.velocity,
        pressure_loss: calculationData.pressure_loss,
        warnings: calculationData.warnings || [],
        points: geometryData.points,
        geometry3D: geometryData.geometry3D,
        connections: geometryData.connections,
        ductNode: geometryData.ductNode ? new DuctNode(geometryData.ductNode) : undefined,
        material3D: calculationData.material3D
      };
    });
  }

  // =============================================================================
  // Fitting Segment Management
  // =============================================================================

  private async saveFittingSegments(projectId: string, segments: EnhancedFittingSegment[]): Promise<void> {
    const segmentRecords: Omit<ProjectSegment, 'id' | 'lastModified' | 'syncStatus'>[] = segments.map(segment => ({
      uuid: segment.segment_id,
      projectUuid: projectId,
      segmentType: 'fitting',
      name: segment.name,
      calculationData: {
        type: segment.type,
        ductShape: segment.ductShape,
        dimensions: segment.dimensions,
        material: segment.material,
        fittingParameters: segment.fittingParameters,
        pressureLoss: segment.calculationData?.pressureLoss,
        velocity: segment.calculationData?.velocity,
        kFactor: segment.calculationData?.kFactor
      },
      geometryData: {
        geometry3D: segment.geometry3D,
        connections: segment.connections
      },
      validationResults: segment.validationResults || {
        warnings: [],
        recommendations: [],
        complianceStatus: 'compliant'
      }
    }));

    await this.db.bulkSaveProjectSegments(segmentRecords);
  }

  private async loadFittingSegments(projectId: string): Promise<EnhancedFittingSegment[]> {
    const segmentRecords = await this.db.getProjectSegmentsByType(projectId, 'fitting');
    
    return segmentRecords.map(record => {
      const calculationData = record.calculationData || {};
      const geometryData = record.geometryData || {};
      
      return {
        segment_id: record.uuid,
        type: calculationData.type || FittingType.ELBOW,
        name: record.name,
        ductShape: calculationData.ductShape || 'round',
        dimensions: calculationData.dimensions || {},
        material: calculationData.material || {
          type: 'galvanized_steel',
          gauge: '26'
        },
        fittingParameters: calculationData.fittingParameters || {},
        geometry3D: geometryData.geometry3D || {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        connections: geometryData.connections || {},
        calculationData: {
          pressureLoss: calculationData.pressureLoss,
          velocity: calculationData.velocity,
          kFactor: calculationData.kFactor
        },
        validationResults: record.validationResults || {
          warnings: [],
          recommendations: [],
          complianceStatus: 'compliant'
        }
      };
    });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  async deleteProject(projectId: string): Promise<void> {
    try {
      // Delete all segments first
      const segments = await this.db.getProjectSegments(projectId);
      for (const segment of segments) {
        await this.db.deleteProjectSegment(segment.uuid);
      }

      // Delete the project
      await this.db.deleteProject(projectId);
      
      console.log(`✅ Project deleted successfully: ${projectId}`);
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjectList(): Promise<EnhancedProject[]> {
    try {
      const allProjects = await this.db.getAllProjects();
      const projects = allProjects.filter(p => p.user_name === this.currentUserId);
      
      // Load segments for each project (optional - can be lazy loaded)
      const enhancedProjects: EnhancedProject[] = [];
      for (const project of projects) {
        const ductSegments = await this.loadDuctSegments(project.uuid);
        const fittingSegments = await this.loadFittingSegments(project.uuid);
        
        enhancedProjects.push({
          ...project,
          id: project.uuid, // Use UUID as the string ID
          ductSegments,
          fittingSegments
        });
      }
      
      return enhancedProjects;
    } catch (error) {
      console.error('❌ Failed to get project list:', error);
      throw new Error(`Failed to get project list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
