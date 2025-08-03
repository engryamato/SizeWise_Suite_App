#!/usr/bin/env python3
"""
API Performance Profiler
SizeWise Suite - Phase 4: Performance Optimization

Comprehensive profiling tool to identify API performance bottlenecks
and measure response times across all endpoints.
"""

import time
import requests
import json
import asyncio
import aiohttp
import statistics
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

@dataclass
class EndpointProfile:
    """Performance profile for a single endpoint."""
    endpoint: str
    method: str
    response_times: List[float]
    status_codes: List[int]
    errors: List[str]
    payload_size: int
    response_size: int

    @property
    def avg_response_time(self) -> float:
        return statistics.mean(self.response_times) if self.response_times else 0

    @property
    def p95_response_time(self) -> float:
        if not self.response_times:
            return 0
        sorted_times = sorted(self.response_times)
        index = int(0.95 * len(sorted_times))
        return sorted_times[index]

    @property
    def success_rate(self) -> float:
        if not self.status_codes:
            return 0
        success_count = sum(1 for code in self.status_codes if 200 <= code < 300)
        return (success_count / len(self.status_codes)) * 100

class APIPerformanceProfiler:
    """Comprehensive API performance profiler."""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.profiles: Dict[str, EndpointProfile] = {}
        
        # Critical endpoints to test
        self.test_endpoints = [
            # Core API endpoints
            {"method": "GET", "path": "/api/info", "payload": None},
            {"method": "GET", "path": "/api/health", "payload": None},
            
            # Calculation endpoints (likely bottlenecks)
            {"method": "POST", "path": "/api/calculations/air-duct", "payload": {
                "airflow": 1000, "duct_type": "round", "friction_rate": 0.1, "units": "imperial"
            }},
            {"method": "POST", "path": "/api/calculations/grease-duct", "payload": {
                "airflow": 500, "duct_type": "rectangular", "grease_type": "heavy"
            }},
            {"method": "POST", "path": "/api/calculations/estimate", "payload": {
                "project_type": "office", "square_footage": 5000, "duct_count": 20
            }},
            
            # Validation endpoints
            {"method": "POST", "path": "/api/validation/smacna", "payload": {
                "duct_type": "round", "velocity": 2000, "pressure": 0.5
            }},
            {"method": "POST", "path": "/api/validation/ashrae", "payload": {
                "airflow": 1000, "temperature": 70, "humidity": 50
            }},
            
            # Export endpoints (potentially slow)
            {"method": "POST", "path": "/api/exports/pdf", "payload": {
                "project_name": "Test Project", "calculations": {"test": "data"}
            }},
            {"method": "POST", "path": "/api/exports/json", "payload": {
                "project_name": "Test Project", "calculations": {"test": "data"}
            }},
            
            # Analytics endpoints
            {"method": "GET", "path": "/api/analytics/health", "payload": None},
            
            # MongoDB endpoints (if available)
            {"method": "GET", "path": "/api/mongodb/health", "payload": None},
            
            # Compliance endpoints
            {"method": "GET", "path": "/api/compliance/health", "payload": None},
        ]

    def profile_endpoint(self, endpoint_config: Dict, iterations: int = 5) -> EndpointProfile:
        """Profile a single endpoint with multiple iterations."""
        method = endpoint_config["method"]
        path = endpoint_config["path"]
        payload = endpoint_config["payload"]
        
        url = f"{self.base_url}{path}"
        response_times = []
        status_codes = []
        errors = []
        payload_size = len(json.dumps(payload)) if payload else 0
        response_size = 0
        
        logger.info(f"Profiling {method} {path}")
        
        for i in range(iterations):
            try:
                start_time = time.perf_counter()
                
                if method == "GET":
                    response = requests.get(url, timeout=30)
                elif method == "POST":
                    response = requests.post(
                        url, 
                        json=payload,
                        headers={'Content-Type': 'application/json'},
                        timeout=30
                    )
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                end_time = time.perf_counter()
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                
                response_times.append(response_time)
                status_codes.append(response.status_code)
                response_size = len(response.content)
                
                logger.info(f"  Iteration {i+1}: {response_time:.2f}ms, Status: {response.status_code}")
                
            except requests.exceptions.Timeout:
                errors.append(f"Timeout on iteration {i+1}")
                response_times.append(30000)  # 30 second timeout
                status_codes.append(408)
                logger.warning(f"  Iteration {i+1}: TIMEOUT")
                
            except requests.exceptions.ConnectionError:
                errors.append(f"Connection error on iteration {i+1}")
                logger.warning(f"  Iteration {i+1}: CONNECTION ERROR")
                
            except Exception as e:
                errors.append(f"Error on iteration {i+1}: {str(e)}")
                logger.error(f"  Iteration {i+1}: ERROR - {str(e)}")
        
        return EndpointProfile(
            endpoint=path,
            method=method,
            response_times=response_times,
            status_codes=status_codes,
            errors=errors,
            payload_size=payload_size,
            response_size=response_size
        )

    def run_comprehensive_profile(self, iterations: int = 5) -> Dict[str, Any]:
        """Run comprehensive performance profiling on all endpoints."""
        logger.info("Starting comprehensive API performance profiling...")
        
        start_time = datetime.now()
        
        for endpoint_config in self.test_endpoints:
            profile = self.profile_endpoint(endpoint_config, iterations)
            key = f"{profile.method} {profile.endpoint}"
            self.profiles[key] = profile
        
        end_time = datetime.now()
        total_duration = (end_time - start_time).total_seconds()
        
        # Generate comprehensive report
        report = self.generate_performance_report(total_duration)
        
        logger.info("API performance profiling completed")
        return report

    def generate_performance_report(self, total_duration: float) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        
        # Calculate overall statistics
        all_response_times = []
        slow_endpoints = []
        fast_endpoints = []
        error_endpoints = []
        
        for key, profile in self.profiles.items():
            all_response_times.extend(profile.response_times)
            
            if profile.avg_response_time > 200:  # Slower than target
                slow_endpoints.append({
                    "endpoint": key,
                    "avg_time": profile.avg_response_time,
                    "p95_time": profile.p95_response_time,
                    "success_rate": profile.success_rate
                })
            elif profile.avg_response_time < 50:  # Fast endpoints
                fast_endpoints.append({
                    "endpoint": key,
                    "avg_time": profile.avg_response_time
                })
            
            if profile.errors:
                error_endpoints.append({
                    "endpoint": key,
                    "errors": profile.errors,
                    "success_rate": profile.success_rate
                })
        
        # Sort by performance
        slow_endpoints.sort(key=lambda x: x["avg_time"], reverse=True)
        
        overall_avg = statistics.mean(all_response_times) if all_response_times else 0
        overall_p95 = statistics.quantiles(all_response_times, n=20)[18] if len(all_response_times) > 20 else 0
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_duration": total_duration,
            "endpoints_tested": len(self.profiles),
            "overall_performance": {
                "avg_response_time": overall_avg,
                "p95_response_time": overall_p95,
                "target_met": overall_avg < 200,
                "performance_grade": self.calculate_performance_grade(overall_avg)
            },
            "slow_endpoints": slow_endpoints,
            "fast_endpoints": fast_endpoints,
            "error_endpoints": error_endpoints,
            "detailed_profiles": {
                key: {
                    "avg_time": profile.avg_response_time,
                    "p95_time": profile.p95_response_time,
                    "success_rate": profile.success_rate,
                    "payload_size": profile.payload_size,
                    "response_size": profile.response_size,
                    "error_count": len(profile.errors)
                }
                for key, profile in self.profiles.items()
            },
            "recommendations": self.generate_recommendations(slow_endpoints, error_endpoints)
        }
        
        return report

    def calculate_performance_grade(self, avg_time: float) -> str:
        """Calculate performance grade based on average response time."""
        if avg_time < 50:
            return "A+ (Excellent)"
        elif avg_time < 100:
            return "A (Very Good)"
        elif avg_time < 200:
            return "B (Good)"
        elif avg_time < 500:
            return "C (Needs Improvement)"
        elif avg_time < 1000:
            return "D (Poor)"
        else:
            return "F (Critical)"

    def generate_recommendations(self, slow_endpoints: List, error_endpoints: List) -> List[str]:
        """Generate optimization recommendations."""
        recommendations = []
        
        if slow_endpoints:
            recommendations.append(f"🔴 CRITICAL: {len(slow_endpoints)} endpoints exceed 200ms target")
            recommendations.append("• Implement Redis caching for calculation results")
            recommendations.append("• Optimize database queries with proper indexing")
            recommendations.append("• Consider async processing for heavy calculations")
        
        if error_endpoints:
            recommendations.append(f"⚠️ WARNING: {len(error_endpoints)} endpoints have errors")
            recommendations.append("• Review error handling and timeout configurations")
            recommendations.append("• Implement circuit breaker patterns")
        
        # Specific recommendations based on endpoint types
        calc_endpoints = [ep for ep in slow_endpoints if "calculations" in ep["endpoint"]]
        if calc_endpoints:
            recommendations.append("• Cache HVAC lookup tables and material properties")
            recommendations.append("• Optimize calculation algorithms for performance")
        
        export_endpoints = [ep for ep in slow_endpoints if "exports" in ep["endpoint"]]
        if export_endpoints:
            recommendations.append("• Implement async PDF/CSV generation")
            recommendations.append("• Use background job processing for exports")
        
        return recommendations

    def print_report(self, report: Dict[str, Any]):
        """Print formatted performance report."""
        print("\n" + "="*80)
        print("API PERFORMANCE PROFILING REPORT")
        print("="*80)
        print(f"Timestamp: {report['timestamp']}")
        print(f"Total Duration: {report['total_duration']:.2f}s")
        print(f"Endpoints Tested: {report['endpoints_tested']}")
        
        overall = report['overall_performance']
        print(f"\nOVERALL PERFORMANCE:")
        print(f"Average Response Time: {overall['avg_response_time']:.2f}ms")
        print(f"95th Percentile: {overall['p95_response_time']:.2f}ms")
        print(f"Performance Grade: {overall['performance_grade']}")
        print(f"Target Met (<200ms): {'✅ YES' if overall['target_met'] else '❌ NO'}")
        
        if report['slow_endpoints']:
            print(f"\nSLOW ENDPOINTS (>{200}ms):")
            print("-" * 50)
            for ep in report['slow_endpoints'][:5]:  # Top 5 slowest
                print(f"🔴 {ep['endpoint']}: {ep['avg_time']:.2f}ms (P95: {ep['p95_time']:.2f}ms)")
        
        if report['error_endpoints']:
            print(f"\nERROR ENDPOINTS:")
            print("-" * 50)
            for ep in report['error_endpoints']:
                print(f"⚠️ {ep['endpoint']}: {len(ep['errors'])} errors")
        
        if report['recommendations']:
            print(f"\nRECOMMENDATIONS:")
            print("-" * 50)
            for rec in report['recommendations']:
                print(rec)
        
        print("="*80)

def main():
    """Main function to run API performance profiling."""
    profiler = APIPerformanceProfiler()
    
    try:
        report = profiler.run_comprehensive_profile(iterations=3)
        profiler.print_report(report)
        
        # Save report to file
        with open('api_performance_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Detailed report saved to: api_performance_report.json")
        
        return 0 if report['overall_performance']['target_met'] else 1
        
    except Exception as e:
        logger.error(f"Performance profiling failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
