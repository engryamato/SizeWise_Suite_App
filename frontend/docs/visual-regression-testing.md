# Visual Regression Testing for SizeWise Suite

## Overview

Visual regression testing is implemented using Playwright's built-in screenshot comparison capabilities to detect unintended visual changes in the SizeWise Suite frontend. This ensures that UI components maintain their expected appearance across different browsers, screen sizes, and user interactions.

## Test Structure

### Test Files

- **`visual-regression.spec.ts`** - Main visual regression test suite covering:
  - Landing page and authentication flows
  - Dashboard and navigation components
  - Export and reporting interfaces
  - Error states and loading states
  - Responsive design tests

- **`visual-hvac-components.spec.ts`** - HVAC-specific component tests covering:
  - Air duct sizer components
  - 3D visualization components
  - Calculation results components
  - HVAC-specific error states

### Configuration

- **`playwright-visual.config.ts`** - Specialized configuration for visual tests with:
  - Consistent screenshot settings
  - Disabled animations for stable captures
  - Multiple browser and viewport testing
  - Optimized retry and timeout settings

### Utilities

- **`visual-test-helpers.ts`** - Helper functions for:
  - Consistent test preparation
  - Authentication mocking
  - Dynamic content hiding
  - Responsive testing
  - Component state testing

## Running Visual Tests

### Local Development

```bash
# Run all visual regression tests
npm run test:visual

# Run with UI mode for debugging
npm run test:visual:ui

# Run in headed mode to see browser
npm run test:visual:headed

# Update snapshots when intentional changes are made
npm run test:visual:update
```

### Specific Test Execution

```bash
# Run only main visual regression tests
npx playwright test visual-regression.spec.ts --config=playwright-visual.config.ts

# Run only HVAC component tests
npx playwright test visual-hvac-components.spec.ts --config=playwright-visual.config.ts

# Run tests for specific browser
npx playwright test --config=playwright-visual.config.ts --project=chromium
```

## CI/CD Integration

### GitHub Actions Workflow

The visual regression testing is integrated into the CI/CD pipeline via `.github/workflows/visual-regression.yml`:

- **Triggers**: Pull requests, pushes to main, manual dispatch
- **Matrix Testing**: Tests across Chromium, Firefox, and WebKit
- **Artifact Upload**: Test results and visual diffs are uploaded
- **PR Comments**: Automated reporting of visual regression results

### Snapshot Management

- **Baseline Snapshots**: Stored in `frontend/e2e/` directory alongside test files
- **Automatic Updates**: Can be triggered via workflow dispatch with `update_snapshots: true`
- **Version Control**: Snapshots are committed to the repository for consistency

## Test Coverage

### Core UI Components

1. **Authentication Flow**
   - Login page
   - Signup page
   - Password reset
   - User profile dropdown

2. **Dashboard Components**
   - Overview dashboard
   - Navigation sidebar
   - User interface elements
   - Notification panels

3. **HVAC Calculation Interfaces**
   - Air duct sizer form
   - Material selection components
   - Calculation results tables
   - Pressure loss charts
   - Velocity profile visualizations

4. **3D Visualization**
   - 3D canvas with different fittings
   - Control panels and toolbars
   - View angle variations
   - Fitting library interface

5. **Export and Reporting**
   - Export options modal
   - Report preview components
   - Format selection interfaces

### Error States

- Form validation errors
- Calculation errors
- 3D rendering failures
- Network error states
- Loading states

### Responsive Design

- Tablet viewport (768x1024)
- Desktop viewport (1280x720)
- Large desktop viewport (1920x1080)

## Best Practices

### Writing Visual Tests

1. **Consistent Setup**
   ```typescript
   test.beforeEach(async ({ page }) => {
     visualHelper = new VisualTestHelper(page);
     await visualHelper.prepareForVisualTest();
     await visualHelper.mockAuthentication('premium');
   });
   ```

2. **Stable Screenshots**
   ```typescript
   // Wait for elements to be stable
   await visualHelper.waitForStableElements(['[data-testid="component"]']);
   
   // Hide dynamic content
   await visualHelper.hideDynamicContent();
   
   // Take screenshot with appropriate thresholds
   await visualHelper.takeScreenshot('component-name.png', element, {
     threshold: 0.2,
     maxDiffPixels: 1000
   });
   ```

3. **Component State Testing**
   ```typescript
   // Test different component states
   await visualHelper.testComponentStates(
     '[data-testid="button"]',
     'primary-button',
     { threshold: 0.1 }
   );
   ```

### Handling Dynamic Content

1. **Hide Timestamps and Dates**
   - Use CSS to hide elements with `data-testid` containing "timestamp" or "date"
   - Hide user avatars and generated content

2. **Mock Consistent Data**
   - Use `setConsistentTestData()` for form inputs
   - Mock authentication with consistent user data
   - Use fixed test data for calculations

3. **Disable Animations**
   - CSS animations and transitions are disabled automatically
   - Wait for elements to be stable before capturing

### Threshold Configuration

- **Standard Components**: `threshold: 0.2, maxDiffPixels: 1000`
- **3D Content**: `threshold: 0.3, maxDiffPixels: 2000` (higher due to rendering variations)
- **Simple Elements**: `threshold: 0.1, maxDiffPixels: 500`

## Troubleshooting

### Common Issues

1. **Flaky Tests Due to Animations**
   - Ensure animations are properly disabled
   - Add appropriate wait times for transitions
   - Use `waitForStableElements()` helper

2. **Font Loading Issues**
   - Tests wait for `document.fonts.ready`
   - Ensure consistent font loading across environments

3. **3D Rendering Variations**
   - Use higher thresholds for 3D content
   - Test WebGL fallback scenarios
   - Consider GPU differences in CI environments

4. **Dynamic Content Changes**
   - Hide or mock time-dependent content
   - Use consistent test data
   - Mock external API responses

### Debugging Failed Tests

1. **View Test Results**
   ```bash
   npm run test:visual:ui
   ```

2. **Check Diff Images**
   - Actual vs Expected images are saved in `test-results/`
   - Diff images highlight the differences

3. **Update Snapshots**
   ```bash
   # After confirming changes are intentional
   npm run test:visual:update
   ```

## Maintenance

### Regular Tasks

1. **Review Failed Tests**: Investigate visual regression failures in CI
2. **Update Snapshots**: When intentional UI changes are made
3. **Monitor Test Performance**: Ensure tests complete within reasonable time
4. **Browser Compatibility**: Verify tests work across all supported browsers

### Snapshot Updates

When UI changes are intentional:

1. **Local Update**:
   ```bash
   npm run test:visual:update
   git add frontend/e2e/**/*-*.png
   git commit -m "Update visual regression snapshots"
   ```

2. **CI Update**: Use workflow dispatch with `update_snapshots: true`

### Adding New Tests

1. Create test in appropriate spec file
2. Use `VisualTestHelper` for consistency
3. Follow naming conventions for screenshots
4. Add appropriate test data attributes to components
5. Document any special requirements or thresholds
