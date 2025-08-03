#!/usr/bin/env python3
"""
Log Aggregation Initialization for SizeWise Suite

This script initializes the centralized log aggregation system and integrates it
with existing logging infrastructure including structlog, Sentry, and Flask.
"""

import sys
import os
import asyncio
import structlog
from typing import Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from CentralizedLogger import CentralizedLogger, LogLevel, LogSource
from log_aggregation_config import (
    load_log_aggregation_config,
    validate_log_aggregation_config,
    LoggingIntegrationConfig,
    create_structlog_processor,
    create_flask_logging_middleware,
    create_hvac_calculation_logger
)


class LogAggregationManager:
    """Manager for centralized log aggregation system."""
    
    def __init__(self):
        self.centralized_logger: Optional[CentralizedLogger] = None
        self.integration_config = LoggingIntegrationConfig()
        self.logger = structlog.get_logger()
        self.is_initialized = False
    
    async def initialize(self) -> bool:
        """Initialize the log aggregation system."""
        try:
            # Load and validate configuration
            config = load_log_aggregation_config()
            validation_issues = validate_log_aggregation_config(config)
            
            if validation_issues:
                self.logger.error("Log aggregation configuration validation failed",
                                issues=validation_issues)
                return False
            
            # Initialize centralized logger
            self.centralized_logger = CentralizedLogger(config)
            await self.centralized_logger.initialize()
            
            # Integrate with existing logging systems
            await self._setup_integrations()
            
            self.is_initialized = True
            
            # Log successful initialization
            await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.MONITORING,
                service="log_aggregation",
                message="Centralized log aggregation system initialized successfully",
                component="log_aggregation_manager",
                action="initialization_complete",
                metadata={
                    "retention_days": config.retention_days,
                    "batch_size": config.batch_size,
                    "privacy_mode": config.privacy_mode_enabled,
                    "search_enabled": config.search_index_enabled
                },
                tags=["initialization", "log_aggregation"]
            )
            
            self.logger.info("Log aggregation system initialized successfully",
                           retention_days=config.retention_days,
                           privacy_mode=config.privacy_mode_enabled)
            
            return True
            
        except Exception as e:
            self.logger.error("Failed to initialize log aggregation system", error=str(e))
            return False
    
    async def shutdown(self) -> None:
        """Shutdown the log aggregation system."""
        if self.centralized_logger:
            await self.centralized_logger.shutdown()
        self.is_initialized = False
        self.logger.info("Log aggregation system shutdown completed")
    
    async def _setup_integrations(self) -> None:
        """Set up integrations with existing logging systems."""
        
        # Integrate with structlog
        if self.integration_config.structlog_integration:
            await self._setup_structlog_integration()
        
        # Log integration completion
        await self.centralized_logger.log(
            level=LogLevel.INFO,
            source=LogSource.MONITORING,
            service="log_aggregation",
            message="Log aggregation integrations configured",
            component="log_aggregation_manager",
            action="integrations_complete",
            metadata={
                "structlog_integration": self.integration_config.structlog_integration,
                "sentry_integration": self.integration_config.sentry_breadcrumb_integration,
                "flask_integration": self.integration_config.flask_request_logging
            },
            tags=["integration", "configuration"]
        )
    
    async def _setup_structlog_integration(self) -> None:
        """Set up structlog integration."""
        try:
            # Create centralized logging processor
            centralized_processor = create_structlog_processor(self.centralized_logger)
            
            # Get current structlog configuration
            current_config = structlog.get_config()
            current_processors = list(current_config.get('processors', []))
            
            # Insert centralized logging processor before JSONRenderer
            insert_position = self.integration_config.structlog_processor_position
            if insert_position < 0:
                insert_position = len(current_processors) + insert_position
            
            current_processors.insert(insert_position, centralized_processor)
            
            # Reconfigure structlog with centralized logging processor
            structlog.configure(
                processors=current_processors,
                context_class=current_config.get('context_class', dict),
                logger_factory=current_config.get('logger_factory', structlog.stdlib.LoggerFactory()),
                wrapper_class=current_config.get('wrapper_class', structlog.stdlib.BoundLogger),
                cache_logger_on_first_use=current_config.get('cache_logger_on_first_use', True)
            )
            
            self.logger.info("Structlog integration configured successfully")
            
        except Exception as e:
            self.logger.error("Failed to setup structlog integration", error=str(e))
    
    def get_flask_middleware(self):
        """Get Flask middleware for request logging."""
        if not self.centralized_logger:
            return None
        return create_flask_logging_middleware(self.centralized_logger)
    
    def get_hvac_calculation_logger(self):
        """Get HVAC calculation logging utilities."""
        if not self.centralized_logger:
            return None
        return create_hvac_calculation_logger(self.centralized_logger)
    
    def get_centralized_logger(self) -> Optional[CentralizedLogger]:
        """Get the centralized logger instance."""
        return self.centralized_logger
    
    async def test_logging_functionality(self) -> bool:
        """Test the logging functionality with sample logs."""
        if not self.centralized_logger:
            return False
        
        try:
            # Test basic logging
            correlation_id = await self.centralized_logger.log(
                level=LogLevel.INFO,
                source=LogSource.MONITORING,
                service="log_aggregation_test",
                message="Testing centralized logging functionality",
                component="test_suite",
                action="functionality_test",
                metadata={"test_type": "basic_logging"},
                tags=["test", "functionality"]
            )
            
            # Test correlation tracking
            await self.centralized_logger.log(
                level=LogLevel.DEBUG,
                source=LogSource.MONITORING,
                service="log_aggregation_test",
                message="Testing correlation tracking",
                correlation_id=correlation_id,
                component="test_suite",
                action="correlation_test",
                metadata={"test_type": "correlation_tracking"},
                tags=["test", "correlation"]
            )
            
            # Test error logging
            await self.centralized_logger.log(
                level=LogLevel.WARNING,
                source=LogSource.MONITORING,
                service="log_aggregation_test",
                message="Testing warning level logging",
                correlation_id=correlation_id,
                component="test_suite",
                action="warning_test",
                metadata={"test_type": "warning_logging"},
                tags=["test", "warning"]
            )
            
            # Test search functionality
            from CentralizedLogger import LogSearchQuery
            search_query = LogSearchQuery(
                correlation_id=correlation_id,
                limit=10
            )
            
            search_results = await self.centralized_logger.search_logs(search_query)
            
            if len(search_results) >= 3:  # Should find our 3 test logs
                self.logger.info("Log aggregation functionality test passed",
                               correlation_id=correlation_id,
                               search_results_count=len(search_results))
                return True
            else:
                self.logger.error("Log aggregation functionality test failed",
                                correlation_id=correlation_id,
                                search_results_count=len(search_results))
                return False
            
        except Exception as e:
            self.logger.error("Log aggregation functionality test failed", error=str(e))
            return False
    
    def get_statistics(self) -> dict:
        """Get logging system statistics."""
        if not self.centralized_logger:
            return {}
        return self.centralized_logger.get_statistics()


# Global log aggregation manager instance
log_aggregation_manager = LogAggregationManager()


async def initialize_log_aggregation() -> LogAggregationManager:
    """Initialize the global log aggregation system."""
    success = await log_aggregation_manager.initialize()
    if not success:
        raise RuntimeError("Failed to initialize log aggregation system")
    return log_aggregation_manager


async def shutdown_log_aggregation() -> None:
    """Shutdown the global log aggregation system."""
    await log_aggregation_manager.shutdown()


def get_log_aggregation_manager() -> LogAggregationManager:
    """Get the global log aggregation manager."""
    return log_aggregation_manager


async def main():
    """Main function for testing log aggregation initialization."""
    print("🔄 Initializing centralized log aggregation system...")
    
    try:
        # Initialize log aggregation
        manager = await initialize_log_aggregation()
        
        print("✅ Log aggregation system initialized successfully")
        
        # Test functionality
        print("🧪 Testing log aggregation functionality...")
        test_passed = await manager.test_logging_functionality()
        
        if test_passed:
            print("✅ Log aggregation functionality test passed")
        else:
            print("❌ Log aggregation functionality test failed")
        
        # Display statistics
        stats = manager.get_statistics()
        print(f"📊 Statistics: {stats}")
        
        # Test search functionality
        print("🔍 Testing log search functionality...")
        centralized_logger = manager.get_centralized_logger()
        
        if centralized_logger:
            from CentralizedLogger import LogSearchQuery, LogLevel
            
            # Search for recent logs
            search_query = LogSearchQuery(
                levels=[LogLevel.INFO, LogLevel.DEBUG, LogLevel.WARNING],
                limit=5
            )
            
            results = await centralized_logger.search_logs(search_query)
            print(f"🔍 Found {len(results)} recent logs")
            
            for result in results[:3]:  # Show first 3 results
                print(f"   • {result.timestamp.isoformat()} [{result.level.value}] {result.message}")
        
        print("🎉 Log aggregation system validation completed successfully")
        
        # Shutdown
        await shutdown_log_aggregation()
        print("✅ Log aggregation system shutdown completed")
        
    except Exception as e:
        print(f"💥 Error during log aggregation initialization: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
