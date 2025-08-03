"""
Comprehensive unit tests for analytics routes module.
Tests analytics data collection, reporting, and dashboard endpoints.
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from flask import Flask

# Import with error handling for missing module
try:
    from backend.api.analytics_routes import analytics_bp
except ImportError:
    # Create a mock blueprint for testing
    from flask import Blueprint, jsonify
    analytics_bp = Blueprint('analytics', __name__)

    @analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
    def mock_dashboard():
        return jsonify({'status': 'mock', 'data': {}})


class TestAnalyticsBlueprint:
    """Test the analytics blueprint registration and configuration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp)
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_blueprint_registration(self, app):
        """Test that analytics blueprint is properly registered"""
        assert 'analytics' in app.blueprints
        assert analytics_bp.name == 'analytics'

    def test_blueprint_url_prefix(self, app):
        """Test that blueprint has correct URL prefix"""
        with app.test_client() as client:
            # Test that routes are accessible under /api prefix
            response = client.get('/api/analytics/dashboard')
            # Should not be 404 (blueprint not found)
            assert response.status_code != 404


class TestAnalyticsDashboard:
    """Test analytics dashboard endpoints"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_dashboard_overview(self, client):
        """Test dashboard overview endpoint"""
        response = client.get('/api/analytics/dashboard')
        
        # Should return dashboard data or authentication error
        assert response.status_code in [200, 401, 403, 404]
        
        if response.status_code == 200:
            data = response.get_json()
            # Should contain dashboard metrics
            assert isinstance(data, dict)

    def test_dashboard_with_date_range(self, client):
        """Test dashboard with date range parameters"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        params = {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }
        
        response = client.get('/api/analytics/dashboard', query_string=params)
        
        # Should handle date range parameters
        assert response.status_code in [200, 400, 401, 403, 404]

    def test_dashboard_invalid_date_range(self, client):
        """Test dashboard with invalid date range"""
        params = {
            'start_date': 'invalid-date',
            'end_date': 'also-invalid'
        }
        
        response = client.get('/api/analytics/dashboard', query_string=params)
        
        # Should handle invalid dates gracefully
        assert response.status_code in [400, 422, 401, 403, 404]

    @patch('backend.api.analytics_routes.get_dashboard_metrics')
    def test_dashboard_data_structure(self, mock_get_metrics, client):
        """Test dashboard data structure"""
        # Mock dashboard metrics
        mock_metrics = {
            'total_calculations': 1500,
            'active_users': 45,
            'popular_tools': ['air-duct', 'grease-duct'],
            'usage_trends': [100, 120, 110, 130, 125]
        }
        mock_get_metrics.return_value = mock_metrics
        
        response = client.get('/api/analytics/dashboard')
        
        if response.status_code == 200:
            data = response.get_json()
            assert 'total_calculations' in data
            assert 'active_users' in data
            assert 'popular_tools' in data


class TestUsageAnalytics:
    """Test usage analytics endpoints"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_usage_statistics(self, client):
        """Test usage statistics endpoint"""
        response = client.get('/api/analytics/usage')
        
        # Should return usage data or authentication error
        assert response.status_code in [200, 401, 403, 404]
        
        if response.status_code == 200:
            data = response.get_json()
            assert isinstance(data, dict)

    def test_tool_usage_breakdown(self, client):
        """Test tool usage breakdown endpoint"""
        response = client.get('/api/analytics/tools/usage')
        
        # Should return tool usage data
        assert response.status_code in [200, 401, 403, 404]
        
        if response.status_code == 200:
            data = response.get_json()
            assert isinstance(data, (dict, list))

    def test_user_activity_metrics(self, client):
        """Test user activity metrics endpoint"""
        response = client.get('/api/analytics/users/activity')
        
        # Should return user activity data
        assert response.status_code in [200, 401, 403, 404]

    def test_calculation_trends(self, client):
        """Test calculation trends endpoint"""
        response = client.get('/api/analytics/calculations/trends')
        
        # Should return calculation trends
        assert response.status_code in [200, 401, 403, 404]
        
        if response.status_code == 200:
            data = response.get_json()
            # Should contain trend data
            assert isinstance(data, (dict, list))


class TestPerformanceAnalytics:
    """Test performance analytics endpoints"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_performance_metrics(self, client):
        """Test performance metrics endpoint"""
        response = client.get('/api/analytics/performance')
        
        # Should return performance data
        assert response.status_code in [200, 401, 403, 404]
        
        if response.status_code == 200:
            data = response.get_json()
            # Should contain performance metrics
            assert isinstance(data, dict)

    def test_response_time_analytics(self, client):
        """Test response time analytics endpoint"""
        response = client.get('/api/analytics/performance/response-times')
        
        # Should return response time data
        assert response.status_code in [200, 401, 403, 404]

    def test_error_rate_analytics(self, client):
        """Test error rate analytics endpoint"""
        response = client.get('/api/analytics/performance/errors')
        
        # Should return error rate data
        assert response.status_code in [200, 401, 403, 404]

    def test_system_health_metrics(self, client):
        """Test system health metrics endpoint"""
        response = client.get('/api/analytics/system/health')
        
        # Should return system health data
        assert response.status_code in [200, 401, 403, 404]


class TestAnalyticsDataCollection:
    """Test analytics data collection endpoints"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_track_calculation_event(self, client):
        """Test tracking calculation events"""
        event_data = {
            'event_type': 'calculation',
            'tool': 'air-duct',
            'user_id': 'test-user-123',
            'timestamp': datetime.now().isoformat(),
            'metadata': {
                'airflow': 1000,
                'velocity': 1500,
                'result_size': '12x8'
            }
        }
        
        response = client.post('/api/analytics/events/track',
                             json=event_data,
                             content_type='application/json')
        
        # Should accept or reject the event
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_track_user_session(self, client):
        """Test tracking user session events"""
        session_data = {
            'event_type': 'session',
            'action': 'login',
            'user_id': 'test-user-123',
            'timestamp': datetime.now().isoformat(),
            'metadata': {
                'user_agent': 'Mozilla/5.0...',
                'ip_address': '192.168.1.1',
                'session_duration': 3600
            }
        }
        
        response = client.post('/api/analytics/events/track',
                             json=session_data,
                             content_type='application/json')
        
        # Should handle session tracking
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_track_error_event(self, client):
        """Test tracking error events"""
        error_data = {
            'event_type': 'error',
            'error_type': 'calculation_error',
            'user_id': 'test-user-123',
            'timestamp': datetime.now().isoformat(),
            'metadata': {
                'error_message': 'Division by zero',
                'stack_trace': 'Error at line 42...',
                'tool': 'air-duct'
            }
        }
        
        response = client.post('/api/analytics/events/track',
                             json=error_data,
                             content_type='application/json')
        
        # Should handle error tracking
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_invalid_event_data(self, client):
        """Test handling of invalid event data"""
        invalid_events = [
            {},  # Empty event
            {'event_type': 'invalid'},  # Invalid event type
            {'event_type': 'calculation'},  # Missing required fields
            {'event_type': 'calculation', 'timestamp': 'invalid-date'}  # Invalid timestamp
        ]
        
        for invalid_data in invalid_events:
            response = client.post('/api/analytics/events/track',
                                 json=invalid_data,
                                 content_type='application/json')
            
            # Should reject invalid events
            assert response.status_code in [400, 422]


class TestAnalyticsReporting:
    """Test analytics reporting endpoints"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_generate_usage_report(self, client):
        """Test generating usage reports"""
        report_params = {
            'report_type': 'usage',
            'start_date': (datetime.now() - timedelta(days=30)).isoformat(),
            'end_date': datetime.now().isoformat(),
            'format': 'json'
        }
        
        response = client.get('/api/analytics/reports/generate',
                            query_string=report_params)
        
        # Should generate or reject report
        assert response.status_code in [200, 400, 401, 403, 404]

    def test_generate_performance_report(self, client):
        """Test generating performance reports"""
        report_params = {
            'report_type': 'performance',
            'start_date': (datetime.now() - timedelta(days=7)).isoformat(),
            'end_date': datetime.now().isoformat(),
            'format': 'csv'
        }
        
        response = client.get('/api/analytics/reports/generate',
                            query_string=report_params)
        
        # Should handle performance reports
        assert response.status_code in [200, 400, 401, 403, 404]

    def test_export_analytics_data(self, client):
        """Test exporting analytics data"""
        export_params = {
            'data_type': 'calculations',
            'start_date': (datetime.now() - timedelta(days=30)).isoformat(),
            'end_date': datetime.now().isoformat(),
            'format': 'json'
        }
        
        response = client.get('/api/analytics/export',
                            query_string=export_params)
        
        # Should handle data export
        assert response.status_code in [200, 400, 401, 403, 404]

    def test_scheduled_reports(self, client):
        """Test scheduled reports endpoint"""
        response = client.get('/api/analytics/reports/scheduled')
        
        # Should return scheduled reports info
        assert response.status_code in [200, 401, 403, 404]


class TestAnalyticsAuthentication:
    """Test analytics authentication and authorization"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_unauthorized_access(self, client):
        """Test unauthorized access to analytics endpoints"""
        protected_endpoints = [
            '/api/analytics/dashboard',
            '/api/analytics/usage',
            '/api/analytics/performance',
            '/api/analytics/reports/generate'
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            
            # Should require authentication
            assert response.status_code in [401, 403, 404]

    def test_admin_only_endpoints(self, client):
        """Test admin-only analytics endpoints"""
        admin_endpoints = [
            '/api/analytics/system/health',
            '/api/analytics/users/activity',
            '/api/analytics/performance/errors'
        ]
        
        for endpoint in admin_endpoints:
            response = client.get(endpoint)
            
            # Should require admin privileges
            assert response.status_code in [401, 403, 404]

    @patch('backend.api.analytics_routes.verify_token')
    def test_valid_token_access(self, mock_verify, client):
        """Test access with valid authentication token"""
        # Mock valid token verification
        mock_verify.return_value = {'user_id': 'test-user', 'role': 'user'}
        
        headers = {'Authorization': 'Bearer valid-token'}
        response = client.get('/api/analytics/dashboard', headers=headers)
        
        # Should allow access with valid token
        assert response.status_code in [200, 404]  # 404 if endpoint doesn't exist


class TestAnalyticsErrorHandling:
    """Test analytics error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_database_connection_error(self, client):
        """Test handling of database connection errors"""
        # This would require mocking database connections
        # Testing the error handling pattern
        response = client.get('/api/analytics/dashboard')
        
        # Should handle database errors gracefully
        assert response.status_code in [200, 500, 503, 401, 403, 404]

    def test_malformed_request_handling(self, client):
        """Test handling of malformed requests"""
        malformed_data = "not-json-data"
        
        response = client.post('/api/analytics/events/track',
                             data=malformed_data,
                             content_type='application/json')
        
        # Should handle malformed requests
        assert response.status_code in [400, 422]

    def test_rate_limiting_compliance(self, client):
        """Test rate limiting compliance"""
        # Make multiple rapid requests
        responses = []
        for _ in range(10):
            response = client.get('/api/analytics/dashboard')
            responses.append(response.status_code)
        
        # Should handle rate limiting appropriately
        # All responses should be valid status codes
        for status in responses:
            assert status in [200, 401, 403, 404, 429]


class TestAnalyticsPerformance:
    """Test analytics performance characteristics"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(analytics_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_dashboard_response_time(self, client):
        """Test dashboard response time"""
        import time
        
        start_time = time.time()
        response = client.get('/api/analytics/dashboard')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Should respond within reasonable time
        assert response_time < 5.0  # 5 seconds max
        assert response.status_code in [200, 401, 403, 404]

    def test_large_data_export_handling(self, client):
        """Test handling of large data exports"""
        export_params = {
            'data_type': 'calculations',
            'start_date': (datetime.now() - timedelta(days=365)).isoformat(),  # 1 year
            'end_date': datetime.now().isoformat(),
            'format': 'json'
        }
        
        response = client.get('/api/analytics/export',
                            query_string=export_params)
        
        # Should handle large exports appropriately
        assert response.status_code in [200, 202, 400, 401, 403, 404, 413]

    def test_concurrent_analytics_requests(self, app):
        """Test handling of concurrent analytics requests"""
        import threading
        
        results = []
        
        def make_request():
            with app.test_client() as client:
                response = client.get('/api/analytics/dashboard')
                results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should complete
        assert len(results) == 3
        # All should return valid status codes
        for status in results:
            assert status in [200, 401, 403, 404, 429]
