import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }

  // Client-side initialization
  if (typeof window !== 'undefined') {
    await import('./instrumentation-client');
  }
}

export const onRequestError = Sentry.captureRequestError;
