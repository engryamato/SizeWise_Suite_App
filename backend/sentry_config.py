"""
Sentry Configuration for SizeWise Suite Backend Services

Configures Sentry error monitoring and performance tracking for Flask-based
backend APIs and calculation services.
"""

import os
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import structlog

# Optional SQLAlchemy integration
try:
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    HAS_SQLALCHEMY = True
except (ImportError, Exception):
    HAS_SQLALCHEMY = False
    SqlalchemyIntegration = None

# Sentry DSN - same as frontend for unified monitoring
SENTRY_DSN = (
    "https://805514204a48915f64a39c0f5e7544f9@o4509734387056640"
    ".ingest.us.sentry.io/4509741504069632"
)

def init_sentry(app=None, environment=None):
    """
    Initialize Sentry for the Flask backend application.
    
    Args:
        app: Flask application instance (optional)
        environment: Environment name (development, staging, production)
    """
    
    # Determine environment
    if environment is None:
        environment = os.getenv('FLASK_ENV', 'development')
    
    # Only initialize Sentry if DSN is available and not in testing
    if not SENTRY_DSN or os.getenv('TESTING'):
        return
    
    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=None,  # Capture all log levels
        event_level=None  # Don't send logs as events by default
    )
    
    # Configure Flask integration
    flask_integration = FlaskIntegration(
        transaction_style='endpoint'
    )

    # Build integrations list
    integrations = [flask_integration, logging_integration]

    # Add SQLAlchemy integration if available
    if HAS_SQLALCHEMY:
        sqlalchemy_integration = SqlalchemyIntegration()
        integrations.append(sqlalchemy_integration)

    # Initialize Sentry
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=environment,
        integrations=integrations,
        
        # Performance monitoring
        traces_sample_rate=1.0 if environment == 'development' else 0.1,
        profiles_sample_rate=1.0 if environment == 'development' else 0.1,
        
        # Error filtering
        before_send=filter_errors,
        
        # Release tracking
        release=os.getenv('SENTRY_RELEASE', 'backend@dev'),
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable information
        max_breadcrumbs=50,

        # Additional options
        debug=environment == 'development'
    )

    # Set custom tags after initialization
    sentry_sdk.set_tag('component', 'backend')
    sentry_sdk.set_tag('service', 'sizewise-suite')
    sentry_sdk.set_tag('platform', 'python-flask')

    # Configure structured logging with Sentry
    configure_structured_logging()
    
    # Set user context if available
    if app and hasattr(app, 'config'):
        sentry_sdk.set_tag('app_version', app.config.get('VERSION', 'unknown'))


def filter_errors(event, hint):
    """
    Filter out certain errors from being sent to Sentry.
    
    Args:
        event: Sentry event data
        hint: Additional context about the event
        
    Returns:
        Modified event or None to drop the event
    """
    
    # Don't send 404 errors
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        if exc_type.__name__ == 'NotFound':
            return None
    
    # Filter out health check requests
    if event.get('request', {}).get('url', '').endswith('/health'):
        return None
    
    # Filter out development-only errors
    if event.get('environment') == 'development':
        # Allow all errors in development for debugging
        pass
    
    return event


def configure_structured_logging():
    """Configure structured logging to work with Sentry."""
    
    def add_sentry_breadcrumb(logger, method_name, event_dict):
        """Add Sentry breadcrumb for structured log entries."""
        
        level = event_dict.get('level', 'info')
        message = event_dict.get('event', 'Log entry')
        
        # Convert structlog level to Sentry level
        sentry_level = {
            'debug': 'debug',
            'info': 'info',
            'warning': 'warning',
            'error': 'error',
            'critical': 'fatal'
        }.get(level, 'info')
        
        # Add breadcrumb to Sentry
        sentry_sdk.add_breadcrumb(
            category='log',
            message=message,
            level=sentry_level,
            data={k: v for k, v in event_dict.items() if k not in ['event', 'level']}
        )
        
        return event_dict
    
    # Add Sentry breadcrumb processor to structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            add_sentry_breadcrumb,  # Add our custom processor
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def capture_calculation_performance(calculation_type, duration, input_data=None, result_data=None):
    """
    Capture HVAC calculation performance metrics.
    
    Args:
        calculation_type: Type of calculation (e.g., 'duct_sizing', 'pressure_loss')
        duration: Calculation duration in seconds
        input_data: Input parameters (optional, will be sanitized)
        result_data: Calculation results (optional, will be sanitized)
    """
    
    with sentry_sdk.start_transaction(
        op="calculation",
        name=f"hvac.{calculation_type}"
    ) as transaction:
        
        # Set transaction data
        transaction.set_tag("calculation.type", calculation_type)
        transaction.set_data("calculation.duration", duration)
        
        # Add sanitized input data
        if input_data:
            sanitized_input = sanitize_calculation_data(input_data)
            transaction.set_data("calculation.input", sanitized_input)
        
        # Add sanitized result data
        if result_data:
            sanitized_result = sanitize_calculation_data(result_data)
            transaction.set_data("calculation.result", sanitized_result)
        
        # Record custom metric
        sentry_sdk.set_measurement(f"calculation.{calculation_type}.duration", duration, "second")


def sanitize_calculation_data(data):
    """
    Sanitize calculation data before sending to Sentry.
    
    Args:
        data: Raw calculation data
        
    Returns:
        Sanitized data safe for Sentry
    """
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # Skip sensitive or large data
            if key.lower() in ['password', 'token', 'secret', 'key']:
                continue
            
            # Limit string length
            if isinstance(value, str) and len(value) > 1000:
                sanitized[key] = value[:1000] + "..."
            elif isinstance(value, (dict, list)):
                # Recursively sanitize nested data
                sanitized[key] = sanitize_calculation_data(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    elif isinstance(data, list):
        return [sanitize_calculation_data(item) for item in data[:10]]  # Limit list size
    
    else:
        return data


def capture_api_error(error, endpoint, method, request_data=None):
    """
    Capture API errors with context.
    
    Args:
        error: Exception that occurred
        endpoint: API endpoint path
        method: HTTP method
        request_data: Request data (optional, will be sanitized)
    """
    
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("api.endpoint", endpoint)
        scope.set_tag("api.method", method)
        scope.set_context("api", {
            "endpoint": endpoint,
            "method": method,
            "request_data": sanitize_calculation_data(request_data) if request_data else None
        })
        
        sentry_sdk.capture_exception(error)


# Export commonly used functions
__all__ = [
    'init_sentry',
    'capture_calculation_performance',
    'capture_api_error',
    'sanitize_calculation_data'
]
