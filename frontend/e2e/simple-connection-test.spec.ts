import { test, expect } from '@playwright/test';

test('Simple Connection Test', async ({ page }) => {
  console.log('🔍 Testing basic connection to localhost:3000...');
  
  try {
    await page.goto('http://localhost:3000/', { timeout: 10000 });
    console.log('✅ Successfully connected to localhost:3000');
    
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);
    
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Just verify we can connect
    expect(url).toContain('localhost:3000');
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    throw error;
  }
});
