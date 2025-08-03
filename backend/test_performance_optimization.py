#!/usr/bin/env python3
"""
Performance Optimization Test
SizeWise Suite - Phase 4: Performance Optimization

Quick test to verify API response time improvements after optimization.
"""

import time
import requests
import json
import os
import sys
from datetime import datetime

def test_api_performance():
    """Test API performance with optimizations."""
    
    base_url = "http://localhost:5000"
    
    # Test endpoints with timing
    test_cases = [
        {
            "name": "API Info",
            "method": "GET",
            "url": f"{base_url}/api/info",
            "payload": None
        },
        {
            "name": "Air Duct Calculation",
            "method": "POST", 
            "url": f"{base_url}/api/calculations/air-duct",
            "payload": {
                "airflow": 1000,
                "duct_type": "round",
                "friction_rate": 0.1,
                "units": "imperial"
            }
        },
        {
            "name": "Materials Lookup",
            "method": "GET",
            "url": f"{base_url}/api/calculations/air-duct/materials",
            "payload": None
        }
    ]
    
    print("="*60)
    print("API PERFORMANCE TEST - POST OPTIMIZATION")
    print("="*60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Target: <200ms response times")
    print("-"*60)
    
    total_time = 0
    success_count = 0
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        
        try:
            start_time = time.perf_counter()
            
            if test_case['method'] == 'GET':
                response = requests.get(test_case['url'], timeout=10)
            else:
                response = requests.post(
                    test_case['url'],
                    json=test_case['payload'],
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
            
            end_time = time.perf_counter()
            response_time = (end_time - start_time) * 1000  # Convert to ms
            
            total_time += response_time
            
            if response.status_code == 200:
                success_count += 1
                status_icon = "✅"
                status_text = "SUCCESS"
            else:
                status_icon = "❌"
                status_text = f"FAILED ({response.status_code})"
            
            # Performance assessment
            if response_time < 50:
                perf_icon = "🚀"
                perf_text = "EXCELLENT"
            elif response_time < 100:
                perf_icon = "⚡"
                perf_text = "VERY GOOD"
            elif response_time < 200:
                perf_icon = "✅"
                perf_text = "GOOD"
            elif response_time < 500:
                perf_icon = "⚠️"
                perf_text = "NEEDS IMPROVEMENT"
            else:
                perf_icon = "🔴"
                perf_text = "POOR"
            
            print(f"  {status_icon} Status: {status_text}")
            print(f"  {perf_icon} Response Time: {response_time:.2f}ms ({perf_text})")
            
            # Show response size
            if hasattr(response, 'content'):
                size_kb = len(response.content) / 1024
                print(f"  📦 Response Size: {size_kb:.2f} KB")
            
        except requests.exceptions.Timeout:
            print(f"  ⏰ TIMEOUT (>10s)")
            total_time += 10000  # Add 10s for timeout
            
        except requests.exceptions.ConnectionError:
            print(f"  🔌 CONNECTION ERROR")
            
        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
    
    # Summary
    print("\n" + "="*60)
    print("PERFORMANCE SUMMARY")
    print("="*60)
    
    avg_response_time = total_time / len(test_cases) if test_cases else 0
    success_rate = (success_count / len(test_cases)) * 100 if test_cases else 0
    
    print(f"Average Response Time: {avg_response_time:.2f}ms")
    print(f"Success Rate: {success_rate:.1f}% ({success_count}/{len(test_cases)})")
    
    # Performance grade
    if avg_response_time < 50:
        grade = "A+ (Excellent)"
        grade_icon = "🏆"
    elif avg_response_time < 100:
        grade = "A (Very Good)"
        grade_icon = "🥇"
    elif avg_response_time < 200:
        grade = "B (Good - Target Met)"
        grade_icon = "✅"
    elif avg_response_time < 500:
        grade = "C (Needs Improvement)"
        grade_icon = "⚠️"
    else:
        grade = "F (Critical Issues)"
        grade_icon = "🔴"
    
    print(f"Performance Grade: {grade_icon} {grade}")
    
    # Improvement assessment
    baseline_time = 6000  # Previous 6+ second response times
    if avg_response_time < baseline_time:
        improvement = ((baseline_time - avg_response_time) / baseline_time) * 100
        print(f"Improvement: 🚀 {improvement:.1f}% faster than baseline")
    
    target_met = avg_response_time < 200
    print(f"Target (<200ms): {'✅ MET' if target_met else '❌ NOT MET'}")
    
    print("="*60)
    
    return {
        "avg_response_time": avg_response_time,
        "success_rate": success_rate,
        "target_met": target_met,
        "grade": grade
    }

if __name__ == "__main__":
    # Check if Flask server is running
    try:
        response = requests.get("http://localhost:5000/api/info", timeout=2)
        print("✅ Flask server detected - starting performance test...")
        result = test_api_performance()
        
        # Exit code based on performance
        exit_code = 0 if result["target_met"] else 1
        sys.exit(exit_code)
        
    except requests.exceptions.ConnectionError:
        print("❌ Flask server not running. Please start the server first:")
        print("   cd backend && python app.py")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        sys.exit(1)
