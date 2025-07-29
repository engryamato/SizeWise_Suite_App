"""
MongoDB API Blueprint for SizeWise Suite

Provides REST API endpoints for MongoDB operations including spatial data,
project management, and calculation results storage.
"""

import asyncio
from flask import Blueprint, request, jsonify
from typing import Dict, Any
import structlog
from ..services.mongodb_service import mongodb_service

logger = structlog.get_logger()

mongodb_bp = Blueprint('mongodb', __name__)

def run_async(coro):
    """Helper function to run async functions in Flask routes."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@mongodb_bp.route('/projects', methods=['POST'])
def create_project():
    """Create a new project in MongoDB."""
    try:
        project_data = request.get_json()
        
        if not project_data:
            return jsonify({'error': 'No project data provided'}), 400
        
        project_id = run_async(mongodb_service.create_project(project_data))
        
        return jsonify({
            'success': True,
            'project_id': project_id,
            'message': 'Project created successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to create project", error=str(e))
        return jsonify({'error': 'Failed to create project'}), 500

@mongodb_bp.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id: str):
    """Get project by ID from MongoDB."""
    try:
        project = run_async(mongodb_service.get_project(project_id))
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify({
            'success': True,
            'project': project
        }), 200
        
    except Exception as e:
        logger.error("Failed to get project", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to get project'}), 500

@mongodb_bp.route('/projects/<project_id>', methods=['PUT'])
def update_project(project_id: str):
    """Update project in MongoDB."""
    try:
        update_data = request.get_json()
        
        if not update_data:
            return jsonify({'error': 'No update data provided'}), 400
        
        success = run_async(mongodb_service.update_project(project_id, update_data))
        
        if not success:
            return jsonify({'error': 'Project not found or update failed'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Project updated successfully'
        }), 200
        
    except Exception as e:
        logger.error("Failed to update project", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to update project'}), 500

@mongodb_bp.route('/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id: str):
    """Delete project from MongoDB."""
    try:
        success = run_async(mongodb_service.delete_project(project_id))
        
        if not success:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Project deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error("Failed to delete project", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to delete project'}), 500

@mongodb_bp.route('/projects/<project_id>/spatial-data', methods=['POST'])
def save_spatial_data(project_id: str):
    """Save spatial data for a project."""
    try:
        spatial_data = request.get_json()
        
        if not spatial_data:
            return jsonify({'error': 'No spatial data provided'}), 400
        
        spatial_id = run_async(mongodb_service.save_spatial_data(project_id, spatial_data))
        
        return jsonify({
            'success': True,
            'spatial_id': spatial_id,
            'message': 'Spatial data saved successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to save spatial data", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to save spatial data'}), 500

@mongodb_bp.route('/projects/<project_id>/spatial-data', methods=['GET'])
def get_spatial_data(project_id: str):
    """Get spatial data for a project."""
    try:
        layer_type = request.args.get('layer_type')
        spatial_data = run_async(mongodb_service.get_spatial_data(project_id, layer_type))
        
        return jsonify({
            'success': True,
            'spatial_data': spatial_data
        }), 200
        
    except Exception as e:
        logger.error("Failed to get spatial data", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to get spatial data'}), 500

@mongodb_bp.route('/projects/<project_id>/hvac-systems', methods=['POST'])
def save_hvac_system(project_id: str):
    """Save HVAC system data."""
    try:
        system_data = request.get_json()
        
        if not system_data:
            return jsonify({'error': 'No HVAC system data provided'}), 400
        
        system_id = run_async(mongodb_service.save_hvac_system(project_id, system_data))
        
        return jsonify({
            'success': True,
            'system_id': system_id,
            'message': 'HVAC system saved successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to save HVAC system", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to save HVAC system'}), 500

@mongodb_bp.route('/projects/<project_id>/hvac-systems', methods=['GET'])
def get_hvac_systems(project_id: str):
    """Get HVAC systems for a project."""
    try:
        systems = run_async(mongodb_service.get_hvac_systems(project_id))
        
        return jsonify({
            'success': True,
            'hvac_systems': systems
        }), 200
        
    except Exception as e:
        logger.error("Failed to get HVAC systems", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to get HVAC systems'}), 500

@mongodb_bp.route('/projects/<project_id>/calculations', methods=['POST'])
def save_calculation_result(project_id: str):
    """Save calculation results."""
    try:
        calculation_data = request.get_json()
        
        if not calculation_data:
            return jsonify({'error': 'No calculation data provided'}), 400
        
        calculation_id = run_async(mongodb_service.save_calculation_result(project_id, calculation_data))
        
        return jsonify({
            'success': True,
            'calculation_id': calculation_id,
            'message': 'Calculation result saved successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to save calculation result", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to save calculation result'}), 500

@mongodb_bp.route('/projects/<project_id>/calculations', methods=['GET'])
def get_calculation_results(project_id: str):
    """Get calculation results for a project."""
    try:
        calculation_type = request.args.get('calculation_type')
        calculations = run_async(mongodb_service.get_calculation_results(project_id, calculation_type))
        
        return jsonify({
            'success': True,
            'calculations': calculations
        }), 200
        
    except Exception as e:
        logger.error("Failed to get calculation results", project_id=project_id, error=str(e))
        return jsonify({'error': 'Failed to get calculation results'}), 500

@mongodb_bp.route('/users/<user_id>/preferences', methods=['POST'])
def save_user_preferences(user_id: str):
    """Save user preferences."""
    try:
        preferences = request.get_json()
        
        if not preferences:
            return jsonify({'error': 'No preferences provided'}), 400
        
        success = run_async(mongodb_service.save_user_preferences(user_id, preferences))
        
        if not success:
            return jsonify({'error': 'Failed to save preferences'}), 500
        
        return jsonify({
            'success': True,
            'message': 'User preferences saved successfully'
        }), 200
        
    except Exception as e:
        logger.error("Failed to save user preferences", user_id=user_id, error=str(e))
        return jsonify({'error': 'Failed to save user preferences'}), 500

@mongodb_bp.route('/users/<user_id>/preferences', methods=['GET'])
def get_user_preferences(user_id: str):
    """Get user preferences."""
    try:
        preferences = run_async(mongodb_service.get_user_preferences(user_id))
        
        return jsonify({
            'success': True,
            'preferences': preferences
        }), 200
        
    except Exception as e:
        logger.error("Failed to get user preferences", user_id=user_id, error=str(e))
        return jsonify({'error': 'Failed to get user preferences'}), 500

@mongodb_bp.route('/health', methods=['GET'])
def mongodb_health():
    """MongoDB health check endpoint."""
    try:
        # Test MongoDB connection
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        connected = loop.run_until_complete(mongodb_service.db.client.admin.command('ping'))
        loop.close()
        
        return jsonify({
            'success': True,
            'status': 'connected',
            'message': 'MongoDB is healthy'
        }), 200
        
    except Exception as e:
        logger.error("MongoDB health check failed", error=str(e))
        return jsonify({
            'success': False,
            'status': 'disconnected',
            'error': 'MongoDB connection failed'
        }), 500
