/**
 * Instrumentation file for Next.js Sentry integration
 * This file is automatically loaded by Next.js when the app starts
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Temporarily disable Sentry instrumentation to test if it's causing server hang
  console.log('Instrumentation register called - temporarily disabled');
  return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    await import('./sentry.edge.config');
  }

  // Client-side initialization
  if (typeof window !== 'undefined') {
    await import('./instrumentation-client');
  }
}

// Export the onRequestError hook for Sentry error capture
export const onRequestError = Sentry.captureRequestError;
