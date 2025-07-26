/**
 * Sentry client-side configuration for SizeWise Suite
 * This configuration is loaded on the browser/client side
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

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

  // Filter out noise and focus on meaningful errors
  beforeSend(event, hint) {
    // Filter out development-only errors
    if (process.env.NODE_ENV === 'development') {
      // Skip certain development warnings
      if (event.exception?.values?.[0]?.value?.includes('Warning: ReactDOM.render is deprecated')) {
        return null;
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
});
