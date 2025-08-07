// Test script to validate route logic
const NO_LASER_ROUTES = [
  '/login',
  '/signup',
  '/onboarding',
  '/auth',
  '/export',
  '/preview',
  '/air-duct-sizer-v1',
  '/air-duct-sizer',
];

const TOOL_ROUTES = [
  '/air-duct-sizer-v1',
  '/air-duct-sizer',
];

const DASHBOARD_ROUTES = [
  '/dashboard',
];

function testRoute(pathname) {
  const shouldShowLaser = !NO_LASER_ROUTES.some(route => pathname.startsWith(route));
  const isToolPage = TOOL_ROUTES.some(route => pathname.startsWith(route));
  const isDashboardPage = DASHBOARD_ROUTES.some(route => pathname.startsWith(route));
  const sidebarOpen = true; // default
  const finalSidebarOpen = (isToolPage || isDashboardPage) ? false : sidebarOpen;
  
  console.log(`Route: ${pathname}`);
  console.log(`  shouldShowLaser: ${shouldShowLaser}`);
  console.log(`  isToolPage: ${isToolPage}`);
  console.log(`  isDashboardPage: ${isDashboardPage}`);
  console.log(`  finalSidebarOpen: ${finalSidebarOpen}`);
  console.log('---');
}

// Test routes
testRoute('/dashboard');
testRoute('/air-duct-sizer');
testRoute('/projects');
testRoute('/tools');
