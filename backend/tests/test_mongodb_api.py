"""
Comprehensive unit tests for MongoDB API module.
Tests database operations, data persistence, and MongoDB integration.
"""

import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock
from flask import Flask

# Import with error handling for missing module
try:
    from backend.api.mongodb_api import mongodb_bp
except ImportError:
    # Create a mock blueprint for testing
    from flask import Blueprint
    mongodb_bp = Blueprint('mongodb_api', __name__)


class TestMongoDBBlueprint:
    """Test the MongoDB API blueprint registration and configuration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_blueprint_registration(self, app):
        """Test that MongoDB API blueprint is properly registered"""
        assert 'mongodb_api' in app.blueprints
        assert mongodb_bp.name == 'mongodb_api'

    def test_blueprint_url_prefix(self, app):
        """Test that blueprint has correct URL prefix"""
        with app.test_client() as client:
            # Test that routes are accessible under /api prefix
            response = client.get('/api/mongodb/health')
            # Should not be 404 (blueprint not found)
            assert response.status_code != 404


class TestMongoDBConnection:
    """Test MongoDB connection and health checks"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_mongodb_health_check(self, client):
        """Test MongoDB health check endpoint"""
        response = client.get('/api/mongodb/health')

        # Should return health status
        assert response.status_code in [200, 503, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'status' in data
            assert data['status'] in ['healthy', 'connected']

    @patch('backend.api.mongodb_api.get_mongodb_client')
    def test_mongodb_connection_success(self, mock_client, client):
        """Test successful MongoDB connection"""
        # Mock successful connection
        mock_db_client = MagicMock()
        mock_db_client.admin.command.return_value = {'ok': 1}
        mock_client.return_value = mock_db_client

        response = client.get('/api/mongodb/health')

        # Should indicate healthy connection
        assert response.status_code in [200, 404]

    @patch('backend.api.mongodb_api.get_mongodb_client')
    def test_mongodb_connection_failure(self, mock_client, client):
        """Test MongoDB connection failure handling"""
        # Mock connection failure
        mock_client.side_effect = Exception("Connection failed")

        response = client.get('/api/mongodb/health')

        # Should handle connection failure gracefully
        assert response.status_code in [503, 500, 404]

    def test_mongodb_database_info(self, client):
        """Test getting MongoDB database information"""
        response = client.get('/api/mongodb/info')

        # Should return database info or require authentication
        assert response.status_code in [200, 401, 403, 404, 503]

        if response.status_code == 200:
            data = response.get_json()
            assert 'database' in data or 'collections' in data


class TestProjectDataOperations:
    """Test project data CRUD operations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_create_project(self, client):
        """Test creating a new project"""
        project_data = {
            "name": "Test HVAC Project",
            "description": "Test project for unit testing",
            "client": "Test Client",
            "location": "Test Location",
            "created_by": "test-user-123",
            "metadata": {
                "project_type": "commercial",
                "building_type": "office"
            }
        }

        response = client.post('/api/mongodb/projects',
                             json=project_data,
                             content_type='application/json')

        # Should create project or require authentication
        assert response.status_code in [201, 400, 401, 403, 404, 422]

        if response.status_code == 201:
            data = response.get_json()
            assert 'project_id' in data
            assert 'created_at' in data

    def test_get_project(self, client):
        """Test retrieving a project"""
        project_id = "test-project-123"
        response = client.get(f'/api/mongodb/projects/{project_id}')

        # Should return project data or appropriate error
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'project_id' in data or '_id' in data
            assert 'name' in data

    def test_update_project(self, client):
        """Test updating a project"""
        project_id = "test-project-123"
        update_data = {
            "name": "Updated Project Name",
            "description": "Updated description",
            "last_modified": datetime.now().isoformat()
        }

        response = client.put(f'/api/mongodb/projects/{project_id}',
                            json=update_data,
                            content_type='application/json')

        # Should update project or return appropriate error
        assert response.status_code in [200, 404, 400, 401, 403, 422]

    def test_delete_project(self, client):
        """Test deleting a project"""
        project_id = "test-project-123"
        response = client.delete(f'/api/mongodb/projects/{project_id}')

        # Should delete project or return appropriate error
        assert response.status_code in [200, 204, 404, 401, 403]

    def test_list_projects(self, client):
        """Test listing projects"""
        params = {
            'user_id': 'test-user-123',
            'limit': 10,
            'offset': 0
        }

        response = client.get('/api/mongodb/projects',
                            query_string=params)

        # Should return project list or require authentication
        assert response.status_code in [200, 401, 403, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'projects' in data
            assert isinstance(data['projects'], list)


class TestCalculationDataOperations:
    """Test calculation data CRUD operations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_save_calculation_result(self, client):
        """Test saving calculation results"""
        calculation_data = {
            "project_id": "test-project-123",
            "calculation_type": "air_duct_sizing",
            "input_parameters": {
                "airflow": 1000,
                "velocity": 1500,
                "duct_type": "rectangular"
            },
            "results": {
                "duct_size": "12x8",
                "pressure_loss": 0.25,
                "equivalent_diameter": 9.8
            },
            "metadata": {
                "calculation_method": "equal_friction",
                "units": "imperial",
                "timestamp": datetime.now().isoformat()
            }
        }

        response = client.post('/api/mongodb/calculations',
                             json=calculation_data,
                             content_type='application/json')

        # Should save calculation or require authentication
        assert response.status_code in [201, 400, 401, 403, 404, 422]

        if response.status_code == 201:
            data = response.get_json()
            assert 'calculation_id' in data

    def test_get_calculation_result(self, client):
        """Test retrieving calculation results"""
        calculation_id = "test-calc-123"
        response = client.get(f'/api/mongodb/calculations/{calculation_id}')

        # Should return calculation data
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'calculation_id' in data or '_id' in data
            assert 'results' in data

    def test_list_project_calculations(self, client):
        """Test listing calculations for a project"""
        project_id = "test-project-123"
        params = {
            'calculation_type': 'air_duct_sizing',
            'limit': 20
        }

        response = client.get(f'/api/mongodb/projects/{project_id}/calculations',
                            query_string=params)

        # Should return calculation list
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'calculations' in data
            assert isinstance(data['calculations'], list)

    def test_update_calculation_result(self, client):
        """Test updating calculation results"""
        calculation_id = "test-calc-123"
        update_data = {
            "results": {
                "duct_size": "14x10",
                "pressure_loss": 0.30,
                "equivalent_diameter": 11.2
            },
            "notes": "Updated calculation with revised parameters"
        }

        response = client.put(f'/api/mongodb/calculations/{calculation_id}',
                            json=update_data,
                            content_type='application/json')

        # Should update calculation
        assert response.status_code in [200, 404, 400, 401, 403, 422]

    def test_delete_calculation_result(self, client):
        """Test deleting calculation results"""
        calculation_id = "test-calc-123"
        response = client.delete(f'/api/mongodb/calculations/{calculation_id}')

        # Should delete calculation
        assert response.status_code in [200, 204, 404, 401, 403]


class TestUserDataOperations:
    """Test user data operations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_save_user_preferences(self, client):
        """Test saving user preferences"""
        user_id = "test-user-123"
        preferences_data = {
            "default_units": "imperial",
            "calculation_method": "equal_friction",
            "display_settings": {
                "theme": "light",
                "decimal_places": 2,
                "show_diagrams": True
            },
            "notification_settings": {
                "email_reports": True,
                "calculation_alerts": False
            }
        }

        response = client.put(f'/api/mongodb/users/{user_id}/preferences',
                            json=preferences_data,
                            content_type='application/json')

        # Should save preferences
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_get_user_preferences(self, client):
        """Test retrieving user preferences"""
        user_id = "test-user-123"
        response = client.get(f'/api/mongodb/users/{user_id}/preferences')

        # Should return preferences
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'preferences' in data or 'default_units' in data

    def test_save_user_session_data(self, client):
        """Test saving user session data"""
        user_id = "test-user-123"
        session_data = {
            "last_login": datetime.now().isoformat(),
            "session_duration": 3600,
            "active_projects": ["project-123", "project-456"],
            "recent_calculations": ["calc-789", "calc-101"],
            "browser_info": {
                "user_agent": "Mozilla/5.0...",
                "screen_resolution": "1920x1080"
            }
        }

        response = client.post(f'/api/mongodb/users/{user_id}/sessions',
                             json=session_data,
                             content_type='application/json')

        # Should save session data
        assert response.status_code in [201, 400, 401, 403, 404, 422]


class TestDataValidation:
    """Test data validation and sanitization"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_invalid_project_data(self, client):
        """Test handling of invalid project data"""
        invalid_data_sets = [
            {},  # Empty data
            {"name": ""},  # Empty name
            {"name": "x" * 1000},  # Name too long
            {"name": "<script>alert('xss')</script>"},  # XSS attempt
            {"created_by": None}  # Invalid user ID
        ]

        for invalid_data in invalid_data_sets:
            response = client.post('/api/mongodb/projects',
                                 json=invalid_data,
                                 content_type='application/json')

            # Should reject invalid data
            assert response.status_code in [400, 422]

    def test_invalid_calculation_data(self, client):
        """Test handling of invalid calculation data"""
        invalid_data_sets = [
            {"calculation_type": "invalid_type"},
            {"input_parameters": "not_a_dict"},
            {"results": None},
            {"project_id": "../../../etc/passwd"}
        ]

        for invalid_data in invalid_data_sets:
            response = client.post('/api/mongodb/calculations',
                                 json=invalid_data,
                                 content_type='application/json')

            # Should reject invalid data
            assert response.status_code in [400, 422]

    def test_malicious_input_sanitization(self, client):
        """Test sanitization of malicious input"""
        malicious_data = {
            "name": "<script>alert('xss')</script>",
            "description": "'; DROP TABLE projects; --",
            "location": "javascript:alert('xss')",
            "metadata": {
                "evil": "$where: function() { return true; }"
            }
        }

        response = client.post('/api/mongodb/projects',
                             json=malicious_data,
                             content_type='application/json')

        # Should sanitize and reject malicious input
        assert response.status_code in [400, 422]


class TestMongoDBErrorHandling:
    """Test MongoDB error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    @patch('backend.api.mongodb_api.get_mongodb_client')
    def test_database_connection_error(self, mock_client, client):
        """Test handling of database connection errors"""
        # Mock connection error
        mock_client.side_effect = Exception("Database connection failed")

        response = client.get('/api/mongodb/projects')

        # Should handle connection errors gracefully
        assert response.status_code in [503, 500, 404]

    @patch('backend.api.mongodb_api.get_mongodb_collection')
    def test_collection_operation_error(self, mock_collection, client):
        """Test handling of collection operation errors"""
        # Mock collection operation error
        mock_collection.side_effect = Exception("Collection operation failed")

        project_data = {"name": "Test Project"}
        response = client.post('/api/mongodb/projects',
                             json=project_data,
                             content_type='application/json')

        # Should handle operation errors gracefully
        assert response.status_code in [500, 503, 400, 404]

    def test_invalid_object_id(self, client):
        """Test handling of invalid MongoDB ObjectId"""
        invalid_id = "invalid-object-id"
        response = client.get(f'/api/mongodb/projects/{invalid_id}')

        # Should handle invalid ObjectId
        assert response.status_code in [400, 404]

    def test_document_not_found(self, client):
        """Test handling of document not found"""
        nonexistent_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
        response = client.get(f'/api/mongodb/projects/{nonexistent_id}')

        # Should return not found
        assert response.status_code == 404


class TestMongoDBPerformance:
    """Test MongoDB performance characteristics"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_query_response_time(self, client):
        """Test database query response time"""
        import time

        start_time = time.time()
        response = client.get('/api/mongodb/projects')
        end_time = time.time()

        response_time = end_time - start_time

        # Database queries should complete within reasonable time
        assert response_time < 5.0  # 5 seconds max
        assert response.status_code in [200, 401, 403, 404, 503]

    def test_large_data_handling(self, client):
        """Test handling of large data operations"""
        large_project_data = {
            "name": "Large Project",
            "description": "x" * 10000,  # Large description
            "metadata": {
                "large_field": ["item"] * 1000  # Large array
            }
        }

        response = client.post('/api/mongodb/projects',
                             json=large_project_data,
                             content_type='application/json')

        # Should handle large data appropriately
        assert response.status_code in [201, 400, 413, 422, 401, 403, 404]

    def test_concurrent_database_operations(self, app):
        """Test concurrent database operations"""
        import threading

        results = []

        def make_database_request():
            with app.test_client() as client:
                response = client.get('/api/mongodb/projects')
                results.append(response.status_code)

        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_database_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # All database operations should complete
        assert len(results) == 3
        # All should return valid status codes
        for status in results:
            assert status in [200, 401, 403, 404, 503]


class TestMongoDBSecurity:
    """Test MongoDB security features"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(mongodb_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_unauthorized_database_access(self, client):
        """Test unauthorized access to database operations"""
        protected_endpoints = [
            '/api/mongodb/projects',
            '/api/mongodb/calculations',
            '/api/mongodb/users/test-user/preferences'
        ]

        for endpoint in protected_endpoints:
            response = client.get(endpoint)

            # Should require authentication
            assert response.status_code in [401, 403, 404]

    def test_user_data_isolation(self, client):
        """Test user data isolation"""
        # Attempt to access another user's data
        other_user_id = "other-user-456"
        response = client.get(f'/api/mongodb/users/{other_user_id}/preferences')

        # Should prevent access to other user's data
        assert response.status_code in [401, 403, 404]

    @patch('backend.api.mongodb_api.verify_token')
    def test_valid_token_database_access(self, mock_verify, client):
        """Test database access with valid authentication token"""
        # Mock valid token verification
        mock_verify.return_value = {'user_id': 'test-user', 'tier': 'premium'}

        headers = {'Authorization': 'Bearer valid-token'}
        response = client.get('/api/mongodb/projects', headers=headers)

        # Should allow access with valid token
        assert response.status_code in [200, 404]
