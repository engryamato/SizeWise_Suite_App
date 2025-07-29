/**
 * Sentry client-side instrumentation for SizeWise Suite
 * This configuration is loaded on the browser/client side
 */

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry with error handling
try {
  Sentry.init({
  dsn: "https://805514204a48915f64a39c0f5e7544f9@o4509734387056640.ingest.us.sentry.io/4509741504069632",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Handle transport errors gracefully
  beforeSendTransaction(event) {
    // Allow transactions in development for testing
    return event;
  },

  // Enable logging integration
  _experiments: {
    enableLogs: true,
  },

  integrations: [
    // Send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ 
      levels: ["log", "error", "warn"] 
    }),

    // Capture user interactions
    Sentry.browserTracingIntegration({
      // Set up automatic route change tracking for Next.js App Router
      enableInp: true,
    }),

    // Capture replay sessions for debugging
    Sentry.replayIntegration(),
  ],

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Custom tags for SizeWise Suite
  initialScope: {
    tags: {
      component: "frontend",
      platform: "nextjs",
      application: "sizewise-suite"
    },
  },

  // Filter out noise and focus on meaningful errors (non-blocking)
  beforeSend(event, hint) {
    // In development, log errors but don't block on Sentry failures
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Sentry event (non-blocking):', event.message || event.exception?.values?.[0]?.value);

      // Skip certain development warnings
      if (event.exception?.values?.[0]?.value?.includes('Warning: ReactDOM.render is deprecated')) {
        return null;
      }

      // Skip test panel errors that are intentional
      if (event.exception?.values?.[0]?.value?.includes('Test error from SentryTestPanel')) {
        console.log('✅ Test error captured successfully');
        return event;
      }
    }

    // Filter out canvas-related errors that are expected
    if (event.exception?.values?.[0]?.value?.includes('Canvas')) {
      // Only send canvas errors if they're critical
      if (!event.exception.values[0].value.includes('temporarily unavailable')) {
        return event;
      }
      return null;
    }

    return event;
  },

  // Add transport error handling
  transport: undefined, // Use default transport with error handling
  });

  console.log('✅ Sentry client initialized successfully');
} catch (error) {
  console.warn('⚠️ Sentry client initialization failed (non-blocking):', error);
  // Continue without Sentry - don't block the application
}

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
