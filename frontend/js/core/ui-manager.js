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

            // Make API call to backend
            const apiClient = window.sizeWiseApp?.apiClient;
            if (!apiClient) {
                throw new Error('API client not available');
            }

            const result = await apiClient.calculateAirDuct(data);

            if (result.success) {
                // Display results
                this.displayAirDuctResults(result);
            } else {
                // Show validation errors
                const errorMessages = result.errors || ['Unknown error occurred'];
                this.showError('Calculation Error', errorMessages.join(', '));

                // Show warnings if any
                if (result.warnings && result.warnings.length > 0) {
                    console.warn('Calculation warnings:', result.warnings);
                }
            }

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
            const results = result.results || {};
            const compliance = result.compliance || {};

            // Helper function to format result values
            const formatResult = (key) => {
                const value = results[key];
                if (typeof value === 'object' && value.value !== undefined) {
                    return `${value.value} ${value.unit || ''}`;
                }
                return value || 'N/A';
            };

            resultsContent.innerHTML = `
                <div class="results-grid">
                    <div class="result-item">
                        <label>Duct Size:</label>
                        <span>${results.duct_size || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <label>Velocity:</label>
                        <span>${formatResult('velocity')}</span>
                    </div>
                    <div class="result-item">
                        <label>Area:</label>
                        <span>${formatResult('area')}</span>
                    </div>
                    <div class="result-item">
                        <label>Pressure Loss:</label>
                        <span>${formatResult('pressure_loss')}</span>
                    </div>
                    <div class="result-item">
                        <label>Equivalent Diameter:</label>
                        <span>${formatResult('equivalent_diameter')}</span>
                    </div>
                </div>

                <div class="compliance-section">
                    <h4>SMACNA Compliance</h4>
                    ${this.renderComplianceStatus(compliance)}
                </div>

                ${result.warnings && result.warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h4>Warnings</h4>
                        ${result.warnings.map(warning => `<p class="warning-note">⚠ ${warning}</p>`).join('')}
                    </div>
                ` : ''}
            `;

            resultsSection.classList.remove('hidden');
        }
    }

    renderComplianceStatus(compliance) {
        if (!compliance || Object.keys(compliance).length === 0) {
            return '<p class="compliance-note">No compliance data available</p>';
        }

        let html = '';

        // Check for SMACNA compliance
        if (compliance.smacna) {
            const smacnaChecks = compliance.smacna;
            let allPassed = true;

            for (const [parameter, check] of Object.entries(smacnaChecks)) {
                if (!check.passed) {
                    allPassed = false;
                    break;
                }
            }

            html += `
                <div class="compliance-status ${allPassed ? 'compliant' : 'non-compliant'}">
                    ${allPassed ? '✓ SMACNA Compliant' : '✗ SMACNA Non-Compliant'}
                </div>
            `;

            // Show individual checks
            for (const [parameter, check] of Object.entries(smacnaChecks)) {
                html += `
                    <div class="compliance-check">
                        <span class="check-parameter">${parameter}:</span>
                        <span class="check-status ${check.passed ? 'passed' : 'failed'}">
                            ${check.passed ? '✓' : '✗'}
                        </span>
                        ${check.message ? `<span class="check-message">${check.message}</span>` : ''}
                    </div>
                `;
            }
        } else {
            html += '<p class="compliance-note">Compliance checking not available</p>';
        }

        return html;
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
