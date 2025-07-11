/**
 * Project Model Tests
 */

import { Project } from '../../../frontend/js/models/project.js';

describe('Project Model', () => {
  describe('constructor', () => {
    it('should create a project with default values', () => {
      const project = new Project();
      
      expect(project.id).toBeNull();
      expect(project.name).toBe('');
      expect(project.description).toBe('');
      expect(project.units).toBe('imperial');
      expect(project.calculations).toEqual([]);
      expect(project.metadata).toEqual({});
      expect(project.created).toBeDefined();
      expect(project.modified).toBeDefined();
    });
    
    it('should create a project with provided data', () => {
      const data = {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        units: 'metric',
        created: '2023-01-01T00:00:00.000Z',
        modified: '2023-01-02T00:00:00.000Z'
      };
      
      const project = new Project(data);
      
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.units).toBe('metric');
      expect(project.created).toBe('2023-01-01T00:00:00.000Z');
      expect(project.modified).toBe('2023-01-02T00:00:00.000Z');
    });
  });
  
  describe('validate', () => {
    it('should validate a valid project', () => {
      const project = new Project({
        name: 'Valid Project',
        units: 'imperial'
      });
      
      const validation = project.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
    
    it('should reject project with empty name', () => {
      const project = new Project({
        name: '',
        units: 'imperial'
      });
      
      const validation = project.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project name is required');
    });
    
    it('should reject project with name too long', () => {
      const project = new Project({
        name: 'a'.repeat(256),
        units: 'imperial'
      });
      
      const validation = project.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project name must be less than 255 characters');
    });
    
    it('should reject project with invalid units', () => {
      const project = new Project({
        name: 'Test Project',
        units: 'invalid'
      });
      
      const validation = project.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Units must be either "imperial" or "metric"');
    });
    
    it('should reject project with description too long', () => {
      const project = new Project({
        name: 'Test Project',
        units: 'imperial',
        description: 'a'.repeat(1001)
      });
      
      const validation = project.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project description must be less than 1000 characters');
    });
  });
  
  describe('touch', () => {
    it('should update the modified timestamp', () => {
      const project = new Project();
      const originalModified = project.modified;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        project.touch();
        expect(project.modified).not.toBe(originalModified);
      }, 10);
    });
  });
  
  describe('addCalculation', () => {
    it('should add a calculation to the project', () => {
      const project = new Project();
      const calculation = { id: 1, name: 'Test Calc' };
      
      project.addCalculation(calculation);
      
      expect(project.calculations).toContain(calculation);
    });
  });
  
  describe('removeCalculation', () => {
    it('should remove a calculation from the project', () => {
      const project = new Project();
      const calculation1 = { id: 1, name: 'Test Calc 1' };
      const calculation2 = { id: 2, name: 'Test Calc 2' };
      
      project.addCalculation(calculation1);
      project.addCalculation(calculation2);
      project.removeCalculation(1);
      
      expect(project.calculations).not.toContain(calculation1);
      expect(project.calculations).toContain(calculation2);
    });
  });
  
  describe('getCalculationsByModule', () => {
    it('should return calculations for a specific module', () => {
      const project = new Project();
      const calc1 = { id: 1, moduleId: 'air-duct-sizer' };
      const calc2 = { id: 2, moduleId: 'grease-duct-sizer' };
      const calc3 = { id: 3, moduleId: 'air-duct-sizer' };
      
      project.calculations = [calc1, calc2, calc3];
      
      const airDuctCalcs = project.getCalculationsByModule('air-duct-sizer');
      
      expect(airDuctCalcs).toHaveLength(2);
      expect(airDuctCalcs).toContain(calc1);
      expect(airDuctCalcs).toContain(calc3);
    });
  });
  
  describe('static methods', () => {
    it('should create project from JSON', () => {
      const data = {
        id: 1,
        name: 'Test Project',
        units: 'metric'
      };
      
      const project = Project.fromJSON(data);
      
      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
      expect(project.units).toBe('metric');
    });
    
    it('should create new project with defaults', () => {
      const project = Project.create('New Project', 'metric');
      
      expect(project).toBeInstanceOf(Project);
      expect(project.name).toBe('New Project');
      expect(project.units).toBe('metric');
      expect(project.created).toBeDefined();
      expect(project.modified).toBeDefined();
    });
  });
  
  describe('toJSON', () => {
    it('should convert project to plain object', () => {
      const project = new Project({
        id: 1,
        name: 'Test Project',
        units: 'imperial'
      });
      
      const json = project.toJSON();
      
      expect(json).toEqual({
        id: 1,
        name: 'Test Project',
        description: '',
        units: 'imperial',
        created: project.created,
        modified: project.modified,
        calculations: [],
        metadata: {}
      });
    });
  });
  
  describe('getSummary', () => {
    it('should return project summary', () => {
      const project = new Project({
        id: 1,
        name: 'Test Project',
        calculations: [
          { moduleId: 'air-duct-sizer' },
          { moduleId: 'grease-duct-sizer' },
          { moduleId: 'air-duct-sizer' }
        ]
      });
      
      const summary = project.getSummary();
      
      expect(summary.id).toBe(1);
      expect(summary.name).toBe('Test Project');
      expect(summary.calculationCount).toBe(3);
      expect(summary.moduleTypes).toEqual(['air-duct-sizer', 'grease-duct-sizer']);
    });
  });
});
