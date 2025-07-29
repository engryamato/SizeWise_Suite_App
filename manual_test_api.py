#!/usr/bin/env python3
"""
Test script for SizeWise Suite API endpoints
"""

import requests
import json
import sys

def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get('http://localhost:5000/api/health')
        print(f"Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_air_duct_calculation():
    """Test air duct calculation endpoint"""
    test_data = {
        "airflow": 1000,
        "duct_type": "round",
        "friction_rate": 0.1,
        "units": "imperial"
    }
    
    try:
        response = requests.post(
            'http://localhost:5000/api/calculations/air-duct',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Air Duct Calculation: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Air duct calculation failed: {e}")
        return False

def test_validation_endpoints():
    """Test validation endpoints"""
    test_data = {
        "airflow": 1000,
        "duct_type": "round",
        "friction_rate": 0.1,
        "units": "imperial"
    }
    
    endpoints = [
        '/api/validation/smacna',
        '/api/validation/nfpa', 
        '/api/validation/ashrae'
    ]
    
    results = []
    for endpoint in endpoints:
        try:
            response = requests.post(
                f'http://localhost:5000{endpoint}',
                json=test_data,
                headers={'Content-Type': 'application/json'}
            )
            print(f"{endpoint}: {response.status_code}")
            print(f"Response: {response.json()}")
            results.append(response.status_code == 200)
        except Exception as e:
            print(f"{endpoint} failed: {e}")
            results.append(False)
    
    return all(results)

def test_export_endpoints():
    """Test export endpoints"""
    test_data = {
        "project_name": "Test Project",
        "calculations": {
            "airflow": 1000,
            "duct_size": "12 inch diameter"
        }
    }
    
    endpoints = [
        '/api/exports/pdf',
        '/api/exports/csv',
        '/api/exports/json'
    ]
    
    results = []
    for endpoint in endpoints:
        try:
            response = requests.post(
                f'http://localhost:5000{endpoint}',
                json=test_data,
                headers={'Content-Type': 'application/json'}
            )
            print(f"{endpoint}: {response.status_code}")
            print(f"Response: {response.json()}")
            results.append(response.status_code == 200)
        except Exception as e:
            print(f"{endpoint} failed: {e}")
            results.append(False)
    
    return all(results)

if __name__ == "__main__":
    print("🧪 Testing SizeWise Suite API Endpoints")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Air Duct Calculation", test_air_duct_calculation),
        ("Validation Endpoints", test_validation_endpoints),
        ("Export Endpoints", test_export_endpoints)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        result = test_func()
        results.append(result)
        print(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
    
    print(f"\n📊 Overall Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("🎉 All API tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)
