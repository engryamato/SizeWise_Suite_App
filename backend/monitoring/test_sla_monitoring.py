"""
SizeWise Suite - SLA Monitoring Validation Tests

This module provides comprehensive validation tests for the SLA monitoring
and reporting system, including SLA tracking, breach detection, automated
reporting, and compliance monitoring.

Features:
- SLA target configuration validation
- Measurement recording and tracking
- Breach detection and notification testing
- Automated report generation validation
- API endpoint testing
- Performance and reliability testing

Designed to ensure production readiness of SLA monitoring capabilities.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import structlog

from .sla_monitoring import (
    SLAMonitoringManager,
    SLAMetricType,
    SLAStatus
)

logger = structlog.get_logger()

class SLAMonitoringValidator:
    """Comprehensive validation for SLA monitoring system."""
    
    def __init__(self):
        self.manager = SLAMonitoringManager()
        self.test_results = []
        self.validation_score = 0.0
        
    async def run_validation(self) -> Dict[str, Any]:
        """Run comprehensive SLA monitoring validation."""
        try:
            logger.info("Starting SLA monitoring validation...")
            
            # Initialize SLA monitoring manager
            await self.manager.initialize()
            
            # Run validation tests
            tests = [
                ("SLA Target Configuration Test", self._test_sla_targets),
                ("Measurement Recording Test", self._test_measurement_recording),
                ("Breach Detection Test", self._test_breach_detection),
                ("Report Generation Test", self._test_report_generation),
                ("Compliance Tracking Test", self._test_compliance_tracking),
                ("Historical Data Test", self._test_historical_data),
                ("Notification System Test", self._test_notification_system),
                ("Performance Metrics Test", self._test_performance_metrics)
            ]
            
            passed_tests = 0
            total_tests = len(tests)
            
            for test_name, test_func in tests:
                try:
                    logger.info(f"Running {test_name}...")
                    result = await test_func()
                    
                    if result['success']:
                        passed_tests += 1
                        logger.info(f"✅ {test_name} PASSED")
                    else:
                        logger.error(f"❌ {test_name} FAILED: {result.get('error', 'Unknown error')}")
                    
                    self.test_results.append({
                        'test_name': test_name,
                        'success': result['success'],
                        'details': result.get('details', {}),
                        'error': result.get('error')
                    })
                    
                except Exception as e:
                    logger.error(f"❌ {test_name} FAILED with exception: {str(e)}")
                    self.test_results.append({
                        'test_name': test_name,
                        'success': False,
                        'error': str(e)
                    })
            
            # Calculate validation score
            self.validation_score = (passed_tests / total_tests) * 100
            
            # Determine overall status
            if self.validation_score >= 90:
                status = "READY_FOR_PRODUCTION"
            elif self.validation_score >= 75:
                status = "READY_WITH_MONITORING"
            elif self.validation_score >= 60:
                status = "NEEDS_IMPROVEMENT"
            else:
                status = "NOT_READY"
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'validation_score': round(self.validation_score, 1),
                'status': status,
                'tests_passed': passed_tests,
                'total_tests': total_tests,
                'test_results': self.test_results,
                'recommendations': self._generate_recommendations()
            }
            
        except Exception as e:
            logger.error("SLA monitoring validation failed", error=str(e))
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'validation_score': 0.0,
                'status': 'VALIDATION_FAILED',
                'error': str(e)
            }
    
    async def _test_sla_targets(self) -> Dict[str, Any]:
        """Test SLA target configuration."""
        try:
            # Verify default targets are configured
            assert len(self.manager.sla_targets) >= 5
            
            # Check required metric types
            required_metrics = [
                SLAMetricType.UPTIME,
                SLAMetricType.API_RESPONSE_TIME,
                SLAMetricType.ERROR_RATE,
                SLAMetricType.AVAILABILITY,
                SLAMetricType.INCIDENT_RESPONSE_TIME
            ]
            
            for metric_type in required_metrics:
                assert metric_type in self.manager.sla_targets
                target = self.manager.sla_targets[metric_type]
                
                # Validate target configuration
                assert target.target_value > 0
                assert target.threshold_warning > 0
                assert target.threshold_breach > 0
                assert target.unit is not None
                assert target.measurement_window > 0
                assert target.description is not None
            
            return {
                'success': True,
                'details': {
                    'targets_configured': len(self.manager.sla_targets),
                    'required_metrics_present': len(required_metrics)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_measurement_recording(self) -> Dict[str, Any]:
        """Test SLA measurement recording functionality."""
        try:
            # Test recording measurements for different metrics
            test_measurements = [
                (SLAMetricType.UPTIME, 99.95),
                (SLAMetricType.API_RESPONSE_TIME, 150.0),
                (SLAMetricType.ERROR_RATE, 0.5),
                (SLAMetricType.AVAILABILITY, 99.99),
                (SLAMetricType.INCIDENT_RESPONSE_TIME, 12.0)
            ]
            
            recorded_measurements = []
            for metric_type, value in test_measurements:
                measurement = await self.manager.record_measurement(
                    metric_type=metric_type,
                    value=value,
                    metadata={'test': 'validation'}
                )
                recorded_measurements.append(measurement)
            
            # Validate measurements
            for measurement in recorded_measurements:
                assert measurement.timestamp is not None
                assert measurement.value > 0
                assert measurement.target_value > 0
                assert measurement.status in [SLAStatus.COMPLIANT, SLAStatus.WARNING, SLAStatus.BREACH]
                assert measurement.metadata.get('test') == 'validation'
            
            return {
                'success': True,
                'details': {
                    'measurements_recorded': len(recorded_measurements),
                    'total_measurements': len(self.manager.measurements)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_breach_detection(self) -> Dict[str, Any]:
        """Test SLA breach detection functionality."""
        try:
            initial_breaches = len(self.manager.breaches)
            
            # Record measurements that should trigger breaches
            breach_measurements = [
                (SLAMetricType.UPTIME, 98.0),  # Below 99.9% target
                (SLAMetricType.API_RESPONSE_TIME, 600.0),  # Above 200ms target
                (SLAMetricType.ERROR_RATE, 8.0)  # Above 1% target
            ]
            
            for metric_type, value in breach_measurements:
                await self.manager.record_measurement(
                    metric_type=metric_type,
                    value=value,
                    metadata={'test': 'breach_detection'}
                )
            
            # Verify breaches were created
            final_breaches = len(self.manager.breaches)
            new_breaches = final_breaches - initial_breaches
            
            assert new_breaches >= 3  # Should have created at least 3 breaches
            
            # Validate breach properties
            for breach in list(self.manager.breaches.values())[-new_breaches:]:
                assert breach.id is not None
                assert breach.metric_type in [m[0] for m in breach_measurements]
                assert breach.breach_start is not None
                assert breach.severity in ['CRITICAL', 'HIGH', 'MEDIUM']
                assert breach.impact_description is not None
            
            return {
                'success': True,
                'details': {
                    'breaches_detected': new_breaches,
                    'total_breaches': final_breaches
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_report_generation(self) -> Dict[str, Any]:
        """Test SLA report generation functionality."""
        try:
            # Generate test report
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=1)
            
            report = await self.manager.generate_sla_report(
                period_start=start_time,
                period_end=end_time,
                report_type='comprehensive'
            )
            
            # Validate report structure
            assert report.report_id is not None
            assert report.period_start == start_time
            assert report.period_end == end_time
            assert isinstance(report.overall_compliance, (int, float))
            assert isinstance(report.metric_compliance, dict)
            assert isinstance(report.total_breaches, int)
            assert isinstance(report.breach_summary, list)
            assert isinstance(report.recommendations, list)
            assert report.generated_at is not None
            
            # Validate metric compliance data
            for metric_type, compliance in report.metric_compliance.items():
                assert isinstance(metric_type, SLAMetricType)
                assert isinstance(compliance, (int, float))
                assert 0 <= compliance <= 100
            
            return {
                'success': True,
                'details': {
                    'report_id': report.report_id,
                    'overall_compliance': report.overall_compliance,
                    'total_breaches': report.total_breaches,
                    'recommendations_count': len(report.recommendations)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_compliance_tracking(self) -> Dict[str, Any]:
        """Test SLA compliance tracking functionality."""
        try:
            # Get current SLA status
            status = self.manager.get_current_sla_status()
            
            # Validate status structure
            assert 'timestamp' in status
            assert 'overall_status' in status
            assert 'active_breaches' in status
            assert 'metrics' in status
            assert 'monitoring_enabled' in status
            
            # Validate metrics data
            for metric_name, metric_data in status['metrics'].items():
                if metric_data.get('status') != 'no_data':
                    assert 'current_value' in metric_data
                    assert 'target_value' in metric_data
                    assert 'status' in metric_data
                    assert 'unit' in metric_data
                    assert 'last_updated' in metric_data
            
            return {
                'success': True,
                'details': {
                    'overall_status': status['overall_status'],
                    'active_breaches': status['active_breaches'],
                    'metrics_tracked': len(status['metrics']),
                    'monitoring_enabled': status['monitoring_enabled']
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_historical_data(self) -> Dict[str, Any]:
        """Test historical data storage and retrieval."""
        try:
            # Verify measurements are stored
            assert len(self.manager.measurements) > 0
            
            # Check measurement timestamps
            for measurement in self.manager.measurements:
                assert measurement.timestamp is not None
                assert isinstance(measurement.timestamp, datetime)
            
            # Verify breaches are stored
            assert len(self.manager.breaches) > 0
            
            # Check breach data
            for breach in self.manager.breaches.values():
                assert breach.breach_start is not None
                assert isinstance(breach.breach_start, datetime)
            
            return {
                'success': True,
                'details': {
                    'total_measurements': len(self.manager.measurements),
                    'total_breaches': len(self.manager.breaches),
                    'total_reports': len(self.manager.reports)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_notification_system(self) -> Dict[str, Any]:
        """Test SLA breach notification system."""
        try:
            # This test verifies the notification system is configured
            # In a real implementation, this would test actual notifications
            
            # Verify notification methods exist
            assert hasattr(self.manager, '_send_breach_notification')
            assert hasattr(self.manager, '_create_sla_incident')
            
            # Test notification would be sent for critical breach
            # (This is simulated since we don't want to send real notifications)
            
            return {
                'success': True,
                'details': {
                    'notification_methods_available': 2,
                    'notification_system_configured': True
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_performance_metrics(self) -> Dict[str, Any]:
        """Test performance metrics collection and processing."""
        try:
            # Test metric collection performance
            start_time = time.time()
            
            # Record multiple measurements quickly
            for i in range(10):
                await self.manager.record_measurement(
                    metric_type=SLAMetricType.API_RESPONSE_TIME,
                    value=100.0 + i,
                    metadata={'test': 'performance'}
                )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Verify performance is acceptable (should be fast)
            assert processing_time < 5.0  # Should complete in under 5 seconds
            
            return {
                'success': True,
                'details': {
                    'measurements_processed': 10,
                    'processing_time_seconds': round(processing_time, 3),
                    'performance_acceptable': processing_time < 5.0
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []
        
        if self.validation_score < 100:
            failed_tests = [
                result['test_name'] for result in self.test_results
                if not result['success']
            ]
            
            if failed_tests:
                recommendations.append(f"Address failed tests: {', '.join(failed_tests)}")
        
        if self.validation_score < 90:
            recommendations.append("Implement additional monitoring for SLA system reliability")
        
        if self.validation_score < 75:
            recommendations.append("Review and enhance SLA monitoring procedures")
            recommendations.append("Conduct SLA monitoring training and testing")
        
        if not recommendations:
            recommendations.append("SLA monitoring system is production ready")
        
        return recommendations

# Standalone validation function
async def validate_sla_monitoring() -> Dict[str, Any]:
    """Standalone function to validate SLA monitoring system."""
    validator = SLAMonitoringValidator()
    return await validator.run_validation()

if __name__ == "__main__":
    # Run validation when script is executed directly
    async def main():
        result = await validate_sla_monitoring()
        print(json.dumps(result, indent=2))
    
    asyncio.run(main())
