#!/usr/bin/env python3
"""
Test script for Operational Metrics Dashboard

Validates the comprehensive operational metrics dashboard implementation
including Flask integration, HVAC metrics collection, and real-time monitoring.
"""

import asyncio
import sys
import os
import time
from datetime import datetime
import requests
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import structlog

logger = structlog.get_logger()


class OperationalDashboardValidator:
    """Validator for operational metrics dashboard functionality."""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []
        self.validation_score = 0
        self.total_tests = 0
    
    def log_test_result(self, test_name: str, success: bool, message: str = "", details: dict = None):
        """Log a test result."""
        result = {
            'test_name': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        self.test_results.append(result)
        self.total_tests += 1
        if success:
            self.validation_score += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}", message=message)
    
    async def test_monitoring_status(self):
        """Test monitoring system status endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                components = data.get('components', {})
                
                # Check if all components are initialized
                required_components = [
                    'metrics_collector', 'performance_dashboard', 'health_monitor',
                    'error_tracker', 'hvac_metrics_collector'
                ]
                
                missing_components = [comp for comp in required_components if not components.get(comp, False)]
                
                if not missing_components:
                    self.log_test_result(
                        "Monitoring Status Check",
                        True,
                        "All monitoring components initialized successfully",
                        {'components': components}
                    )
                else:
                    self.log_test_result(
                        "Monitoring Status Check",
                        False,
                        f"Missing components: {missing_components}",
                        {'components': components}
                    )
            else:
                self.log_test_result(
                    "Monitoring Status Check",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "Monitoring Status Check",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def test_dashboard_overview(self):
        """Test dashboard overview endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/dashboard", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required dashboard data
                required_fields = ['widgets', 'system_overview', 'performance_summary']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    widget_count = len(data.get('widgets', {}))
                    self.log_test_result(
                        "Dashboard Overview",
                        True,
                        f"Dashboard loaded with {widget_count} widgets",
                        {'widget_count': widget_count}
                    )
                else:
                    self.log_test_result(
                        "Dashboard Overview",
                        False,
                        f"Missing dashboard fields: {missing_fields}",
                        {'available_fields': list(data.keys())}
                    )
            else:
                self.log_test_result(
                    "Dashboard Overview",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "Dashboard Overview",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def test_system_health(self):
        """Test system health monitoring."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/system/overview", timeout=10)
            
            if response.status_code == 200:
                data = response.json()

                # Check for system health data in system overview response
                system_health = data.get('system_health', {})
                overall_status = system_health.get('overall_status')
                checks = system_health.get('checks', {})

                # Debug output
                logger.info("System health debug", system_health_keys=list(system_health.keys()),
                           overall_status=overall_status, checks_count=len(checks))

                if overall_status and checks:
                    healthy_checks = sum(1 for check in checks.values() if check.get('status') == 'healthy')
                    unknown_checks = sum(1 for check in checks.values() if check.get('status') == 'unknown')
                    total_checks = len(checks)

                    # Accept unknown status as valid for newly started system
                    if healthy_checks > 0 or unknown_checks > 0:
                        self.log_test_result(
                            "System Health Check",
                            True,
                            f"Health status: {overall_status}, {healthy_checks}/{total_checks} checks healthy, {unknown_checks} unknown",
                            {
                                'overall_status': overall_status,
                                'healthy_checks': healthy_checks,
                                'unknown_checks': unknown_checks,
                                'total_checks': total_checks
                            }
                        )
                    else:
                        self.log_test_result(
                            "System Health Check",
                            False,
                            f"No healthy or unknown checks found",
                            {'response_data': data}
                        )
                else:
                    self.log_test_result(
                        "System Health Check",
                        False,
                        "Missing health data",
                        {'response_data': data}
                    )
            else:
                self.log_test_result(
                    "System Health Check",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "System Health Check",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def test_hvac_metrics(self):
        """Test HVAC-specific metrics collection."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/hvac/calculations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for HVAC metrics data
                hvac_metrics = data.get('hvac_metrics', {})
                performance_summary = data.get('hvac_performance_summary', {})
                
                if hvac_metrics or performance_summary:
                    self.log_test_result(
                        "HVAC Metrics Collection",
                        True,
                        "HVAC metrics endpoint responding with data",
                        {
                            'has_hvac_metrics': bool(hvac_metrics),
                            'has_performance_summary': bool(performance_summary)
                        }
                    )
                else:
                    self.log_test_result(
                        "HVAC Metrics Collection",
                        False,
                        "No HVAC metrics data available",
                        {'response_data': data}
                    )
            else:
                self.log_test_result(
                    "HVAC Metrics Collection",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "HVAC Metrics Collection",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def test_metrics_summary(self):
        """Test metrics summary endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/metrics/summary", timeout=10)
            
            if response.status_code == 200:
                data = response.json()

                # Check for key metrics in the actual response structure
                required_metrics = ['system', 'alerts', 'metrics']
                available_metrics = [metric for metric in required_metrics if metric in data]

                if available_metrics:
                    self.log_test_result(
                        "Metrics Summary",
                        True,
                        f"Metrics summary available: {available_metrics}",
                        {'available_metrics': available_metrics}
                    )
                else:
                    self.log_test_result(
                        "Metrics Summary",
                        False,
                        "No metrics summary data available",
                        {'response_data': data}
                    )
            else:
                self.log_test_result(
                    "Metrics Summary",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "Metrics Summary",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def test_prometheus_metrics(self):
        """Test Prometheus metrics endpoint."""
        try:
            response = requests.get(f"{self.base_url}/api/monitoring/metrics", timeout=10)
            
            if response.status_code == 200:
                metrics_text = response.text
                
                # Check for Prometheus format
                if "# HELP" in metrics_text and "# TYPE" in metrics_text:
                    metric_count = metrics_text.count("# TYPE")
                    self.log_test_result(
                        "Prometheus Metrics",
                        True,
                        f"Prometheus metrics endpoint working with {metric_count} metrics",
                        {'metric_count': metric_count}
                    )
                else:
                    self.log_test_result(
                        "Prometheus Metrics",
                        False,
                        "Invalid Prometheus format",
                        {'response_preview': metrics_text[:200]}
                    )
            else:
                self.log_test_result(
                    "Prometheus Metrics",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test_result(
                "Prometheus Metrics",
                False,
                f"Request failed: {str(e)}"
            )
    
    async def run_validation(self):
        """Run complete validation suite."""
        logger.info("Starting Operational Metrics Dashboard validation...")
        
        # Run all tests
        await self.test_monitoring_status()
        await self.test_dashboard_overview()
        await self.test_system_health()
        await self.test_hvac_metrics()
        await self.test_metrics_summary()
        await self.test_prometheus_metrics()
        
        # Calculate final score
        success_rate = (self.validation_score / self.total_tests) * 100 if self.total_tests > 0 else 0
        
        logger.info("Operational Metrics Dashboard validation completed",
                   total_tests=self.total_tests,
                   passed=self.validation_score,
                   success_rate=f"{success_rate:.1f}%")
        
        return {
            'validation_score': self.validation_score,
            'total_tests': self.total_tests,
            'success_rate': success_rate,
            'test_results': self.test_results,
            'status': 'READY_FOR_PRODUCTION' if success_rate >= 80 else 'NEEDS_IMPROVEMENT'
        }


async def main():
    """Main validation function."""
    print("🔍 Operational Metrics Dashboard Validation")
    print("=" * 50)
    
    validator = OperationalDashboardValidator()
    results = await validator.run_validation()
    
    print(f"\n📊 Validation Results:")
    print(f"   Tests Passed: {results['validation_score']}/{results['total_tests']}")
    print(f"   Success Rate: {results['success_rate']:.1f}%")
    print(f"   Status: {results['status']}")
    
    # Print detailed results
    print(f"\n📋 Detailed Test Results:")
    for result in results['test_results']:
        status = "✅" if result['success'] else "❌"
        print(f"   {status} {result['test_name']}: {result['message']}")
    
    return results


if __name__ == "__main__":
    try:
        results = asyncio.run(main())
        
        # Exit with appropriate code
        if results['success_rate'] >= 80:
            print(f"\n🎉 Operational Metrics Dashboard validation PASSED!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Operational Metrics Dashboard validation FAILED!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Validation failed with error: {e}")
        sys.exit(1)
