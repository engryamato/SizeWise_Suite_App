#!/usr/bin/env python3
"""
SizeWise Suite - Contract Test Runner

Comprehensive contract test runner with configuration management,
reporting, and CI/CD integration.

Features:
- Environment-specific configuration
- Parallel test execution
- HTML and JSON reporting
- CI/CD integration
- Performance benchmarking
- Schema validation compliance
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse

# Add the contract tests directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api_contract_tests import APIContractTester

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class ContractTestRunner:
    """Contract test runner with configuration and reporting."""
    
    def __init__(self, environment: str = "development", config_file: str = None):
        self.environment = environment
        self.config = self._load_config(config_file)
        self.results = {}
        self.start_time = None
        self.end_time = None
        
    def _load_config(self, config_file: str = None) -> Dict[str, Any]:
        """Load contract test configuration."""
        if config_file is None:
            config_file = os.path.join(os.path.dirname(__file__), "contract-test-config.json")
        
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            return config.get('contract_test_config', {})
        except FileNotFoundError:
            logger.warning(f"Config file not found: {config_file}, using defaults")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration."""
        return {
            "environments": {
                "development": {
                    "base_url": "http://localhost:5000",
                    "timeout_seconds": 30,
                    "retry_attempts": 3
                }
            },
            "performance_thresholds": {
                "api_info_ms": 1000,
                "health_check_ms": 500,
                "calculation_ms": 5000
            },
            "quality_gates": {
                "contract_compliance_threshold": 90,
                "performance_threshold": 95
            }
        }
    
    async def run_tests(self, test_categories: List[str] = None) -> Dict[str, Any]:
        """Run contract tests with configuration."""
        self.start_time = datetime.utcnow()
        logger.info(f"Starting contract tests for environment: {self.environment}")
        
        # Get environment configuration
        env_config = self.config.get('environments', {}).get(self.environment, {})
        base_url = env_config.get('base_url', 'http://localhost:5000')
        
        # Initialize tester
        tester = APIContractTester(base_url=base_url)
        
        # Run tests
        test_results = await tester.run_contract_tests()
        
        self.end_time = datetime.utcnow()
        
        # Enhance results with configuration and metadata
        enhanced_results = {
            **test_results,
            "environment": self.environment,
            "configuration": {
                "base_url": base_url,
                "test_categories": test_categories,
                "quality_gates": self.config.get('quality_gates', {}),
                "performance_thresholds": self.config.get('performance_thresholds', {})
            },
            "execution_metadata": {
                "start_time": self.start_time.isoformat(),
                "end_time": self.end_time.isoformat(),
                "duration_seconds": (self.end_time - self.start_time).total_seconds(),
                "runner_version": "1.0.0"
            }
        }
        
        # Evaluate against quality gates
        enhanced_results["quality_assessment"] = self._evaluate_quality_gates(enhanced_results)
        
        self.results = enhanced_results
        return enhanced_results
    
    def _evaluate_quality_gates(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate results against quality gates."""
        quality_gates = self.config.get('quality_gates', {})
        
        compliance_threshold = quality_gates.get('contract_compliance_threshold', 90)
        performance_threshold = quality_gates.get('performance_threshold', 95)
        
        validation_score = results.get('validation_score', 0)
        
        # Calculate performance score from test results
        performance_scores = []
        for test_result in results.get('test_results', []):
            if 'details' in test_result and 'response_time_ms' in test_result['details']:
                response_time = test_result['details']['response_time_ms']
                # Score based on response time (lower is better)
                if response_time < 1000:
                    performance_scores.append(100)
                elif response_time < 3000:
                    performance_scores.append(80)
                elif response_time < 5000:
                    performance_scores.append(60)
                else:
                    performance_scores.append(40)
        
        avg_performance_score = sum(performance_scores) / len(performance_scores) if performance_scores else 100
        
        # Determine overall quality assessment
        compliance_pass = validation_score >= compliance_threshold
        performance_pass = avg_performance_score >= performance_threshold
        
        overall_pass = compliance_pass and performance_pass
        
        return {
            "compliance_score": validation_score,
            "compliance_threshold": compliance_threshold,
            "compliance_pass": compliance_pass,
            "performance_score": avg_performance_score,
            "performance_threshold": performance_threshold,
            "performance_pass": performance_pass,
            "overall_pass": overall_pass,
            "quality_level": self._determine_quality_level(validation_score, avg_performance_score)
        }
    
    def _determine_quality_level(self, compliance_score: float, performance_score: float) -> str:
        """Determine overall quality level."""
        avg_score = (compliance_score + performance_score) / 2
        
        if avg_score >= 95:
            return "EXCELLENT"
        elif avg_score >= 90:
            return "GOOD"
        elif avg_score >= 75:
            return "ACCEPTABLE"
        elif avg_score >= 60:
            return "NEEDS_IMPROVEMENT"
        else:
            return "POOR"
    
    def generate_html_report(self, output_file: str = None) -> str:
        """Generate HTML report."""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"contract_test_report_{timestamp}.html"
        
        html_content = self._generate_html_content()
        
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        logger.info(f"HTML report generated: {output_file}")
        return output_file
    
    def _generate_html_content(self) -> str:
        """Generate HTML report content."""
        if not self.results:
            return "<html><body><h1>No test results available</h1></body></html>"
        
        quality_assessment = self.results.get('quality_assessment', {})
        test_results = self.results.get('test_results', [])
        
        # Generate test results table
        test_rows = ""
        for test in test_results:
            status_icon = "✅" if test['success'] else "❌"
            status_class = "success" if test['success'] else "failure"
            
            details = test.get('details', {})
            response_time = details.get('response_time_ms', 'N/A')
            
            test_rows += f"""
            <tr class="{status_class}">
                <td>{status_icon} {test['test_name']}</td>
                <td>{'PASS' if test['success'] else 'FAIL'}</td>
                <td>{response_time}</td>
                <td>{test.get('error', 'N/A')}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SizeWise Suite - API Contract Test Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .summary {{ display: flex; gap: 20px; margin: 20px 0; }}
                .metric {{ background-color: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; }}
                .metric h3 {{ margin: 0; color: #2c3e50; }}
                .metric .value {{ font-size: 24px; font-weight: bold; color: #3498db; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .success {{ background-color: #d4edda; }}
                .failure {{ background-color: #f8d7da; }}
                .quality-excellent {{ color: #28a745; }}
                .quality-good {{ color: #17a2b8; }}
                .quality-acceptable {{ color: #ffc107; }}
                .quality-needs-improvement {{ color: #fd7e14; }}
                .quality-poor {{ color: #dc3545; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SizeWise Suite - API Contract Test Report</h1>
                <p><strong>Environment:</strong> {self.results.get('environment', 'Unknown')}</p>
                <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Duration:</strong> {self.results.get('execution_metadata', {}).get('duration_seconds', 0):.2f} seconds</p>
            </div>
            
            <div class="summary">
                <div class="metric">
                    <h3>Validation Score</h3>
                    <div class="value">{self.results.get('validation_score', 0):.1f}%</div>
                </div>
                <div class="metric">
                    <h3>Tests Passed</h3>
                    <div class="value">{self.results.get('tests_passed', 0)}/{self.results.get('total_tests', 0)}</div>
                </div>
                <div class="metric">
                    <h3>Quality Level</h3>
                    <div class="value quality-{quality_assessment.get('quality_level', 'unknown').lower()}">{quality_assessment.get('quality_level', 'Unknown')}</div>
                </div>
                <div class="metric">
                    <h3>Status</h3>
                    <div class="value">{self.results.get('status', 'Unknown')}</div>
                </div>
            </div>
            
            <h2>Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Response Time (ms)</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    {test_rows}
                </tbody>
            </table>
            
            <h2>Quality Assessment</h2>
            <ul>
                <li><strong>Compliance Score:</strong> {quality_assessment.get('compliance_score', 0):.1f}% (Threshold: {quality_assessment.get('compliance_threshold', 0)}%)</li>
                <li><strong>Performance Score:</strong> {quality_assessment.get('performance_score', 0):.1f}% (Threshold: {quality_assessment.get('performance_threshold', 0)}%)</li>
                <li><strong>Overall Pass:</strong> {'✅ YES' if quality_assessment.get('overall_pass', False) else '❌ NO'}</li>
            </ul>
            
            <h2>Recommendations</h2>
            <ul>
        """
        
        for recommendation in self.results.get('recommendations', []):
            html_content += f"<li>{recommendation}</li>"
        
        html_content += """
            </ul>
        </body>
        </html>
        """
        
        return html_content
    
    def generate_json_report(self, output_file: str = None) -> str:
        """Generate JSON report."""
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"contract_test_report_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"JSON report generated: {output_file}")
        return output_file
    
    def export_to_ci(self) -> Dict[str, Any]:
        """Export results for CI/CD integration."""
        if not self.results:
            return {"error": "No test results available"}
        
        quality_assessment = self.results.get('quality_assessment', {})
        
        ci_export = {
            "test_suite": "api_contract_tests",
            "environment": self.environment,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_tests": self.results.get('total_tests', 0),
                "passed_tests": self.results.get('tests_passed', 0),
                "failed_tests": self.results.get('total_tests', 0) - self.results.get('tests_passed', 0),
                "validation_score": self.results.get('validation_score', 0),
                "status": self.results.get('status', 'UNKNOWN')
            },
            "quality_gates": {
                "compliance_pass": quality_assessment.get('compliance_pass', False),
                "performance_pass": quality_assessment.get('performance_pass', False),
                "overall_pass": quality_assessment.get('overall_pass', False)
            },
            "failed_tests": [
                test['test_name'] for test in self.results.get('test_results', [])
                if not test['success']
            ],
            "recommendations": self.results.get('recommendations', [])
        }
        
        return ci_export

async def main():
    """Main function with CLI argument parsing."""
    parser = argparse.ArgumentParser(description='Run SizeWise Suite API Contract Tests')
    parser.add_argument('--environment', '-e', default='development',
                       choices=['development', 'staging', 'production'],
                       help='Environment to test against')
    parser.add_argument('--config', '-c', help='Path to configuration file')
    parser.add_argument('--output-dir', '-o', default='.',
                       help='Output directory for reports')
    parser.add_argument('--html-report', action='store_true',
                       help='Generate HTML report')
    parser.add_argument('--json-report', action='store_true',
                       help='Generate JSON report')
    parser.add_argument('--ci-export', action='store_true',
                       help='Export results for CI/CD')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize runner
    runner = ContractTestRunner(
        environment=args.environment,
        config_file=args.config
    )
    
    # Run tests
    results = await runner.run_tests()
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"API Contract Test Results - {args.environment.upper()}")
    print(f"{'='*60}")
    print(f"Validation Score: {results['validation_score']:.1f}%")
    print(f"Tests Passed: {results['tests_passed']}/{results['total_tests']}")
    print(f"Status: {results['status']}")
    print(f"Quality Level: {results.get('quality_assessment', {}).get('quality_level', 'Unknown')}")
    
    # Generate reports
    if args.html_report:
        html_file = os.path.join(args.output_dir, f"contract_report_{args.environment}.html")
        runner.generate_html_report(html_file)
    
    if args.json_report:
        json_file = os.path.join(args.output_dir, f"contract_report_{args.environment}.json")
        runner.generate_json_report(json_file)
    
    if args.ci_export:
        ci_data = runner.export_to_ci()
        ci_file = os.path.join(args.output_dir, f"contract_ci_export_{args.environment}.json")
        with open(ci_file, 'w') as f:
            json.dump(ci_data, f, indent=2)
        print(f"CI export generated: {ci_file}")
    
    # Exit with appropriate code for CI/CD
    quality_assessment = results.get('quality_assessment', {})
    if quality_assessment.get('overall_pass', False):
        print("\n✅ All quality gates passed!")
        sys.exit(0)
    else:
        print("\n❌ Quality gates failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
