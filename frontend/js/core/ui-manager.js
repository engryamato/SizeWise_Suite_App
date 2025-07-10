/**
 * UI Manager
 * 
 * Handles user interface interactions and module content loading.
 */

export class UIManager {
    constructor() {
        this.currentModule = null;
        this.sidebarOpen = true;
    }
    
    init() {
        this.setupResponsiveLayout();
        this.updateUnitsDisplay();
    }
    
    setupResponsiveLayout() {
        // Handle responsive sidebar behavior
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            const sidebar = document.getElementById('sidebar');
            
            if (sidebar) {
                if (isMobile) {
                    sidebar.classList.add('mobile');
                    this.sidebarOpen = false;
                } else {
                    sidebar.classList.remove('mobile');
                    this.sidebarOpen = true;
                }
                
                this.updateSidebarState();
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }
    
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        this.updateSidebarState();
    }
    
    updateSidebarState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        if (sidebar) {
            if (this.sidebarOpen) {
                sidebar.classList.add('open');
                sidebar.classList.remove('closed');
            } else {
                sidebar.classList.add('closed');
                sidebar.classList.remove('open');
            }
        }
        
        if (mainContent) {
            if (this.sidebarOpen) {
                mainContent.classList.add('sidebar-open');
                mainContent.classList.remove('sidebar-closed');
            } else {
                mainContent.classList.add('sidebar-closed');
                mainContent.classList.remove('sidebar-open');
            }
        }
    }
    
    setActiveNavigation(moduleId) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to current module link
        const activeLink = document.querySelector(`a[href="#${moduleId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Hide all module content
        const moduleContents = document.querySelectorAll('.module-content');
        moduleContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
    }
    
    async loadModuleContent(moduleId, module) {
        const contentArea = document.getElementById('content-area');
        
        if (!contentArea) {
            throw new Error('Content area not found');
        }
        
        // Check if module content already exists
        let moduleContent = document.getElementById(moduleId);
        
        if (!moduleContent) {
            // Create new module content
            moduleContent = document.createElement('div');
            moduleContent.id = moduleId;
            moduleContent.className = 'module-content';
            
            // Load module-specific content
            const content = await this.generateModuleContent(moduleId, module);
            moduleContent.innerHTML = content;
            
            contentArea.appendChild(moduleContent);
        }
        
        // Show the module content
        moduleContent.style.display = 'block';
        moduleContent.classList.add('active');
        
        // Initialize module-specific functionality
        this.initializeModuleEvents(moduleId);
        
        this.currentModule = moduleId;
    }
    
    async generateModuleContent(moduleId, module) {
        switch (moduleId) {
            case 'air-duct-sizer':
                return this.generateAirDuctSizerContent();
            case 'dashboard':
                return this.generateDashboardContent();
            default:
                return this.generatePlaceholderContent(module);
        }
    }
    
    generateDashboardContent() {
        return `
            <div class="dashboard">
                <h2>Welcome to SizeWise Suite</h2>
                <p>Select a module from the sidebar to get started with your HVAC calculations.</p>
                
                <div class="quick-actions">
                    <div class="action-card">
                        <h3>Air Duct Sizer</h3>
                        <p>Calculate duct sizes per SMACNA standards</p>
                        <button class="btn btn-primary" data-module="air-duct-sizer">Start Calculation</button>
                    </div>
                    
                    <div class="action-card">
                        <h3>Estimating App</h3>
                        <p>Generate project estimates and takeoffs</p>
                        <button class="btn btn-primary" data-module="estimating-app">Create Estimate</button>
                    </div>
                </div>
                
                <div class="recent-projects">
                    <h3>Recent Projects</h3>
                    <div id="recent-projects-list">
                        <p class="no-projects">No recent projects. Create your first project to get started.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateAirDuctSizerContent() {
        return `
            <div class="air-duct-sizer">
                <h2>Air Duct Sizer</h2>
                <p>Calculate duct sizes according to SMACNA standards</p>
                
                <form id="air-duct-form" class="calculation-form">
                    <div class="form-group">
                        <label for="airflow">Airflow (CFM):</label>
                        <input type="number" id="airflow" name="airflow" required min="1" step="1">
                    </div>
                    
                    <div class="form-group">
                        <label for="duct-type">Duct Type:</label>
                        <select id="duct-type" name="duct_type" required>
                            <option value="">Select duct type</option>
                            <option value="rectangular">Rectangular</option>
                            <option value="round">Round</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="friction-rate">Friction Rate (in. w.g./100 ft):</label>
                        <input type="number" id="friction-rate" name="friction_rate" required min="0.01" max="1.0" step="0.01" value="0.08">
                    </div>
                    
                    <div class="form-group">
                        <label for="units">Units:</label>
                        <select id="units" name="units" required>
                            <option value="imperial">Imperial</option>
                            <option value="metric">Metric</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Calculate</button>
                        <button type="reset" class="btn btn-secondary">Reset</button>
                    </div>
                </form>
                
                <div id="calculation-results" class="results-section hidden">
                    <h3>Calculation Results</h3>
                    <div id="results-content"></div>
                </div>
            </div>
        `;
    }
    
    generatePlaceholderContent(module) {
        return `
            <div class="module-placeholder">
                <h2>${module.name}</h2>
                <p>${module.description}</p>
                <div class="placeholder-content">
                    <p>This module is not yet implemented.</p>
                    <p>Version: ${module.version}</p>
                    <p>Status: Coming Soon</p>
                </div>
            </div>
        `;
    }
    
    initializeModuleEvents(moduleId) {
        switch (moduleId) {
            case 'air-duct-sizer':
                this.initializeAirDuctSizerEvents();
                break;
            default:
                break;
        }
    }
    
    initializeAirDuctSizerEvents() {
        const form = document.getElementById('air-duct-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAirDuctCalculation(form);
            });
        }
    }
    
    async handleAirDuctCalculation(form) {
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert numeric fields
            data.airflow = parseFloat(data.airflow);
            data.friction_rate = parseFloat(data.friction_rate);
            
            console.log('Air duct calculation data:', data);
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Calculating...';
            submitButton.disabled = true;
            
            // Make API call (placeholder for now)
            const result = {
                input: data,
                results: {
                    duct_size: data.duct_type === 'round' ? '12" diameter' : '12" x 8"',
                    velocity: Math.round(data.airflow / (data.duct_type === 'round' ? 113 : 96)),
                    pressure_loss: data.friction_rate,
                    equivalent_diameter: data.duct_type === 'rectangular' ? 9.8 : 12
                },
                compliance: {
                    smacna_compliant: true,
                    velocity_within_limits: true,
                    notes: ['Calculation completed successfully']
                }
            };
            
            // Display results
            this.displayAirDuctResults(result);
            
            // Restore button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
        } catch (error) {
            console.error('Air duct calculation failed:', error);
            this.showError('Calculation Error', error.message);
            
            // Restore button state
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Calculate';
            submitButton.disabled = false;
        }
    }
    
    displayAirDuctResults(result) {
        const resultsSection = document.getElementById('calculation-results');
        const resultsContent = document.getElementById('results-content');
        
        if (resultsSection && resultsContent) {
            resultsContent.innerHTML = `
                <div class="results-grid">
                    <div class="result-item">
                        <label>Duct Size:</label>
                        <span>${result.results.duct_size}</span>
                    </div>
                    <div class="result-item">
                        <label>Velocity:</label>
                        <span>${result.results.velocity} FPM</span>
                    </div>
                    <div class="result-item">
                        <label>Pressure Loss:</label>
                        <span>${result.results.pressure_loss} in. w.g./100 ft</span>
                    </div>
                    <div class="result-item">
                        <label>Equivalent Diameter:</label>
                        <span>${result.results.equivalent_diameter}"</span>
                    </div>
                </div>
                
                <div class="compliance-section">
                    <h4>SMACNA Compliance</h4>
                    <div class="compliance-status ${result.compliance.smacna_compliant ? 'compliant' : 'non-compliant'}">
                        ${result.compliance.smacna_compliant ? '✓ Compliant' : '✗ Non-Compliant'}
                    </div>
                    ${result.compliance.notes.map(note => `<p class="compliance-note">${note}</p>`).join('')}
                </div>
            `;
            
            resultsSection.classList.remove('hidden');
        }
    }
    
    updateUnitsDisplay() {
        // This will be called by the main app when units change
        const unitsSelects = document.querySelectorAll('select[name="units"]');
        unitsSelects.forEach(select => {
            // Update based on current units setting
        });
    }
    
    showError(title, message) {
        // Simple error display - could be enhanced with a modal or toast
        alert(`${title}: ${message}`);
    }
}
