"""
Sentry Configuration for SizeWise Suite Authentication Server

Configures Sentry error monitoring and performance tracking for the
Flask-based authentication and user management service.
"""

import os
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

# Optional SQLAlchemy integration
try:
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    HAS_SQLALCHEMY = True
except (ImportError, Exception):
    HAS_SQLALCHEMY = False
    SqlalchemyIntegration = None

# Sentry DSN - same as frontend for unified monitoring
SENTRY_DSN = "https://7c66eaefa7b2dde6957e18ffb03bf28f@o4509734387056640.ingest.us.sentry.io/4509734389481472"

def init_sentry(app=None, environment=None):
    """
    Initialize Sentry for the Flask authentication server.
    
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
        before_send=filter_auth_errors,
        
        # Release tracking
        release=os.getenv('SENTRY_RELEASE', 'auth-server@dev'),
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Critical: Don't send PII for auth service
        max_breadcrumbs=50,

        # Additional options
        debug=environment == 'development'
    )

    # Set custom tags after initialization
    sentry_sdk.set_tag('component', 'auth-server')
    sentry_sdk.set_tag('service', 'sizewise-suite')
    sentry_sdk.set_tag('platform', 'python-flask')

    # Set user context if available
    if app and hasattr(app, 'config'):
        sentry_sdk.set_tag('app_version', app.config.get('VERSION', 'unknown'))


def filter_auth_errors(event, hint):
    """
    Filter out certain errors from being sent to Sentry.
    Special handling for authentication-related errors.
    
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
    
    # Filter out expected authentication failures (but keep unexpected ones)
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        error_message = str(exc_value).lower()
        
        # Don't send common auth failures as errors
        if any(phrase in error_message for phrase in [
            'invalid credentials',
            'token expired',
            'unauthorized',
            'invalid token'
        ]):
            # Convert to breadcrumb instead of error
            sentry_sdk.add_breadcrumb(
                category='auth',
                message=f'Authentication failure: {exc_value}',
                level='warning'
            )
            return None
    
    # Sanitize any potential PII from the event
    event = sanitize_auth_event(event)
    
    return event


def sanitize_auth_event(event):
    """
    Remove any potential PII from Sentry events.
    
    Args:
        event: Sentry event data
        
    Returns:
        Sanitized event
    """
    
    # Remove sensitive data from request
    if 'request' in event:
        request_data = event['request']
        
        # Remove sensitive headers
        if 'headers' in request_data:
            sensitive_headers = ['authorization', 'cookie', 'x-api-key']
            for header in sensitive_headers:
                if header in request_data['headers']:
                    request_data['headers'][header] = '[Filtered]'
        
        # Remove sensitive form data
        if 'data' in request_data:
            if isinstance(request_data['data'], dict):
                sensitive_fields = ['password', 'token', 'secret', 'key', 'email']
                for field in sensitive_fields:
                    if field in request_data['data']:
                        request_data['data'][field] = '[Filtered]'
    
    # Remove sensitive data from extra context
    if 'extra' in event:
        sensitive_keys = ['password', 'token', 'secret', 'key', 'email', 'user_id']
        for key in sensitive_keys:
            if key in event['extra']:
                event['extra'][key] = '[Filtered]'
    
    return event


def capture_auth_event(event_type, user_id=None, details=None):
    """
    Capture authentication-related events for monitoring.
    
    Args:
        event_type: Type of auth event (login, logout, register, etc.)
        user_id: User ID (will be hashed for privacy)
        details: Additional details (will be sanitized)
    """
    
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("auth.event_type", event_type)
        
        # Hash user ID for privacy
        if user_id:
            import hashlib
            hashed_user_id = hashlib.sha256(str(user_id).encode()).hexdigest()[:16]
            scope.set_tag("auth.user_hash", hashed_user_id)
        
        # Add sanitized details
        if details:
            sanitized_details = sanitize_auth_data(details)
            scope.set_context("auth_details", sanitized_details)
        
        # Add breadcrumb
        sentry_sdk.add_breadcrumb(
            category='auth',
            message=f'Auth event: {event_type}',
            level='info',
            data={'event_type': event_type}
        )


def sanitize_auth_data(data):
    """
    Sanitize authentication data before sending to Sentry.
    
    Args:
        data: Raw authentication data
        
    Returns:
        Sanitized data safe for Sentry
    """
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # Skip sensitive data
            if key.lower() in ['password', 'token', 'secret', 'key', 'email', 'user_id']:
                sanitized[key] = '[Filtered]'
            elif isinstance(value, str) and len(value) > 100:
                sanitized[key] = value[:100] + "..."
            elif isinstance(value, (dict, list)):
                sanitized[key] = sanitize_auth_data(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    elif isinstance(data, list):
        return [sanitize_auth_data(item) for item in data[:5]]  # Limit list size
    
    else:
        return data


def capture_auth_error(error, endpoint, method, user_context=None):
    """
    Capture authentication errors with context.
    
    Args:
        error: Exception that occurred
        endpoint: API endpoint path
        method: HTTP method
        user_context: User context (will be sanitized)
    """
    
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("auth.endpoint", endpoint)
        scope.set_tag("auth.method", method)
        
        # Add sanitized user context
        if user_context:
            sanitized_context = sanitize_auth_data(user_context)
            scope.set_context("user", sanitized_context)
        
        scope.set_context("auth", {
            "endpoint": endpoint,
            "method": method,
            "component": "auth-server"
        })
        
        sentry_sdk.capture_exception(error)


# Export commonly used functions
__all__ = [
    'init_sentry',
    'capture_auth_event',
    'capture_auth_error',
    'sanitize_auth_data'
]
