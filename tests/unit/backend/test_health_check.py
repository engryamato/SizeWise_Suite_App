"""
Test suite for backend health check endpoints.
"""

import pytest
import json
from backend.app import create_app


@pytest.fixture
def app():
    """Create and configure a test app."""
    app = create_app('testing')
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


def test_health_check_endpoint(client):
    """Test the health check endpoint returns correct response."""
    response = client.get('/api/health')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert data['service'] == 'SizeWise Suite Backend'
    assert 'version' in data


def test_api_info_endpoint(client):
    """Test the API info endpoint returns correct information."""
    response = client.get('/api/info')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['name'] == 'SizeWise Suite API'
    assert 'version' in data
    assert 'description' in data
    assert 'modules' in data
    assert 'endpoints' in data
    
    # Check that expected modules are listed
    expected_modules = [
        'air-duct-sizer',
        'grease-duct-sizer',
        'engine-exhaust-sizer',
        'boiler-vent-sizer',
        'estimating-app'
    ]
    for module in expected_modules:
        assert module in data['modules']
    
    # Check that expected endpoints are listed
    expected_endpoints = ['calculations', 'validation', 'exports', 'health']
    for endpoint in expected_endpoints:
        assert endpoint in data['endpoints']


def test_health_check_content_type(client):
    """Test that health check returns JSON content type."""
    response = client.get('/api/health')
    
    assert response.status_code == 200
    assert response.content_type == 'application/json'


def test_api_info_content_type(client):
    """Test that API info returns JSON content type."""
    response = client.get('/api/info')
    
    assert response.status_code == 200
    assert response.content_type == 'application/json'


def test_nonexistent_endpoint_404(client):
    """Test that nonexistent endpoints return 404."""
    response = client.get('/api/nonexistent')
    
    assert response.status_code == 404
    
    data = json.loads(response.data)
    assert data['error'] == 'Not found'
    assert 'message' in data
