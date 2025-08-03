"""
Flask Integration for SizeWise Suite Monitoring Dashboard

Provides Flask routes and middleware for the comprehensive operational metrics dashboard.
Integrates with existing monitoring infrastructure to provide real-time dashboard data.
"""

import asyncio
import json
from datetime import datetime
from flask import Blueprint, jsonify, request, Response
from flask_cors import cross_origin
import structlog

from .MetricsCollector import get_metrics_collector, initialize_metrics_collector
from .PerformanceDashboard import get_performance_dashboard, initialize_performance_dashboard
from .HealthMonitor import get_health_monitor, initialize_health_monitor
from .ErrorTracker import get_error_tracker, initialize_error_tracker
from .AlertingManager import AlertingManager
from .CentralizedLogger import CentralizedLogger
from .hvac_metrics_collector import get_hvac_metrics_collector, initialize_hvac_metrics_collector
from .incident_response import get_incident_response_manager, initialize_incident_response_manager
from .incident_response_routes import incident_bp
from .sla_monitoring import get_sla_monitoring_manager, initialize_sla_monitoring_manager
from .sla_routes import sla_bp
from .disaster_recovery import get_disaster_recovery_manager, initialize_disaster_recovery_manager
from .disaster_recovery_routes import dr_bp

logger = structlog.get_logger()

# Create monitoring blueprint
monitoring_bp = Blueprint('monitoring', __name__, url_prefix='/api/monitoring')

# Global monitoring components
_monitoring_initialized = False
_metrics_collector = None
_performance_dashboard = None
_health_monitor = None
_error_tracker = None
_alerting_manager = None
_centralized_logger = None
_hvac_metrics_collector = None
_incident_response_manager = None
_sla_monitoring_manager = None
_disaster_recovery_manager = None


async def initialize_monitoring_components():
    """Initialize all monitoring components."""
    global _monitoring_initialized, _metrics_collector, _performance_dashboard
    global _health_monitor, _error_tracker, _alerting_manager, _centralized_logger, _hvac_metrics_collector
    global _incident_response_manager, _sla_monitoring_manager, _disaster_recovery_manager
    
    if _monitoring_initialized:
        return
    
    try:
        logger.info("Initializing monitoring components...")
        
        # Initialize core components
        _metrics_collector = initialize_metrics_collector()
        _performance_dashboard = initialize_performance_dashboard()
        _health_monitor = initialize_health_monitor()
        _error_tracker = initialize_error_tracker()
        _hvac_metrics_collector = initialize_hvac_metrics_collector()
        _incident_response_manager = initialize_incident_response_manager()
        _sla_monitoring_manager = initialize_sla_monitoring_manager()
        _disaster_recovery_manager = initialize_disaster_recovery_manager()

        # Initialize async components
        await _metrics_collector.initialize()
        await _performance_dashboard.initialize()
        await _health_monitor.initialize()
        await _error_tracker.initialize()
        await _hvac_metrics_collector.initialize()
        await _incident_response_manager.initialize()
        await _sla_monitoring_manager.initialize()
        await _disaster_recovery_manager.initialize()

        # Initialize alerting manager
        try:
            from .alerting_config import load_alerting_config
            alerting_config = load_alerting_config()
            _alerting_manager = AlertingManager(alerting_config)
            await _alerting_manager.initialize()
            logger.info("Alerting manager initialized successfully")
        except Exception as e:
            logger.warning("Failed to initialize alerting manager", error=str(e))
        
        # Initialize centralized logger
        try:
            from .log_aggregation_config import load_log_aggregation_config
            log_config = load_log_aggregation_config()
            _centralized_logger = CentralizedLogger(log_config)
            await _centralized_logger.initialize()
            logger.info("Centralized logger initialized successfully")
        except Exception as e:
            logger.warning("Failed to initialize centralized logger", error=str(e))
        
        _monitoring_initialized = True
        logger.info("All monitoring components initialized successfully")
        
    except Exception as e:
        logger.error("Failed to initialize monitoring components", error=str(e))
        raise


def init_monitoring(app):
    """Initialize monitoring with Flask application."""

    # Initialize monitoring components immediately
    try:
        # Run async initialization in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(initialize_monitoring_components())
        loop.close()

        logger.info("Production monitoring initialized successfully")

    except Exception as e:
        logger.error("Failed to initialize monitoring", error=str(e))

    # Register monitoring blueprints
    app.register_blueprint(monitoring_bp)
    app.register_blueprint(incident_bp, url_prefix='/api/monitoring')
    app.register_blueprint(sla_bp, url_prefix='/api/monitoring')
    app.register_blueprint(dr_bp, url_prefix='/api/monitoring')

    logger.info("Monitoring Flask integration initialized")


# =============================================================================
# Dashboard API Routes
# =============================================================================

@monitoring_bp.route('/dashboard', methods=['GET'])
@cross_origin()
def dashboard_overview():
    """Get complete dashboard overview with all widgets."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        overview = loop.run_until_complete(_performance_dashboard.get_dashboard_overview())
        loop.close()
        
        return jsonify(overview)
        
    except Exception as e:
        logger.error("Failed to get dashboard overview", error=str(e))
        return jsonify({'error': 'Failed to load dashboard'}), 500


@monitoring_bp.route('/dashboard/widget/<widget_id>', methods=['GET'])
@cross_origin()
def get_widget_data(widget_id):
    """Get data for a specific dashboard widget."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        widget_data = loop.run_until_complete(_performance_dashboard.get_widget_data(widget_id))
        loop.close()
        
        return jsonify(widget_data)
        
    except Exception as e:
        logger.error("Failed to get widget data", error=str(e), widget_id=widget_id)
        return jsonify({'error': f'Failed to load widget {widget_id}'}), 500


@monitoring_bp.route('/dashboard/widgets', methods=['GET'])
@cross_origin()
def list_dashboard_widgets():
    """List all available dashboard widgets."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        widgets = {}
        for widget_id, widget in _performance_dashboard.widgets.items():
            widgets[widget_id] = {
                'widget_id': widget.widget_id,
                'title': widget.title,
                'chart_type': widget.chart_type.value,
                'data_source': widget.data_source,
                'refresh_interval_seconds': widget.refresh_interval_seconds,
                'time_range': widget.time_range.value,
                'config': widget.config
            }
        
        return jsonify({
            'widgets': widgets,
            'total_count': len(widgets)
        })
        
    except Exception as e:
        logger.error("Failed to list dashboard widgets", error=str(e))
        return jsonify({'error': 'Failed to load widgets'}), 500


# =============================================================================
# Health Monitoring Routes
# =============================================================================

@monitoring_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Get overall system health status."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        health = loop.run_until_complete(_health_monitor.get_overall_health())
        loop.close()
        
        return jsonify(health)
        
    except Exception as e:
        logger.error("Failed to get health status", error=str(e))
        return jsonify({'error': 'Failed to get health status'}), 500


@monitoring_bp.route('/health/checks', methods=['GET'])
@cross_origin()
def list_health_checks():
    """List all health checks and their current status."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        checks = loop.run_until_complete(_health_monitor.get_all_health_checks())
        loop.close()
        
        return jsonify(checks)
        
    except Exception as e:
        logger.error("Failed to get health checks", error=str(e))
        return jsonify({'error': 'Failed to get health checks'}), 500


# =============================================================================
# Metrics Routes
# =============================================================================

@monitoring_bp.route('/metrics', methods=['GET'])
def prometheus_metrics():
    """Prometheus-compatible metrics endpoint."""
    try:
        if not _monitoring_initialized:
            return Response('# Monitoring not initialized\n', mimetype='text/plain'), 503
        
        prometheus_metrics = _metrics_collector.get_prometheus_metrics()
        return Response(prometheus_metrics, mimetype='text/plain')
        
    except Exception as e:
        logger.error("Failed to get Prometheus metrics", error=str(e))
        return Response('# Error getting metrics\n', mimetype='text/plain'), 500


@monitoring_bp.route('/metrics/summary', methods=['GET'])
@cross_origin()
def metrics_summary():
    """Get metrics summary in JSON format."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        summary = loop.run_until_complete(_metrics_collector.get_metrics_summary())
        loop.close()
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error("Failed to get metrics summary", error=str(e))
        return jsonify({'error': 'Failed to get metrics summary'}), 500


# =============================================================================
# Error Tracking Routes
# =============================================================================

@monitoring_bp.route('/errors', methods=['GET'])
@cross_origin()
def error_summary():
    """Get error tracking summary."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        summary = loop.run_until_complete(_error_tracker.get_error_summary())
        loop.close()
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error("Failed to get error summary", error=str(e))
        return jsonify({'error': 'Failed to get error summary'}), 500


@monitoring_bp.route('/errors/groups', methods=['GET'])
@cross_origin()
def error_groups():
    """Get error groups with details."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        groups = loop.run_until_complete(_error_tracker.get_error_groups())
        loop.close()
        
        return jsonify(groups)
        
    except Exception as e:
        logger.error("Failed to get error groups", error=str(e))
        return jsonify({'error': 'Failed to get error groups'}), 500


# =============================================================================
# HVAC-Specific Monitoring Routes
# =============================================================================

@monitoring_bp.route('/hvac/calculations', methods=['GET'])
@cross_origin()
def hvac_calculation_metrics():
    """Get HVAC calculation performance metrics."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503

        # Get HVAC-specific metrics from both dashboard and HVAC collector
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Get dashboard widgets
        hvac_widgets = ['hvac_calculations', 'hvac_performance']
        hvac_data = {}

        for widget_id in hvac_widgets:
            widget_data = loop.run_until_complete(_performance_dashboard.get_widget_data(widget_id))
            hvac_data[widget_id] = widget_data

        # Get detailed HVAC metrics
        hvac_summary = loop.run_until_complete(_hvac_metrics_collector.get_hvac_performance_summary())
        calculation_trends = loop.run_until_complete(_hvac_metrics_collector.get_calculation_trends(24))

        loop.close()

        return jsonify({
            'timestamp': datetime.utcnow().isoformat(),
            'hvac_metrics': hvac_data,
            'hvac_performance_summary': hvac_summary,
            'calculation_trends': calculation_trends
        })

    except Exception as e:
        logger.error("Failed to get HVAC calculation metrics", error=str(e))
        return jsonify({'error': 'Failed to get HVAC metrics'}), 500


@monitoring_bp.route('/hvac/sync', methods=['GET'])
@cross_origin()
def hvac_sync_metrics():
    """Get HVAC offline sync performance metrics."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503

        # Get sync performance data from HVAC collector
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        hvac_summary = loop.run_until_complete(_hvac_metrics_collector.get_hvac_performance_summary())

        loop.close()

        sync_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'sync_performance': hvac_summary.get('sync_performance', {}),
            'active_syncs': hvac_summary.get('active_operations', {}).get('syncs', 0)
        }

        return jsonify(sync_data)

    except Exception as e:
        logger.error("Failed to get HVAC sync metrics", error=str(e))
        return jsonify({'error': 'Failed to get HVAC sync metrics'}), 500


@monitoring_bp.route('/hvac/engagement', methods=['GET'])
@cross_origin()
def hvac_user_engagement():
    """Get HVAC user engagement metrics."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503

        # Get user engagement data from HVAC collector
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        hvac_summary = loop.run_until_complete(_hvac_metrics_collector.get_hvac_performance_summary())

        loop.close()

        engagement_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_engagement': hvac_summary.get('user_engagement', {}),
            'active_sessions': hvac_summary.get('active_operations', {}).get('sessions', 0)
        }

        return jsonify(engagement_data)

    except Exception as e:
        logger.error("Failed to get HVAC user engagement", error=str(e))
        return jsonify({'error': 'Failed to get HVAC user engagement'}), 500


@monitoring_bp.route('/system/overview', methods=['GET'])
@cross_origin()
def system_overview():
    """Get system overview with key performance indicators."""
    try:
        if not _monitoring_initialized:
            return jsonify({'error': 'Monitoring not initialized'}), 503
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Get key system metrics
        health = loop.run_until_complete(_health_monitor.get_overall_health())
        metrics_summary = loop.run_until_complete(_metrics_collector.get_metrics_summary())
        error_summary = loop.run_until_complete(_error_tracker.get_error_summary())
        
        # Get key dashboard widgets
        key_widgets = ['system_cpu', 'system_memory', 'response_times', 'error_rate']
        widget_data = {}
        
        for widget_id in key_widgets:
            widget_data[widget_id] = loop.run_until_complete(_performance_dashboard.get_widget_data(widget_id))
        
        loop.close()
        
        overview = {
            'timestamp': datetime.utcnow().isoformat(),
            'system_health': health,
            'metrics_summary': metrics_summary,
            'error_summary': error_summary,
            'key_metrics': widget_data
        }
        
        return jsonify(overview)
        
    except Exception as e:
        logger.error("Failed to get system overview", error=str(e))
        return jsonify({'error': 'Failed to get system overview'}), 500


# =============================================================================
# Utility Routes
# =============================================================================

@monitoring_bp.route('/status', methods=['GET'])
@cross_origin()
def monitoring_status():
    """Get monitoring system status."""
    try:
        status = {
            'monitoring_initialized': _monitoring_initialized,
            'components': {
                'metrics_collector': _metrics_collector is not None,
                'performance_dashboard': _performance_dashboard is not None,
                'health_monitor': _health_monitor is not None,
                'error_tracker': _error_tracker is not None,
                'alerting_manager': _alerting_manager is not None,
                'centralized_logger': _centralized_logger is not None,
                'hvac_metrics_collector': _hvac_metrics_collector is not None
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(status)
        
    except Exception as e:
        logger.error("Failed to get monitoring status", error=str(e))
        return jsonify({'error': 'Failed to get monitoring status'}), 500
