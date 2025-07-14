/**
 * Project Data Model
 * 
 * Defines the structure and validation for project data in SizeWise Suite.
 */

export class Project {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.units = data.units || 'imperial';
        this.created = data.created || new Date().toISOString();
        this.modified = data.modified || new Date().toISOString();
        this.calculations = data.calculations || [];
        this.metadata = data.metadata || {};
    }
    
    /**
     * Validate project data
     */
    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Project name is required');
        }
        
        if (this.name.length > 255) {
            errors.push('Project name must be less than 255 characters');
        }
        
        if (this.description && this.description.length > 1000) {
            errors.push('Project description must be less than 1000 characters');
        }
        
        if (!['imperial', 'metric'].includes(this.units)) {
            errors.push('Units must be either "imperial" or "metric"');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Update modification timestamp
     */
    touch() {
        this.modified = new Date().toISOString();
    }
    
    /**
     * Add a calculation to the project
     */
    addCalculation(calculation) {
        this.calculations.push(calculation);
        this.touch();
    }
    
    /**
     * Remove a calculation from the project
     */
    removeCalculation(calculationId) {
        this.calculations = this.calculations.filter(calc => calc.id !== calculationId);
        this.touch();
    }
    
    /**
     * Get calculations by module
     */
    getCalculationsByModule(moduleId) {
        return this.calculations.filter(calc => calc.moduleId === moduleId);
    }
    
    /**
     * Convert to plain object for storage
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            units: this.units,
            created: this.created,
            modified: this.modified,
            calculations: this.calculations,
            metadata: this.metadata
        };
    }
    
    /**
     * Create from plain object
     */
    static fromJSON(data) {
        return new Project(data);
    }
    
    /**
     * Create a new project with default values
     */
    static create(name, units = 'imperial') {
        return new Project({
            name,
            units,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        });
    }
    
    /**
     * Get project summary for display
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            units: this.units,
            created: this.created,
            modified: this.modified,
            calculationCount: this.calculations.length,
            moduleTypes: [...new Set(this.calculations.map(calc => calc.moduleId))]
        };
    }
}
