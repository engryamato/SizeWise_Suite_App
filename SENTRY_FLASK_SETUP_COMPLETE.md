# Sentry Flask Integration Setup - Complete

## Overview

Sentry SDK has been successfully installed and configured for the SizeWise Suite Flask backend application following the official Sentry Flask integration pattern.

## Installation

The Sentry SDK with Flask extra has been installed:

```bash
pip install "sentry-sdk[flask]==2.33.2"
```

This is reflected in `backend/requirements.txt`:
```
sentry-sdk[flask]==2.33.2
```

## Configuration

### DSN Configuration
The Sentry DSN has been updated to match your provided configuration:
```
https://5deb7c885560c5bed065966a8c341727@o4509734387056640.ingest.us.sentry.io/4509741831028736
```

### Flask Integration
The Sentry configuration in `backend/sentry_config.py` follows the official Flask integration pattern:

```python
sentry_sdk.init(
    dsn=SENTRY_DSN,
    # Add data like request headers and IP for users
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
```

## Integration Points

### Main Flask Application
The main Flask app (`backend/app.py`) initializes Sentry during app creation:

```python
from .sentry_config import init_sentry

def create_app(config_name='development'):
    app = Flask(__name__)
    
    # Initialize Sentry monitoring
    init_sentry(app, environment=config_name)
    # ... rest of app configuration
```

### Verification Endpoint
A debug endpoint has been added for testing Sentry integration:

```python
@app.route('/api/sentry-debug')
def sentry_debug():
    """Sentry verification endpoint - triggers an error for testing."""
    logger.info("Sentry debug endpoint accessed")
    1/0  # raises an error
    return jsonify({'message': 'This should not be reached'})
```

## Verification

### Testing the Integration

1. **Start the Flask application:**
   ```bash
   source .venv/bin/activate
   python -m backend.app
   ```

2. **Test the error endpoint:**
   ```bash
   curl http://localhost:5000/api/sentry-debug
   ```

3. **Test the health endpoint:**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Standalone Verification Script
A standalone verification script (`backend/verify_sentry.py`) is available that demonstrates the exact pattern from the Sentry documentation:

```bash
source .venv/bin/activate
python backend/verify_sentry.py
```

Then visit:
- `http://localhost:5000/` - triggers an error
- `http://localhost:5000/health` - working endpoint

## Features Enabled

✅ **Error Tracking**: Automatic exception capture and reporting
✅ **Performance Monitoring**: 100% transaction sampling for development
✅ **Profiling**: Continuous profiling with trace lifecycle
✅ **Flask Integration**: Automatic request/response tracking
✅ **Structured Logging**: Integration with structlog for breadcrumbs
✅ **Custom Context**: API endpoint and calculation performance tracking

## Expected Sentry Data

When the integration is working correctly, you should see:

1. **Error Events**: ZeroDivisionError from the debug endpoint
2. **Transaction Data**: HTTP request/response performance
3. **Profile Data**: CPU profiling information
4. **Breadcrumbs**: Structured log entries as breadcrumbs

## Next Steps

1. Visit your Sentry dashboard to confirm error and transaction data is being received
2. The integration is ready for production use with appropriate sampling rates
3. Custom error capture and performance tracking functions are available in `sentry_config.py`

## Production Considerations

For production deployment, consider adjusting:
- `traces_sample_rate`: Reduce from 1.0 to 0.1 or lower
- `profile_session_sample_rate`: Reduce from 1.0 to 0.1 or lower
- `send_default_pii`: Set to False if PII concerns exist
- Environment-specific configuration in `init_sentry()`

The current configuration automatically adjusts sampling rates based on the environment, with full sampling in development and reduced sampling in production.
