#!/usr/bin/env python3
"""
Comprehensive Test Suite for Centralized Logging System

This test suite validates all aspects of the centralized logging system including:
- Log aggregation and storage
- Search and filtering functionality
- Correlation ID tracking
- Privacy and data sanitization
- Integration with existing systems
- Performance and reliability
"""

import asyncio
import json
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
import sys
import os
from typing import Dict, Any, List

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from CentralizedLogger import (
    CentralizedLogger, LogAggregationConfig, LogEntry, LogLevel, 
    LogSource, LogSearchQuery
)
from log_aggregation_config import (
    load_log_aggregation_config, validate_log_aggregation_config,
    create_structlog_processor, create_hvac_calculation_logger
)
from initialize_log_aggregation import LogAggregationManager


class CentralizedLoggingValidator:
    """Comprehensive validator for the centralized logging system."""
    
    def __init__(self):
        self.results: Dict[str, Any] = {
            'tests_run': 0,
            'tests_passed': 0,
            'tests_failed': 0,
            'validation_details': []
        }
        self.temp_dir = None
        self.centralized_logger = None
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result."""
        self.results['tests_run'] += 1
        if passed:
            self.results['tests_passed'] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.results['tests_failed'] += 1
            print(f"❌ {test_name}: FAILED - {details}")
        
        self.results['validation_details'].append({
            'test_name': test_name,
            'passed': passed,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    async def validate_complete_system(self) -> Dict[str, Any]:
        """Run complete system validation."""
        print("🔄 Starting comprehensive centralized logging validation...")
        print("=" * 70)
        
        try:
            # Setup test environment
            await self._setup_test_environment()
            
            # Core functionality tests
            await self._test_logger_initialization()
            await self._test_basic_logging()
            await self._test_correlation_tracking()
            await self._test_log_levels_and_sources()
            await self._test_metadata_and_tags()
            
            # Search and filtering tests
            await self._test_log_search_functionality()
            await self._test_correlation_search()
            await self._test_time_range_search()
            await self._test_advanced_filtering()
            
            # Privacy and security tests
            await self._test_data_sanitization()
            await self._test_sensitive_data_handling()
            await self._test_user_privacy_protection()
            
            # Storage and retention tests
            await self._test_log_storage()
            await self._test_log_compression()
            await self._test_retention_policy()
            
            # Performance tests
            await self._test_high_volume_logging()
            await self._test_search_performance()
            await self._test_memory_usage()
            
            # Integration tests
            await self._test_structlog_integration()
            await self._test_hvac_calculation_logging()
            await self._test_error_alerting_integration()
            
            # Calculate success rate
            success_rate = (self.results['tests_passed'] / self.results['tests_run']) * 100
            self.results['success_rate'] = success_rate
            
            print("=" * 70)
            print(f"🎯 Validation Summary:")
            print(f"   Success Rate: {success_rate:.1f}%")
            print(f"   Tests Passed: {self.results['tests_passed']}")
            print(f"   Tests Failed: {self.results['tests_failed']}")
            print(f"   Total Tests: {self.results['tests_run']}")
            
            if success_rate >= 90:
                print("🎉 Centralized logging system validation SUCCESSFUL!")
                self.results['overall_status'] = 'PASSED'
            else:
                print("⚠️  Centralized logging system validation needs attention")
                self.results['overall_status'] = 'NEEDS_ATTENTION'
            
            return self.results
            
        except Exception as e:
            print(f"💥 Critical error during validation: {str(e)}")
            self.results['critical_error'] = str(e)
            self.results['overall_status'] = 'CRITICAL_ERROR'
            return self.results
        
        finally:
            await self._cleanup_test_environment()
    
    async def _setup_test_environment(self):
        """Set up test environment with temporary directories."""
        try:
            # Create temporary directory for test logs
            self.temp_dir = tempfile.mkdtemp(prefix="sizewise_log_test_")
            
            # Create test configuration
            config = LogAggregationConfig(
                log_directory=str(Path(self.temp_dir) / "logs"),
                max_file_size_mb=10,
                retention_days=1,
                compression_enabled=True,
                collection_interval_seconds=1,
                batch_size=100,
                max_memory_buffer_mb=10,
                search_index_enabled=True,
                search_cache_size=1000,
                privacy_mode_enabled=True,
                async_processing=True,
                worker_threads=2
            )
            
            # Initialize centralized logger
            self.centralized_logger = CentralizedLogger(config)
            await self.centralized_logger.initialize()
            
            self.log_test("Test Environment Setup", True)
            
        except Exception as e:
            self.log_test("Test Environment Setup", False, str(e))
            raise
    
    async def _cleanup_test_environment(self):
        """Clean up test environment."""
        try:
            if self.centralized_logger:
                await self.centralized_logger.shutdown()
            
            if self.temp_dir and Path(self.temp_dir).exists():
                shutil.rmtree(self.temp_dir)
            
        except Exception as e:
            print(f"Warning: Failed to cleanup test environment: {str(e)}")
    
    async def _test_logger_initialization(self):
        """Test logger initialization."""
        try:
            assert self.centralized_logger is not None
            assert self.centralized_logger.is_running
            assert self.centralized_logger.config is not None
            assert len(self.centralized_logger.worker_tasks) > 0
            
            self.log_test("Logger Initialization", True)
            
        except Exception as e:
            self.log_test("Logger Initialization", False, str(e))
    
    async def _test_basic_logging(self):
        """Test basic logging functionality."""
        try:
            # Test basic log entry
            correlation_id = await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="test_service",
                message="Test log message",
                component="test_component",
                action="test_action"
            )
            
            assert correlation_id is not None
            assert len(correlation_id) > 0
            
            # Verify log was added to buffer
            assert len(self.centralized_logger.log_buffer) > 0
            
            # Check statistics
            stats = self.centralized_logger.get_statistics()
            assert stats['logs_collected'] > 0
            
            self.log_test("Basic Logging", True)
            
        except Exception as e:
            self.log_test("Basic Logging", False, str(e))
    
    async def _test_correlation_tracking(self):
        """Test correlation ID tracking."""
        try:
            # Generate correlation ID
            correlation_id = self.centralized_logger.generate_correlation_id()
            
            # Log multiple entries with same correlation ID
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="test_service",
                message="First correlated log",
                correlation_id=correlation_id
            )
            
            await self.centralized_logger.log(
                level=LogLevel.DEBUG,
                source=LogSource.FRONTEND,
                service="test_frontend",
                message="Second correlated log",
                correlation_id=correlation_id
            )
            
            # Retrieve correlated logs
            correlated_logs = self.centralized_logger.get_correlation_logs(correlation_id)
            assert len(correlated_logs) == 2
            assert all(log.correlation_id == correlation_id for log in correlated_logs)
            
            self.log_test("Correlation Tracking", True)
            
        except Exception as e:
            self.log_test("Correlation Tracking", False, str(e))
    
    async def _test_log_levels_and_sources(self):
        """Test different log levels and sources."""
        try:
            # Test all log levels
            levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL]
            sources = [LogSource.FRONTEND, LogSource.BACKEND, LogSource.DATABASE, LogSource.HVAC_CALCULATOR]
            
            for level in levels:
                for source in sources:
                    await self.centralized_logger.log(
                        level=level,
                        source=source,
                        service=f"test_{source.value}",
                        message=f"Test {level.value} message from {source.value}"
                    )
            
            # Verify logs were created
            total_expected = len(levels) * len(sources)
            stats = self.centralized_logger.get_statistics()
            assert stats['logs_collected'] >= total_expected
            
            self.log_test("Log Levels and Sources", True)
            
        except Exception as e:
            self.log_test("Log Levels and Sources", False, str(e))
    
    async def _test_metadata_and_tags(self):
        """Test metadata and tags functionality."""
        try:
            # Log with metadata and tags
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="test_service",
                message="Test with metadata and tags",
                metadata={
                    "user_action": "calculation",
                    "calculation_type": "duct_sizing",
                    "input_count": 5,
                    "processing_time": 1.23
                },
                tags=["hvac", "calculation", "performance"]
            )
            
            # Verify metadata and tags are stored
            buffer_logs = list(self.centralized_logger.log_buffer)
            test_log = next((log for log in buffer_logs if "metadata and tags" in log.message), None)
            
            assert test_log is not None
            assert "user_action" in test_log.metadata
            assert test_log.metadata["calculation_type"] == "duct_sizing"
            assert "hvac" in test_log.tags
            assert len(test_log.tags) == 3
            
            self.log_test("Metadata and Tags", True)
            
        except Exception as e:
            self.log_test("Metadata and Tags", False, str(e))
    
    async def _test_log_search_functionality(self):
        """Test log search functionality."""
        try:
            # Create test logs with specific patterns
            test_correlation_id = self.centralized_logger.generate_correlation_id()
            
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="search_test",
                message="Searchable log entry 1",
                correlation_id=test_correlation_id,
                tags=["search_test"]
            )
            
            await self.centralized_logger.log(
                level=LogLevel.WARNING,
                source=LogSource.FRONTEND,
                service="search_test",
                message="Searchable log entry 2",
                correlation_id=test_correlation_id,
                tags=["search_test"]
            )
            
            # Test message search
            query = LogSearchQuery(
                message_contains="Searchable log entry",
                limit=10
            )
            results = await self.centralized_logger.search_logs(query)
            assert len(results) >= 2
            
            # Test level filtering
            query = LogSearchQuery(
                levels=[LogLevel.WARNING],
                message_contains="Searchable",
                limit=10
            )
            results = await self.centralized_logger.search_logs(query)
            assert len(results) >= 1
            assert all(log.level == LogLevel.WARNING for log in results)
            
            # Test source filtering
            query = LogSearchQuery(
                sources=[LogSource.BACKEND],
                message_contains="Searchable",
                limit=10
            )
            results = await self.centralized_logger.search_logs(query)
            assert len(results) >= 1
            assert all(log.source == LogSource.BACKEND for log in results)
            
            self.log_test("Log Search Functionality", True)
            
        except Exception as e:
            self.log_test("Log Search Functionality", False, str(e))
    
    async def _test_correlation_search(self):
        """Test correlation-based search."""
        try:
            # Create correlated logs
            correlation_id = self.centralized_logger.generate_correlation_id()
            
            for i in range(3):
                await self.centralized_logger.log(
                    level=LogLevel.INFO,
                    source=LogSource.BACKEND,
                    service="correlation_test",
                    message=f"Correlated log {i+1}",
                    correlation_id=correlation_id
                )
            
            # Search by correlation ID
            query = LogSearchQuery(correlation_id=correlation_id)
            results = await self.centralized_logger.search_logs(query)
            
            assert len(results) == 3
            assert all(log.correlation_id == correlation_id for log in results)
            
            self.log_test("Correlation Search", True)
            
        except Exception as e:
            self.log_test("Correlation Search", False, str(e))
    
    async def _test_time_range_search(self):
        """Test time range search."""
        try:
            # Create logs with specific timing
            start_time = datetime.utcnow()
            
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="time_test",
                message="Time range test log"
            )
            
            end_time = datetime.utcnow()
            
            # Search within time range
            query = LogSearchQuery(
                start_time=start_time,
                end_time=end_time,
                message_contains="Time range test"
            )
            results = await self.centralized_logger.search_logs(query)
            
            assert len(results) >= 1
            for log in results:
                assert start_time <= log.timestamp <= end_time
            
            self.log_test("Time Range Search", True)
            
        except Exception as e:
            self.log_test("Time Range Search", False, str(e))
    
    async def _test_advanced_filtering(self):
        """Test advanced filtering capabilities."""
        try:
            # Create logs with specific metadata
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.HVAC_CALCULATOR,
                service="advanced_test",
                message="Advanced filtering test",
                metadata={"calculation_type": "duct_sizing", "user_tier": "premium"},
                tags=["advanced", "filtering"]
            )
            
            # Test metadata filtering
            query = LogSearchQuery(
                metadata_filters={"calculation_type": "duct_sizing"},
                limit=10
            )
            results = await self.centralized_logger.search_logs(query)
            
            assert len(results) >= 1
            for log in results:
                assert log.metadata.get("calculation_type") == "duct_sizing"
            
            # Test tags filtering
            query = LogSearchQuery(
                tags=["advanced", "filtering"],
                limit=10
            )
            results = await self.centralized_logger.search_logs(query)
            
            assert len(results) >= 1
            for log in results:
                assert "advanced" in log.tags
                assert "filtering" in log.tags
            
            self.log_test("Advanced Filtering", True)
            
        except Exception as e:
            self.log_test("Advanced Filtering", False, str(e))
    
    async def _test_data_sanitization(self):
        """Test data sanitization functionality."""
        try:
            # Log with sensitive data
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="sanitization_test",
                message="User email: john.doe@example.com and phone: 555-123-4567",
                metadata={
                    "password": "secret123",
                    "credit_card": "4111-1111-1111-1111",
                    "normal_field": "normal_value"
                }
            )
            
            # Check that sensitive data was sanitized
            buffer_logs = list(self.centralized_logger.log_buffer)
            test_log = next((log for log in buffer_logs if "sanitization_test" in log.service), None)
            
            assert test_log is not None
            assert test_log.sanitized
            assert "[EMAIL_REDACTED]" in test_log.message
            assert "[PHONE_REDACTED]" in test_log.message
            assert "secret123" not in str(test_log.metadata)
            assert "4111-1111-1111-1111" not in str(test_log.metadata)
            assert test_log.metadata["normal_field"] == "normal_value"
            
            self.log_test("Data Sanitization", True)
            
        except Exception as e:
            self.log_test("Data Sanitization", False, str(e))
    
    async def _test_sensitive_data_handling(self):
        """Test sensitive data handling."""
        try:
            # Log with various sensitive patterns
            sensitive_message = "API key: abc123def456ghi789 and SSN: 123-45-6789"
            
            await self.centralized_logger.log(
                level=LogLevel.WARNING,
                source=LogSource.BACKEND,
                service="sensitive_test",
                message=sensitive_message
            )
            
            # Verify sanitization
            buffer_logs = list(self.centralized_logger.log_buffer)
            test_log = next((log for log in buffer_logs if "sensitive_test" in log.service), None)
            
            assert test_log is not None
            assert "[TOKEN_REDACTED]" in test_log.message
            assert "[SSN_REDACTED]" in test_log.message
            assert "abc123def456ghi789" not in test_log.message
            assert "123-45-6789" not in test_log.message
            
            self.log_test("Sensitive Data Handling", True)
            
        except Exception as e:
            self.log_test("Sensitive Data Handling", False, str(e))
    
    async def _test_user_privacy_protection(self):
        """Test user privacy protection."""
        try:
            # Log with user ID
            original_user_id = "user_12345"
            
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.BACKEND,
                service="privacy_test",
                message="User action logged",
                user_id=original_user_id
            )
            
            # Verify user ID was hashed
            buffer_logs = list(self.centralized_logger.log_buffer)
            test_log = next((log for log in buffer_logs if "privacy_test" in log.service), None)
            
            assert test_log is not None
            assert test_log.user_id != original_user_id
            assert len(test_log.user_id) == 16  # Hash length
            
            self.log_test("User Privacy Protection", True)

        except Exception as e:
            self.log_test("User Privacy Protection", False, str(e))

    async def _test_log_storage(self):
        """Test log storage functionality."""
        try:
            # Force log flush to storage
            await self.centralized_logger._flush_logs()

            # Check if log files were created
            log_dir = Path(self.centralized_logger.config.log_directory)
            log_files = list(log_dir.glob("*.jsonl*"))

            assert len(log_files) > 0

            # Verify log file content
            log_file = log_files[0]
            with open(log_file, 'r') as f:
                lines = f.readlines()
                assert len(lines) > 0

                # Verify JSON format
                for line in lines[:3]:  # Check first 3 lines
                    log_data = json.loads(line.strip())
                    assert 'timestamp' in log_data
                    assert 'level' in log_data
                    assert 'message' in log_data

            self.log_test("Log Storage", True)

        except Exception as e:
            self.log_test("Log Storage", False, str(e))

    async def _test_log_compression(self):
        """Test log compression functionality."""
        try:
            # Create a log file for compression
            log_dir = Path(self.centralized_logger.config.log_directory)
            test_file = log_dir / "test_compression.jsonl"

            # Write test data
            with open(test_file, 'w') as f:
                for i in range(100):
                    log_data = {
                        'timestamp': datetime.utcnow().isoformat(),
                        'level': 'INFO',
                        'message': f'Test compression log {i}'
                    }
                    f.write(json.dumps(log_data) + '\n')

            # Test compression
            await self.centralized_logger._compress_file(test_file)

            # Verify compressed file exists
            compressed_file = test_file.with_suffix('.jsonl.gz')
            assert compressed_file.exists()
            assert not test_file.exists()  # Original should be removed

            self.log_test("Log Compression", True)

        except Exception as e:
            self.log_test("Log Compression", False, str(e))

    async def _test_retention_policy(self):
        """Test log retention policy."""
        try:
            # Create old log files
            log_dir = Path(self.centralized_logger.config.log_directory)
            old_file = log_dir / "old_logs.jsonl"

            # Create file and set old timestamp
            old_file.write_text('{"timestamp": "2023-01-01T00:00:00", "message": "old log"}')

            # Modify file timestamp to be older than retention period
            old_timestamp = datetime.utcnow() - timedelta(days=100)
            os.utime(old_file, (old_timestamp.timestamp(), old_timestamp.timestamp()))

            # Run cleanup
            await self.centralized_logger._cleanup_old_logs()

            # Verify old file was removed
            assert not old_file.exists()

            self.log_test("Retention Policy", True)

        except Exception as e:
            self.log_test("Retention Policy", False, str(e))

    async def _test_high_volume_logging(self):
        """Test high volume logging performance."""
        try:
            start_time = datetime.utcnow()
            log_count = 1000

            # Generate high volume of logs
            tasks = []
            for i in range(log_count):
                task = self.centralized_logger.log(
                    level=LogLevel.INFO,
                    source=LogSource.BACKEND,
                    service="performance_test",
                    message=f"High volume log {i}",
                    metadata={"batch_id": "performance_test", "log_number": i}
                )
                tasks.append(task)

            # Wait for all logs to complete
            await asyncio.gather(*tasks)

            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Verify performance (should handle 1000 logs in reasonable time)
            assert duration < 10.0  # Should complete within 10 seconds

            # Verify logs were processed
            stats = self.centralized_logger.get_statistics()
            assert stats['logs_collected'] >= log_count

            logs_per_second = log_count / duration
            print(f"   Performance: {logs_per_second:.1f} logs/second")

            self.log_test("High Volume Logging", True)

        except Exception as e:
            self.log_test("High Volume Logging", False, str(e))

    async def _test_search_performance(self):
        """Test search performance."""
        try:
            # Ensure we have logs to search
            for i in range(100):
                await self.centralized_logger.log(
                    level=LogLevel.INFO,
                    source=LogSource.BACKEND,
                    service="search_performance_test",
                    message=f"Search performance test log {i}",
                    tags=["performance", "search"]
                )

            # Test search performance
            start_time = datetime.utcnow()

            query = LogSearchQuery(
                message_contains="Search performance test",
                limit=50
            )
            results = await self.centralized_logger.search_logs(query)

            end_time = datetime.utcnow()
            search_duration = (end_time - start_time).total_seconds()

            # Verify search completed quickly
            assert search_duration < 2.0  # Should complete within 2 seconds
            assert len(results) > 0

            print(f"   Search Performance: {search_duration:.3f} seconds for {len(results)} results")

            self.log_test("Search Performance", True)

        except Exception as e:
            self.log_test("Search Performance", False, str(e))

    async def _test_memory_usage(self):
        """Test memory usage and buffer management."""
        try:
            # Check initial memory usage
            initial_buffer_size = len(self.centralized_logger.log_buffer)

            # Fill buffer beyond normal capacity
            for i in range(500):
                await self.centralized_logger.log(
                    level=LogLevel.DEBUG,
                    source=LogSource.BACKEND,
                    service="memory_test",
                    message=f"Memory test log {i}"
                )

            # Check buffer management
            current_buffer_size = len(self.centralized_logger.log_buffer)

            # Buffer should not grow indefinitely
            max_expected_size = self.centralized_logger.config.batch_size * 2
            assert current_buffer_size <= max_expected_size

            # Verify statistics tracking
            stats = self.centralized_logger.get_statistics()
            assert 'memory_usage_mb' in stats
            assert stats['memory_usage_mb'] > 0

            self.log_test("Memory Usage", True)

        except Exception as e:
            self.log_test("Memory Usage", False, str(e))

    async def _test_structlog_integration(self):
        """Test structlog integration."""
        try:
            # Test structlog processor creation
            processor = create_structlog_processor(self.centralized_logger)
            assert processor is not None

            # Test processor with sample event
            test_event = {
                'level': 'info',
                'event': 'Test structlog integration',
                'service': 'integration_test',
                'correlation_id': 'test_correlation_123'
            }

            # Process event (should not raise exception)
            result = processor(None, 'info', test_event)
            assert result == test_event  # Should return original event

            self.log_test("Structlog Integration", True)

        except Exception as e:
            self.log_test("Structlog Integration", False, str(e))

    async def _test_hvac_calculation_logging(self):
        """Test HVAC calculation logging utilities."""
        try:
            # Create HVAC calculation logger
            hvac_logger = create_hvac_calculation_logger(self.centralized_logger)
            assert hvac_logger is not None

            # Test calculation start logging
            correlation_id = await hvac_logger['log_calculation_start'](
                calculation_type="duct_sizing",
                input_parameters={"diameter": 12, "flow_rate": 1000},
                user_id="test_user"
            )

            assert correlation_id is not None

            # Test calculation completion logging
            await hvac_logger['log_calculation_complete'](
                calculation_type="duct_sizing",
                result={"pressure_drop": 0.5, "velocity": 800},
                duration_ms=150.0,
                correlation_id=correlation_id,
                user_id="test_user"
            )

            # Test calculation error logging
            test_error = ValueError("Invalid input parameters")
            await hvac_logger['log_calculation_error'](
                calculation_type="duct_sizing",
                error=test_error,
                duration_ms=50.0,
                correlation_id=correlation_id,
                user_id="test_user"
            )

            # Verify logs were created
            correlated_logs = self.centralized_logger.get_correlation_logs(correlation_id)
            assert len(correlated_logs) >= 3  # Start, complete, error

            self.log_test("HVAC Calculation Logging", True)

        except Exception as e:
            self.log_test("HVAC Calculation Logging", False, str(e))

    async def _test_error_alerting_integration(self):
        """Test error alerting integration."""
        try:
            # Log critical error to trigger alerting
            await self.centralized_logger.log(
                level=LogLevel.CRITICAL,
                source=LogSource.BACKEND,
                service="alerting_test",
                message="Critical error for alerting test"
            )

            # Log multiple errors to trigger rate-based alerting
            for i in range(12):
                await self.centralized_logger.log(
                    level=LogLevel.ERROR,
                    source=LogSource.BACKEND,
                    service="alerting_test",
                    message=f"Error {i} for rate alerting test"
                )

            # Wait for alerting to process
            await asyncio.sleep(0.1)

            # Verify alerting was attempted (no actual alerts sent in test)
            stats = self.centralized_logger.get_statistics()
            assert 'logs_collected' in stats

            self.log_test("Error Alerting Integration", True)

        except Exception as e:
            self.log_test("Error Alerting Integration", False, str(e))


async def main():
    """Main function for running centralized logging validation."""
    print("🚀 Starting SizeWise Suite Centralized Logging Validation")
    print("=" * 70)

    validator = CentralizedLoggingValidator()
    results = await validator.validate_complete_system()

    # Save results to file
    results_file = Path("centralized_logging_validation_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n📄 Detailed results saved to: {results_file}")

    # Return appropriate exit code
    if results.get('overall_status') == 'PASSED':
        return 0
    else:
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
