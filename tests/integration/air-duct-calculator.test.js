/**
 * Air Duct Calculator Integration Tests
 */

describe('Air Duct Calculator Integration', () => {
  const API_BASE_URL = 'http://127.0.0.1:5000/api';
  
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
  });
  
  describe('API Integration', () => {
    it('should calculate rectangular duct sizing', async () => {
      const mockResponse = {
        success: true,
        input_data: {
          airflow: 1000,
          duct_type: 'rectangular',
          friction_rate: 0.08,
          units: 'imperial'
        },
        results: {
          duct_size: '16" x 6"',
          width: { value: 16.0, unit: 'in' },
          height: { value: 6.0, unit: 'in' },
          area: { value: 0.67, unit: 'sq_ft' },
          velocity: { value: 1500.0, unit: 'fpm' },
          equivalent_diameter: { value: 10.41, unit: 'in' },
          pressure_loss: { value: 1002.59, unit: 'in_wg_per_100ft' }
        },
        compliance: {
          smacna: {
            velocity: {
              passed: true,
              value: 1500.0,
              limit: 2500,
              message: 'Velocity within SMACNA limits'
            }
          }
        },
        warnings: [],
        errors: []
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const inputData = {
        airflow: 1000,
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial'
      };
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      
      const result = await response.json();
      
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/calculations/air-duct`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputData)
        })
      );
      
      expect(result.success).toBe(true);
      expect(result.results.duct_size).toBe('16" x 6"');
      expect(result.results.velocity.value).toBe(1500.0);
      expect(result.compliance.smacna.velocity.passed).toBe(true);
    });
    
    it('should calculate round duct sizing', async () => {
      const mockResponse = {
        success: true,
        input_data: {
          airflow: 1500,
          duct_type: 'round',
          friction_rate: 0.1,
          units: 'imperial'
        },
        results: {
          duct_size: '14" diameter',
          diameter: { value: 14.0, unit: 'in' },
          area: { value: 1.07, unit: 'sq_ft' },
          velocity: { value: 1400.0, unit: 'fpm' },
          equivalent_diameter: { value: 14.0, unit: 'in' },
          pressure_loss: { value: 856.32, unit: 'in_wg_per_100ft' }
        },
        compliance: {
          smacna: {
            velocity: {
              passed: true,
              value: 1400.0,
              limit: 2500,
              message: 'Velocity within SMACNA limits'
            }
          }
        },
        warnings: [],
        errors: []
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const inputData = {
        airflow: 1500,
        duct_type: 'round',
        friction_rate: 0.1,
        units: 'imperial'
      };
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.results.duct_size).toBe('14" diameter');
      expect(result.results.velocity.value).toBe(1400.0);
    });
    
    it('should handle validation errors', async () => {
      const mockResponse = {
        success: false,
        errors: ['Airflow must be a positive number'],
        warnings: []
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse
      });
      
      const inputData = {
        airflow: -100,
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial'
      };
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Airflow must be a positive number');
    });
    
    it('should handle missing required fields', async () => {
      const mockResponse = {
        success: false,
        errors: ['Missing required field: airflow'],
        warnings: []
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse
      });
      
      const inputData = {
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial'
        // Missing airflow
      };
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      
      const result = await response.json();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required field: airflow');
    });
  });
  
  describe('Validation Endpoint', () => {
    it('should validate input without calculation', async () => {
      const mockResponse = {
        is_valid: true,
        errors: [],
        warnings: ['Very low airflow - verify this is correct']
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const inputData = {
        airflow: 25,
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial'
      };
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });
      
      const result = await response.json();
      
      expect(result.is_valid).toBe(true);
      expect(result.warnings).toContain('Very low airflow - verify this is correct');
    });
  });
  
  describe('Standard Sizes Endpoint', () => {
    it('should get round duct standard sizes', async () => {
      const mockResponse = {
        success: true,
        duct_type: 'round',
        sizes: [4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/standard-sizes/round`);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.duct_type).toBe('round');
      expect(result.sizes).toContain(12);
      expect(result.sizes).toContain(16);
    });
  });
  
  describe('Materials Endpoint', () => {
    it('should get available duct materials', async () => {
      const mockResponse = {
        success: true,
        materials: {
          galvanized_steel: {
            name: 'Galvanized Steel',
            roughness: 0.0003,
            description: 'Standard galvanized steel ductwork'
          },
          aluminum: {
            name: 'Aluminum',
            roughness: 0.0002,
            description: 'Lightweight aluminum ductwork'
          }
        }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const response = await fetch(`${API_BASE_URL}/calculations/air-duct/materials`);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.materials.galvanized_steel).toBeDefined();
      expect(result.materials.aluminum).toBeDefined();
    });
  });
});
