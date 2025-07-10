/**
 * Module Registry
 * 
 * Manages registration and discovery of HVAC calculation modules.
 */

export class ModuleRegistry {
    constructor() {
        this.modules = new Map();
    }
    
    register(module) {
        if (!module.id) {
            throw new Error('Module must have an id');
        }
        
        const moduleConfig = {
            id: module.id,
            name: module.name || module.id,
            description: module.description || '',
            version: module.version || '0.1.0',
            enabled: module.enabled !== false,
            dependencies: module.dependencies || [],
            metadata: module.metadata || {}
        };
        
        this.modules.set(module.id, moduleConfig);
        console.log(`Registered module: ${module.id}`);
    }
    
    get(moduleId) {
        return this.modules.get(moduleId);
    }
    
    getAll() {
        return Array.from(this.modules.values());
    }
    
    getEnabled() {
        return this.getAll().filter(module => module.enabled);
    }
    
    isEnabled(moduleId) {
        const module = this.get(moduleId);
        return module ? module.enabled : false;
    }
    
    enable(moduleId) {
        const module = this.get(moduleId);
        if (module) {
            module.enabled = true;
            console.log(`Enabled module: ${moduleId}`);
        }
    }
    
    disable(moduleId) {
        const module = this.get(moduleId);
        if (module) {
            module.enabled = false;
            console.log(`Disabled module: ${moduleId}`);
        }
    }
    
    unregister(moduleId) {
        const removed = this.modules.delete(moduleId);
        if (removed) {
            console.log(`Unregistered module: ${moduleId}`);
        }
        return removed;
    }
    
    clear() {
        this.modules.clear();
        console.log('Cleared all modules');
    }
}
