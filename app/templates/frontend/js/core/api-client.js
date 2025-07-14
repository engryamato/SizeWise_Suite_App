/**
 * API Client
 * 
 * Handles communication with the SizeWise Suite backend API.
 */

export class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };
        
        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`API Response: ${url}`, data);
                return data;
            } else {
                const text = await response.text();
                console.log(`API Response (text): ${url}`, text);
                return text;
            }
            
        } catch (error) {
            console.error(`API Error: ${url}`, error);
            throw error;
        }
    }
    
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    // HVAC-specific API methods
    async calculateAirDuct(data) {
        return this.post('/calculations/air-duct', data);
    }

    async validateAirDuctInput(data) {
        return this.post('/calculations/air-duct/validate', data);
    }

    async getAirDuctStandardSizes(ductType) {
        return this.get(`/calculations/air-duct/standard-sizes/${ductType}`);
    }

    async getAirDuctMaterials() {
        return this.get('/calculations/air-duct/materials');
    }

    async getAirDuctInfo() {
        return this.get('/calculations/air-duct/info');
    }
    
    async calculateGreaseDuct(data) {
        return this.post('/calculations/grease-duct', data);
    }
    
    async calculateEngineExhaust(data) {
        return this.post('/calculations/engine-exhaust', data);
    }
    
    async calculateBoilerVent(data) {
        return this.post('/calculations/boiler-vent', data);
    }
    
    async calculateEstimate(data) {
        return this.post('/calculations/estimate', data);
    }
    
    async validateSMACNA(data) {
        return this.post('/validation/smacna', data);
    }
    
    async validateNFPA(data) {
        return this.post('/validation/nfpa', data);
    }
    
    async validateASHRAE(data) {
        return this.post('/validation/ashrae', data);
    }
    
    async validateUnits(data) {
        return this.post('/validation/units', data);
    }
    
    async exportPDF(data) {
        return this.post('/exports/pdf', data);
    }
    
    async exportExcel(data) {
        return this.post('/exports/excel', data);
    }
    
    async exportCSV(data) {
        return this.post('/exports/csv', data);
    }
    
    async exportJSON(data) {
        return this.post('/exports/json', data);
    }
    
    async getExportFormats() {
        return this.get('/exports/formats');
    }
}
