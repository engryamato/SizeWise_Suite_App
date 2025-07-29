#!/usr/bin/env python3
"""
Simple Production Monitoring Validation Script

Basic validation script that checks file structure, imports, and basic functionality
without requiring external dependencies.
"""

import os
import sys
import json
from datetime import datetime

class SimpleValidator:
    """Simple validator for monitoring implementation."""
    
    def __init__(self):
        self.results = []
        self.score = 0
        self.max_score = 0
    
    def validate_file_structure(self):
        """Validate monitoring file structure."""
        print("Validating file structure...")
        
        required_files = [
            'MetricsCollector.py',
            'ErrorTracker.py',
            'PerformanceDashboard.py',
            'HealthMonitor.py',
            'README.md'
        ]
        
        missing_files = []
        for file in required_files:
            if not os.path.exists(file):
                missing_files.append(file)
        
        if not missing_files:
            self._add_result("File Structure", "All required files present", True, 20, 20)
        else:
            self._add_result("File Structure", f"Missing files: {missing_files}", False, 0, 20)
    
    def validate_imports(self):
        """Validate that files can be imported."""
        print("Validating imports...")
        
        files_to_test = [
            'MetricsCollector.py',
            'ErrorTracker.py', 
            'PerformanceDashboard.py',
            'HealthMonitor.py'
        ]
        
        import_errors = []
        for file in files_to_test:
            try:
                # Basic syntax check by compiling
                with open(file, 'r') as f:
                    content = f.read()
                compile(content, file, 'exec')
            except Exception as e:
                import_errors.append(f"{file}: {str(e)}")
        
        if not import_errors:
            self._add_result("Import Validation", "All files compile successfully", True, 20, 20)
        else:
            self._add_result("Import Validation", f"Import errors: {import_errors}", False, 0, 20)
    
    def validate_class_definitions(self):
        """Validate that required classes are defined."""
        print("Validating class definitions...")
        
        class_checks = [
            ('MetricsCollector.py', 'class MetricsCollector'),
            ('ErrorTracker.py', 'class ErrorTracker'),
            ('PerformanceDashboard.py', 'class PerformanceDashboard'),
            ('HealthMonitor.py', 'class HealthMonitor')
        ]
        
        missing_classes = []
        for file, class_def in class_checks:
            try:
                with open(file, 'r') as f:
                    content = f.read()
                if class_def not in content:
                    missing_classes.append(f"{file}: {class_def}")
            except Exception as e:
                missing_classes.append(f"{file}: Error reading file")
        
        if not missing_classes:
            self._add_result("Class Definitions", "All required classes found", True, 15, 15)
        else:
            self._add_result("Class Definitions", f"Missing classes: {missing_classes}", False, 0, 15)
    
    def validate_method_definitions(self):
        """Validate that required methods are defined."""
        print("Validating method definitions...")
        
        method_checks = [
            ('MetricsCollector.py', ['async def initialize', 'def get_prometheus_metrics', 'async def get_metrics_summary']),
            ('ErrorTracker.py', ['async def initialize', 'def capture_error', 'async def get_error_summary']),
            ('PerformanceDashboard.py', ['async def initialize', 'async def get_dashboard_overview', 'async def get_widget_data']),
            ('HealthMonitor.py', ['async def initialize', 'async def get_overall_health'])
        ]
        
        missing_methods = []
        for file, methods in method_checks:
            try:
                with open(file, 'r') as f:
                    content = f.read()
                for method in methods:
                    if method not in content:
                        missing_methods.append(f"{file}: {method}")
            except Exception as e:
                missing_methods.append(f"{file}: Error reading file")
        
        if not missing_methods:
            self._add_result("Method Definitions", "All required methods found", True, 15, 15)
        else:
            self._add_result("Method Definitions", f"Missing methods: {missing_methods}", False, 0, 15)
    
    def validate_documentation(self):
        """Validate documentation completeness."""
        print("Validating documentation...")
        
        doc_checks = []
        
        # Check README.md
        if os.path.exists('README.md'):
            with open('README.md', 'r') as f:
                readme_content = f.read()
            
            required_sections = [
                '## Overview',
                '## Architecture', 
                '## Features',
                '## Quick Start',
                '## Configuration'
            ]
            
            missing_sections = []
            for section in required_sections:
                if section not in readme_content:
                    missing_sections.append(section)
            
            if not missing_sections:
                doc_checks.append("README.md complete")
            else:
                doc_checks.append(f"README.md missing: {missing_sections}")
        else:
            doc_checks.append("README.md not found")
        
        # Check docstrings in Python files
        files_to_check = ['MetricsCollector.py', 'ErrorTracker.py', 'PerformanceDashboard.py', 'HealthMonitor.py']
        documented_files = 0
        
        for file in files_to_check:
            try:
                with open(file, 'r') as f:
                    content = f.read()
                if '"""' in content and 'class ' in content:
                    documented_files += 1
            except:
                pass
        
        doc_score = 10 if len(doc_checks) == 1 and "complete" in doc_checks[0] else 5
        doc_score += (documented_files / len(files_to_check)) * 10
        
        self._add_result("Documentation", f"Documentation status: {doc_checks}", True, int(doc_score), 20)
    
    def validate_kubernetes_integration(self):
        """Validate Kubernetes integration files."""
        print("Validating Kubernetes integration...")
        
        k8s_path = "../microservices/kubernetes/sizewise-configmap.yaml"
        
        if os.path.exists(k8s_path):
            with open(k8s_path, 'r') as f:
                config_content = f.read()
            
            required_configs = [
                'METRICS_COLLECTION_ENABLED',
                'ERROR_TRACKING_ENABLED',
                'PERFORMANCE_DASHBOARD_ENABLED',
                'HEALTH_MONITORING_ENABLED'
            ]
            
            missing_configs = []
            for config in required_configs:
                if config not in config_content:
                    missing_configs.append(config)
            
            if not missing_configs:
                self._add_result("Kubernetes Integration", "ConfigMap properly configured", True, 10, 10)
            else:
                self._add_result("Kubernetes Integration", f"Missing configs: {missing_configs}", False, 5, 10)
        else:
            self._add_result("Kubernetes Integration", "ConfigMap file not found", False, 0, 10)
    
    def _add_result(self, component, message, passed, score, max_score):
        """Add validation result."""
        result = {
            'component': component,
            'message': message,
            'passed': passed,
            'score': score,
            'max_score': max_score,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.results.append(result)
        self.score += score
        self.max_score += max_score
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} {component}: {message} ({score}/{max_score})")
    
    def run_validation(self):
        """Run complete validation."""
        print("="*80)
        print("SIZEWISE SUITE - PRODUCTION MONITORING SIMPLE VALIDATION")
        print("="*80)
        print()
        
        self.validate_file_structure()
        self.validate_imports()
        self.validate_class_definitions()
        self.validate_method_definitions()
        self.validate_documentation()
        self.validate_kubernetes_integration()
        
        # Calculate final score
        percentage = (self.score / self.max_score * 100) if self.max_score > 0 else 0
        
        print()
        print("="*80)
        print("VALIDATION RESULTS")
        print("="*80)
        print(f"Total Score: {self.score}/{self.max_score} ({percentage:.1f}%)")
        
        if percentage >= 90:
            print("✅ EXCELLENT - Production ready!")
            status = "PASS"
        elif percentage >= 80:
            print("✅ GOOD - Minor improvements needed")
            status = "PASS"
        elif percentage >= 70:
            print("⚠️  ACCEPTABLE - Some improvements needed")
            status = "PARTIAL"
        else:
            print("❌ NEEDS WORK - Significant improvements required")
            status = "FAIL"
        
        print()
        print("Component Breakdown:")
        for result in self.results:
            status_icon = "✅" if result['passed'] else "❌"
            print(f"  {status_icon} {result['component']}: {result['score']}/{result['max_score']}")
        
        # Save results
        validation_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_score': self.score,
            'max_score': self.max_score,
            'percentage': percentage,
            'status': status,
            'results': self.results
        }
        
        with open('simple_validation_results.json', 'w') as f:
            json.dump(validation_results, f, indent=2)
        
        print()
        print("Detailed results saved to: simple_validation_results.json")
        print("="*80)
        
        return validation_results

def main():
    """Main validation function."""
    validator = SimpleValidator()
    results = validator.run_validation()
    
    # Exit with appropriate code
    if results['percentage'] >= 70:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
