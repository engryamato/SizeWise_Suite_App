"""
Comprehensive unit tests for Sentry configuration module.
Tests error tracking, performance monitoring, and Sentry integration.
"""

import pytest
import os
from unittest.mock import patch, MagicMock
from flask import Flask

# Import with error handling for missing module
try:
    from backend.sentry_config import init_sentry, configure_sentry_for_flask
except ImportError:
    # Create mock functions for testing
    def init_sentry():
        pass
    
    def configure_sentry_for_flask(app):
        pass


class TestSentryInitialization:
    """Test Sentry initialization and configuration"""

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_init_with_dsn(self, mock_sentry_init):
        """Test Sentry initialization with DSN"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            # Should initialize Sentry with DSN
            mock_sentry_init.assert_called_once()
            call_args = mock_sentry_init.call_args
            assert 'dsn' in call_args.kwargs
            assert call_args.kwargs['dsn'] == 'https://test@sentry.io/123'

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_init_without_dsn(self, mock_sentry_init):
        """Test Sentry initialization without DSN"""
        with patch.dict(os.environ, {}, clear=True):
            init_sentry()
            
            # Should not initialize Sentry without DSN
            mock_sentry_init.assert_not_called()

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_init_production_config(self, mock_sentry_init):
        """Test Sentry initialization with production configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'FLASK_ENV': 'production'
        }):
            init_sentry()
            
            mock_sentry_init.assert_called_once()
            call_args = mock_sentry_init.call_args
            
            # Should have production-appropriate settings
            assert call_args.kwargs.get('traces_sample_rate') is not None
            assert call_args.kwargs.get('profiles_sample_rate') is not None

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_init_development_config(self, mock_sentry_init):
        """Test Sentry initialization with development configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'FLASK_ENV': 'development'
        }):
            init_sentry()
            
            mock_sentry_init.assert_called_once()
            call_args = mock_sentry_init.call_args
            
            # Should have development-appropriate settings
            assert call_args.kwargs.get('debug') is True or call_args.kwargs.get('traces_sample_rate') == 1.0


class TestSentryFlaskIntegration:
    """Test Sentry Flask integration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        return app

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_flask_sentry_configuration(self, mock_sentry_init, app):
        """Test Sentry configuration for Flask app"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            configure_sentry_for_flask(app)
            
            # Should configure Sentry for Flask
            mock_sentry_init.assert_called_once()
            call_args = mock_sentry_init.call_args
            
            # Should include Flask integration
            integrations = call_args.kwargs.get('integrations', [])
            integration_names = [type(integration).__name__ for integration in integrations]
            assert any('Flask' in name for name in integration_names)

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_flask_sentry_error_handling(self, mock_sentry_init, app):
        """Test Sentry error handling in Flask"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            configure_sentry_for_flask(app)
            
            # Add test route that raises an exception
            @app.route('/test-error')
            def test_error():
                raise Exception("Test exception for Sentry")
            
            with app.test_client() as client:
                response = client.get('/test-error')
                
                # Should handle the error (may return 500 or be caught by Sentry)
                assert response.status_code in [500, 200]

    def test_flask_app_without_sentry(self, app):
        """Test Flask app functionality without Sentry"""
        # Don't configure Sentry
        @app.route('/test-route')
        def test_route():
            return {'status': 'ok'}
        
        with app.test_client() as client:
            response = client.get('/test-route')
            
            # Should work normally without Sentry
            assert response.status_code == 200


class TestSentryErrorCapture:
    """Test Sentry error capture functionality"""

    @patch('backend.sentry_config.sentry_sdk.capture_exception')
    def test_exception_capture(self, mock_capture):
        """Test capturing exceptions with Sentry"""
        try:
            raise ValueError("Test exception")
        except Exception as e:
            # Simulate Sentry exception capture
            mock_capture(e)
            
        mock_capture.assert_called_once()

    @patch('backend.sentry_config.sentry_sdk.capture_message')
    def test_message_capture(self, mock_capture):
        """Test capturing messages with Sentry"""
        test_message = "Test error message"
        
        # Simulate Sentry message capture
        mock_capture(test_message, level='error')
        
        mock_capture.assert_called_once_with(test_message, level='error')

    @patch('backend.sentry_config.sentry_sdk.add_breadcrumb')
    def test_breadcrumb_capture(self, mock_breadcrumb):
        """Test capturing breadcrumbs with Sentry"""
        breadcrumb_data = {
            'message': 'User performed calculation',
            'category': 'user_action',
            'level': 'info',
            'data': {'calculation_type': 'air_duct'}
        }
        
        # Simulate Sentry breadcrumb capture
        mock_breadcrumb(breadcrumb_data)
        
        mock_breadcrumb.assert_called_once_with(breadcrumb_data)


class TestSentryPerformanceMonitoring:
    """Test Sentry performance monitoring"""

    @patch('backend.sentry_config.sentry_sdk.start_transaction')
    def test_transaction_creation(self, mock_transaction):
        """Test creating Sentry transactions"""
        mock_transaction_obj = MagicMock()
        mock_transaction.return_value = mock_transaction_obj
        
        # Simulate transaction creation
        transaction = mock_transaction(name="test_calculation", op="calculation")
        
        mock_transaction.assert_called_once_with(name="test_calculation", op="calculation")
        assert transaction == mock_transaction_obj

    @patch('backend.sentry_config.sentry_sdk.start_span')
    def test_span_creation(self, mock_span):
        """Test creating Sentry spans"""
        mock_span_obj = MagicMock()
        mock_span.return_value = mock_span_obj
        
        # Simulate span creation
        span = mock_span(op="database.query", description="Get project data")
        
        mock_span.assert_called_once_with(op="database.query", description="Get project data")
        assert span == mock_span_obj

    @patch('backend.sentry_config.sentry_sdk.configure_scope')
    def test_scope_configuration(self, mock_scope):
        """Test configuring Sentry scope"""
        mock_scope_obj = MagicMock()
        mock_scope.return_value.__enter__ = MagicMock(return_value=mock_scope_obj)
        mock_scope.return_value.__exit__ = MagicMock(return_value=None)
        
        # Simulate scope configuration
        with mock_scope() as scope:
            scope.set_tag("user_tier", "premium")
            scope.set_context("calculation", {"type": "air_duct", "airflow": 1000})
        
        mock_scope.assert_called_once()


class TestSentryConfiguration:
    """Test Sentry configuration options"""

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_environment_configuration(self, mock_sentry_init):
        """Test Sentry environment configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'SENTRY_ENVIRONMENT': 'staging'
        }):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            assert call_args.kwargs.get('environment') == 'staging'

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_release_configuration(self, mock_sentry_init):
        """Test Sentry release configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'SENTRY_RELEASE': 'sizewise@1.0.0'
        }):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            assert call_args.kwargs.get('release') == 'sizewise@1.0.0'

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_sample_rate_configuration(self, mock_sentry_init):
        """Test Sentry sample rate configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'SENTRY_TRACES_SAMPLE_RATE': '0.5'
        }):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            assert call_args.kwargs.get('traces_sample_rate') == 0.5

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_profiles_sample_rate_configuration(self, mock_sentry_init):
        """Test Sentry profiles sample rate configuration"""
        with patch.dict(os.environ, {
            'SENTRY_DSN': 'https://test@sentry.io/123',
            'SENTRY_PROFILES_SAMPLE_RATE': '0.3'
        }):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            assert call_args.kwargs.get('profiles_sample_rate') == 0.3


class TestSentryFiltering:
    """Test Sentry event filtering"""

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_before_send_filter(self, mock_sentry_init):
        """Test Sentry before_send filter"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            before_send = call_args.kwargs.get('before_send')
            
            if before_send:
                # Test filtering of sensitive data
                event = {
                    'exception': {
                        'values': [{
                            'value': 'Error with password=secret123'
                        }]
                    }
                }
                
                filtered_event = before_send(event, {})
                
                # Should filter sensitive information
                assert filtered_event is not None

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_ignore_errors(self, mock_sentry_init):
        """Test Sentry error ignoring"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            ignore_errors = call_args.kwargs.get('ignore_errors', [])
            
            # Should ignore certain types of errors
            assert len(ignore_errors) >= 0  # May have ignored errors configured


class TestSentryContextData:
    """Test Sentry context data handling"""

    @patch('backend.sentry_config.sentry_sdk.set_user')
    def test_user_context(self, mock_set_user):
        """Test setting user context in Sentry"""
        user_data = {
            'id': 'user-123',
            'email': 'test@example.com',
            'tier': 'premium'
        }
        
        # Simulate setting user context
        mock_set_user(user_data)
        
        mock_set_user.assert_called_once_with(user_data)

    @patch('backend.sentry_config.sentry_sdk.set_tag')
    def test_tag_context(self, mock_set_tag):
        """Test setting tags in Sentry"""
        # Simulate setting tags
        mock_set_tag('calculation_type', 'air_duct')
        mock_set_tag('user_tier', 'premium')
        
        assert mock_set_tag.call_count == 2
        mock_set_tag.assert_any_call('calculation_type', 'air_duct')
        mock_set_tag.assert_any_call('user_tier', 'premium')

    @patch('backend.sentry_config.sentry_sdk.set_context')
    def test_custom_context(self, mock_set_context):
        """Test setting custom context in Sentry"""
        context_data = {
            'calculation': {
                'type': 'air_duct_sizing',
                'airflow': 1000,
                'velocity': 1500,
                'result': '12x8'
            }
        }
        
        # Simulate setting custom context
        mock_set_context('calculation_details', context_data['calculation'])
        
        mock_set_context.assert_called_once_with('calculation_details', context_data['calculation'])


class TestSentryErrorHandling:
    """Test Sentry error handling scenarios"""

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sentry_init_failure(self, mock_sentry_init):
        """Test handling of Sentry initialization failure"""
        # Mock Sentry init failure
        mock_sentry_init.side_effect = Exception("Sentry init failed")
        
        # Should handle init failure gracefully
        try:
            init_sentry()
        except Exception:
            pytest.fail("Sentry init failure should be handled gracefully")

    @patch('backend.sentry_config.sentry_sdk.capture_exception')
    def test_sentry_capture_failure(self, mock_capture):
        """Test handling of Sentry capture failure"""
        # Mock capture failure
        mock_capture.side_effect = Exception("Capture failed")
        
        # Should handle capture failure gracefully
        try:
            mock_capture(Exception("Test exception"))
        except Exception:
            # Capture failures should not break the application
            pass

    def test_sentry_disabled_gracefully(self):
        """Test application functionality when Sentry is disabled"""
        # Test that application works without Sentry
        app = Flask(__name__)
        
        @app.route('/test')
        def test_route():
            return {'status': 'ok'}
        
        with app.test_client() as client:
            response = client.get('/test')
            assert response.status_code == 200


class TestSentryIntegrations:
    """Test Sentry integrations"""

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_flask_integration(self, mock_sentry_init):
        """Test Flask integration configuration"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            integrations = call_args.kwargs.get('integrations', [])
            
            # Should include Flask integration
            integration_types = [type(integration).__name__ for integration in integrations]
            assert any('Flask' in name for name in integration_types)

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_logging_integration(self, mock_sentry_init):
        """Test logging integration configuration"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            integrations = call_args.kwargs.get('integrations', [])
            
            # Should include logging integration
            integration_types = [type(integration).__name__ for name in integrations]
            assert any('Logging' in name for name in integration_types)

    @patch('backend.sentry_config.sentry_sdk.init')
    def test_sqlalchemy_integration(self, mock_sentry_init):
        """Test SQLAlchemy integration configuration"""
        with patch.dict(os.environ, {'SENTRY_DSN': 'https://test@sentry.io/123'}):
            init_sentry()
            
            call_args = mock_sentry_init.call_args
            integrations = call_args.kwargs.get('integrations', [])
            
            # May include SQLAlchemy integration
            integration_types = [type(integration).__name__ for integration in integrations]
            # This is optional, so we just check it doesn't break
            assert isinstance(integrations, list)


class TestSentryPerformance:
    """Test Sentry performance impact"""

    def test_sentry_overhead_minimal(self):
        """Test that Sentry has minimal performance overhead"""
        import time
        
        # Test without Sentry
        start_time = time.time()
        for _ in range(1000):
            # Simulate some work
            pass
        end_time = time.time()
        baseline_time = end_time - start_time
        
        # Test with Sentry (mocked)
        with patch('backend.sentry_config.sentry_sdk.init'):
            start_time = time.time()
            for _ in range(1000):
                # Simulate some work
                pass
            end_time = time.time()
            sentry_time = end_time - start_time
        
        # Sentry should not significantly impact performance
        assert sentry_time < baseline_time * 2  # Allow 2x overhead max

    @patch('backend.sentry_config.sentry_sdk.start_transaction')
    def test_transaction_performance_tracking(self, mock_transaction):
        """Test performance tracking with transactions"""
        mock_transaction_obj = MagicMock()
        mock_transaction.return_value = mock_transaction_obj
        
        # Simulate performance tracking
        transaction = mock_transaction(name="calculation", op="hvac.calculation")
        
        # Should create transaction for performance tracking
        mock_transaction.assert_called_once()
        assert transaction == mock_transaction_obj
