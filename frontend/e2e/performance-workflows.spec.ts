import { test, expect } from '@playwright/test';

/**
 * Performance and Load Testing E2E Tests
 * 
 * This test suite focuses on performance characteristics and load handling
 * to ensure SizeWise Suite performs well under various conditions.
 */

test.describe('Performance Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock authentication for consistent testing
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('user-tier', 'premium');
      localStorage.setItem('user-id', 'test-user');
    });
  });

  test('calculation performance under load', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    const calculations = [];
    const startTime = Date.now();
    
    // Perform 20 rapid calculations
    for (let i = 0; i < 20; i++) {
      const airflow = 1000 + (i * 100);
      const calcStartTime = Date.now();
      
      await page.fill('[data-testid="airflow-input"]', airflow.toString());
      await page.click('[data-testid="calculate-button"]');
      await page.waitForSelector('[data-testid="calculation-results"]', { timeout: 10000 });
      
      const calcEndTime = Date.now();
      calculations.push({
        iteration: i + 1,
        airflow,
        duration: calcEndTime - calcStartTime
      });
      
      // Brief pause to avoid overwhelming the system
      await page.waitForTimeout(100);
    }
    
    const totalTime = Date.now() - startTime;
    const avgCalculationTime = calculations.reduce((sum, calc) => sum + calc.duration, 0) / calculations.length;
    
    console.log(`Performance Results:`);
    console.log(`Total time for 20 calculations: ${totalTime}ms`);
    console.log(`Average calculation time: ${avgCalculationTime.toFixed(2)}ms`);
    console.log(`Calculations per second: ${(20000 / totalTime).toFixed(2)}`);
    
    // Performance assertions
    expect(avgCalculationTime).toBeLessThan(2000); // Each calculation should take less than 2 seconds
    expect(totalTime).toBeLessThan(30000); // Total should take less than 30 seconds
    
    // Verify all calculations completed successfully
    expect(calculations.length).toBe(20);
    calculations.forEach(calc => {
      expect(calc.duration).toBeGreaterThan(0);
      expect(calc.duration).toBeLessThan(5000); // No single calculation should take more than 5 seconds
    });
  });

  test('3D visualization performance with complex models', async ({ page }) => {
    await page.goto('/3d-visualization');
    await page.waitForLoadState('networkidle');
    
    // Wait for 3D canvas to initialize
    await page.waitForSelector('[data-testid="3d-canvas"]', { timeout: 10000 });
    
    const performanceMetrics = [];
    
    // Test rendering performance with increasing complexity
    const complexityLevels = [
      { ducts: 5, fittings: 3, name: 'Simple' },
      { ducts: 15, fittings: 10, name: 'Medium' },
      { ducts: 30, fittings: 20, name: 'Complex' },
      { ducts: 50, fittings: 35, name: 'Very Complex' }
    ];
    
    for (const level of complexityLevels) {
      const startTime = Date.now();
      
      // Add ducts to the scene
      for (let i = 0; i < level.ducts; i++) {
        await page.click('[data-testid="add-duct-button"]');
        await page.waitForTimeout(50); // Small delay between additions
      }
      
      // Add fittings to the scene
      for (let i = 0; i < level.fittings; i++) {
        await page.click('[data-testid="add-fitting-button"]');
        await page.waitForTimeout(50);
      }
      
      // Wait for rendering to complete
      await page.waitForTimeout(1000);
      
      // Test camera movement performance
      const cameraStartTime = Date.now();
      await page.mouse.move(400, 300);
      await page.mouse.down();
      
      // Perform camera rotation
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(400 + (i * 10), 300 + (i * 5));
        await page.waitForTimeout(50);
      }
      
      await page.mouse.up();
      const cameraEndTime = Date.now();
      
      const totalTime = Date.now() - startTime;
      const cameraTime = cameraEndTime - cameraStartTime;
      
      performanceMetrics.push({
        level: level.name,
        ducts: level.ducts,
        fittings: level.fittings,
        totalRenderTime: totalTime,
        cameraResponseTime: cameraTime
      });
      
      console.log(`${level.name} scene: ${totalTime}ms total, ${cameraTime}ms camera response`);
      
      // Clear scene for next test
      await page.click('[data-testid="clear-scene-button"]');
      await page.waitForTimeout(500);
    }
    
    // Performance assertions
    performanceMetrics.forEach(metric => {
      expect(metric.totalRenderTime).toBeLessThan(10000); // Scene should render in under 10 seconds
      expect(metric.cameraResponseTime).toBeLessThan(2000); // Camera should be responsive
    });
    
    // Verify performance doesn't degrade significantly with complexity
    const simpleTime = performanceMetrics[0].cameraResponseTime;
    const complexTime = performanceMetrics[3].cameraResponseTime;
    const degradationRatio = complexTime / simpleTime;
    
    expect(degradationRatio).toBeLessThan(5); // Performance shouldn't degrade more than 5x
  });

  test('memory usage during extended session', async ({ page }) => {
    await page.goto('/air-duct-sizer');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (!initialMemory) {
      console.log('Memory API not available, skipping memory test');
      return;
    }
    
    console.log('Initial memory usage:', initialMemory);
    
    // Simulate extended usage session
    for (let session = 0; session < 5; session++) {
      console.log(`Session ${session + 1}/5`);
      
      // Perform various operations
      for (let i = 0; i < 10; i++) {
        // Calculation operations
        await page.fill('[data-testid="airflow-input"]', (1000 + i * 100).toString());
        await page.click('[data-testid="calculate-button"]');
        await page.waitForSelector('[data-testid="calculation-results"]');
        
        // Navigate between tools
        if (i % 3 === 0) {
          await page.goto('/tools/grease-duct-sizer');
          await page.waitForLoadState('networkidle');
          await page.goto('/air-duct-sizer');
          await page.waitForLoadState('networkidle');
        }
        
        await page.waitForTimeout(100);
      }
      
      // Check memory usage after each session
      const currentMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (currentMemory) {
        const memoryIncrease = currentMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        console.log(`Memory after session ${session + 1}:`, currentMemory);
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%)`);
        
        // Memory shouldn't increase more than 100% over initial usage
        expect(memoryIncreasePercent).toBeLessThan(100);
      }
    }
  });

  test('concurrent user simulation', async ({ browser }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = [];
    const userSessions = [];
    
    try {
      // Create 5 concurrent user sessions
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        contexts.push(context);
        
        // Setup user session
        await page.goto('/');
        await page.evaluate((userId) => {
          localStorage.setItem('auth-token', `test-token-${userId}`);
          localStorage.setItem('user-tier', 'premium');
          localStorage.setItem('user-id', `test-user-${userId}`);
        }, i);
        
        userSessions.push({
          id: i,
          page,
          context
        });
      }
      
      // Simulate concurrent operations
      const operations = userSessions.map(async (session, index) => {
        const { page } = session;
        const startTime = Date.now();
        
        try {
          // Each user performs different operations
          await page.goto('/air-duct-sizer');
          await page.waitForLoadState('networkidle');
          
          // Perform calculations with different parameters
          const airflow = 1000 + (index * 500);
          await page.fill('[data-testid="airflow-input"]', airflow.toString());
          await page.click('[data-testid="calculate-button"]');
          await page.waitForSelector('[data-testid="calculation-results"]', { timeout: 15000 });
          
          // Save project
          await page.click('[data-testid="save-project-button"]');
          await page.waitForSelector('[data-testid="save-success"]', { timeout: 15000 });
          
          const endTime = Date.now();
          return {
            userId: index,
            success: true,
            duration: endTime - startTime
          };
        } catch (error) {
          const endTime = Date.now();
          return {
            userId: index,
            success: false,
            duration: endTime - startTime,
            error: error.message
          };
        }
      });
      
      // Wait for all operations to complete
      const results = await Promise.all(operations);
      
      // Analyze results
      const successfulOperations = results.filter(r => r.success);
      const failedOperations = results.filter(r => !r.success);
      
      console.log(`Concurrent user test results:`);
      console.log(`Successful operations: ${successfulOperations.length}/5`);
      console.log(`Failed operations: ${failedOperations.length}/5`);
      
      if (successfulOperations.length > 0) {
        const avgDuration = successfulOperations.reduce((sum, r) => sum + r.duration, 0) / successfulOperations.length;
        console.log(`Average operation duration: ${avgDuration.toFixed(2)}ms`);
        
        // Performance assertions
        expect(successfulOperations.length).toBeGreaterThanOrEqual(4); // At least 80% success rate
        expect(avgDuration).toBeLessThan(20000); // Average operation should complete within 20 seconds
      }
      
      if (failedOperations.length > 0) {
        console.log('Failed operations:', failedOperations);
      }
      
    } finally {
      // Clean up contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('large dataset handling performance', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Create a large number of projects to test UI performance
    const projectCount = 50;
    const startTime = Date.now();
    
    console.log(`Creating ${projectCount} projects for performance testing...`);
    
    for (let i = 0; i < projectCount; i++) {
      await page.click('[data-testid="new-project-button"]');
      await page.fill('[data-testid="project-name-input"]', `Performance Test Project ${i + 1}`);
      await page.fill('[data-testid="project-description-input"]', `Test project ${i + 1} for performance evaluation`);
      await page.click('[data-testid="create-project-button"]');
      
      // Wait for project to be created
      await page.waitForSelector('[data-testid="project-created-success"]', { timeout: 10000 });
      
      // Return to dashboard every 10 projects to test list performance
      if ((i + 1) % 10 === 0) {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Test scrolling performance with current project count
        const scrollStartTime = Date.now();
        await page.evaluate(() => {
          const projectList = document.querySelector('[data-testid="project-list"]');
          if (projectList) {
            projectList.scrollTop = projectList.scrollHeight;
          }
        });
        await page.waitForTimeout(500);
        const scrollEndTime = Date.now();
        
        console.log(`Scroll performance with ${i + 1} projects: ${scrollEndTime - scrollStartTime}ms`);
        expect(scrollEndTime - scrollStartTime).toBeLessThan(1000); // Scrolling should be smooth
      }
    }
    
    const totalCreationTime = Date.now() - startTime;
    console.log(`Created ${projectCount} projects in ${totalCreationTime}ms`);
    console.log(`Average project creation time: ${(totalCreationTime / projectCount).toFixed(2)}ms`);
    
    // Test final dashboard load performance with all projects
    const dashboardLoadStart = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardLoadEnd = Date.now();
    
    console.log(`Dashboard load time with ${projectCount} projects: ${dashboardLoadEnd - dashboardLoadStart}ms`);
    
    // Performance assertions
    expect(totalCreationTime / projectCount).toBeLessThan(2000); // Average creation time should be under 2 seconds
    expect(dashboardLoadEnd - dashboardLoadStart).toBeLessThan(5000); // Dashboard should load within 5 seconds
    
    // Test search performance
    const searchStartTime = Date.now();
    await page.fill('[data-testid="project-search-input"]', 'Performance Test Project 25');
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
    const searchEndTime = Date.now();
    
    console.log(`Search performance: ${searchEndTime - searchStartTime}ms`);
    expect(searchEndTime - searchStartTime).toBeLessThan(2000); // Search should be fast
    
    // Verify search found the correct project
    await expect(page.locator('text=Performance Test Project 25')).toBeVisible();
  });
});
