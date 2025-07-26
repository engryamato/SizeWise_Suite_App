/**
 * Sentry edge runtime configuration for SizeWise Suite
 * This configuration is loaded for Edge Runtime functions
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472",

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
