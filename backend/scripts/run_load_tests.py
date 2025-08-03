#!/usr/bin/env python3
"""
Load Test Runner for SizeWise Suite Backend

This script provides a convenient way to run different load test scenarios
and collect results for analysis.
"""

import argparse
import subprocess
import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

class LoadTestRunner:
    """Manages load test execution and result collection."""
    
    def __init__(self):
        self.results_dir = Path("load-test-results")
        self.results_dir.mkdir(exist_ok=True)
        
        # Load test configurations
        self.configs = {
            "light": {
                "users": 10,
                "spawn_rate": 2,
                "run_time": "5m",
                "description": "Light load test for normal usage"
            },
            "medium": {
                "users": 50,
                "spawn_rate": 5,
                "run_time": "10m",
                "description": "Medium load test for peak usage"
            },
            "heavy": {
                "users": 100,
                "spawn_rate": 10,
                "run_time": "15m",
                "description": "Heavy load test for stress testing"
            },
            "spike": {
                "users": 200,
                "spawn_rate": 20,
                "run_time": "5m",
                "description": "Spike load test for sudden traffic increases"
            }
        }
    
    def run_load_test(self, test_type: str, host: str = "http://localhost:5000", 
                     output_format: str = "json") -> dict:
        """
        Run a specific load test configuration.
        
        Args:
            test_type: Type of load test (light, medium, heavy, spike)
            host: Target host URL
            output_format: Output format (json, csv, html)
            
        Returns:
            Dictionary containing test results and metadata
        """
        if test_type not in self.configs:
            raise ValueError(f"Unknown test type: {test_type}")
        
        config = self.configs[test_type]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create output files
        output_file = self.results_dir / f"load_test_{test_type}_{timestamp}"
        log_file = self.results_dir / f"load_test_{test_type}_{timestamp}.log"
        
        print(f"Starting {test_type} load test...")
        print(f"Configuration: {config}")
        print(f"Target host: {host}")
        print(f"Results will be saved to: {output_file}")
        
        # Build locust command
        cmd = [
            "locust",
            "-f", "tests/load/test_load_performance.py",
            "--host", host,
            "--users", str(config["users"]),
            "--spawn-rate", str(config["spawn_rate"]),
            "--run-time", config["run_time"],
            "--headless",
            "--html", f"{output_file}.html",
            "--csv", str(output_file),
            "--logfile", str(log_file)
        ]
        
        # Add JSON output if requested
        if output_format == "json":
            cmd.extend(["--json"])
        
        start_time = time.time()
        
        try:
            # Run the load test
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            end_time = time.time()
            
            # Collect results
            test_results = {
                "test_type": test_type,
                "config": config,
                "host": host,
                "start_time": datetime.fromtimestamp(start_time).isoformat(),
                "end_time": datetime.fromtimestamp(end_time).isoformat(),
                "duration_seconds": end_time - start_time,
                "status": "success",
                "output_files": {
                    "html": f"{output_file}.html",
                    "csv_stats": f"{output_file}_stats.csv",
                    "csv_failures": f"{output_file}_failures.csv",
                    "csv_exceptions": f"{output_file}_exceptions.csv",
                    "log": str(log_file)
                },
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            # Parse CSV results if available
            stats_file = Path(f"{output_file}_stats.csv")
            if stats_file.exists():
                test_results["stats"] = self._parse_stats_csv(stats_file)
            
            # Save results metadata
            results_file = self.results_dir / f"load_test_{test_type}_{timestamp}.json"
            with open(results_file, 'w') as f:
                json.dump(test_results, f, indent=2)
            
            print(f"Load test completed successfully!")
            print(f"Results saved to: {results_file}")
            
            return test_results
            
        except subprocess.CalledProcessError as e:
            end_time = time.time()
            
            error_results = {
                "test_type": test_type,
                "config": config,
                "host": host,
                "start_time": datetime.fromtimestamp(start_time).isoformat(),
                "end_time": datetime.fromtimestamp(end_time).isoformat(),
                "duration_seconds": end_time - start_time,
                "status": "failed",
                "error": str(e),
                "stdout": e.stdout,
                "stderr": e.stderr
            }
            
            # Save error results
            error_file = self.results_dir / f"load_test_{test_type}_{timestamp}_error.json"
            with open(error_file, 'w') as f:
                json.dump(error_results, f, indent=2)
            
            print(f"Load test failed: {e}")
            print(f"Error details saved to: {error_file}")
            
            return error_results
    
    def _parse_stats_csv(self, csv_file: Path) -> list:
        """Parse Locust stats CSV file."""
        import csv
        
        stats = []
        try:
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    stats.append(row)
        except Exception as e:
            print(f"Warning: Could not parse stats CSV: {e}")
        
        return stats
    
    def run_all_tests(self, host: str = "http://localhost:5000") -> dict:
        """Run all load test configurations."""
        all_results = {}
        
        for test_type in self.configs.keys():
            print(f"\n{'='*50}")
            print(f"Running {test_type} load test")
            print(f"{'='*50}")
            
            try:
                result = self.run_load_test(test_type, host)
                all_results[test_type] = result
                
                # Brief pause between tests
                if test_type != list(self.configs.keys())[-1]:
                    print("Waiting 30 seconds before next test...")
                    time.sleep(30)
                    
            except Exception as e:
                print(f"Failed to run {test_type} test: {e}")
                all_results[test_type] = {"status": "failed", "error": str(e)}
        
        # Save combined results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        combined_file = self.results_dir / f"load_test_suite_{timestamp}.json"
        
        with open(combined_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        print(f"\nAll load tests completed!")
        print(f"Combined results saved to: {combined_file}")
        
        return all_results
    
    def generate_report(self, results_pattern: str = "load_test_*.json") -> None:
        """Generate a summary report from test results."""
        import glob
        
        result_files = glob.glob(str(self.results_dir / results_pattern))
        
        if not result_files:
            print("No test results found.")
            return
        
        print("\n" + "="*80)
        print("LOAD TEST SUMMARY REPORT")
        print("="*80)
        
        for result_file in sorted(result_files):
            try:
                with open(result_file, 'r') as f:
                    results = json.load(f)
                
                if "test_type" in results:
                    # Single test result
                    self._print_test_summary(results)
                else:
                    # Test suite results
                    for test_type, test_results in results.items():
                        self._print_test_summary(test_results)
                        
            except Exception as e:
                print(f"Error reading {result_file}: {e}")
    
    def _print_test_summary(self, results: dict) -> None:
        """Print summary for a single test."""
        print(f"\nTest Type: {results.get('test_type', 'Unknown')}")
        print(f"Status: {results.get('status', 'Unknown')}")
        print(f"Duration: {results.get('duration_seconds', 0):.2f} seconds")
        
        if results.get('status') == 'success' and 'stats' in results:
            stats = results['stats']
            if stats:
                # Find aggregated stats (usually the last row)
                total_stats = next((s for s in stats if s.get('Name') == 'Aggregated'), stats[-1] if stats else {})
                
                print(f"Total Requests: {total_stats.get('Request Count', 'N/A')}")
                print(f"Failure Count: {total_stats.get('Failure Count', 'N/A')}")
                print(f"Average Response Time: {total_stats.get('Average Response Time', 'N/A')} ms")
                print(f"Max Response Time: {total_stats.get('Max Response Time', 'N/A')} ms")
                print(f"Requests/sec: {total_stats.get('Requests/s', 'N/A')}")
        
        print("-" * 40)


def main():
    """Main entry point for the load test runner."""
    parser = argparse.ArgumentParser(description="Run load tests for SizeWise Suite backend")
    
    parser.add_argument(
        "test_type",
        nargs="?",
        choices=["light", "medium", "heavy", "spike", "all", "report"],
        default="light",
        help="Type of load test to run"
    )
    
    parser.add_argument(
        "--host",
        default="http://localhost:5000",
        help="Target host URL (default: http://localhost:5000)"
    )
    
    parser.add_argument(
        "--format",
        choices=["json", "csv", "html"],
        default="json",
        help="Output format (default: json)"
    )
    
    args = parser.parse_args()
    
    # Change to backend directory
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    
    runner = LoadTestRunner()
    
    if args.test_type == "report":
        runner.generate_report()
    elif args.test_type == "all":
        runner.run_all_tests(args.host)
    else:
        runner.run_load_test(args.test_type, args.host, args.format)


if __name__ == "__main__":
    main()
