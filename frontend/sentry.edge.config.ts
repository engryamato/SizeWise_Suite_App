/**
 * Sentry edge runtime configuration for SizeWise Suite
 * This configuration is loaded for Edge Runtime functions
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://805514204a48915f64a39c0f5e7544f9@o4509734387056640.ingest.us.sentry.io/4509741504069632",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Custom tags for SizeWise Suite edge functions
  initialScope: {
    tags: {
      component: "edge",
      platform: "edge-runtime",
      application: "sizewise-suite"
    },
  },
});
