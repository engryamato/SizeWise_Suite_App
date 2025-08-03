"""
SizeWise Suite - Incident Response Flask Routes

This module provides Flask routes for incident response management,
including incident creation, status updates, escalation, and reporting.

Features:
- RESTful API for incident management
- Automated incident creation from monitoring alerts
- Incident status tracking and updates
- Escalation management
- SLA monitoring and reporting
- Incident summary and analytics

Designed for integration with monitoring and alerting systems.
"""

import asyncio
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime
import structlog

from .incident_response import (
    get_incident_response_manager,
    IncidentSeverity,
    IncidentStatus,
    IncidentCategory
)

logger = structlog.get_logger()

# Create incident response blueprint
incident_bp = Blueprint('incident_response', __name__)

# =============================================================================
# Incident Management Routes
# =============================================================================

@incident_bp.route('/incidents', methods=['POST'])
@cross_origin()
def create_incident():
    """Create new incident."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'severity', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse severity and category
        try:
            severity = IncidentSeverity(data['severity'])
            category = IncidentCategory(data['category'])
        except ValueError as e:
            return jsonify({'error': f'Invalid severity or category: {str(e)}'}), 400
        
        # Get incident response manager
        manager = get_incident_response_manager()
        
        # Create incident
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        incident = loop.run_until_complete(manager.create_incident(
            title=data['title'],
            description=data['description'],
            severity=severity,
            category=category,
            source=data.get('source', 'api'),
            tags=data.get('tags', [])
        ))
        loop.close()
        
        return jsonify({
            'incident_id': incident.id,
            'status': 'created',
            'message': 'Incident created successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to create incident", error=str(e))
        return jsonify({'error': 'Failed to create incident'}), 500

@incident_bp.route('/incidents/<incident_id>', methods=['GET'])
@cross_origin()
def get_incident(incident_id):
    """Get incident details."""
    try:
        manager = get_incident_response_manager()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        incident_details = loop.run_until_complete(manager.get_incident_details(incident_id))
        loop.close()
        
        if not incident_details:
            return jsonify({'error': 'Incident not found'}), 404
        
        return jsonify(incident_details)
        
    except Exception as e:
        logger.error("Failed to get incident", incident_id=incident_id, error=str(e))
        return jsonify({'error': 'Failed to get incident'}), 500

@incident_bp.route('/incidents/<incident_id>/status', methods=['PUT'])
@cross_origin()
def update_incident_status(incident_id):
    """Update incident status."""
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Missing required field: status'}), 400
        
        try:
            status = IncidentStatus(data['status'])
        except ValueError:
            return jsonify({'error': 'Invalid status value'}), 400
        
        manager = get_incident_response_manager()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(manager.update_incident_status(
            incident_id=incident_id,
            status=status,
            user=data.get('user', 'api'),
            notes=data.get('notes', '')
        ))
        loop.close()
        
        if not success:
            return jsonify({'error': 'Failed to update incident status'}), 400
        
        return jsonify({
            'incident_id': incident_id,
            'status': status.value,
            'message': 'Incident status updated successfully'
        })
        
    except Exception as e:
        logger.error("Failed to update incident status", incident_id=incident_id, error=str(e))
        return jsonify({'error': 'Failed to update incident status'}), 500

@incident_bp.route('/incidents/<incident_id>/escalate', methods=['POST'])
@cross_origin()
def escalate_incident(incident_id):
    """Escalate incident to next level."""
    try:
        data = request.get_json() or {}
        
        manager = get_incident_response_manager()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(manager.escalate_incident(
            incident_id=incident_id,
            reason=data.get('reason', 'manual_escalation'),
            user=data.get('user', 'api')
        ))
        loop.close()
        
        if not success:
            return jsonify({'error': 'Failed to escalate incident'}), 400
        
        return jsonify({
            'incident_id': incident_id,
            'message': 'Incident escalated successfully'
        })
        
    except Exception as e:
        logger.error("Failed to escalate incident", incident_id=incident_id, error=str(e))
        return jsonify({'error': 'Failed to escalate incident'}), 500

# =============================================================================
# Incident Analytics and Reporting Routes
# =============================================================================

@incident_bp.route('/incidents/summary', methods=['GET'])
@cross_origin()
def get_incident_summary():
    """Get incident summary and statistics."""
    try:
        manager = get_incident_response_manager()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        summary = loop.run_until_complete(manager.get_incident_summary())
        loop.close()
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error("Failed to get incident summary", error=str(e))
        return jsonify({'error': 'Failed to get incident summary'}), 500

@incident_bp.route('/incidents/list', methods=['GET'])
@cross_origin()
def list_incidents():
    """List incidents with optional filtering."""
    try:
        manager = get_incident_response_manager()
        
        # Get query parameters for filtering
        status_filter = request.args.get('status')
        severity_filter = request.args.get('severity')
        category_filter = request.args.get('category')
        limit = int(request.args.get('limit', 50))
        
        incidents = []
        for incident in list(manager.incidents.values())[-limit:]:
            # Apply filters
            if status_filter and incident.status.value != status_filter:
                continue
            if severity_filter and incident.severity.value != severity_filter:
                continue
            if category_filter and incident.category.value != category_filter:
                continue
            
            incidents.append({
                'id': incident.id,
                'title': incident.title,
                'severity': incident.severity.value,
                'status': incident.status.value,
                'category': incident.category.value,
                'created_at': incident.created_at.isoformat(),
                'updated_at': incident.updated_at.isoformat(),
                'escalation_level': incident.escalation_level,
                'sla_breach': incident.sla_breach
            })
        
        return jsonify({
            'incidents': incidents,
            'total': len(incidents),
            'filters_applied': {
                'status': status_filter,
                'severity': severity_filter,
                'category': category_filter,
                'limit': limit
            }
        })
        
    except Exception as e:
        logger.error("Failed to list incidents", error=str(e))
        return jsonify({'error': 'Failed to list incidents'}), 500

# =============================================================================
# Incident Response Configuration Routes
# =============================================================================

@incident_bp.route('/incidents/config/escalation-matrix', methods=['GET'])
@cross_origin()
def get_escalation_matrix():
    """Get escalation matrix configuration."""
    try:
        manager = get_incident_response_manager()
        
        escalation_matrix = []
        for level in manager.escalation_matrix:
            escalation_matrix.append({
                'level': level.level,
                'name': level.name,
                'contacts': level.contacts,
                'channels': level.channels,
                'response_time_minutes': level.response_time_minutes,
                'auto_escalate_after_minutes': level.auto_escalate_after_minutes
            })
        
        return jsonify({
            'escalation_matrix': escalation_matrix,
            'auto_escalation_enabled': manager.auto_escalation_enabled
        })
        
    except Exception as e:
        logger.error("Failed to get escalation matrix", error=str(e))
        return jsonify({'error': 'Failed to get escalation matrix'}), 500

@incident_bp.route('/incidents/config/runbooks', methods=['GET'])
@cross_origin()
def get_runbooks():
    """Get available runbooks."""
    try:
        manager = get_incident_response_manager()
        
        runbooks = {}
        for category, runbook in manager.runbooks.items():
            runbooks[category.value] = {
                'title': runbook.title,
                'description': runbook.description,
                'automated_steps': runbook.automated_steps,
                'manual_steps': runbook.manual_steps,
                'escalation_triggers': runbook.escalation_triggers,
                'recovery_validation': runbook.recovery_validation
            }
        
        return jsonify({
            'runbooks': runbooks,
            'total_runbooks': len(runbooks)
        })
        
    except Exception as e:
        logger.error("Failed to get runbooks", error=str(e))
        return jsonify({'error': 'Failed to get runbooks'}), 500

@incident_bp.route('/incidents/config/sla-targets', methods=['GET'])
@cross_origin()
def get_sla_targets():
    """Get SLA targets configuration."""
    try:
        manager = get_incident_response_manager()
        
        sla_targets = {}
        for severity, target_minutes in manager.sla_targets.items():
            sla_targets[severity.value] = {
                'target_minutes': target_minutes,
                'target_hours': round(target_minutes / 60, 2)
            }
        
        return jsonify({
            'sla_targets': sla_targets
        })
        
    except Exception as e:
        logger.error("Failed to get SLA targets", error=str(e))
        return jsonify({'error': 'Failed to get SLA targets'}), 500

# =============================================================================
# Health Check Route
# =============================================================================

@incident_bp.route('/incidents/health', methods=['GET'])
@cross_origin()
def incident_response_health():
    """Health check for incident response system."""
    try:
        manager = get_incident_response_manager()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'total_incidents': len(manager.incidents),
            'escalation_levels': len(manager.escalation_matrix),
            'runbooks_available': len(manager.runbooks),
            'auto_escalation_enabled': manager.auto_escalation_enabled
        })
        
    except Exception as e:
        logger.error("Incident response health check failed", error=str(e))
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
