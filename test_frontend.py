#!/usr/bin/env python3
"""
Test script for SizeWise Suite Frontend functionality
"""

import requests
from bs4 import BeautifulSoup
import json
import sys
import re

def test_frontend_pages():
    """Test that frontend pages are accessible and contain expected content"""
    pages = [
        ('/', 'Welcome to SizeWise Suite'),
        ('/tools', 'Air Duct Sizer'),
        ('/demo', 'Component Demo'),
        ('/air-duct-sizer-v1', 'Air Duct Sizer V1'),
    ]
    
    results = []
    for path, expected_content in pages:
        try:
            response = requests.get(f'http://localhost:3000{path}', timeout=10)
            print(f"Testing {path}: {response.status_code}")
            
            if response.status_code == 200:
                # Check if expected content is present
                if expected_content.lower() in response.text.lower():
                    print(f"  ✅ Found expected content: '{expected_content}'")
                    results.append(True)
                else:
                    print(f"  ❌ Missing expected content: '{expected_content}'")
                    results.append(False)
            else:
                print(f"  ❌ HTTP {response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"  ❌ Error accessing {path}: {e}")
            results.append(False)
    
    return all(results)

def test_static_assets():
    """Test that static assets are loading"""
    assets = [
        '/_next/static/css/',  # CSS files
        '/_next/static/chunks/', # JS chunks
    ]
    
    try:
        # Get the main page to find actual asset URLs
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        # Look for CSS and JS links in the HTML
        css_found = '_next/static/css/' in response.text
        js_found = '_next/static/chunks/' in response.text
        
        print(f"CSS assets found: {css_found}")
        print(f"JS assets found: {js_found}")
        
        return css_found and js_found
        
    except Exception as e:
        print(f"Error testing static assets: {e}")
        return False

def test_api_integration():
    """Test that frontend can communicate with backend"""
    try:
        # Test if frontend is configured to proxy API calls
        # We'll check if the frontend has the correct API configuration
        response = requests.get('http://localhost:3000/api/health', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"API integration working: {data}")
            return data.get('status') == 'healthy'
        else:
            print(f"API integration failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"API integration test failed: {e}")
        return False

def test_responsive_design():
    """Test responsive design by checking viewport meta tag and CSS"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        # Check for viewport meta tag
        viewport_found = 'viewport' in response.text and 'width=device-width' in response.text
        
        # Check for responsive CSS classes (Tailwind)
        responsive_classes = ['sm:', 'md:', 'lg:', 'xl:']
        responsive_found = any(cls in response.text for cls in responsive_classes)
        
        print(f"Viewport meta tag found: {viewport_found}")
        print(f"Responsive CSS classes found: {responsive_found}")
        
        return viewport_found and responsive_found
        
    except Exception as e:
        print(f"Responsive design test failed: {e}")
        return False

def test_accessibility_features():
    """Test basic accessibility features"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text.lower()
        
        # Check for accessibility features
        features = {
            'Skip to content link': 'skip to main content' in html,
            'ARIA labels': 'aria-label' in html,
            'Alt text': 'alt=' in html,
            'Semantic HTML': '<main' in html or '<nav' in html,
            'Focus management': 'focus:' in html
        }
        
        for feature, found in features.items():
            print(f"{feature}: {'✅' if found else '❌'}")
        
        return sum(features.values()) >= 3  # At least 3 accessibility features
        
    except Exception as e:
        print(f"Accessibility test failed: {e}")
        return False

def test_theme_system():
    """Test dark/light theme system"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check for theme-related classes and functionality
        theme_indicators = [
            'dark:' in html,  # Tailwind dark mode classes
            'theme' in html.lower(),
            'light' in html.lower() and 'dark' in html.lower()
        ]
        
        theme_support = any(theme_indicators)
        print(f"Theme system detected: {theme_support}")
        
        return theme_support
        
    except Exception as e:
        print(f"Theme system test failed: {e}")
        return False

def test_interactive_components():
    """Test for interactive component indicators"""
    try:
        response = requests.get('http://localhost:3000/air-duct-sizer-v1', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text.lower()
        
        # Check for interactive component indicators
        components = {
            '3D Canvas': 'canvas' in html or 'three' in html,
            'Drawing Tools': 'tool' in html and ('draw' in html or 'fab' in html),
            'Form Inputs': 'input' in html and 'form' in html,
            'Buttons': 'button' in html,
            'Modals/Panels': 'modal' in html or 'panel' in html
        }
        
        for component, found in components.items():
            print(f"{component}: {'✅' if found else '❌'}")
        
        return sum(components.values()) >= 2  # At least 2 interactive components
        
    except Exception as e:
        print(f"Interactive components test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing SizeWise Suite Frontend")
    print("=" * 50)
    
    tests = [
        ("Frontend Pages", test_frontend_pages),
        ("Static Assets", test_static_assets),
        ("API Integration", test_api_integration),
        ("Responsive Design", test_responsive_design),
        ("Accessibility Features", test_accessibility_features),
        ("Theme System", test_theme_system),
        ("Interactive Components", test_interactive_components)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        try:
            result = test_func()
            results.append(result)
            print(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append(False)
    
    print(f"\n📊 Overall Results: {sum(results)}/{len(results)} tests passed")
    
    if sum(results) >= len(results) * 0.8:  # 80% pass rate
        print("🎉 Frontend tests mostly passed!")
        sys.exit(0)
    else:
        print("❌ Too many frontend tests failed")
        sys.exit(1)
