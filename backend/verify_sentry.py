#!/usr/bin/env python3
"""
Sentry Verification Script for SizeWise Suite Backend

This script demonstrates the Sentry integration following the official Flask
integration pattern. It creates a simple Flask app that triggers an error
to verify that Sentry is properly configured and capturing exceptions.
"""

import sentry_sdk
from flask import Flask

# Initialize Sentry with Flask integration
sentry_sdk.init(
    dsn="https://5deb7c885560c5bed065966a8c341727@o4509734387056640.ingest.us.sentry.io/4509741831028736",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profile_session_sample_rate to 1.0 to profile 100%
    # of profile sessions.
    profile_session_sample_rate=1.0,
    # Set profile_lifecycle to "trace" to automatically
    # run the profiler on when there is an active transaction
    profile_lifecycle="trace",
)

app = Flask(__name__)

@app.route("/")
def hello_world():
    1/0  # raises an error
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    """Health check endpoint that works correctly."""
    return {"status": "healthy", "service": "SizeWise Sentry Verification"}

if __name__ == '__main__':
    print("Starting Sentry verification server...")
    print("Visit http://localhost:5000/ to trigger an error")
    print("Visit http://localhost:5000/health for a working endpoint")
    print("Check your Sentry dashboard for the captured error and transaction data")
    
    app.run(host='127.0.0.1', port=5000, debug=True)
