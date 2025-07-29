import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
class SentryExampleAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}
// A faulty API route to test Sentry's error monitoring
export async function GET() {
  try {
    throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
    // return NextResponse.json({ data: "Testing Sentry Error..." });
  } catch (error) {
    console.error('[SentryExampleAPIError]', error);
    return NextResponse.json({
      success: false,
      error: {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

