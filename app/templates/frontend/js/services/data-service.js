/**
 * Data Service
 * 
 * High-level service for managing projects and calculations with offline storage.
 */

import { Project } from '../models/project.js';
import { Calculation } from '../models/calculation.js';

export class DataService {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentProject = null;
    }
    
    /**
     * Initialize the data service
     */
    async init() {
        await this.storage.init();
        console.log('Data service initialized');
    }
    
    // Project Management
    
    /**
     * Create a new project
     */
    async createProject(name, units = 'imperial', description = '') {
        const project = Project.create(name, units);
        project.description = description;
        
        const validation = project.validate();
        if (!validation.isValid) {
            throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
        }
        
        const projectId = await this.storage.saveProject(project.toJSON());
        project.id = projectId;
        
        console.log('Project created:', project.getSummary());
        return project;
    }
    
    /**
     * Get a project by ID
     */
    async getProject(projectId) {
        const projectData = await this.storage.getProject(projectId);
        if (!projectData) {
            return null;
        }
        
        return Project.fromJSON(projectData);
    }
    
    /**
     * Get all projects
     */
    async getAllProjects() {
        const projectsData = await this.storage.getAllProjects();
        return projectsData.map(data => Project.fromJSON(data));
    }
    
    /**
     * Update a project
     */
    async updateProject(project) {
        const validation = project.validate();
        if (!validation.isValid) {
            throw new Error(`Invalid project data: ${validation.errors.join(', ')}`);
        }
        
        project.touch();
        await this.storage.saveProject(project.toJSON());
        
        console.log('Project updated:', project.getSummary());
        return project;
    }
    
    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        // Delete all calculations for this project first
        const calculations = await this.getCalculationsByProject(projectId);
        for (const calculation of calculations) {
            await this.deleteCalculation(calculation.id);
        }
        
        // Delete the project
        await this.storage.deleteProject(projectId);
        
        if (this.currentProject && this.currentProject.id === projectId) {
            this.currentProject = null;
        }
        
        console.log('Project deleted:', projectId);
    }
    
    /**
     * Set the current active project
     */
    setCurrentProject(project) {
        this.currentProject = project;
        console.log('Current project set:', project ? project.getSummary() : null);
    }
    
    /**
     * Get the current active project
     */
    getCurrentProject() {
        return this.currentProject;
    }
    
    // Calculation Management
    
    /**
     * Save a calculation
     */
    async saveCalculation(calculation) {
        const validation = calculation.validate();
        if (!validation.isValid) {
            throw new Error(`Invalid calculation data: ${validation.errors.join(', ')}`);
        }
        
        calculation.touch();
        const calculationId = await this.storage.saveCalculation(calculation.toJSON());
        calculation.id = calculationId;
        
        // Update project if this calculation belongs to one
        if (calculation.projectId) {
            const project = await this.getProject(calculation.projectId);
            if (project) {
                // Update or add calculation to project
                const existingIndex = project.calculations.findIndex(calc => calc.id === calculation.id);
                if (existingIndex >= 0) {
                    project.calculations[existingIndex] = calculation.getSummary();
                } else {
                    project.calculations.push(calculation.getSummary());
                }
                await this.updateProject(project);
            }
        }
        
        console.log('Calculation saved:', calculation.getSummary());
        return calculation;
    }
    
    /**
     * Get a calculation by ID
     */
    async getCalculation(calculationId) {
        const calculationData = await this.storage.getCalculation(calculationId);
        if (!calculationData) {
            return null;
        }
        
        return Calculation.fromJSON(calculationData);
    }
    
    /**
     * Get calculations by project
     */
    async getCalculationsByProject(projectId) {
        const calculationsData = await this.storage.getCalculationsByProject(projectId);
        return calculationsData.map(data => Calculation.fromJSON(data));
    }
    
    /**
     * Get calculations by module
     */
    async getCalculationsByModule(moduleId) {
        const calculationsData = await this.storage.getCalculationsByModule(moduleId);
        return calculationsData.map(data => Calculation.fromJSON(data));
    }
    
    /**
     * Delete a calculation
     */
    async deleteCalculation(calculationId) {
        const calculation = await this.getCalculation(calculationId);
        if (!calculation) {
            return;
        }
        
        // Remove from project if it belongs to one
        if (calculation.projectId) {
            const project = await this.getProject(calculation.projectId);
            if (project) {
                project.removeCalculation(calculationId);
                await this.updateProject(project);
            }
        }
        
        await this.storage.deleteCalculation(calculationId);
        console.log('Calculation deleted:', calculationId);
    }
    
    /**
     * Create calculation from API response
     */
    async createCalculationFromApi(moduleId, name, inputData, apiResponse, projectId = null) {
        const calculation = Calculation.fromApiResponse(moduleId, name, inputData, apiResponse, projectId);
        return await this.saveCalculation(calculation);
    }
    
    // Utility Methods
    
    /**
     * Get recent projects
     */
    async getRecentProjects(limit = 5) {
        const projects = await this.getAllProjects();
        return projects
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .slice(0, limit);
    }
    
    /**
     * Get recent calculations
     */
    async getRecentCalculations(limit = 10) {
        const calculations = await this.getAllCalculations();
        return calculations
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .slice(0, limit);
    }
    
    /**
     * Get all calculations
     */
    async getAllCalculations() {
        // This is a helper method - we'll need to implement this in storage manager
        const projects = await this.getAllProjects();
        const allCalculations = [];
        
        for (const project of projects) {
            const calculations = await this.getCalculationsByProject(project.id);
            allCalculations.push(...calculations);
        }
        
        return allCalculations;
    }
    
    /**
     * Search projects and calculations
     */
    async search(query) {
        const projects = await this.getAllProjects();
        const calculations = await this.getAllCalculations();
        
        const lowerQuery = query.toLowerCase();
        
        const matchingProjects = projects.filter(project => 
            project.name.toLowerCase().includes(lowerQuery) ||
            project.description.toLowerCase().includes(lowerQuery)
        );
        
        const matchingCalculations = calculations.filter(calculation =>
            calculation.name.toLowerCase().includes(lowerQuery) ||
            calculation.description.toLowerCase().includes(lowerQuery) ||
            calculation.moduleId.toLowerCase().includes(lowerQuery)
        );
        
        return {
            projects: matchingProjects,
            calculations: matchingCalculations
        };
    }
    
    /**
     * Export project data
     */
    async exportProject(projectId) {
        const project = await this.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const calculations = await this.getCalculationsByProject(projectId);
        
        return {
            project: project.toJSON(),
            calculations: calculations.map(calc => calc.toJSON()),
            exportedAt: new Date().toISOString(),
            version: '0.1.0'
        };
    }
    
    /**
     * Import project data
     */
    async importProject(exportData) {
        const project = Project.fromJSON(exportData.project);
        project.id = null; // Generate new ID
        
        const newProject = await this.createProject(
            `${project.name} (Imported)`,
            project.units,
            project.description
        );
        
        // Import calculations
        for (const calcData of exportData.calculations) {
            const calculation = Calculation.fromJSON(calcData);
            calculation.id = null; // Generate new ID
            calculation.projectId = newProject.id;
            await this.saveCalculation(calculation);
        }
        
        return newProject;
    }
}
