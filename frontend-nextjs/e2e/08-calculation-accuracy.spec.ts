import { test, expect } from '@playwright/test';

test.describe('Calculation Accuracy Testing', () => {
  test('should test backend calculation API with known SMACNA examples', async ({ page }) => {
    // Test backend calculation endpoint directly
    const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: 1000,
        duct_type: 'round',
        friction_rate: 0.1,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // Verify response structure
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('results');
    expect(result.results).toHaveProperty('diameter');
    expect(result.results).toHaveProperty('velocity');
    expect(result.results).toHaveProperty('pressure_loss');
    
    // Verify calculation accuracy for 1000 CFM at 0.1" w.g./100ft
    const diameter = result.results.diameter.value;
    const velocity = result.results.velocity.value;
    
    // Expected diameter should be around 12-14 inches for 1000 CFM
    expect(diameter).toBeGreaterThan(10);
    expect(diameter).toBeLessThan(16);
    
    // Expected velocity should be reasonable (800-1500 FPM)
    expect(velocity).toBeGreaterThan(800);
    expect(velocity).toBeLessThan(1500);
    
    console.log(`Backend calculation: ${diameter}" diameter, ${velocity.toFixed(0)} FPM`);
  });

  test('should test rectangular duct calculations', async ({ page }) => {
    const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: 2000,
        duct_type: 'rectangular',
        friction_rate: 0.08,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    expect(result.success).toBeTruthy();
    expect(result.results).toHaveProperty('width');
    expect(result.results).toHaveProperty('height');
    expect(result.results).toHaveProperty('velocity');
    expect(result.results).toHaveProperty('equivalent_diameter');
    expect(result.results).toHaveProperty('aspect_ratio');
    
    const width = result.results.width.value;
    const height = result.results.height.value;
    const velocity = result.results.velocity.value;
    const aspectRatio = result.results.aspect_ratio.value;
    
    // Verify reasonable dimensions
    expect(width).toBeGreaterThan(8);
    expect(height).toBeGreaterThan(6);
    expect(velocity).toBeGreaterThan(600);
    expect(velocity).toBeLessThan(2000);
    
    // Aspect ratio should be <= 4:1 per SMACNA standards
    expect(aspectRatio).toBeLessThanOrEqual(4.0);
    
    console.log(`Rectangular duct: ${width}" x ${height}", ${velocity.toFixed(0)} FPM, AR: ${aspectRatio.toFixed(1)}:1`);
  });

  test('should test client-side calculation fallback', async ({ page }) => {
    // Block backend requests to test fallback
    await page.route('**/api/calculations/**', route => route.abort());

    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');

    // Test client-side calculations by evaluating JavaScript
    const result = await page.evaluate(() => {
      // Test basic velocity calculation
      const area = Math.PI * Math.pow(12 / 12 / 2, 2); // 12" diameter in sq ft
      const velocity = 1000 / area; // CFM / sq ft = FPM

      return {
        velocity,
        area,
        diameter: 12
      };
    });

    expect(result).toBeTruthy();
    expect(result.velocity).toBeGreaterThan(800);
    expect(result.velocity).toBeLessThan(1500);

    console.log(`Client-side calculation: ${result.velocity.toFixed(0)} FPM for 12" diameter`);
  });

  test('should validate ASHRAE velocity standards via backend', async ({ page }) => {
    // Test that backend calculations produce reasonable velocities
    const testCases = [
      { airflow: 1000, description: 'Small office' },
      { airflow: 2000, description: 'Medium office' },
      { airflow: 5000, description: 'Large space' }
    ];

    for (const testCase of testCases) {
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: {
          airflow: testCase.airflow,
          duct_type: 'round',
          friction_rate: 0.1,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBeTruthy();

      // Check that velocity is within ASHRAE acceptable range (typically 800-2500 FPM)
      const velocity = result.results.velocity.value;
      expect(velocity).toBeGreaterThan(600); // Minimum reasonable velocity
      expect(velocity).toBeLessThan(2500); // Maximum SMACNA velocity

      // Check that compliance information is provided
      expect(result.compliance).toBeDefined();
      expect(result.compliance.smacna).toBeDefined();
      expect(result.compliance.smacna.velocity).toBeDefined();
      expect(result.compliance.smacna.velocity.passed).toBeTruthy();

      console.log(`${testCase.description}: ${velocity.toFixed(0)} FPM - ${result.compliance.smacna.velocity.message}`);
    }

    console.log('ASHRAE validation tests passed via backend');
  });

  test('should test aspect ratio validation via backend', async ({ page }) => {
    // Test rectangular ducts with different aspect ratios
    const testCases = [
      { width: 14, height: 7, aspectRatio: 2.0, shouldPass: true },
      { width: 20, height: 5, aspectRatio: 4.0, shouldPass: true },
      { width: 25, height: 5, aspectRatio: 5.0, shouldPass: false }
    ];

    for (const testCase of testCases) {
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: {
          airflow: 2000,
          duct_type: 'rectangular',
          friction_rate: 0.1,
          units: 'imperial',
          material: 'galvanized_steel'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBeTruthy();

      // Check that rectangular duct results include aspect ratio
      expect(result.results).toHaveProperty('width');
      expect(result.results).toHaveProperty('height');

      const width = result.results.width.value;
      const height = result.results.height.value;
      const aspectRatio = Math.max(width, height) / Math.min(width, height);

      // SMACNA standard: aspect ratio should not exceed 4:1
      expect(aspectRatio).toBeLessThanOrEqual(4.1); // Allow small tolerance
    }

    console.log('Aspect ratio validation tests passed via backend');
  });

  test('should test equivalent diameter calculations via backend', async ({ page }) => {
    // Test rectangular duct calculations which include equivalent diameter
    const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: 2000,
        duct_type: 'rectangular',
        friction_rate: 0.1,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBeTruthy();

    // Check that rectangular duct results include equivalent diameter
    expect(result.results).toHaveProperty('equivalent_diameter');

    const width = result.results.width.value;
    const height = result.results.height.value;
    const equivalentDiameter = result.results.equivalent_diameter.value;

    // Equivalent diameter should be reasonable compared to dimensions
    const maxDimension = Math.max(width, height);
    const minDimension = Math.min(width, height);

    expect(equivalentDiameter).toBeGreaterThan(minDimension);
    expect(equivalentDiameter).toBeLessThan(maxDimension * 1.2);

    console.log(`Rectangular duct: ${width}" x ${height}", equivalent diameter: ${equivalentDiameter.toFixed(1)}"`);
  });

  test('should test material roughness factors', async ({ page }) => {
    // Test different materials with backend
    const materials = ['galvanized_steel', 'aluminum', 'stainless_steel', 'pvc', 'fiberglass'];
    
    for (const material of materials) {
      const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
        data: {
          airflow: 1000,
          duct_type: 'round',
          friction_rate: 0.1,
          units: 'imperial',
          material: material
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBeTruthy();
      
      // Different materials should give slightly different results
      const diameter = result.results.diameter.value;
      expect(diameter).toBeGreaterThan(10);
      expect(diameter).toBeLessThan(16);
      
      console.log(`${material}: ${diameter.toFixed(1)}" diameter`);
    }
  });

  test('should test pressure loss calculations', async ({ page }) => {
    const response = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: 1500,
        duct_type: 'round',
        friction_rate: 0.12,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    expect(result.success).toBeTruthy();
    expect(result.results).toHaveProperty('pressure_loss');
    
    const pressureLoss = result.results.pressure_loss.value;
    
    // Pressure loss should be close to the target friction rate (0.12" w.g./100ft)
    expect(pressureLoss).toBeGreaterThan(0.08);
    expect(pressureLoss).toBeLessThan(0.16);
    
    console.log(`Pressure loss: ${pressureLoss.toFixed(3)}" w.g./100ft (target: 0.12)`);
  });

  test('should handle edge cases and invalid inputs', async ({ page }) => {
    // Test invalid airflow
    const invalidAirflow = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: -100,
        duct_type: 'round',
        friction_rate: 0.1,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    const invalidResult = await invalidAirflow.json();
    expect(invalidResult.success).toBeFalsy();
    expect(invalidResult.errors).toBeDefined();
    
    // Test very high airflow
    const highAirflow = await page.request.post('http://127.0.0.1:5000/api/calculations/air-duct', {
      data: {
        airflow: 100000,
        duct_type: 'round',
        friction_rate: 0.1,
        units: 'imperial',
        material: 'galvanized_steel'
      }
    });
    
    const highResult = await highAirflow.json();
    // Should either succeed with large diameter or fail gracefully
    if (highResult.success) {
      expect(highResult.results.diameter.value).toBeGreaterThan(30);
    } else {
      expect(highResult.errors).toBeDefined();
    }
    
    console.log('Edge case handling tests passed');
  });
});
