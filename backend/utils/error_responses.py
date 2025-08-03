"""
Standardized Error Response Utilities for SizeWise Suite Backend

Provides consistent error response formatting, logging, and handling
across all Flask API endpoints.
"""

import logging
import traceback
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, Union
from flask import jsonify, request
from functools import wraps

# =============================================================================
# Error Types and Severity Levels
# =============================================================================

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    CALCULATION = "calculation"
    NETWORK = "network"
    DATABASE = "database"
    SYSTEM = "system"
    USER_INPUT = "user_input"
    HVAC_DOMAIN = "hvac_domain"
    OFFLINE = "offline"
    PERFORMANCE = "performance"

# =============================================================================
# Standard Error Response Class
# =============================================================================

class StandardErrorResponse:
    def __init__(
        self,
        code: str,
        message: str,
        user_message: str,
        severity: ErrorSeverity,
        category: ErrorCategory,
        status_code: int = 500,
        context: Optional[Dict[str, Any]] = None,
        recoverable: bool = True,
        retryable: bool = False
    ):
        self.id = f"err_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        self.code = code
        self.message = message
        self.user_message = user_message
        self.severity = severity
        self.category = category
        self.status_code = status_code
        self.context = context or {}
        self.recoverable = recoverable
        self.retryable = retryable
        self.timestamp = datetime.utcnow().isoformat()
        
        # Add request context
        if request:
            self.context.update({
                'endpoint': request.endpoint,
                'method': request.method,
                'url': request.url,
                'user_agent': request.headers.get('User-Agent'),
                'remote_addr': request.remote_addr
            })

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert error to dictionary format for JSON response"""
        response = {
            'success': False,
            'error': {
                'id': self.id,
                'code': self.code,
                'message': self.user_message,  # Always use user-friendly message
                'severity': self.severity.value,
                'category': self.category.value,
                'timestamp': self.timestamp,
                'recoverable': self.recoverable,
                'retryable': self.retryable
            }
        }
        
        # Include sensitive information only in development
        if include_sensitive:
            response['error'].update({
                'internal_message': self.message,
                'context': self.context,
                'stack_trace': traceback.format_exc() if hasattr(self, '_exception') else None
            })
        
        return response

    def to_flask_response(self, include_sensitive: bool = False):
        """Convert to Flask JSON response"""
        return jsonify(self.to_dict(include_sensitive)), self.status_code

# =============================================================================
# Predefined Error Types
# =============================================================================

class ErrorTypes:
    @staticmethod
    def authentication_failed(message: str = "Authentication failed", context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="AUTH_FAILED",
            message=message,
            user_message="Please check your login credentials and try again",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.AUTHENTICATION,
            status_code=401,
            context=context,
            retryable=True
        )
    
    @staticmethod
    def access_denied(message: str = "Access denied", context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="ACCESS_DENIED",
            message=message,
            user_message="You do not have permission to perform this action",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.AUTHORIZATION,
            status_code=403,
            context=context,
            recoverable=False
        )
    
    @staticmethod
    def validation_error(message: str, user_message: str = None, context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="VALIDATION_FAILED",
            message=message,
            user_message=user_message or "Please check your input and try again",
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.VALIDATION,
            status_code=400,
            context=context,
            recoverable=True
        )
    
    @staticmethod
    def hvac_calculation_error(message: str, context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="HVAC_CALC_ERROR",
            message=message,
            user_message="HVAC calculation failed. Please verify your inputs",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.HVAC_DOMAIN,
            status_code=422,
            context=context,
            retryable=True
        )
    
    @staticmethod
    def database_error(message: str = "Database operation failed", context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="DATABASE_ERROR",
            message=message,
            user_message="Data operation failed. Please try again",
            severity=ErrorSeverity.HIGH,
            category=ErrorCategory.DATABASE,
            status_code=500,
            context=context,
            retryable=True
        )
    
    @staticmethod
    def network_error(message: str = "Network operation failed", context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="NETWORK_ERROR",
            message=message,
            user_message="Network connection failed. Please check your connection",
            severity=ErrorSeverity.MEDIUM,
            category=ErrorCategory.NETWORK,
            status_code=503,
            context=context,
            retryable=True
        )
    
    @staticmethod
    def internal_server_error(message: str = "Internal server error", context: Optional[Dict] = None):
        return StandardErrorResponse(
            code="INTERNAL_ERROR",
            message=message,
            user_message="An unexpected error occurred. Please try again",
            severity=ErrorSeverity.CRITICAL,
            category=ErrorCategory.SYSTEM,
            status_code=500,
            context=context,
            retryable=True
        )

# =============================================================================
# Error Handler Decorator
# =============================================================================

def handle_api_errors(
    include_sensitive: bool = False,
    log_errors: bool = True,
    custom_error_handler: Optional[callable] = None
):
    """Decorator for standardized API error handling"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Create standard error response
                if isinstance(e, StandardErrorResponse):
                    error_response = e
                else:
                    # Convert generic exception to standard error
                    error_response = ErrorTypes.internal_server_error(
                        message=str(e),
                        context={'function': func.__name__, 'args_count': len(args)}
                    )
                    error_response._exception = e
                
                # Log the error
                if log_errors:
                    logger = logging.getLogger(__name__)
                    log_level = _get_log_level(error_response.severity)
                    logger.log(
                        log_level,
                        f"API Error [{error_response.id}]: {error_response.message}",
                        extra={
                            'error_id': error_response.id,
                            'error_code': error_response.code,
                            'severity': error_response.severity.value,
                            'category': error_response.category.value,
                            'context': error_response.context
                        }
                    )
                
                # Custom error handling
                if custom_error_handler:
                    custom_error_handler(error_response)
                
                return error_response.to_flask_response(include_sensitive)
        
        return wrapper
    return decorator

# =============================================================================
# Utility Functions
# =============================================================================

def _get_log_level(severity: ErrorSeverity) -> int:
    """Convert error severity to logging level"""
    mapping = {
        ErrorSeverity.LOW: logging.INFO,
        ErrorSeverity.MEDIUM: logging.WARNING,
        ErrorSeverity.HIGH: logging.ERROR,
        ErrorSeverity.CRITICAL: logging.CRITICAL
    }
    return mapping.get(severity, logging.ERROR)

def create_error_response(
    error_type: str,
    message: str,
    user_message: str = None,
    context: Optional[Dict] = None
) -> StandardErrorResponse:
    """Factory function for creating error responses"""
    error_creators = {
        'auth': ErrorTypes.authentication_failed,
        'access': ErrorTypes.access_denied,
        'validation': ErrorTypes.validation_error,
        'hvac': ErrorTypes.hvac_calculation_error,
        'database': ErrorTypes.database_error,
        'network': ErrorTypes.network_error,
        'internal': ErrorTypes.internal_server_error
    }
    
    creator = error_creators.get(error_type, ErrorTypes.internal_server_error)
    
    if error_type == 'validation':
        return creator(message, user_message, context)
    else:
        return creator(message, context)

def log_error_metrics(error_response: StandardErrorResponse):
    """Log error metrics for monitoring and analytics"""
    logger = logging.getLogger('error_metrics')
    logger.info(
        "Error metric",
        extra={
            'metric_type': 'error_occurred',
            'error_id': error_response.id,
            'error_code': error_response.code,
            'severity': error_response.severity.value,
            'category': error_response.category.value,
            'status_code': error_response.status_code,
            'recoverable': error_response.recoverable,
            'retryable': error_response.retryable,
            'timestamp': error_response.timestamp
        }
    )

# =============================================================================
# Flask Error Handlers
# =============================================================================

def register_error_handlers(app):
    """Register standardized error handlers with Flask app"""
    
    @app.errorhandler(400)
    def handle_bad_request(e):
        error = ErrorTypes.validation_error(
            message="Bad request",
            user_message="Invalid request format"
        )
        return error.to_flask_response()
    
    @app.errorhandler(401)
    def handle_unauthorized(e):
        error = ErrorTypes.authentication_failed()
        return error.to_flask_response()
    
    @app.errorhandler(403)
    def handle_forbidden(e):
        error = ErrorTypes.access_denied()
        return error.to_flask_response()
    
    @app.errorhandler(404)
    def handle_not_found(e):
        error = StandardErrorResponse(
            code="NOT_FOUND",
            message="Resource not found",
            user_message="The requested resource was not found",
            severity=ErrorSeverity.LOW,
            category=ErrorCategory.SYSTEM,
            status_code=404,
            recoverable=False
        )
        return error.to_flask_response()
    
    @app.errorhandler(500)
    def handle_internal_error(e):
        error = ErrorTypes.internal_server_error()
        return error.to_flask_response()

# =============================================================================
# Export main functions
# =============================================================================

__all__ = [
    'StandardErrorResponse',
    'ErrorTypes',
    'ErrorSeverity',
    'ErrorCategory',
    'handle_api_errors',
    'create_error_response',
    'register_error_handlers',
    'log_error_metrics'
]
