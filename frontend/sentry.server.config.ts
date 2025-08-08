/**
 * Sentry server-side configuration for SizeWise Suite
 * This configuration is loaded on the Node.js server side
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://805514204a48915f64a39c0f5e7544f9@o4509734387056640.ingest.us.sentry.io/4509741504069632",

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
  ],

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA,

  // Custom tags for SizeWise Suite server
  initialScope: {
    tags: {
      component: "server",
      platform: "nodejs",
      application: "sizewise-suite",
      deployment_env: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    },
  },

  // Server-side error filtering
  beforeSend(event, hint) {
    // Filter out expected server errors
    if (event.exception?.values?.[0]?.value?.includes('ECONNREFUSED')) {
      // Only send connection errors if they're not to the backend API during development
      if (process.env.NODE_ENV === 'development' &&
          (event.exception.values[0].value.includes('localhost:5000') ||
           event.exception.values[0].value.includes('localhost:5001'))) {
        return null;
      }
    }

    return event;
  },
});
