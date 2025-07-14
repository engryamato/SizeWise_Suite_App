/**
 * SizeWise Suite - Main Application Entry Point
 * 
 * Initializes the modular HVAC engineering platform with offline-first capabilities.
 */

import '../styles/main.css';
import { ModuleRegistry } from './core/module-registry.js';
import { StorageManager } from './core/storage-manager.js';
import { ApiClient } from './core/api-client.js';
import { UIManager } from './core/ui-manager.js';
import { UnitsManager } from './core/units-manager.js';
import { DataService } from './services/data-service.js';

class SizeWiseApp {
    constructor() {
        this.moduleRegistry = new ModuleRegistry();
        this.storageManager = new StorageManager();
        this.apiClient = new ApiClient();
        this.uiManager = new UIManager();
        this.unitsManager = new UnitsManager();
        this.dataService = new DataService(this.storageManager);

        this.isOnline = navigator.onLine;
        this.currentModule = null;

        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing SizeWise Suite...');
            
            // Initialize core services
            await this.storageManager.init();
            await this.dataService.init();
            await this.setupEventListeners();
            await this.loadModules();
            
            // Check backend connectivity
            await this.checkBackendHealth();
            
            // Initialize UI
            this.uiManager.init();
            this.hideLoading();
            
            console.log('SizeWise Suite initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize SizeWise Suite:', error);
            this.showError('Failed to initialize application', error.message);
        }
    }
    
    async loadModules() {
        // Register available modules
        const modules = [
            {
                id: 'air-duct-sizer',
                name: 'Air Duct Sizer',
                description: 'SMACNA-compliant duct sizing calculations',
                version: '0.1.0',
                enabled: true
            },
            {
                id: 'grease-duct-sizer',
                name: 'Grease Duct Sizer',
                description: 'NFPA 96 compliant grease duct calculations',
                version: '0.1.0',
                enabled: false // Not implemented yet
            },
            {
                id: 'engine-exhaust-sizer',
                name: 'Engine Exhaust Sizer',
                description: 'Generator and CHP exhaust sizing',
                version: '0.1.0',
                enabled: false // Not implemented yet
            },
            {
                id: 'boiler-vent-sizer',
                name: 'Boiler Vent Sizer',
                description: 'Category I-IV boiler vent calculations',
                version: '0.1.0',
                enabled: false // Not implemented yet
            },
            {
                id: 'estimating-app',
                name: 'Estimating App',
                description: 'Project estimation and takeoffs',
                version: '0.1.0',
                enabled: false // Not implemented yet
            }
        ];
        
        for (const module of modules) {
            this.moduleRegistry.register(module);
        }
        
        console.log(`Loaded ${modules.length} modules`);
    }
    
    async setupEventListeners() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
        
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const moduleId = e.target.getAttribute('href').substring(1);
                this.loadModule(moduleId);
            }
            
            if (e.target.matches('[data-module]')) {
                const moduleId = e.target.getAttribute('data-module');
                this.loadModule(moduleId);
            }
        });
        
        // Units toggle
        const unitsToggle = document.getElementById('units-toggle');
        if (unitsToggle) {
            unitsToggle.addEventListener('click', () => {
                this.unitsManager.toggle();
                this.updateUnitsDisplay();
            });
        }
        
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.uiManager.toggleSidebar();
            });
        }
        
        // Error boundary
        const reloadButton = document.getElementById('reload-app');
        if (reloadButton) {
            reloadButton.addEventListener('click', () => {
                window.location.reload();
            });
        }
        
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showError('Application Error', e.error?.message || 'An unexpected error occurred');
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showError('Application Error', e.reason?.message || 'An unexpected error occurred');
        });
    }
    
    async checkBackendHealth() {
        try {
            const health = await this.apiClient.get('/health');
            console.log('Backend health check:', health);
            return true;
        } catch (error) {
            console.warn('Backend health check failed:', error);
            this.isOnline = false;
            this.updateConnectionStatus();
            return false;
        }
    }
    
    async loadModule(moduleId) {
        try {
            const module = this.moduleRegistry.get(moduleId);
            
            if (!module) {
                throw new Error(`Module not found: ${moduleId}`);
            }
            
            if (!module.enabled) {
                this.showError('Module Not Available', `${module.name} is not yet implemented.`);
                return;
            }
            
            console.log(`Loading module: ${moduleId}`);
            
            // Update navigation
            this.uiManager.setActiveNavigation(moduleId);
            
            // Load module content
            await this.uiManager.loadModuleContent(moduleId, module);
            
            this.currentModule = moduleId;
            
        } catch (error) {
            console.error(`Failed to load module ${moduleId}:`, error);
            this.showError('Module Load Error', error.message);
        }
    }
    
    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            statusElement.className = `status-indicator ${this.isOnline ? 'online' : 'offline'}`;
        }
    }
    
    updateUnitsDisplay() {
        const unitsDisplay = document.getElementById('units-display');
        const unitsToggle = document.getElementById('units-toggle');
        
        const currentUnits = this.unitsManager.getCurrentUnits();
        const nextUnits = currentUnits === 'imperial' ? 'metric' : 'imperial';
        
        if (unitsDisplay) {
            unitsDisplay.textContent = `Units: ${currentUnits.charAt(0).toUpperCase() + currentUnits.slice(1)}`;
        }
        
        if (unitsToggle) {
            unitsToggle.textContent = `Switch to ${nextUnits.charAt(0).toUpperCase() + nextUnits.slice(1)}`;
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        const app = document.getElementById('app');
        
        if (loading) loading.classList.add('hidden');
        if (app) app.classList.remove('hidden');
    }
    
    showError(title, message) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        const app = document.getElementById('app');
        const loading = document.getElementById('loading');
        
        if (errorMessage) {
            errorMessage.textContent = `${title}: ${message}`;
        }
        
        if (errorBoundary) errorBoundary.classList.remove('hidden');
        if (app) app.classList.add('hidden');
        if (loading) loading.classList.add('hidden');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sizeWiseApp = new SizeWiseApp();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
