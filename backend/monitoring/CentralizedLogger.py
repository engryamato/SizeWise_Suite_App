#!/usr/bin/env python3
"""
Centralized Log Aggregation System for SizeWise Suite

This module provides comprehensive centralized logging with:
- Log aggregation from all services and components
- Structured logging with correlation IDs
- Log search and filtering capabilities
- 90-day retention policy
- User privacy and data protection
- Integration with existing Sentry and structlog infrastructure

Features:
- Multi-service log collection
- Correlation ID tracking across requests
- Log search and analysis
- Automated log retention
- Privacy-preserving log sanitization
- Performance monitoring integration
"""

import asyncio
import json
import uuid
import hashlib
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
import structlog
import aiofiles
import aiohttp
from pathlib import Path
import gzip
import shutil
import os
from collections import defaultdict, deque
import threading
import time

# Import existing monitoring components
try:
    from .MetricsCollector import MetricsCollector
    from .AlertingManager import AlertingManager, Alert, AlertSeverity
except ImportError:
    # Fallback for standalone testing
    MetricsCollector = None
    AlertingManager = None
    Alert = None
    AlertSeverity = None


class LogLevel(Enum):
    """Log severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class LogSource(Enum):
    """Log source types."""
    FRONTEND = "frontend"
    BACKEND = "backend"
    AUTH_SERVER = "auth_server"
    DATABASE = "database"
    NGINX = "nginx"
    REDIS = "redis"
    MONGODB = "mongodb"
    HVAC_CALCULATOR = "hvac_calculator"
    COLLABORATION = "collaboration"
    MONITORING = "monitoring"


@dataclass
class LogEntry:
    """Structured log entry with correlation tracking."""
    
    # Core fields
    timestamp: datetime
    level: LogLevel
    source: LogSource
    service: str
    message: str
    
    # Correlation tracking
    correlation_id: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    parent_span_id: Optional[str] = None
    
    # Context information
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    component: Optional[str] = None
    action: Optional[str] = None
    
    # Technical details
    hostname: Optional[str] = None
    process_id: Optional[int] = None
    thread_id: Optional[int] = None
    
    # Additional data
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    
    # Privacy and security
    is_sensitive: bool = False
    sanitized: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert log entry to dictionary for storage/transmission."""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        result['level'] = self.level.value
        result['source'] = self.source.value
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LogEntry':
        """Create log entry from dictionary."""
        data = data.copy()
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        data['level'] = LogLevel(data['level'])
        data['source'] = LogSource(data['source'])
        return cls(**data)


@dataclass
class LogSearchQuery:
    """Log search query parameters."""
    
    # Time range
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    # Filtering
    levels: List[LogLevel] = field(default_factory=list)
    sources: List[LogSource] = field(default_factory=list)
    services: List[str] = field(default_factory=list)
    
    # Text search
    message_contains: Optional[str] = None
    message_regex: Optional[str] = None
    
    # Correlation tracking
    correlation_id: Optional[str] = None
    trace_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Metadata search
    metadata_filters: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    
    # Result options
    limit: int = 1000
    offset: int = 0
    sort_order: str = "desc"  # desc or asc


@dataclass
class LogAggregationConfig:
    """Configuration for centralized logging."""
    
    # Storage configuration
    log_directory: str = "logs/centralized"
    max_file_size_mb: int = 100
    retention_days: int = 90
    compression_enabled: bool = True
    
    # Collection configuration
    collection_interval_seconds: int = 5
    batch_size: int = 1000
    max_memory_buffer_mb: int = 50
    
    # Search configuration
    search_index_enabled: bool = True
    search_cache_size: int = 10000
    
    # Privacy configuration
    privacy_mode_enabled: bool = True
    sensitive_fields: List[str] = field(default_factory=lambda: [
        'password', 'token', 'secret', 'key', 'credential',
        'ssn', 'credit_card', 'email', 'phone'
    ])
    
    # Integration configuration
    sentry_integration: bool = True
    metrics_integration: bool = True
    alerting_integration: bool = True
    
    # Performance configuration
    async_processing: bool = True
    worker_threads: int = 4


class CentralizedLogger:
    """Centralized log aggregation and management system."""
    
    def __init__(self, config: LogAggregationConfig):
        self.config = config
        self.logger = structlog.get_logger()
        
        # Storage and indexing
        self.log_buffer: deque = deque(maxlen=config.batch_size * 10)
        self.search_index: Dict[str, List[LogEntry]] = defaultdict(list)
        self.correlation_index: Dict[str, List[LogEntry]] = defaultdict(list)
        
        # Processing state
        self.is_running = False
        self.worker_tasks: List[asyncio.Task] = []
        self.last_cleanup = datetime.utcnow()
        
        # Statistics
        self.stats = {
            'logs_collected': 0,
            'logs_stored': 0,
            'logs_searched': 0,
            'logs_sanitized': 0,
            'storage_size_mb': 0,
            'search_cache_hits': 0,
            'search_cache_misses': 0
        }
        
        # Integration components
        self.metrics_collector: Optional[MetricsCollector] = None
        self.alerting_manager: Optional[AlertingManager] = None
        
        # Thread safety
        self.lock = threading.RLock()
    
    async def initialize(self) -> None:
        """Initialize the centralized logging system."""
        try:
            # Create log directory
            log_path = Path(self.config.log_directory)
            log_path.mkdir(parents=True, exist_ok=True)
            
            # Initialize integration components
            if self.config.metrics_integration and MetricsCollector:
                self.metrics_collector = MetricsCollector()
                await self.metrics_collector.initialize()
            
            if self.config.alerting_integration and AlertingManager:
                from .alerting_config import load_alerting_config
                alerting_config = load_alerting_config()
                self.alerting_manager = AlertingManager(alerting_config)
                await self.alerting_manager.initialize()
            
            # Start background workers
            if self.config.async_processing:
                await self._start_workers()
            
            self.is_running = True
            self.logger.info("Centralized logging system initialized",
                           log_directory=self.config.log_directory,
                           retention_days=self.config.retention_days,
                           privacy_mode=self.config.privacy_mode_enabled)
            
        except Exception as e:
            self.logger.error("Failed to initialize centralized logging", error=str(e))
            raise
    
    async def shutdown(self) -> None:
        """Shutdown the centralized logging system."""
        try:
            self.is_running = False
            
            # Stop worker tasks
            for task in self.worker_tasks:
                task.cancel()
            
            if self.worker_tasks:
                await asyncio.gather(*self.worker_tasks, return_exceptions=True)
            
            # Flush remaining logs
            await self._flush_logs()
            
            # Shutdown integration components
            if self.metrics_collector:
                # MetricsCollector doesn't have shutdown method yet
                pass
            
            if self.alerting_manager:
                await self.alerting_manager.shutdown()
            
            self.logger.info("Centralized logging system shutdown completed")
            
        except Exception as e:
            self.logger.error("Error during centralized logging shutdown", error=str(e))
    
    def generate_correlation_id(self) -> str:
        """Generate a new correlation ID for request tracking."""
        return str(uuid.uuid4())
    
    def generate_trace_id(self) -> str:
        """Generate a new trace ID for distributed tracing."""
        return str(uuid.uuid4())
    
    def generate_span_id(self) -> str:
        """Generate a new span ID for tracing."""
        return str(uuid.uuid4())
    
    async def log(self, 
                  level: LogLevel,
                  source: LogSource,
                  service: str,
                  message: str,
                  correlation_id: Optional[str] = None,
                  trace_id: Optional[str] = None,
                  span_id: Optional[str] = None,
                  user_id: Optional[str] = None,
                  session_id: Optional[str] = None,
                  component: Optional[str] = None,
                  action: Optional[str] = None,
                  metadata: Optional[Dict[str, Any]] = None,
                  tags: Optional[List[str]] = None) -> str:
        """
        Log a message to the centralized logging system.
        
        Returns the correlation_id for the log entry.
        """
        try:
            # Generate correlation ID if not provided
            if not correlation_id:
                correlation_id = self.generate_correlation_id()
            
            # Create log entry
            log_entry = LogEntry(
                timestamp=datetime.utcnow(),
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
                hostname=os.getenv('HOSTNAME', 'unknown'),
                process_id=os.getpid(),
                thread_id=threading.get_ident(),
                metadata=metadata or {},
                tags=tags or []
            )
            
            # Sanitize sensitive data if privacy mode enabled
            if self.config.privacy_mode_enabled:
                log_entry = self._sanitize_log_entry(log_entry)
            
            # Add to buffer
            with self.lock:
                self.log_buffer.append(log_entry)
                self.stats['logs_collected'] += 1
            
            # Update search index
            if self.config.search_index_enabled:
                self._update_search_index(log_entry)
            
            # Record metrics
            if self.metrics_collector:
                await self.metrics_collector.record_metric(
                    f"sizewise_logs_collected_total",
                    1,
                    {"level": level.value, "source": source.value, "service": service}
                )
            
            # Check for critical errors that need alerting
            if level in [LogLevel.ERROR, LogLevel.CRITICAL] and self.alerting_manager:
                await self._check_error_alerting(log_entry)
            
            return correlation_id
            
        except Exception as e:
            # Fallback to standard logging if centralized logging fails
            self.logger.error("Failed to log to centralized system", 
                            error=str(e), 
                            original_message=message)
            return str(uuid.uuid4())
    
    async def search_logs(self, query: LogSearchQuery) -> List[LogEntry]:
        """Search logs based on query parameters."""
        try:
            start_time = time.time()
            results = []
            
            # Search in memory buffer first
            buffer_results = self._search_buffer(query)
            results.extend(buffer_results)
            
            # Search in stored files if needed
            if len(results) < query.limit:
                file_results = await self._search_files(query, query.limit - len(results))
                results.extend(file_results)
            
            # Sort and limit results
            results = sorted(results, 
                           key=lambda x: x.timestamp, 
                           reverse=(query.sort_order == "desc"))
            
            if query.offset:
                results = results[query.offset:]
            
            results = results[:query.limit]
            
            # Update statistics
            search_time = time.time() - start_time
            self.stats['logs_searched'] += len(results)
            
            # Record metrics
            if self.metrics_collector:
                await self.metrics_collector.record_metric(
                    "sizewise_log_search_duration_seconds",
                    search_time,
                    {"result_count": len(results)}
                )
            
            self.logger.debug("Log search completed",
                            query_filters=len([f for f in [query.message_contains, 
                                                          query.correlation_id, 
                                                          query.trace_id] if f]),
                            results_count=len(results),
                            search_time_ms=search_time * 1000)
            
            return results
            
        except Exception as e:
            self.logger.error("Failed to search logs", error=str(e))
            return []
    
    def get_correlation_logs(self, correlation_id: str) -> List[LogEntry]:
        """Get all logs for a specific correlation ID."""
        with self.lock:
            return self.correlation_index.get(correlation_id, []).copy()
    
    def get_trace_logs(self, trace_id: str) -> List[LogEntry]:
        """Get all logs for a specific trace ID."""
        results = []
        with self.lock:
            for log_entry in self.log_buffer:
                if log_entry.trace_id == trace_id:
                    results.append(log_entry)
        return sorted(results, key=lambda x: x.timestamp)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get logging system statistics."""
        with self.lock:
            stats = self.stats.copy()
        
        # Add current buffer size
        stats['buffer_size'] = len(self.log_buffer)
        stats['search_index_size'] = sum(len(entries) for entries in self.search_index.values())
        stats['correlation_index_size'] = sum(len(entries) for entries in self.correlation_index.values())
        
        return stats
    
    async def _start_workers(self) -> None:
        """Start background worker tasks."""
        # Log processing worker
        self.worker_tasks.append(
            asyncio.create_task(self._log_processing_worker())
        )
        
        # Cleanup worker
        self.worker_tasks.append(
            asyncio.create_task(self._cleanup_worker())
        )
        
        # Statistics worker
        self.worker_tasks.append(
            asyncio.create_task(self._statistics_worker())
        )
    
    async def _log_processing_worker(self) -> None:
        """Background worker for processing and storing logs."""
        while self.is_running:
            try:
                if len(self.log_buffer) >= self.config.batch_size:
                    await self._flush_logs()
                
                await asyncio.sleep(self.config.collection_interval_seconds)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in log processing worker", error=str(e))
                await asyncio.sleep(5)  # Wait before retrying
    
    async def _cleanup_worker(self) -> None:
        """Background worker for log cleanup and retention."""
        while self.is_running:
            try:
                # Run cleanup every hour
                if datetime.utcnow() - self.last_cleanup > timedelta(hours=1):
                    await self._cleanup_old_logs()
                    self.last_cleanup = datetime.utcnow()
                
                await asyncio.sleep(3600)  # 1 hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in cleanup worker", error=str(e))
                await asyncio.sleep(300)  # Wait 5 minutes before retrying
    
    async def _statistics_worker(self) -> None:
        """Background worker for collecting and reporting statistics."""
        while self.is_running:
            try:
                # Update storage size statistics
                await self._update_storage_statistics()
                
                # Report statistics to metrics collector
                if self.metrics_collector:
                    stats = self.get_statistics()
                    for metric_name, value in stats.items():
                        if isinstance(value, (int, float)):
                            await self.metrics_collector.record_metric(
                                f"sizewise_logging_{metric_name}",
                                value,
                                {"component": "centralized_logger"}
                            )
                
                await asyncio.sleep(60)  # Update every minute

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in statistics worker", error=str(e))
                await asyncio.sleep(60)

    def _sanitize_log_entry(self, log_entry: LogEntry) -> LogEntry:
        """Sanitize log entry to remove sensitive information."""
        if log_entry.sanitized:
            return log_entry

        # Sanitize message
        sanitized_message = self._sanitize_text(log_entry.message)

        # Sanitize metadata
        sanitized_metadata = {}
        for key, value in log_entry.metadata.items():
            if any(sensitive in key.lower() for sensitive in self.config.sensitive_fields):
                sanitized_metadata[key] = self._hash_sensitive_value(str(value))
            elif isinstance(value, str):
                sanitized_metadata[key] = self._sanitize_text(value)
            else:
                sanitized_metadata[key] = value

        # Create sanitized copy
        sanitized_entry = LogEntry(
            timestamp=log_entry.timestamp,
            level=log_entry.level,
            source=log_entry.source,
            service=log_entry.service,
            message=sanitized_message,
            correlation_id=log_entry.correlation_id,
            trace_id=log_entry.trace_id,
            span_id=log_entry.span_id,
            parent_span_id=log_entry.parent_span_id,
            user_id=self._hash_user_id(log_entry.user_id) if log_entry.user_id else None,
            session_id=log_entry.session_id,
            request_id=log_entry.request_id,
            component=log_entry.component,
            action=log_entry.action,
            hostname=log_entry.hostname,
            process_id=log_entry.process_id,
            thread_id=log_entry.thread_id,
            metadata=sanitized_metadata,
            tags=log_entry.tags,
            is_sensitive=log_entry.is_sensitive,
            sanitized=True
        )

        self.stats['logs_sanitized'] += 1
        return sanitized_entry

    def _sanitize_text(self, text: str) -> str:
        """Sanitize text content to remove sensitive patterns."""
        # Email pattern
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                     '[EMAIL_REDACTED]', text)

        # Phone number patterns
        text = re.sub(r'\b\d{3}-\d{3}-\d{4}\b', '[PHONE_REDACTED]', text)
        text = re.sub(r'\b\(\d{3}\)\s*\d{3}-\d{4}\b', '[PHONE_REDACTED]', text)

        # Credit card patterns
        text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
                     '[CARD_REDACTED]', text)

        # SSN patterns
        text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]', text)

        # API key/token patterns
        text = re.sub(r'\b[A-Za-z0-9]{32,}\b', '[TOKEN_REDACTED]', text)

        return text

    def _hash_sensitive_value(self, value: str) -> str:
        """Hash sensitive values for privacy while maintaining searchability."""
        return hashlib.sha256(value.encode()).hexdigest()[:16]

    def _hash_user_id(self, user_id: str) -> str:
        """Hash user ID for privacy while maintaining correlation."""
        return hashlib.sha256(f"user_{user_id}".encode()).hexdigest()[:16]

    def _update_search_index(self, log_entry: LogEntry) -> None:
        """Update search index with new log entry."""
        with self.lock:
            # Index by level
            self.search_index[f"level:{log_entry.level.value}"].append(log_entry)

            # Index by source
            self.search_index[f"source:{log_entry.source.value}"].append(log_entry)

            # Index by service
            self.search_index[f"service:{log_entry.service}"].append(log_entry)

            # Index by correlation ID
            if log_entry.correlation_id:
                self.correlation_index[log_entry.correlation_id].append(log_entry)

            # Index by trace ID
            if log_entry.trace_id:
                self.search_index[f"trace:{log_entry.trace_id}"].append(log_entry)

            # Index by user ID (hashed)
            if log_entry.user_id:
                self.search_index[f"user:{log_entry.user_id}"].append(log_entry)

            # Index by tags
            for tag in log_entry.tags:
                self.search_index[f"tag:{tag}"].append(log_entry)

            # Limit index size to prevent memory issues
            for key, entries in self.search_index.items():
                if len(entries) > self.config.search_cache_size:
                    self.search_index[key] = entries[-self.config.search_cache_size:]

    def _search_buffer(self, query: LogSearchQuery) -> List[LogEntry]:
        """Search logs in memory buffer."""
        results = []

        with self.lock:
            for log_entry in self.log_buffer:
                if self._matches_query(log_entry, query):
                    results.append(log_entry)

        return results

    def _matches_query(self, log_entry: LogEntry, query: LogSearchQuery) -> bool:
        """Check if log entry matches search query."""
        # Time range filter
        if query.start_time and log_entry.timestamp < query.start_time:
            return False
        if query.end_time and log_entry.timestamp > query.end_time:
            return False

        # Level filter
        if query.levels and log_entry.level not in query.levels:
            return False

        # Source filter
        if query.sources and log_entry.source not in query.sources:
            return False

        # Service filter
        if query.services and log_entry.service not in query.services:
            return False

        # Message text search
        if query.message_contains and query.message_contains.lower() not in log_entry.message.lower():
            return False

        # Message regex search
        if query.message_regex:
            try:
                if not re.search(query.message_regex, log_entry.message, re.IGNORECASE):
                    return False
            except re.error:
                # Invalid regex, skip this filter
                pass

        # Correlation ID filter
        if query.correlation_id and log_entry.correlation_id != query.correlation_id:
            return False

        # Trace ID filter
        if query.trace_id and log_entry.trace_id != query.trace_id:
            return False

        # User ID filter
        if query.user_id and log_entry.user_id != query.user_id:
            return False

        # Session ID filter
        if query.session_id and log_entry.session_id != query.session_id:
            return False

        # Metadata filters
        for key, expected_value in query.metadata_filters.items():
            if key not in log_entry.metadata or log_entry.metadata[key] != expected_value:
                return False

        # Tags filter
        if query.tags:
            if not all(tag in log_entry.tags for tag in query.tags):
                return False

        return True

    async def _search_files(self, query: LogSearchQuery, limit: int) -> List[LogEntry]:
        """Search logs in stored files."""
        results = []
        log_dir = Path(self.config.log_directory)

        # Get log files sorted by date (newest first)
        log_files = sorted(log_dir.glob("*.jsonl*"), key=lambda x: x.stat().st_mtime, reverse=True)

        for log_file in log_files:
            if len(results) >= limit:
                break

            try:
                file_results = await self._search_file(log_file, query, limit - len(results))
                results.extend(file_results)
            except Exception as e:
                self.logger.error("Error searching log file", file=str(log_file), error=str(e))

        return results

    async def _search_file(self, file_path: Path, query: LogSearchQuery, limit: int) -> List[LogEntry]:
        """Search a single log file."""
        results = []

        # Handle compressed files
        if file_path.suffix == '.gz':
            import gzip
            open_func = gzip.open
            mode = 'rt'
        else:
            open_func = open
            mode = 'r'

        try:
            async with aiofiles.open(file_path, mode=mode) as f:
                async for line in f:
                    if len(results) >= limit:
                        break

                    try:
                        log_data = json.loads(line.strip())
                        log_entry = LogEntry.from_dict(log_data)

                        if self._matches_query(log_entry, query):
                            results.append(log_entry)
                    except (json.JSONDecodeError, KeyError, ValueError) as e:
                        # Skip malformed log entries
                        continue
        except Exception as e:
            self.logger.error("Error reading log file", file=str(file_path), error=str(e))

        return results

    async def _flush_logs(self) -> None:
        """Flush log buffer to storage."""
        if not self.log_buffer:
            return

        try:
            # Get logs to flush
            with self.lock:
                logs_to_flush = list(self.log_buffer)
                self.log_buffer.clear()

            if not logs_to_flush:
                return

            # Generate filename with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"logs_{timestamp}.jsonl"
            file_path = Path(self.config.log_directory) / filename

            # Write logs to file
            async with aiofiles.open(file_path, 'w') as f:
                for log_entry in logs_to_flush:
                    log_data = log_entry.to_dict()
                    await f.write(json.dumps(log_data) + '\n')

            # Compress file if enabled
            if self.config.compression_enabled:
                await self._compress_file(file_path)

            self.stats['logs_stored'] += len(logs_to_flush)

            self.logger.debug("Flushed logs to storage",
                            count=len(logs_to_flush),
                            file=str(file_path))

        except Exception as e:
            self.logger.error("Failed to flush logs", error=str(e))
            # Put logs back in buffer if flush failed
            with self.lock:
                self.log_buffer.extendleft(reversed(logs_to_flush))

    async def _compress_file(self, file_path: Path) -> None:
        """Compress a log file."""
        try:
            compressed_path = file_path.with_suffix(file_path.suffix + '.gz')

            with open(file_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)

            # Remove original file
            file_path.unlink()

        except Exception as e:
            self.logger.error("Failed to compress log file", file=str(file_path), error=str(e))

    async def _cleanup_old_logs(self) -> None:
        """Clean up old log files based on retention policy."""
        try:
            log_dir = Path(self.config.log_directory)
            cutoff_date = datetime.utcnow() - timedelta(days=self.config.retention_days)

            deleted_count = 0
            for log_file in log_dir.glob("*.jsonl*"):
                file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                if file_time < cutoff_date:
                    log_file.unlink()
                    deleted_count += 1

            if deleted_count > 0:
                self.logger.info("Cleaned up old log files",
                               deleted_count=deleted_count,
                               retention_days=self.config.retention_days)

        except Exception as e:
            self.logger.error("Failed to cleanup old logs", error=str(e))

    async def _update_storage_statistics(self) -> None:
        """Update storage size statistics."""
        try:
            log_dir = Path(self.config.log_directory)
            total_size = 0

            for log_file in log_dir.glob("*.jsonl*"):
                total_size += log_file.stat().st_size

            self.stats['storage_size_mb'] = total_size / (1024 * 1024)

        except Exception as e:
            self.logger.error("Failed to update storage statistics", error=str(e))

    async def _check_error_alerting(self, log_entry: LogEntry) -> None:
        """Check if error log entry should trigger an alert."""
        if not self.alerting_manager:
            return

        try:
            # Create alert for critical errors
            if log_entry.level == LogLevel.CRITICAL:
                alert = Alert(
                    name="critical_error_detected",
                    severity=AlertSeverity.CRITICAL,
                    description=f"Critical error in {log_entry.service}: {log_entry.message[:200]}",
                    metric_name="critical_errors",
                    current_value=1,
                    threshold=0,
                    condition=">",
                    duration_seconds=0,
                    timestamp=log_entry.timestamp,
                    runbook_url="https://docs.sizewise-suite.com/runbooks/critical-errors"
                )

                await self.alerting_manager.send_alert(alert)

            # Create alert for high error rates
            elif log_entry.level == LogLevel.ERROR:
                # Count recent errors for this service
                recent_errors = 0
                cutoff_time = datetime.utcnow() - timedelta(minutes=5)

                with self.lock:
                    for entry in self.log_buffer:
                        if (entry.service == log_entry.service and
                            entry.level == LogLevel.ERROR and
                            entry.timestamp > cutoff_time):
                            recent_errors += 1

                # Alert if error rate is high
                if recent_errors >= 10:  # 10 errors in 5 minutes
                    alert = Alert(
                        name="high_error_rate",
                        severity=AlertSeverity.WARNING,
                        description=f"High error rate in {log_entry.service}: {recent_errors} errors in 5 minutes",
                        metric_name="error_rate",
                        current_value=recent_errors,
                        threshold=10,
                        condition=">=",
                        duration_seconds=300,
                        timestamp=log_entry.timestamp,
                        runbook_url="https://docs.sizewise-suite.com/runbooks/high-error-rate"
                    )

                    await self.alerting_manager.send_alert(alert)

        except Exception as e:
            self.logger.error("Failed to check error alerting", error=str(e))
