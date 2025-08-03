#!/usr/bin/env python3
"""
Comprehensive Validation Script for SizeWise Suite Alerting System

This script validates the complete alerting system implementation including:
- AlertingManager functionality
- MetricsCollector integration
- Multi-channel alert delivery
- HVAC-specific alert rules
- Performance monitoring
- Authentication failure detection

Usage:
    python validate_alerting_system.py
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from AlertingManager import AlertingManager, AlertConfiguration, Alert, AlertSeverity
from alerting_config import load_alerting_config, validate_alerting_config, get_configured_channels
from MetricsCollector import MetricsCollector, AlertRule


class AlertingSystemValidator:
    """Comprehensive validator for the alerting system."""
    
    def __init__(self):
        self.results: Dict[str, Any] = {
            'tests_run': 0,
            'tests_passed': 0,
            'tests_failed': 0,
            'validation_details': []
        }
    
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
        print("🔄 Starting comprehensive alerting system validation...")
        print("=" * 60)
        
        try:
            # Core component tests
            await self._test_alerting_manager_initialization()
            await self._test_alert_creation_and_validation()
            await self._test_configuration_loading()
            await self._test_channel_selection()
            await self._test_alert_formatting()
            
            # Integration tests
            await self._test_metrics_collector_integration()
            await self._test_alert_rule_evaluation()
            await self._test_hvac_specific_alerts()
            
            # Performance tests
            await self._test_alert_processing_performance()
            await self._test_deduplication_functionality()
            await self._test_rate_limiting()
            
            # Calculate success rate
            success_rate = (self.results['tests_passed'] / self.results['tests_run']) * 100
            self.results['success_rate'] = success_rate
            
            print("=" * 60)
            print(f"🎯 Validation Summary:")
            print(f"   Success Rate: {success_rate:.1f}%")
            print(f"   Tests Passed: {self.results['tests_passed']}")
            print(f"   Tests Failed: {self.results['tests_failed']}")
            print(f"   Total Tests: {self.results['tests_run']}")
            
            if success_rate >= 90:
                print("🎉 Alerting system validation SUCCESSFUL!")
                self.results['overall_status'] = 'PASSED'
            else:
                print("⚠️  Alerting system validation needs attention")
                self.results['overall_status'] = 'NEEDS_ATTENTION'
            
            return self.results
            
        except Exception as e:
            print(f"💥 Critical error during validation: {str(e)}")
            self.results['critical_error'] = str(e)
            self.results['overall_status'] = 'CRITICAL_ERROR'
            return self.results
    
    async def _test_alerting_manager_initialization(self):
        """Test AlertingManager initialization."""
        try:
            config = AlertConfiguration()
            manager = AlertingManager(config)
            await manager.initialize()
            
            # Verify initialization
            assert manager.session is not None
            assert manager.config is not None
            assert isinstance(manager.alert_history, list)
            assert isinstance(manager.deduplication_cache, set)
            assert isinstance(manager.rate_limit_tracker, dict)
            
            await manager.shutdown()
            self.log_test("AlertingManager Initialization", True)
            
        except Exception as e:
            self.log_test("AlertingManager Initialization", False, str(e))
    
    async def _test_alert_creation_and_validation(self):
        """Test alert creation and validation."""
        try:
            # Test valid alert creation
            alert = Alert(
                name="test_alert",
                severity=AlertSeverity.WARNING,
                description="Test alert description",
                metric_name="test_metric",
                current_value=1.5,
                threshold=1.0,
                condition=">",
                duration_seconds=300,
                timestamp=datetime.utcnow()
            )
            
            # Validate alert properties
            assert alert.name == "test_alert"
            assert alert.severity == AlertSeverity.WARNING
            assert alert.current_value == 1.5
            assert alert.threshold == 1.0
            assert alert.condition == ">"
            
            # Test alert serialization
            alert_dict = alert.to_dict()
            assert 'name' in alert_dict
            assert 'severity' in alert_dict
            assert alert_dict['severity'] == 'warning'
            
            self.log_test("Alert Creation and Validation", True)
            
        except Exception as e:
            self.log_test("Alert Creation and Validation", False, str(e))
    
    async def _test_configuration_loading(self):
        """Test configuration loading and validation."""
        try:
            # Test configuration loading
            config = load_alerting_config()
            assert isinstance(config, AlertConfiguration)
            
            # Test configuration validation
            validation_issues = validate_alerting_config(config)
            assert isinstance(validation_issues, list)
            
            # Test channel detection
            channels = get_configured_channels(config)
            assert isinstance(channels, list)
            
            self.log_test("Configuration Loading", True)
            
        except Exception as e:
            self.log_test("Configuration Loading", False, str(e))
    
    async def _test_channel_selection(self):
        """Test severity-based channel selection."""
        try:
            config = AlertConfiguration()
            manager = AlertingManager(config)
            
            # Test channel selection for different severities
            critical_channels = manager._get_channels_for_severity(AlertSeverity.CRITICAL)
            warning_channels = manager._get_channels_for_severity(AlertSeverity.WARNING)
            info_channels = manager._get_channels_for_severity(AlertSeverity.INFO)
            
            # Validate escalation logic
            assert len(critical_channels) >= len(warning_channels)
            assert len(warning_channels) >= len(info_channels)
            
            # Critical should include high-priority channels
            critical_channel_names = [c.value for c in critical_channels]
            assert 'sms' in critical_channel_names
            assert 'pagerduty' in critical_channel_names
            
            self.log_test("Channel Selection", True)
            
        except Exception as e:
            self.log_test("Channel Selection", False, str(e))
    
    async def _test_alert_formatting(self):
        """Test alert formatting for different channels."""
        try:
            config = AlertConfiguration()
            manager = AlertingManager(config)
            
            alert = Alert(
                name="format_test",
                severity=AlertSeverity.CRITICAL,
                description="Test alert for formatting",
                metric_name="test_metric",
                current_value=2.5,
                threshold=1.0,
                condition=">",
                duration_seconds=600,
                timestamp=datetime.utcnow(),
                runbook_url="https://example.com/runbook"
            )
            
            # Test email formatting
            email_body = manager._format_email_body(alert)
            assert "CRITICAL" in email_body
            assert "format_test" in email_body
            assert "test_metric" in email_body
            assert "runbook" in email_body.lower()
            
            # Test color coding
            slack_color = manager._get_slack_color(AlertSeverity.CRITICAL)
            assert slack_color == "danger"
            
            discord_color = manager._get_discord_color(AlertSeverity.WARNING)
            assert discord_color == 0xffc107
            
            teams_color = manager._get_teams_color(AlertSeverity.INFO)
            assert teams_color == "17a2b8"
            
            self.log_test("Alert Formatting", True)
            
        except Exception as e:
            self.log_test("Alert Formatting", False, str(e))
    
    async def _test_metrics_collector_integration(self):
        """Test integration with MetricsCollector."""
        try:
            # Initialize components
            config = AlertConfiguration()
            alerting_manager = AlertingManager(config)
            await alerting_manager.initialize()
            
            metrics_collector = MetricsCollector()
            metrics_collector.alerting_manager = alerting_manager
            await metrics_collector.initialize()
            
            # Verify integration
            assert hasattr(metrics_collector, 'alerting_manager')
            assert metrics_collector.alerting_manager is not None
            assert isinstance(metrics_collector.alert_rules, list)
            
            await alerting_manager.shutdown()
            self.log_test("MetricsCollector Integration", True)
            
        except Exception as e:
            self.log_test("MetricsCollector Integration", False, str(e))
    
    async def _test_alert_rule_evaluation(self):
        """Test alert rule evaluation."""
        try:
            # Initialize system
            config = AlertConfiguration()
            alerting_manager = AlertingManager(config)
            await alerting_manager.initialize()
            
            metrics_collector = MetricsCollector()
            metrics_collector.alerting_manager = alerting_manager
            await metrics_collector.initialize()
            
            # Add test alert rule
            test_rule = AlertRule(
                name="test_rule",
                metric_name="test_metric",
                condition=">",
                threshold=1.0,
                severity=AlertSeverity.WARNING,
                duration_seconds=0,
                description="Test alert rule"
            )
            metrics_collector.alert_rules.append(test_rule)
            
            # Record metric that should trigger alert
            await metrics_collector.record_metric("test_metric", 2.0, {"test": "true"})
            
            # Evaluate alerts
            await metrics_collector.evaluate_alerts()
            
            await alerting_manager.shutdown()
            self.log_test("Alert Rule Evaluation", True)
            
        except Exception as e:
            self.log_test("Alert Rule Evaluation", False, str(e))
    
    async def _test_hvac_specific_alerts(self):
        """Test HVAC-specific alert rules."""
        try:
            # Test HVAC alert rule creation
            hvac_rules = [
                AlertRule(
                    name="hvac_calculation_slow",
                    metric_name="sizewise_hvac_calculation_duration_p95",
                    condition=">",
                    threshold=5.0,
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="HVAC calculations taking longer than 5 seconds"
                ),
                AlertRule(
                    name="hvac_calculation_error_rate",
                    metric_name="sizewise_hvac_calculation_error_rate",
                    condition=">",
                    threshold=0.02,
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="HVAC calculation error rate above 2%"
                )
            ]
            
            # Validate HVAC rules
            for rule in hvac_rules:
                assert rule.name.startswith("hvac_")
                assert "hvac" in rule.metric_name.lower()
                assert rule.threshold > 0
                assert rule.severity in [AlertSeverity.WARNING, AlertSeverity.CRITICAL]
            
            self.log_test("HVAC-Specific Alerts", True)
            
        except Exception as e:
            self.log_test("HVAC-Specific Alerts", False, str(e))
    
    async def _test_alert_processing_performance(self):
        """Test alert processing performance."""
        try:
            import time
            
            config = AlertConfiguration()
            manager = AlertingManager(config)
            await manager.initialize()
            
            # Create multiple alerts
            alerts = []
            for i in range(50):
                alert = Alert(
                    name=f"perf_test_{i}",
                    severity=AlertSeverity.INFO,
                    description=f"Performance test alert {i}",
                    metric_name="perf_metric",
                    current_value=float(i),
                    threshold=25.0,
                    condition=">",
                    duration_seconds=0,
                    timestamp=datetime.utcnow()
                )
                alerts.append(alert)
            
            # Measure processing time
            start_time = time.time()
            
            # Process alerts (with no actual channels configured)
            for alert in alerts:
                await manager.send_alert(alert, [])
            
            processing_time = time.time() - start_time
            
            await manager.shutdown()
            
            # Should process 50 alerts quickly (< 2 seconds)
            assert processing_time < 2.0
            
            self.log_test("Alert Processing Performance", True, f"Processed 50 alerts in {processing_time:.2f}s")
            
        except Exception as e:
            self.log_test("Alert Processing Performance", False, str(e))
    
    async def _test_deduplication_functionality(self):
        """Test alert deduplication."""
        try:
            config = AlertConfiguration(deduplication_window_minutes=5)
            manager = AlertingManager(config)
            await manager.initialize()
            
            # Create identical alerts
            alert1 = Alert(
                name="dedup_test",
                severity=AlertSeverity.WARNING,
                description="Deduplication test",
                metric_name="test_metric",
                current_value=1.0,
                threshold=0.5,
                condition=">",
                duration_seconds=0,
                timestamp=datetime.utcnow()
            )
            
            alert2 = Alert(
                name="dedup_test",
                severity=AlertSeverity.WARNING,
                description="Deduplication test",
                metric_name="test_metric",
                current_value=1.1,
                threshold=0.5,
                condition=">",
                duration_seconds=0,
                timestamp=datetime.utcnow()
            )
            
            # Send first alert
            result1 = await manager.send_alert(alert1, [])
            
            # Send duplicate alert (should be deduplicated)
            result2 = await manager.send_alert(alert2, [])
            
            await manager.shutdown()
            
            # Second alert should be deduplicated
            assert result2 == False
            
            self.log_test("Deduplication Functionality", True)
            
        except Exception as e:
            self.log_test("Deduplication Functionality", False, str(e))
    
    async def _test_rate_limiting(self):
        """Test alert rate limiting."""
        try:
            config = AlertConfiguration(
                rate_limit_window_minutes=1,
                max_alerts_per_window=3
            )
            manager = AlertingManager(config)
            await manager.initialize()
            
            # Create multiple alerts of same type
            alerts = []
            for i in range(6):
                alert = Alert(
                    name="rate_limit_test",
                    severity=AlertSeverity.WARNING,
                    description=f"Rate limit test {i}",
                    metric_name="test_metric",
                    current_value=float(i),
                    threshold=0.5,
                    condition=">",
                    duration_seconds=0,
                    timestamp=datetime.utcnow()
                )
                alerts.append(alert)
            
            # Send all alerts
            results = []
            for alert in alerts:
                result = await manager.send_alert(alert, [])
                results.append(result)
            
            await manager.shutdown()
            
            # Some alerts should be rate limited
            rate_limited_count = sum(1 for r in results if not r)
            assert rate_limited_count > 0
            
            self.log_test("Rate Limiting", True, f"Rate limited {rate_limited_count} alerts")
            
        except Exception as e:
            self.log_test("Rate Limiting", False, str(e))


async def main():
    """Main validation function."""
    validator = AlertingSystemValidator()
    results = await validator.validate_complete_system()
    
    # Print detailed results if there were failures
    if results['tests_failed'] > 0:
        print("\n" + "=" * 60)
        print("❌ Failed Test Details:")
        for detail in results['validation_details']:
            if not detail['passed']:
                print(f"   • {detail['test_name']}: {detail['details']}")
    
    # Exit with appropriate code
    if results['overall_status'] == 'PASSED':
        print("\n🎉 Comprehensive Alerting System Validation: SUCCESS")
        exit(0)
    elif results['overall_status'] == 'NEEDS_ATTENTION':
        print("\n⚠️  Comprehensive Alerting System Validation: NEEDS ATTENTION")
        exit(1)
    else:
        print("\n💥 Comprehensive Alerting System Validation: CRITICAL ERROR")
        exit(2)


if __name__ == "__main__":
    asyncio.run(main())
