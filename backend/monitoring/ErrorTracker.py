"""
Production Error Tracking System for SizeWise Suite

Comprehensive error tracking and alerting system that provides:
- Real-time error capture and categorization
- Error aggregation and deduplication
- Performance impact analysis
- Automated alerting and notifications
- Error trend analysis and reporting
- Integration with monitoring and logging systems

Designed for production environments with high-volume error handling.
"""

import asyncio
import traceback
import hashlib
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import structlog

logger = structlog.get_logger()

# =============================================================================
# Error Types and Configuration
# =============================================================================

class ErrorSeverity(Enum):
    """Error severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ErrorCategory(Enum):
    """Error categories for classification."""
    SYSTEM = "system"
    APPLICATION = "application"
    DATABASE = "database"
    NETWORK = "network"
    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    CALCULATION = "calculation"
    CACHE = "cache"
    SERVICE_MESH = "service_mesh"
    LOAD_BALANCER = "load_balancer"

@dataclass
class ErrorContext:
    """Context information for an error."""
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    service_name: Optional[str] = None
    service_version: Optional[str] = None
    additional_data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ErrorEvent:
    """Individual error event."""
    error_id: str
    fingerprint: str
    message: str
    exception_type: str
    severity: ErrorSeverity
    category: ErrorCategory
    timestamp: datetime
    stack_trace: Optional[str] = None
    context: Optional[ErrorContext] = None
    resolved: bool = False
    resolution_notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error event to dictionary."""
        return {
            'error_id': self.error_id,
            'fingerprint': self.fingerprint,
            'message': self.message,
            'exception_type': self.exception_type,
            'severity': self.severity.value,
            'category': self.category.value,
            'timestamp': self.timestamp.isoformat(),
            'stack_trace': self.stack_trace,
            'context': self.context.__dict__ if self.context else None,
            'resolved': self.resolved,
            'resolution_notes': self.resolution_notes
        }

@dataclass
class ErrorGroup:
    """Grouped errors with same fingerprint."""
    fingerprint: str
    first_seen: datetime
    last_seen: datetime
    count: int
    events: List[ErrorEvent] = field(default_factory=list)
    severity: ErrorSeverity = ErrorSeverity.LOW
    category: ErrorCategory = ErrorCategory.APPLICATION
    resolved: bool = False
    
    def add_event(self, event: ErrorEvent):
        """Add an error event to this group."""
        self.events.append(event)
        self.count += 1
        self.last_seen = event.timestamp
        
        # Update severity to highest seen
        severity_order = [ErrorSeverity.INFO, ErrorSeverity.LOW, ErrorSeverity.MEDIUM, 
                         ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]
        if severity_order.index(event.severity) > severity_order.index(self.severity):
            self.severity = event.severity

class ErrorTracker:
    """
    Production error tracking system for comprehensive error monitoring.
    
    Features:
    - Real-time error capture and categorization
    - Error deduplication and grouping
    - Automated alerting based on error patterns
    - Performance impact analysis
    - Error trend analysis and reporting
    - Integration with external monitoring systems
    """
    
    def __init__(self):
        self.error_groups: Dict[str, ErrorGroup] = {}
        self.error_events: List[ErrorEvent] = []
        self.error_handlers: Dict[ErrorCategory, List[Callable]] = {}
        self.alert_thresholds: Dict[str, Dict[str, Any]] = {}
        
        # Configuration
        self.max_events_per_group = 100
        self.max_total_events = 10000
        self.cleanup_interval_hours = 24
        self.alert_cooldown_minutes = 15
        
        # Alert tracking
        self.last_alerts: Dict[str, datetime] = {}
        
        # Initialize default alert thresholds
        self._initialize_alert_thresholds()
        
        # Background tasks
        self.cleanup_task: Optional[asyncio.Task] = None
        self.alert_task: Optional[asyncio.Task] = None
    
    def _initialize_alert_thresholds(self):
        """Initialize default alert thresholds."""
        self.alert_thresholds = {
            'error_rate': {
                'critical': {'count': 50, 'window_minutes': 5},
                'high': {'count': 20, 'window_minutes': 5},
                'medium': {'count': 10, 'window_minutes': 10}
            },
            'new_error_group': {
                'critical': {'severity': ErrorSeverity.CRITICAL},
                'high': {'severity': ErrorSeverity.HIGH},
                'medium': {'severity': ErrorSeverity.MEDIUM}
            },
            'error_spike': {
                'critical': {'increase_factor': 5.0, 'window_minutes': 10},
                'high': {'increase_factor': 3.0, 'window_minutes': 15},
                'medium': {'increase_factor': 2.0, 'window_minutes': 30}
            }
        }
    
    async def initialize(self):
        """Initialize the error tracker."""
        try:
            # Start background tasks
            self.cleanup_task = asyncio.create_task(self._cleanup_old_errors())
            self.alert_task = asyncio.create_task(self._monitor_error_patterns())
            
            logger.info("Error tracker initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize error tracker", error=str(e))
            raise
    
    def capture_error(self, 
                     exception: Exception,
                     context: Optional[ErrorContext] = None,
                     severity: Optional[ErrorSeverity] = None,
                     category: Optional[ErrorCategory] = None) -> str:
        """
        Capture an error event.
        
        Args:
            exception: The exception that occurred
            context: Additional context information
            severity: Error severity (auto-detected if not provided)
            category: Error category (auto-detected if not provided)
            
        Returns:
            Error ID for tracking
        """
        try:
            # Generate error fingerprint for grouping
            fingerprint = self._generate_fingerprint(exception)
            
            # Auto-detect severity and category if not provided
            if severity is None:
                severity = self._detect_severity(exception)
            if category is None:
                category = self._detect_category(exception)
            
            # Create error event
            error_event = ErrorEvent(
                error_id=self._generate_error_id(),
                fingerprint=fingerprint,
                message=str(exception),
                exception_type=type(exception).__name__,
                severity=severity,
                category=category,
                timestamp=datetime.utcnow(),
                stack_trace=traceback.format_exc(),
                context=context
            )
            
            # Add to error group
            self._add_to_group(error_event)
            
            # Store individual event
            self.error_events.append(error_event)
            
            # Trigger error handlers
            asyncio.create_task(self._trigger_error_handlers(error_event))
            
            logger.error("Error captured",
                        error_id=error_event.error_id,
                        fingerprint=fingerprint,
                        severity=severity.value,
                        category=category.value,
                        message=str(exception))
            
            return error_event.error_id
            
        except Exception as e:
            logger.error("Failed to capture error", error=str(e))
            return ""
    
    def _generate_fingerprint(self, exception: Exception) -> str:
        """Generate a fingerprint for error grouping."""
        try:
            # Create fingerprint based on exception type and message
            fingerprint_data = f"{type(exception).__name__}:{str(exception)}"
            
            # Include relevant stack trace information
            tb = traceback.extract_tb(exception.__traceback__)
            if tb:
                # Use the last few frames for fingerprinting
                relevant_frames = tb[-3:]  # Last 3 frames
                for frame in relevant_frames:
                    fingerprint_data += f":{frame.filename}:{frame.lineno}"
            
            # Generate hash
            return hashlib.md5(fingerprint_data.encode()).hexdigest()
            
        except Exception as e:
            logger.warning("Failed to generate error fingerprint", error=str(e))
            return hashlib.md5(str(exception).encode()).hexdigest()
    
    def _detect_severity(self, exception: Exception) -> ErrorSeverity:
        """Auto-detect error severity based on exception type."""
        try:
            exception_type = type(exception).__name__
            
            # Critical errors
            critical_types = [
                'SystemExit', 'KeyboardInterrupt', 'MemoryError',
                'OSError', 'IOError', 'DatabaseError', 'ConnectionError'
            ]
            
            # High severity errors
            high_types = [
                'RuntimeError', 'ValueError', 'TypeError', 'AttributeError',
                'ImportError', 'ModuleNotFoundError'
            ]
            
            # Medium severity errors
            medium_types = [
                'FileNotFoundError', 'PermissionError', 'TimeoutError',
                'ValidationError', 'AuthenticationError'
            ]
            
            if exception_type in critical_types:
                return ErrorSeverity.CRITICAL
            elif exception_type in high_types:
                return ErrorSeverity.HIGH
            elif exception_type in medium_types:
                return ErrorSeverity.MEDIUM
            else:
                return ErrorSeverity.LOW
                
        except Exception:
            return ErrorSeverity.MEDIUM
    
    def _detect_category(self, exception: Exception) -> ErrorCategory:
        """Auto-detect error category based on exception type and context."""
        try:
            exception_type = type(exception).__name__
            message = str(exception).lower()
            
            # Database errors
            if any(keyword in exception_type.lower() for keyword in ['database', 'sql', 'connection']):
                return ErrorCategory.DATABASE
            
            # Network errors
            if any(keyword in exception_type.lower() for keyword in ['network', 'connection', 'timeout', 'http']):
                return ErrorCategory.NETWORK
            
            # Authentication errors
            if any(keyword in message for keyword in ['auth', 'permission', 'unauthorized', 'forbidden']):
                return ErrorCategory.AUTHENTICATION
            
            # Validation errors
            if any(keyword in exception_type.lower() for keyword in ['validation', 'value', 'type']):
                return ErrorCategory.VALIDATION
            
            # HVAC calculation errors
            if any(keyword in message for keyword in ['hvac', 'calculation', 'load', 'cooling', 'heating']):
                return ErrorCategory.CALCULATION
            
            # Cache errors
            if any(keyword in message for keyword in ['cache', 'redis', 'memory']):
                return ErrorCategory.CACHE
            
            # System errors
            if any(keyword in exception_type.lower() for keyword in ['system', 'os', 'memory', 'io']):
                return ErrorCategory.SYSTEM
            
            return ErrorCategory.APPLICATION
            
        except Exception:
            return ErrorCategory.APPLICATION
    
    def _generate_error_id(self) -> str:
        """Generate unique error ID."""
        import uuid
        return str(uuid.uuid4())
    
    def _add_to_group(self, error_event: ErrorEvent):
        """Add error event to appropriate group."""
        try:
            fingerprint = error_event.fingerprint
            
            if fingerprint in self.error_groups:
                # Add to existing group
                self.error_groups[fingerprint].add_event(error_event)
                
                # Limit events per group
                group = self.error_groups[fingerprint]
                if len(group.events) > self.max_events_per_group:
                    group.events = group.events[-self.max_events_per_group:]
            else:
                # Create new group
                self.error_groups[fingerprint] = ErrorGroup(
                    fingerprint=fingerprint,
                    first_seen=error_event.timestamp,
                    last_seen=error_event.timestamp,
                    count=1,
                    events=[error_event],
                    severity=error_event.severity,
                    category=error_event.category
                )
                
                # Trigger new error group alert
                asyncio.create_task(self._alert_new_error_group(self.error_groups[fingerprint]))
            
        except Exception as e:
            logger.error("Failed to add error to group", error=str(e))
    
    async def _trigger_error_handlers(self, error_event: ErrorEvent):
        """Trigger registered error handlers for the error category."""
        try:
            if error_event.category in self.error_handlers:
                for handler in self.error_handlers[error_event.category]:
                    try:
                        await handler(error_event)
                    except Exception as e:
                        logger.error("Error handler failed", 
                                   category=error_event.category.value,
                                   error=str(e))
                        
        except Exception as e:
            logger.error("Failed to trigger error handlers", error=str(e))
    
    def register_error_handler(self, category: ErrorCategory, handler: Callable):
        """Register an error handler for a specific category."""
        try:
            if category not in self.error_handlers:
                self.error_handlers[category] = []
            self.error_handlers[category].append(handler)
            
            logger.info("Error handler registered", 
                       category=category.value,
                       handler=handler.__name__)
            
        except Exception as e:
            logger.error("Failed to register error handler", error=str(e))
    
    async def _cleanup_old_errors(self):
        """Clean up old error events and groups."""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                cutoff_time = datetime.utcnow() - timedelta(hours=self.cleanup_interval_hours)
                
                # Clean up old events
                self.error_events = [
                    event for event in self.error_events
                    if event.timestamp > cutoff_time
                ]
                
                # Clean up old groups
                groups_to_remove = []
                for fingerprint, group in self.error_groups.items():
                    if group.last_seen < cutoff_time:
                        groups_to_remove.append(fingerprint)
                    else:
                        # Clean up old events within the group
                        group.events = [
                            event for event in group.events
                            if event.timestamp > cutoff_time
                        ]
                        group.count = len(group.events)
                
                for fingerprint in groups_to_remove:
                    del self.error_groups[fingerprint]
                
                # Limit total events
                if len(self.error_events) > self.max_total_events:
                    self.error_events = self.error_events[-self.max_total_events:]
                
                logger.debug("Error cleanup completed",
                           total_events=len(self.error_events),
                           total_groups=len(self.error_groups),
                           removed_groups=len(groups_to_remove))
                
            except Exception as e:
                logger.error("Error during cleanup", error=str(e))
    
    async def _monitor_error_patterns(self):
        """Monitor error patterns and trigger alerts."""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Check error rate alerts
                await self._check_error_rate_alerts()
                
                # Check error spike alerts
                await self._check_error_spike_alerts()
                
            except Exception as e:
                logger.error("Error in pattern monitoring", error=str(e))
    
    async def _check_error_rate_alerts(self):
        """Check for high error rates."""
        try:
            for severity, config in self.alert_thresholds['error_rate'].items():
                window_start = datetime.utcnow() - timedelta(minutes=config['window_minutes'])
                
                recent_errors = [
                    event for event in self.error_events
                    if event.timestamp > window_start
                ]
                
                if len(recent_errors) >= config['count']:
                    alert_key = f"error_rate_{severity}"
                    if self._should_send_alert(alert_key):
                        await self._send_alert(
                            f"High error rate detected",
                            f"{len(recent_errors)} errors in {config['window_minutes']} minutes",
                            severity
                        )
                        self.last_alerts[alert_key] = datetime.utcnow()
                        
        except Exception as e:
            logger.error("Failed to check error rate alerts", error=str(e))
    
    async def _check_error_spike_alerts(self):
        """Check for error spikes."""
        try:
            for severity, config in self.alert_thresholds['error_spike'].items():
                window_minutes = config['window_minutes']
                increase_factor = config['increase_factor']
                
                current_window = datetime.utcnow() - timedelta(minutes=window_minutes)
                previous_window = current_window - timedelta(minutes=window_minutes)
                
                current_errors = len([
                    event for event in self.error_events
                    if event.timestamp > current_window
                ])
                
                previous_errors = len([
                    event for event in self.error_events
                    if previous_window < event.timestamp <= current_window
                ])
                
                if previous_errors > 0 and current_errors >= previous_errors * increase_factor:
                    alert_key = f"error_spike_{severity}"
                    if self._should_send_alert(alert_key):
                        await self._send_alert(
                            f"Error spike detected",
                            f"Errors increased from {previous_errors} to {current_errors} "
                            f"({increase_factor}x increase)",
                            severity
                        )
                        self.last_alerts[alert_key] = datetime.utcnow()
                        
        except Exception as e:
            logger.error("Failed to check error spike alerts", error=str(e))
    
    async def _alert_new_error_group(self, error_group: ErrorGroup):
        """Alert for new error groups."""
        try:
            threshold_config = self.alert_thresholds['new_error_group']
            
            for severity, config in threshold_config.items():
                if error_group.severity == config['severity']:
                    alert_key = f"new_error_group_{error_group.fingerprint}"
                    if self._should_send_alert(alert_key):
                        await self._send_alert(
                            f"New {severity} error group detected",
                            f"Error: {error_group.events[0].message}",
                            severity
                        )
                        self.last_alerts[alert_key] = datetime.utcnow()
                    break
                    
        except Exception as e:
            logger.error("Failed to send new error group alert", error=str(e))
    
    def _should_send_alert(self, alert_key: str) -> bool:
        """Check if alert should be sent based on cooldown."""
        try:
            if alert_key not in self.last_alerts:
                return True
            
            last_alert = self.last_alerts[alert_key]
            cooldown_period = timedelta(minutes=self.alert_cooldown_minutes)
            
            return datetime.utcnow() - last_alert > cooldown_period
            
        except Exception:
            return True
    
    async def _send_alert(self, title: str, message: str, severity: str):
        """Send alert notification."""
        try:
            alert_data = {
                'title': title,
                'message': message,
                'severity': severity,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'SizeWise Error Tracker'
            }
            
            logger.warning("ERROR ALERT", **alert_data)
            
            # Here you would integrate with alerting systems:
            # - Slack notifications
            # - Email alerts
            # - PagerDuty
            # - Discord webhooks
            # - etc.
            
        except Exception as e:
            logger.error("Failed to send alert", error=str(e))
    
    async def get_error_summary(self) -> Dict[str, Any]:
        """Get comprehensive error summary."""
        try:
            # Recent errors (last hour)
            recent_cutoff = datetime.utcnow() - timedelta(hours=1)
            recent_errors = [
                event for event in self.error_events
                if event.timestamp > recent_cutoff
            ]
            
            # Error counts by category
            category_counts = {}
            for event in recent_errors:
                category = event.category.value
                category_counts[category] = category_counts.get(category, 0) + 1
            
            # Error counts by severity
            severity_counts = {}
            for event in recent_errors:
                severity = event.severity.value
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Top error groups
            top_groups = sorted(
                self.error_groups.values(),
                key=lambda g: g.count,
                reverse=True
            )[:10]
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'summary': {
                    'total_error_groups': len(self.error_groups),
                    'total_events': len(self.error_events),
                    'recent_events_1h': len(recent_errors),
                    'active_alerts': len(self.last_alerts)
                },
                'recent_errors': {
                    'by_category': category_counts,
                    'by_severity': severity_counts
                },
                'top_error_groups': [
                    {
                        'fingerprint': group.fingerprint,
                        'count': group.count,
                        'severity': group.severity.value,
                        'category': group.category.value,
                        'first_seen': group.first_seen.isoformat(),
                        'last_seen': group.last_seen.isoformat(),
                        'latest_message': group.events[-1].message if group.events else ""
                    }
                    for group in top_groups
                ]
            }
            
        except Exception as e:
            logger.error("Failed to get error summary", error=str(e))
            return {'error': str(e)}

# Global error tracker instance
error_tracker = None

def initialize_error_tracker() -> ErrorTracker:
    """Initialize the global error tracker."""
    global error_tracker
    error_tracker = ErrorTracker()
    return error_tracker

def get_error_tracker() -> ErrorTracker:
    """Get the global error tracker instance."""
    if error_tracker is None:
        raise RuntimeError("Error tracker not initialized")
    return error_tracker
