/**
 * Calculation Data Model
 * 
 * Defines the structure and validation for calculation data in SizeWise Suite.
 */

export class Calculation {
    constructor(data = {}) {
        this.id = data.id || null;
        this.projectId = data.projectId || null;
        this.moduleId = data.moduleId || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.inputData = data.inputData || {};
        this.results = data.results || {};
        this.compliance = data.compliance || {};
        this.warnings = data.warnings || [];
        this.errors = data.errors || [];
        this.created = data.created || new Date().toISOString();
        this.modified = data.modified || new Date().toISOString();
        this.metadata = data.metadata || {};
    }
    
    /**
     * Validate calculation data
     */
    validate() {
        const errors = [];
        
        if (!this.moduleId || this.moduleId.trim().length === 0) {
            errors.push('Module ID is required');
        }
        
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Calculation name is required');
        }
        
        if (this.name.length > 255) {
            errors.push('Calculation name must be less than 255 characters');
        }
        
        if (this.description && this.description.length > 1000) {
            errors.push('Calculation description must be less than 1000 characters');
        }
        
        if (!this.inputData || Object.keys(this.inputData).length === 0) {
            errors.push('Input data is required');
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
     * Check if calculation has errors
     */
    hasErrors() {
        return this.errors && this.errors.length > 0;
    }
    
    /**
     * Check if calculation has warnings
     */
    hasWarnings() {
        return this.warnings && this.warnings.length > 0;
    }
    
    /**
     * Check if calculation is valid (no errors)
     */
    isValid() {
        return !this.hasErrors();
    }
    
    /**
     * Get compliance status for a specific standard
     */
    getComplianceStatus(standard) {
        if (!this.compliance || !this.compliance[standard]) {
            return null;
        }
        
        const checks = this.compliance[standard];
        const allPassed = Object.values(checks).every(check => check.passed);
        
        return {
            standard,
            passed: allPassed,
            checks
        };
    }
    
    /**
     * Get overall compliance status
     */
    getOverallCompliance() {
        if (!this.compliance || Object.keys(this.compliance).length === 0) {
            return { passed: null, standards: [] };
        }
        
        const standards = Object.keys(this.compliance);
        const results = standards.map(standard => this.getComplianceStatus(standard));
        const allPassed = results.every(result => result.passed);
        
        return {
            passed: allPassed,
            standards: results
        };
    }
    
    /**
     * Convert to plain object for storage
     */
    toJSON() {
        return {
            id: this.id,
            projectId: this.projectId,
            moduleId: this.moduleId,
            name: this.name,
            description: this.description,
            inputData: this.inputData,
            results: this.results,
            compliance: this.compliance,
            warnings: this.warnings,
            errors: this.errors,
            created: this.created,
            modified: this.modified,
            metadata: this.metadata
        };
    }
    
    /**
     * Create from plain object
     */
    static fromJSON(data) {
        return new Calculation(data);
    }
    
    /**
     * Create a new calculation
     */
    static create(moduleId, name, inputData, projectId = null) {
        return new Calculation({
            moduleId,
            name,
            inputData,
            projectId,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        });
    }
    
    /**
     * Create from API response
     */
    static fromApiResponse(moduleId, name, inputData, apiResponse, projectId = null) {
        const calculation = new Calculation({
            moduleId,
            name,
            inputData,
            projectId,
            results: apiResponse.results || {},
            compliance: apiResponse.compliance || {},
            warnings: apiResponse.warnings || [],
            errors: apiResponse.errors || [],
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            metadata: apiResponse.metadata || {}
        });
        
        return calculation;
    }
    
    /**
     * Get calculation summary for display
     */
    getSummary() {
        return {
            id: this.id,
            projectId: this.projectId,
            moduleId: this.moduleId,
            name: this.name,
            description: this.description,
            created: this.created,
            modified: this.modified,
            isValid: this.isValid(),
            hasWarnings: this.hasWarnings(),
            complianceStatus: this.getOverallCompliance()
        };
    }
    
    /**
     * Get formatted results for display
     */
    getFormattedResults() {
        const formatted = {};
        
        for (const [key, value] of Object.entries(this.results)) {
            if (typeof value === 'object' && value.value !== undefined) {
                formatted[key] = `${value.value} ${value.unit || ''}`.trim();
            } else {
                formatted[key] = value;
            }
        }
        
        return formatted;
    }
}
