"""
SizeWise Suite - SLA Monitoring API Routes

This module provides Flask API routes for SLA monitoring, reporting, and management.
Includes endpoints for real-time SLA status, historical reports, breach management,
and configuration.

Features:
- Real-time SLA status endpoints
- Historical SLA reporting
- SLA breach management
- Target configuration
- Automated report generation
- Performance analytics

Designed for production monitoring and SLA compliance tracking.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import structlog

from .sla_monitoring import (
    get_sla_monitoring_manager,
    SLAMetricType,
    SLAStatus
)

logger = structlog.get_logger()

# Create SLA monitoring blueprint
sla_bp = Blueprint('sla_monitoring', __name__)

@sla_bp.route('/sla/status', methods=['GET'])
@cross_origin()
def get_sla_status():
    """Get current SLA status for all metrics."""
    try:
        manager = get_sla_monitoring_manager()
        status = manager.get_current_sla_status()
        
        return jsonify({
            'success': True,
            'data': status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error("Failed to get SLA status", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@sla_bp.route('/sla/metrics/<metric_type>/record', methods=['POST'])
@cross_origin()
def record_sla_measurement(metric_type: str):
    """Record a new SLA measurement."""
    try:
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: value'
            }), 400
        
        # Validate metric type
        try:
            metric_enum = SLAMetricType(metric_type)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid metric type: {metric_type}'
            }), 400
        
        manager = get_sla_monitoring_manager()
        
        # Record measurement (async call in sync context)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            measurement = loop.run_until_complete(
                manager.record_measurement(
                    metric_type=metric_enum,
                    value=float(data['value']),
                    metadata=data.get('metadata', {})
                )
            )
        finally:
            loop.close()
        
        return jsonify({
            'success': True,
            'data': {
                'metric_type': measurement.metric_type.value,
                'value': measurement.value,
                'status': measurement.status.value,
                'timestamp': measurement.timestamp.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error("Failed to record SLA measurement", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/reports/generate', methods=['POST'])
@cross_origin()
def generate_sla_report():
    """Generate SLA compliance report for specified period."""
    try:
        data = request.get_json() or {}
        
        # Parse date parameters
        end_date = datetime.utcnow()
        if 'end_date' in data:
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
        # Default to last 24 hours
        period_hours = data.get('period_hours', 24)
        start_date = end_date - timedelta(hours=period_hours)
        
        if 'start_date' in data:
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        
        report_type = data.get('report_type', 'comprehensive')
        
        manager = get_sla_monitoring_manager()
        
        # Generate report (async call in sync context)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            report = loop.run_until_complete(
                manager.generate_sla_report(start_date, end_date, report_type)
            )
        finally:
            loop.close()
        
        return jsonify({
            'success': True,
            'data': {
                'report_id': report.report_id,
                'period_start': report.period_start.isoformat(),
                'period_end': report.period_end.isoformat(),
                'overall_compliance': report.overall_compliance,
                'metric_compliance': {
                    k.value: v for k, v in report.metric_compliance.items()
                },
                'total_breaches': report.total_breaches,
                'breach_summary': report.breach_summary,
                'recommendations': report.recommendations,
                'generated_at': report.generated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to generate SLA report", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/reports/<report_id>', methods=['GET'])
@cross_origin()
def get_sla_report(report_id: str):
    """Get specific SLA report by ID."""
    try:
        manager = get_sla_monitoring_manager()
        
        if report_id not in manager.reports:
            return jsonify({
                'success': False,
                'error': 'Report not found'
            }), 404
        
        report = manager.reports[report_id]
        
        return jsonify({
            'success': True,
            'data': {
                'report_id': report.report_id,
                'period_start': report.period_start.isoformat(),
                'period_end': report.period_end.isoformat(),
                'overall_compliance': report.overall_compliance,
                'metric_compliance': {
                    k.value: v for k, v in report.metric_compliance.items()
                },
                'total_breaches': report.total_breaches,
                'breach_summary': report.breach_summary,
                'recommendations': report.recommendations,
                'generated_at': report.generated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to get SLA report", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/reports', methods=['GET'])
@cross_origin()
def list_sla_reports():
    """List all available SLA reports."""
    try:
        manager = get_sla_monitoring_manager()
        
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        reports = list(manager.reports.values())
        reports.sort(key=lambda x: x.generated_at, reverse=True)
        
        # Apply pagination
        paginated_reports = reports[offset:offset + limit]
        
        report_summaries = [
            {
                'report_id': report.report_id,
                'period_start': report.period_start.isoformat(),
                'period_end': report.period_end.isoformat(),
                'overall_compliance': report.overall_compliance,
                'total_breaches': report.total_breaches,
                'generated_at': report.generated_at.isoformat()
            }
            for report in paginated_reports
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'reports': report_summaries,
                'total_count': len(reports),
                'limit': limit,
                'offset': offset
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to list SLA reports", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/breaches', methods=['GET'])
@cross_origin()
def get_sla_breaches():
    """Get SLA breaches with optional filtering."""
    try:
        manager = get_sla_monitoring_manager()
        
        # Get query parameters
        status = request.args.get('status')  # 'active', 'resolved', 'all'
        severity = request.args.get('severity')  # 'CRITICAL', 'HIGH', 'MEDIUM'
        metric_type = request.args.get('metric_type')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        breaches = list(manager.breaches.values())
        
        # Apply filters
        if status == 'active':
            breaches = [b for b in breaches if b.breach_end is None]
        elif status == 'resolved':
            breaches = [b for b in breaches if b.breach_end is not None]
        
        if severity:
            breaches = [b for b in breaches if b.severity == severity]
        
        if metric_type:
            try:
                metric_enum = SLAMetricType(metric_type)
                breaches = [b for b in breaches if b.metric_type == metric_enum]
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': f'Invalid metric type: {metric_type}'
                }), 400
        
        # Sort by breach start time (most recent first)
        breaches.sort(key=lambda x: x.breach_start, reverse=True)
        
        # Apply pagination
        paginated_breaches = breaches[offset:offset + limit]
        
        breach_data = [
            {
                'id': breach.id,
                'metric_type': breach.metric_type.value,
                'breach_start': breach.breach_start.isoformat(),
                'breach_end': breach.breach_end.isoformat() if breach.breach_end else None,
                'duration_minutes': breach.duration_minutes,
                'severity': breach.severity,
                'impact_description': breach.impact_description,
                'root_cause': breach.root_cause,
                'resolution_notes': breach.resolution_notes,
                'created_incident_id': breach.created_incident_id
            }
            for breach in paginated_breaches
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'breaches': breach_data,
                'total_count': len(breaches),
                'limit': limit,
                'offset': offset
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to get SLA breaches", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/targets', methods=['GET'])
@cross_origin()
def get_sla_targets():
    """Get current SLA targets configuration."""
    try:
        manager = get_sla_monitoring_manager()
        
        targets_data = {}
        for metric_type, target in manager.sla_targets.items():
            targets_data[metric_type.value] = {
                'target_value': target.target_value,
                'threshold_warning': target.threshold_warning,
                'threshold_breach': target.threshold_breach,
                'unit': target.unit,
                'measurement_window': target.measurement_window,
                'description': target.description
            }
        
        return jsonify({
            'success': True,
            'data': {
                'targets': targets_data,
                'monitoring_enabled': manager.monitoring_enabled,
                'measurement_interval': manager.measurement_interval
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to get SLA targets", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/analytics/compliance-trend', methods=['GET'])
@cross_origin()
def get_compliance_trend():
    """Get SLA compliance trend over time."""
    try:
        manager = get_sla_monitoring_manager()
        
        # Get query parameters
        hours = int(request.args.get('hours', 24))
        metric_type = request.args.get('metric_type')
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Filter measurements
        measurements = [
            m for m in manager.measurements
            if start_time <= m.timestamp <= end_time
        ]
        
        if metric_type:
            try:
                metric_enum = SLAMetricType(metric_type)
                measurements = [m for m in measurements if m.metric_type == metric_enum]
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': f'Invalid metric type: {metric_type}'
                }), 400
        
        # Group by hour and calculate compliance
        trend_data = []
        current_time = start_time
        while current_time < end_time:
            hour_end = current_time + timedelta(hours=1)
            hour_measurements = [
                m for m in measurements
                if current_time <= m.timestamp < hour_end
            ]
            
            if hour_measurements:
                compliant_count = len([
                    m for m in hour_measurements
                    if m.status == SLAStatus.COMPLIANT
                ])
                compliance_rate = (compliant_count / len(hour_measurements)) * 100
            else:
                compliance_rate = None
            
            trend_data.append({
                'timestamp': current_time.isoformat(),
                'compliance_rate': compliance_rate,
                'measurement_count': len(hour_measurements)
            })
            
            current_time = hour_end
        
        return jsonify({
            'success': True,
            'data': {
                'trend': trend_data,
                'period_start': start_time.isoformat(),
                'period_end': end_time.isoformat(),
                'metric_type': metric_type
            }
        }), 200
        
    except Exception as e:
        logger.error("Failed to get compliance trend", error=str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@sla_bp.route('/sla/health', methods=['GET'])
@cross_origin()
def sla_health_check():
    """Health check endpoint for SLA monitoring system."""
    try:
        manager = get_sla_monitoring_manager()
        
        # Check system health
        health_status = {
            'monitoring_enabled': manager.monitoring_enabled,
            'targets_configured': len(manager.sla_targets),
            'total_measurements': len(manager.measurements),
            'active_breaches': len([
                b for b in manager.breaches.values()
                if b.breach_end is None
            ]),
            'total_reports': len(manager.reports),
            'last_measurement': None
        }
        
        # Get last measurement timestamp
        if manager.measurements:
            latest_measurement = max(manager.measurements, key=lambda x: x.timestamp)
            health_status['last_measurement'] = latest_measurement.timestamp.isoformat()
        
        # Determine overall health
        if health_status['monitoring_enabled'] and health_status['targets_configured'] > 0:
            overall_health = 'healthy'
        else:
            overall_health = 'unhealthy'
        
        return jsonify({
            'success': True,
            'health': overall_health,
            'data': health_status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error("SLA health check failed", error=str(e))
        return jsonify({
            'success': False,
            'health': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500
