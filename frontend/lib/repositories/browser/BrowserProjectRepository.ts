/**
 * Browser Project Repository
 * 
 * IndexedDB-based project repository for browser environment.
 * Implements ProjectRepository interface for offline desktop mode.
 */

import { ProjectRepository } from '../interfaces/ProjectRepository';
import { Project } from '../interfaces/ProjectRepository';
import { BrowserDatabaseManager } from '../../database/BrowserDatabaseManager';

export class BrowserProjectRepository implements ProjectRepository {
  private dbManager: BrowserDatabaseManager;

  constructor(dbManager: BrowserDatabaseManager) {
    this.dbManager = dbManager;
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const projectData = await this.dbManager.get('projects', id);
      return projectData ? this.mapToProject(projectData) : null;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const projectData = this.mapFromProject(project);
      await this.dbManager.put('projects', projectData);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.dbManager.delete('projects', id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      const projectsData = await this.dbManager.getByIndex('projects', 'userId', userId);
      return projectsData.map(projectData => this.mapToProject(projectData));
    } catch (error) {
      console.error('Failed to get projects by user:', error);
      throw error;
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const projectsData = await this.dbManager.getAll('projects');
      return projectsData.map(projectData => this.mapToProject(projectData));
    } catch (error) {
      console.error('Failed to get all projects:', error);
      throw error;
    }
  }

  async getProjectCount(userId?: string): Promise<number> {
    try {
      if (userId) {
        const projects = await this.getProjectsByUser(userId);
        return projects.length;
      } else {
        return await this.dbManager.count('projects');
      }
    } catch (error) {
      console.error('Failed to get project count:', error);
      throw error;
    }
  }

  async searchProjects(query: string, userId?: string): Promise<Project[]> {
    try {
      const projects = userId 
        ? await this.getProjectsByUser(userId)
        : await this.getAllProjects();
      
      const lowercaseQuery = query.toLowerCase();
      return projects.filter(project => 
        project.project_name.toLowerCase().includes(lowercaseQuery) ||
        project.project_description?.toLowerCase().includes(lowercaseQuery) ||
        project.client_name?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Failed to search projects:', error);
      throw error;
    }
  }

  async bulkSaveProjects(projects: Project[]): Promise<void> {
    try {
      for (const project of projects) {
        await this.saveProject(project);
      }
    } catch (error) {
      console.error('Failed to bulk save projects:', error);
      throw error;
    }
  }

  private mapToProject(projectData: any): Project {
    return {
      id: projectData.id,
      userId: projectData.userId,
      project_name: projectData.project_name,
      project_number: projectData.project_number,
      project_description: projectData.project_description,
      project_location: projectData.project_location,
      client_name: projectData.client_name,
      estimator_name: projectData.estimator_name,
      date_created: projectData.date_created,
      last_modified: projectData.last_modified,
      version: projectData.version,
      rooms: projectData.rooms || [],
      segments: projectData.segments || [],
      equipment: projectData.equipment || [],
      computational_properties: projectData.computational_properties || {
        units: 'Imperial',
        default_duct_size: { width: 12, height: 8 },
        default_material: 'Galvanized Steel',
        default_insulation: 'None',
        default_fitting: 'Standard',
        calibration_mode: 'Auto',
        default_velocity: 1000,
        pressure_class: "2",
        altitude: 0,
        friction_rate: 0.1
      },
      code_standards: projectData.code_standards || {
        smacna: true,
        ashrae: true,
        ul: false,
        imc: false,
        nfpa: false
      }
    };
  }

  private mapFromProject(project: Project): any {
    return {
      id: project.id,
      userId: project.userId,
      project_name: project.project_name,
      project_number: project.project_number,
      project_description: project.project_description,
      project_location: project.project_location,
      client_name: project.client_name,
      estimator_name: project.estimator_name,
      date_created: project.date_created,
      last_modified: project.last_modified,
      version: project.version,
      rooms: project.rooms,
      segments: project.segments,
      equipment: project.equipment,
      computational_properties: project.computational_properties,
      code_standards: project.code_standards
    };
  }
}
