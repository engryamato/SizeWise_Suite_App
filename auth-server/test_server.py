#!/usr/bin/env python3
"""
Simple test script for SizeWise Authentication Server
Tests basic functionality and API endpoints
"""

import requests
import json
import time

BASE_URL = 'http://localhost:5000'

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f'{BASE_URL}/api/health')
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    
    user_data = {
        "email": "test@sizewise.com",
        "password": "testpassword123",
        "name": "Test User",
        "company": "SizeWise Test Corp"
    }
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/register', json=user_data)
        
        if response.status_code == 201:
            data = response.json()
            print("✅ User registration successful")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Tier: {data['user']['tier']}")
            print(f"   Trial Expires: {data['user']['trial_expires']}")
            return data['token'], data['user']
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None, None

def test_user_login():
    """Test user login"""
    print("\n🔍 Testing user login...")
    
    login_data = {
        "email": "test@sizewise.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ User login successful")
            print(f"   User: {data['user']['name']}")
            print(f"   Tier: {data['user']['tier']}")
            return data['token'], data['user']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None, None

def test_tier_status(token):
    """Test tier status endpoint"""
    print("\n🔍 Testing tier status...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f'{BASE_URL}/api/user/tier-status', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Tier status retrieved successfully")
            print(f"   Tier: {data['tier']}")
            print(f"   Max Projects: {data['features']['max_projects']}")
            print(f"   Max Segments: {data['features']['max_segments_per_project']}")
            print(f"   High Res Exports: {data['features']['high_res_exports']}")
            print(f"   Watermarked: {data['features']['watermarked_exports']}")
            return True
        else:
            print(f"❌ Tier status failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Tier status error: {e}")
        return False

def test_tier_configurations():
    """Test tier configurations endpoint"""
    print("\n🔍 Testing tier configurations...")
    
    try:
        response = requests.get(f'{BASE_URL}/api/tiers')
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Tier configurations retrieved successfully")
            for tier in data['tiers']:
                print(f"   {tier['tier'].upper()}: {tier['max_projects']} projects, {tier['max_segments_per_project']} segments")
            return True
        else:
            print(f"❌ Tier configurations failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Tier configurations error: {e}")
        return False

def test_logout(token):
    """Test user logout"""
    print("\n🔍 Testing user logout...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/logout', headers=headers)
        
        if response.status_code == 200:
            print("✅ User logout successful")
            return True
        else:
            print(f"❌ Logout failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Logout error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 SizeWise Authentication Server Test Suite")
    print("=" * 50)
    
    # Test health check
    if not test_health_check():
        print("\n❌ Server is not running or not responding")
        print("   Make sure to start the server with: python run.py")
        return
    
    # Test registration
    token, user = test_user_registration()
    if not token:
        print("\n❌ Registration test failed, skipping other tests")
        return
    
    # Test login
    login_token, login_user = test_user_login()
    if not login_token:
        print("\n❌ Login test failed")
    
    # Use registration token for remaining tests
    test_token = token
    
    # Test tier status
    test_tier_status(test_token)
    
    # Test tier configurations
    test_tier_configurations()
    
    # Test logout
    test_logout(test_token)
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")
    print("\n💡 Next steps:")
    print("   1. Integrate HybridAuthManager with SizeWise Suite")
    print("   2. Update auth store to use hybrid authentication")
    print("   3. Implement tier enforcement in UI components")

if __name__ == '__main__':
    main()
