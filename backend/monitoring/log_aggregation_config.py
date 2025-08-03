#!/usr/bin/env python3
"""
Log Aggregation Configuration for SizeWise Suite

This module provides configuration management for the centralized logging system,
including environment-based configuration, validation, and integration settings.
"""

import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path
import structlog

from CentralizedLogger import LogAggregationConfig, LogLevel, LogSource


def load_log_aggregation_config() -> LogAggregationConfig:
    """Load log aggregation configuration from environment variables."""
    
    return LogAggregationConfig(
        # Storage configuration
        log_directory=os.getenv('LOG_AGGREGATION_DIRECTORY', 'logs/centralized'),
        max_file_size_mb=int(os.getenv('LOG_MAX_FILE_SIZE_MB', '100')),
        retention_days=int(os.getenv('LOG_RETENTION_DAYS', '90')),
        compression_enabled=os.getenv('LOG_COMPRESSION_ENABLED', 'true').lower() == 'true',
        
        # Collection configuration
        collection_interval_seconds=int(os.getenv('LOG_COLLECTION_INTERVAL_SECONDS', '5')),
        batch_size=int(os.getenv('LOG_BATCH_SIZE', '1000')),
        max_memory_buffer_mb=int(os.getenv('LOG_MAX_MEMORY_BUFFER_MB', '50')),
        
        # Search configuration
        search_index_enabled=os.getenv('LOG_SEARCH_INDEX_ENABLED', 'true').lower() == 'true',
        search_cache_size=int(os.getenv('LOG_SEARCH_CACHE_SIZE', '10000')),
        
        # Privacy configuration
        privacy_mode_enabled=os.getenv('LOG_PRIVACY_MODE_ENABLED', 'true').lower() == 'true',
        sensitive_fields=os.getenv('LOG_SENSITIVE_FIELDS', 
                                 'password,token,secret,key,credential,ssn,credit_card,email,phone').split(','),
        
        # Integration configuration
        sentry_integration=os.getenv('LOG_SENTRY_INTEGRATION', 'true').lower() == 'true',
        metrics_integration=os.getenv('LOG_METRICS_INTEGRATION', 'true').lower() == 'true',
        alerting_integration=os.getenv('LOG_ALERTING_INTEGRATION', 'true').lower() == 'true',
        
        # Performance configuration
        async_processing=os.getenv('LOG_ASYNC_PROCESSING', 'true').lower() == 'true',
        worker_threads=int(os.getenv('LOG_WORKER_THREADS', '4'))
    )


def validate_log_aggregation_config(config: LogAggregationConfig) -> List[str]:
    """Validate log aggregation configuration and return list of issues."""
    issues = []
    
    # Validate storage configuration
    if config.max_file_size_mb <= 0:
        issues.append("max_file_size_mb must be positive")
    
    if config.retention_days <= 0:
        issues.append("retention_days must be positive")
    
    # Validate collection configuration
    if config.collection_interval_seconds <= 0:
        issues.append("collection_interval_seconds must be positive")
    
    if config.batch_size <= 0:
        issues.append("batch_size must be positive")
    
    if config.max_memory_buffer_mb <= 0:
        issues.append("max_memory_buffer_mb must be positive")
    
    # Validate search configuration
    if config.search_cache_size <= 0:
        issues.append("search_cache_size must be positive")
    
    # Validate performance configuration
    if config.worker_threads <= 0:
        issues.append("worker_threads must be positive")
    
    # Check log directory permissions
    try:
        log_dir = Path(config.log_directory)
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Test write permissions
        test_file = log_dir / '.test_write'
        test_file.write_text('test')
        test_file.unlink()
        
    except Exception as e:
        issues.append(f"Cannot write to log directory {config.log_directory}: {str(e)}")
    
    return issues


def get_sample_environment_config() -> str:
    """Get sample environment configuration for log aggregation."""
    return """
# Log Aggregation Configuration
LOG_AGGREGATION_DIRECTORY=logs/centralized
LOG_MAX_FILE_SIZE_MB=100
LOG_RETENTION_DAYS=90
LOG_COMPRESSION_ENABLED=true

# Collection Settings
LOG_COLLECTION_INTERVAL_SECONDS=5
LOG_BATCH_SIZE=1000
LOG_MAX_MEMORY_BUFFER_MB=50

# Search Settings
LOG_SEARCH_INDEX_ENABLED=true
LOG_SEARCH_CACHE_SIZE=10000

# Privacy Settings
LOG_PRIVACY_MODE_ENABLED=true
LOG_SENSITIVE_FIELDS=password,token,secret,key,credential,ssn,credit_card,email,phone

# Integration Settings
LOG_SENTRY_INTEGRATION=true
LOG_METRICS_INTEGRATION=true
LOG_ALERTING_INTEGRATION=true

# Performance Settings
LOG_ASYNC_PROCESSING=true
LOG_WORKER_THREADS=4
"""


@dataclass
class LoggingIntegrationConfig:
    """Configuration for integrating centralized logging with existing systems."""
    
    # Structlog integration
    structlog_integration: bool = True
    structlog_processor_position: int = -2  # Before JSONRenderer
    
    # Sentry integration
    sentry_breadcrumb_integration: bool = True
    sentry_event_integration: bool = True
    
    # Flask integration
    flask_request_logging: bool = True
    flask_error_logging: bool = True
    flask_performance_logging: bool = True
    
    # HVAC calculation logging
    hvac_calculation_logging: bool = True
    hvac_performance_logging: bool = True
    hvac_error_logging: bool = True
    
    # Authentication logging
    auth_success_logging: bool = True
    auth_failure_logging: bool = True
    auth_security_logging: bool = True
    
    # Database logging
    database_query_logging: bool = False  # Can be verbose
    database_error_logging: bool = True
    database_performance_logging: bool = True
    
    # Frontend logging integration
    frontend_error_logging: bool = True
    frontend_performance_logging: bool = True
    frontend_user_action_logging: bool = True


def create_structlog_processor(centralized_logger):
    """Create a structlog processor for centralized logging integration."""
    
    def centralized_logging_processor(logger, method_name, event_dict):
        """Structlog processor that sends logs to centralized logging system."""
        try:
            # Extract log information
            level_str = event_dict.get('level', 'info')
            message = event_dict.get('event', 'Log entry')
            
            # Map structlog level to LogLevel enum
            level_mapping = {
                'debug': LogLevel.DEBUG,
                'info': LogLevel.INFO,
                'warning': LogLevel.WARNING,
                'error': LogLevel.ERROR,
                'critical': LogLevel.CRITICAL
            }
            level = level_mapping.get(level_str, LogLevel.INFO)
            
            # Determine source and service
            source = LogSource.BACKEND  # Default for backend logs
            service = event_dict.get('service', 'backend')
            
            # Extract correlation information
            correlation_id = event_dict.get('correlation_id')
            trace_id = event_dict.get('trace_id')
            span_id = event_dict.get('span_id')
            user_id = event_dict.get('user_id')
            session_id = event_dict.get('session_id')
            component = event_dict.get('component')
            action = event_dict.get('action')
            
            # Extract metadata (exclude standard fields)
            standard_fields = {
                'level', 'event', 'service', 'correlation_id', 'trace_id', 
                'span_id', 'user_id', 'session_id', 'component', 'action'
            }
            metadata = {k: v for k, v in event_dict.items() if k not in standard_fields}
            
            # Extract tags
            tags = event_dict.get('tags', [])
            if isinstance(tags, str):
                tags = [tags]
            
            # Send to centralized logger (async call in background)
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Create task for async logging
                    loop.create_task(centralized_logger.log(
                        level=level,
                        source=source,
                        service=service,
                        message=message,
                        correlation_id=correlation_id,
                        trace_id=trace_id,
                        span_id=span_id,
                        user_id=user_id,
                        session_id=session_id,
                        component=component,
                        action=action,
                        metadata=metadata,
                        tags=tags
                    ))
                else:
                    # No event loop, skip centralized logging
                    pass
            except RuntimeError:
                # No event loop available, skip centralized logging
                pass
            
        except Exception as e:
            # Don't let logging errors break the application
            logger.error("Failed to send log to centralized system", error=str(e))
        
        # Always return the event_dict for other processors
        return event_dict
    
    return centralized_logging_processor


def create_flask_logging_middleware(centralized_logger):
    """Create Flask middleware for request/response logging."""
    
    def log_request_middleware(app):
        """Flask middleware for logging requests and responses."""
        
        @app.before_request
        def before_request():
            """Log incoming requests."""
            from flask import request, g
            import time
            
            # Generate correlation ID for request tracking
            correlation_id = centralized_logger.generate_correlation_id()
            g.correlation_id = correlation_id
            g.request_start_time = time.time()
            
            # Log request
            asyncio.create_task(centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="flask",
                message=f"{request.method} {request.path}",
                correlation_id=correlation_id,
                component="request_handler",
                action="request_start",
                metadata={
                    "method": request.method,
                    "path": request.path,
                    "remote_addr": request.remote_addr,
                    "user_agent": request.headers.get('User-Agent', ''),
                    "content_length": request.content_length
                },
                tags=["http_request"]
            ))
        
        @app.after_request
        def after_request(response):
            """Log request completion."""
            from flask import g
            import time
            
            if hasattr(g, 'correlation_id') and hasattr(g, 'request_start_time'):
                duration = time.time() - g.request_start_time
                
                # Determine log level based on status code
                if response.status_code >= 500:
                    level = LogLevel.ERROR
                elif response.status_code >= 400:
                    level = LogLevel.WARNING
                else:
                    level = LogLevel.INFO
                
                # Log response
                asyncio.create_task(centralized_logger.log(
                    level=level,
                    source=LogSource.BACKEND,
                    service="flask",
                    message=f"Request completed: {response.status_code}",
                    correlation_id=g.correlation_id,
                    component="request_handler",
                    action="request_complete",
                    metadata={
                        "status_code": response.status_code,
                        "duration_ms": duration * 1000,
                        "content_length": response.content_length
                    },
                    tags=["http_response"]
                ))
            
            return response
        
        @app.errorhandler(Exception)
        def handle_exception(e):
            """Log unhandled exceptions."""
            from flask import g
            
            correlation_id = getattr(g, 'correlation_id', None)
            
            # Log exception
            asyncio.create_task(centralized_logger.log(
                level=LogLevel.ERROR,
                source=LogSource.BACKEND,
                service="flask",
                message=f"Unhandled exception: {str(e)}",
                correlation_id=correlation_id,
                component="error_handler",
                action="exception",
                metadata={
                    "exception_type": type(e).__name__,
                    "exception_message": str(e)
                },
                tags=["exception", "unhandled"]
            ))
            
            # Re-raise the exception
            raise
    
    return log_request_middleware


def create_hvac_calculation_logger(centralized_logger):
    """Create logging utilities for HVAC calculations."""
    
    async def log_calculation_start(calculation_type: str, 
                                  input_parameters: Dict[str, Any],
                                  correlation_id: Optional[str] = None,
                                  user_id: Optional[str] = None) -> str:
        """Log the start of an HVAC calculation."""
        if not correlation_id:
            correlation_id = centralized_logger.generate_correlation_id()
        
        await centralized_logger.log(
            level=LogLevel.INFO,
            source=LogSource.HVAC_CALCULATOR,
            service="hvac_calculations",
            message=f"Starting {calculation_type} calculation",
            correlation_id=correlation_id,
            user_id=user_id,
            component="calculation_engine",
            action="calculation_start",
            metadata={
                "calculation_type": calculation_type,
                "input_parameters": input_parameters,
                "parameter_count": len(input_parameters)
            },
            tags=["hvac_calculation", "calculation_start"]
        )
        
        return correlation_id
    
    async def log_calculation_complete(calculation_type: str,
                                     result: Dict[str, Any],
                                     duration_ms: float,
                                     correlation_id: str,
                                     user_id: Optional[str] = None):
        """Log the completion of an HVAC calculation."""
        await centralized_logger.log(
            level=LogLevel.INFO,
            source=LogSource.HVAC_CALCULATOR,
            service="hvac_calculations",
            message=f"Completed {calculation_type} calculation",
            correlation_id=correlation_id,
            user_id=user_id,
            component="calculation_engine",
            action="calculation_complete",
            metadata={
                "calculation_type": calculation_type,
                "duration_ms": duration_ms,
                "result_keys": list(result.keys()) if result else [],
                "success": True
            },
            tags=["hvac_calculation", "calculation_complete"]
        )
    
    async def log_calculation_error(calculation_type: str,
                                  error: Exception,
                                  duration_ms: float,
                                  correlation_id: str,
                                  user_id: Optional[str] = None):
        """Log an HVAC calculation error."""
        await centralized_logger.log(
            level=LogLevel.ERROR,
            source=LogSource.HVAC_CALCULATOR,
            service="hvac_calculations",
            message=f"Error in {calculation_type} calculation: {str(error)}",
            correlation_id=correlation_id,
            user_id=user_id,
            component="calculation_engine",
            action="calculation_error",
            metadata={
                "calculation_type": calculation_type,
                "duration_ms": duration_ms,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "success": False
            },
            tags=["hvac_calculation", "calculation_error", "error"]
        )
    
    return {
        'log_calculation_start': log_calculation_start,
        'log_calculation_complete': log_calculation_complete,
        'log_calculation_error': log_calculation_error
    }
