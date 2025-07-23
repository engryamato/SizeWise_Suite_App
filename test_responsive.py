#!/usr/bin/env python3
"""
Test script for SizeWise Suite Responsive Design
"""

import requests
import re
import sys

def test_viewport_configuration():
    """Test viewport meta tag configuration"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check for proper viewport configuration
        viewport_patterns = [
            r'<meta[^>]*name=["\']viewport["\'][^>]*>',
            r'width=device-width',
            r'initial-scale=1'
        ]
        
        results = {}
        for pattern in viewport_patterns:
            results[pattern] = bool(re.search(pattern, html, re.IGNORECASE))
        
        print("Viewport Configuration:")
        for pattern, found in results.items():
            print(f"  {pattern}: {'✅' if found else '❌'}")
        
        return all(results.values())
        
    except Exception as e:
        print(f"Viewport test failed: {e}")
        return False

def test_responsive_css_classes():
    """Test for responsive CSS classes (Tailwind breakpoints)"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check for Tailwind responsive classes
        breakpoints = {
            'sm:': 'Small screens (640px+)',
            'md:': 'Medium screens (768px+)', 
            'lg:': 'Large screens (1024px+)',
            'xl:': 'Extra large screens (1280px+)',
            '2xl:': 'Extra extra large screens (1536px+)'
        }
        
        results = {}
        for breakpoint, description in breakpoints.items():
            count = html.count(breakpoint)
            results[breakpoint] = count > 0
            print(f"  {description}: {'✅' if count > 0 else '❌'} ({count} occurrences)")
        
        return sum(results.values()) >= 3  # At least 3 breakpoints used
        
    except Exception as e:
        print(f"Responsive CSS test failed: {e}")
        return False

def test_flexible_layouts():
    """Test for flexible layout patterns"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check for flexible layout classes
        layout_patterns = {
            'Flexbox': ['flex', 'flex-col', 'flex-row', 'justify-', 'items-'],
            'Grid': ['grid', 'grid-cols-', 'gap-'],
            'Container': ['container', 'max-w-', 'mx-auto'],
            'Spacing': ['p-', 'm-', 'px-', 'py-', 'mx-', 'my-']
        }
        
        results = {}
        for category, patterns in layout_patterns.items():
            found = any(pattern in html for pattern in patterns)
            results[category] = found
            print(f"  {category}: {'✅' if found else '❌'}")
        
        return sum(results.values()) >= 3  # At least 3 layout types
        
    except Exception as e:
        print(f"Flexible layouts test failed: {e}")
        return False

def test_responsive_navigation():
    """Test responsive navigation patterns"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text.lower()
        
        # Check for responsive navigation indicators
        nav_patterns = {
            'Navigation element': '<nav' in html,
            'Mobile menu indicators': any(x in html for x in ['menu', 'hamburger', 'toggle']),
            'Hidden/shown classes': any(x in html for x in ['hidden', 'block', 'inline']),
            'Responsive spacing': any(x in html for x in ['space-x-', 'space-y-'])
        }
        
        for pattern, found in nav_patterns.items():
            print(f"  {pattern}: {'✅' if found else '❌'}")
        
        return sum(nav_patterns.values()) >= 2  # At least 2 navigation features
        
    except Exception as e:
        print(f"Responsive navigation test failed: {e}")
        return False

def test_responsive_typography():
    """Test responsive typography"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check for responsive text classes
        typography_patterns = {
            'Responsive text sizes': bool(re.search(r'text-(sm|md|lg|xl|2xl|3xl|4xl):', html)),
            'Base text sizes': bool(re.search(r'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)', html)),
            'Font weights': bool(re.search(r'font-(thin|light|normal|medium|semibold|bold|extrabold|black)', html)),
            'Line heights': bool(re.search(r'leading-(none|tight|snug|normal|relaxed|loose)', html))
        }
        
        for pattern, found in typography_patterns.items():
            print(f"  {pattern}: {'✅' if found else '❌'}")
        
        return sum(typography_patterns.values()) >= 2  # At least 2 typography features
        
    except Exception as e:
        print(f"Responsive typography test failed: {e}")
        return False

def test_responsive_components():
    """Test responsive component behavior"""
    try:
        # Test different pages for responsive components
        pages = ['/', '/tools', '/demo', '/air-duct-sizer-v1']
        
        responsive_features = {
            'Cards/Panels': 0,
            'Buttons': 0,
            'Forms': 0,
            'Images': 0
        }
        
        for page in pages:
            try:
                response = requests.get(f'http://localhost:3000{page}', timeout=10)
                if response.status_code == 200:
                    html = response.text.lower()
                    
                    # Count responsive features
                    if any(x in html for x in ['card', 'panel', 'rounded']):
                        responsive_features['Cards/Panels'] += 1
                    if 'button' in html:
                        responsive_features['Buttons'] += 1
                    if any(x in html for x in ['form', 'input']):
                        responsive_features['Forms'] += 1
                    if 'img' in html:
                        responsive_features['Images'] += 1
                        
            except:
                continue
        
        print("Responsive Components across pages:")
        for feature, count in responsive_features.items():
            print(f"  {feature}: {'✅' if count > 0 else '❌'} ({count} pages)")
        
        return sum(1 for count in responsive_features.values() if count > 0) >= 2
        
    except Exception as e:
        print(f"Responsive components test failed: {e}")
        return False

def test_mobile_optimization():
    """Test mobile-specific optimizations"""
    try:
        response = requests.get('http://localhost:3000/', timeout=10)
        if response.status_code != 200:
            return False
            
        html = response.text.lower()
        
        # Check for mobile optimization indicators
        mobile_features = {
            'Touch-friendly sizing': any(x in html for x in ['p-4', 'p-6', 'p-8', 'py-4', 'px-4']),
            'Mobile-first approach': 'sm:' in html and 'md:' in html,
            'Overflow handling': any(x in html for x in ['overflow-', 'scroll', 'truncate']),
            'Mobile navigation': any(x in html for x in ['menu', 'drawer', 'sidebar'])
        }
        
        for feature, found in mobile_features.items():
            print(f"  {feature}: {'✅' if found else '❌'}")
        
        return sum(mobile_features.values()) >= 2  # At least 2 mobile features
        
    except Exception as e:
        print(f"Mobile optimization test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing SizeWise Suite Responsive Design")
    print("=" * 50)
    
    tests = [
        ("Viewport Configuration", test_viewport_configuration),
        ("Responsive CSS Classes", test_responsive_css_classes),
        ("Flexible Layouts", test_flexible_layouts),
        ("Responsive Navigation", test_responsive_navigation),
        ("Responsive Typography", test_responsive_typography),
        ("Responsive Components", test_responsive_components),
        ("Mobile Optimization", test_mobile_optimization)
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
        print("🎉 Responsive design tests passed!")
        sys.exit(0)
    else:
        print("❌ Responsive design needs improvement")
        sys.exit(1)
