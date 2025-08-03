#!/usr/bin/env python3
"""
Initialize Comprehensive Alerting System for SizeWise Suite

This script initializes the comprehensive alerting system with:
- Multi-channel alert delivery (email, Slack, SMS, Discord, PagerDuty, Teams)
- Alert deduplication and rate limiting
- HVAC-specific alert rules
- Authentication failure monitoring
- Performance threshold monitoring

Usage:
    python initialize_alerting.py [--test] [--config-check]
    
Options:
    --test: Send test alerts to verify configuration
    --config-check: Check configuration and exit
"""

import asyncio
import argparse
import sys
from datetime import datetime
from typing import Dict, Any

import structlog

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from AlertingManager import AlertingManager, Alert, AlertSeverity, AlertChannel
from alerting_config import load_alerting_config, validate_alerting_config, get_configured_channels
from MetricsCollector import MetricsCollector

logger = structlog.get_logger()


async def initialize_comprehensive_alerting() -> Dict[str, Any]:
    """
    Initialize the comprehensive alerting system.
    
    Returns:
        Dict[str, Any]: Initialization results and status
    """
    try:
        logger.info("Initializing comprehensive alerting system...")
        
        # Load configuration
        config = load_alerting_config()
        
        # Validate configuration
        validation_issues = validate_alerting_config(config)
        if validation_issues:
            logger.warning("Alerting configuration issues found", issues=validation_issues)
        
        # Get configured channels
        configured_channels = get_configured_channels(config)
        logger.info("Configured alert channels", channels=configured_channels)
        
        # Initialize AlertingManager
        alerting_manager = AlertingManager(config)
        await alerting_manager.initialize()
        
        # Initialize MetricsCollector with alerting
        metrics_collector = MetricsCollector()
        metrics_collector.alerting_manager = alerting_manager
        await metrics_collector.initialize()
        
        # Add HVAC-specific alert rules
        await add_hvac_alert_rules(metrics_collector)
        
        # Add authentication monitoring rules
        await add_auth_alert_rules(metrics_collector)
        
        # Add performance monitoring rules
        await add_performance_alert_rules(metrics_collector)
        
        logger.info("Comprehensive alerting system initialized successfully")
        
        return {
            'status': 'success',
            'configured_channels': configured_channels,
            'validation_issues': validation_issues,
            'alert_rules_count': len(metrics_collector.alert_rules),
            'alerting_manager': alerting_manager,
            'metrics_collector': metrics_collector
        }
        
    except Exception as e:
        logger.error("Failed to initialize alerting system", error=str(e))
        return {
            'status': 'error',
            'error': str(e),
            'configured_channels': [],
            'validation_issues': [],
            'alert_rules_count': 0
        }


async def add_hvac_alert_rules(metrics_collector: MetricsCollector):
    """Add HVAC-specific alert rules."""
    try:
        from .MetricsCollector import AlertRule, AlertSeverity
        
        hvac_rules = [
            # HVAC Calculation Performance
            AlertRule(
                name="hvac_calculation_slow",
                metric_name="sizewise_hvac_calculation_duration_p95",
                condition=">",
                threshold=5.0,  # 5 seconds
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="HVAC calculations taking longer than 5 seconds (95th percentile)"
            ),
            AlertRule(
                name="hvac_calculation_critical_slow",
                metric_name="sizewise_hvac_calculation_duration_p95",
                condition=">",
                threshold=10.0,  # 10 seconds
                severity=AlertSeverity.CRITICAL,
                duration_seconds=180,
                description="HVAC calculations taking longer than 10 seconds (95th percentile)"
            ),
            
            # HVAC Calculation Accuracy
            AlertRule(
                name="hvac_calculation_error_rate",
                metric_name="sizewise_hvac_calculation_error_rate",
                condition=">",
                threshold=0.02,  # 2% error rate
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="HVAC calculation error rate above 2%"
            ),
            AlertRule(
                name="hvac_calculation_critical_error_rate",
                metric_name="sizewise_hvac_calculation_error_rate",
                condition=">",
                threshold=0.05,  # 5% error rate
                severity=AlertSeverity.CRITICAL,
                duration_seconds=180,
                description="HVAC calculation error rate above 5%"
            ),
            
            # 3D Visualization Performance
            AlertRule(
                name="hvac_3d_render_slow",
                metric_name="sizewise_3d_render_duration_p95",
                condition=">",
                threshold=3.0,  # 3 seconds
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="3D visualization rendering taking longer than 3 seconds"
            ),
            
            # Offline Sync Performance
            AlertRule(
                name="offline_sync_failure_rate",
                metric_name="sizewise_offline_sync_failure_rate",
                condition=">",
                threshold=0.1,  # 10% failure rate
                severity=AlertSeverity.WARNING,
                duration_seconds=600,
                description="Offline sync failure rate above 10%"
            )
        ]
        
        metrics_collector.alert_rules.extend(hvac_rules)
        logger.info("Added HVAC-specific alert rules", count=len(hvac_rules))
        
    except Exception as e:
        logger.error("Failed to add HVAC alert rules", error=str(e))


async def add_auth_alert_rules(metrics_collector: MetricsCollector):
    """Add authentication monitoring alert rules."""
    try:
        from .MetricsCollector import AlertRule, AlertSeverity
        
        auth_rules = [
            # Authentication Failures
            AlertRule(
                name="auth_failure_rate",
                metric_name="sizewise_auth_failure_rate",
                condition=">",
                threshold=0.1,  # 10% failure rate
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="Authentication failure rate above 10%"
            ),
            AlertRule(
                name="auth_critical_failure_rate",
                metric_name="sizewise_auth_failure_rate",
                condition=">",
                threshold=0.25,  # 25% failure rate
                severity=AlertSeverity.CRITICAL,
                duration_seconds=180,
                description="Authentication failure rate above 25%"
            ),
            
            # Suspicious Login Activity
            AlertRule(
                name="suspicious_login_attempts",
                metric_name="sizewise_suspicious_login_rate",
                condition=">",
                threshold=0.05,  # 5% suspicious rate
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="Suspicious login attempt rate above 5%"
            ),
            
            # Rate Limiting Triggers
            AlertRule(
                name="rate_limit_triggers",
                metric_name="sizewise_rate_limit_trigger_rate",
                condition=">",
                threshold=0.02,  # 2% of requests rate limited
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="Rate limiting trigger rate above 2%"
            )
        ]
        
        metrics_collector.alert_rules.extend(auth_rules)
        logger.info("Added authentication alert rules", count=len(auth_rules))
        
    except Exception as e:
        logger.error("Failed to add authentication alert rules", error=str(e))


async def add_performance_alert_rules(metrics_collector: MetricsCollector):
    """Add performance monitoring alert rules."""
    try:
        from .MetricsCollector import AlertRule, AlertSeverity
        
        performance_rules = [
            # API Response Times
            AlertRule(
                name="api_response_time_warning",
                metric_name="sizewise_api_response_time_p95",
                condition=">",
                threshold=0.2,  # 200ms
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="API response time above 200ms (95th percentile)"
            ),
            AlertRule(
                name="api_response_time_critical",
                metric_name="sizewise_api_response_time_p95",
                condition=">",
                threshold=1.0,  # 1 second
                severity=AlertSeverity.CRITICAL,
                duration_seconds=180,
                description="API response time above 1 second (95th percentile)"
            ),
            
            # Database Performance
            AlertRule(
                name="database_query_slow",
                metric_name="sizewise_database_query_duration_p95",
                condition=">",
                threshold=0.5,  # 500ms
                severity=AlertSeverity.WARNING,
                duration_seconds=300,
                description="Database queries taking longer than 500ms (95th percentile)"
            ),
            
            # Cache Performance
            AlertRule(
                name="cache_hit_ratio_low",
                metric_name="sizewise_cache_hit_ratio",
                condition="<",
                threshold=0.8,  # 80% hit ratio
                severity=AlertSeverity.WARNING,
                duration_seconds=600,
                description="Cache hit ratio below 80%"
            )
        ]
        
        metrics_collector.alert_rules.extend(performance_rules)
        logger.info("Added performance alert rules", count=len(performance_rules))
        
    except Exception as e:
        logger.error("Failed to add performance alert rules", error=str(e))


async def send_test_alerts(alerting_manager: AlertingManager) -> bool:
    """Send test alerts to verify configuration."""
    try:
        logger.info("Sending test alerts...")
        
        # Test INFO alert
        info_alert = Alert(
            name="test_info_alert",
            severity=AlertSeverity.INFO,
            description="This is a test INFO alert to verify alerting configuration",
            metric_name="test_metric",
            current_value=1.0,
            threshold=0.5,
            condition=">",
            duration_seconds=0,
            timestamp=datetime.utcnow()
        )
        
        # Test WARNING alert
        warning_alert = Alert(
            name="test_warning_alert",
            severity=AlertSeverity.WARNING,
            description="This is a test WARNING alert to verify alerting configuration",
            metric_name="test_metric",
            current_value=2.0,
            threshold=1.5,
            condition=">",
            duration_seconds=300,
            timestamp=datetime.utcnow()
        )
        
        # Send test alerts
        info_success = await alerting_manager.send_alert(info_alert)
        warning_success = await alerting_manager.send_alert(warning_alert)
        
        logger.info("Test alerts sent", 
                   info_success=info_success, 
                   warning_success=warning_success)
        
        return info_success or warning_success
        
    except Exception as e:
        logger.error("Failed to send test alerts", error=str(e))
        return False


async def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(description="Initialize SizeWise Suite Alerting System")
    parser.add_argument('--test', action='store_true', help='Send test alerts')
    parser.add_argument('--config-check', action='store_true', help='Check configuration and exit')
    
    args = parser.parse_args()
    
    if args.config_check:
        # Check configuration only
        config = load_alerting_config()
        validation_issues = validate_alerting_config(config)
        configured_channels = get_configured_channels(config)
        
        print(f"Configured channels: {configured_channels}")
        if validation_issues:
            print(f"Configuration issues: {validation_issues}")
            sys.exit(1)
        else:
            print("Configuration is valid")
            sys.exit(0)
    
    # Initialize alerting system
    result = await initialize_comprehensive_alerting()
    
    if result['status'] == 'error':
        logger.error("Failed to initialize alerting system", error=result['error'])
        sys.exit(1)
    
    logger.info("Alerting system initialized", 
               channels=result['configured_channels'],
               rules=result['alert_rules_count'])
    
    if args.test and result['alerting_manager']:
        # Send test alerts
        test_success = await send_test_alerts(result['alerting_manager'])
        if test_success:
            logger.info("Test alerts sent successfully")
        else:
            logger.error("Failed to send test alerts")
            sys.exit(1)
    
    logger.info("Alerting system ready")


if __name__ == "__main__":
    asyncio.run(main())
