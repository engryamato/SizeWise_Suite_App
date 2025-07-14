"""
Calculations API Blueprint

Handles all calculation endpoints for HVAC modules.
"""

from flask import Blueprint, request, jsonify
import sys
import os
import structlog

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import the core calculator directly instead of the module wrapper
from core.calculations.air_duct_calculator import AirDuctCalculator

logger = structlog.get_logger()

calculations_bp = Blueprint('calculations', __name__)

@calculations_bp.route('/air-duct', methods=['POST'])
def calculate_air_duct():
    """
    Calculate air duct sizing based on SMACNA standards.

    Expected input:
    {
        "airflow": float,  # CFM or L/s
        "duct_type": str,  # "rectangular" or "round"
        "friction_rate": float,  # inches of water per 100 feet or Pa/m
        "units": str,  # "imperial" or "metric"
        "material": str,  # optional, default "galvanized_steel"
        "insulation": bool  # optional, default false
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Initialize the Air Duct Calculator
        calculator = AirDuctCalculator()

        # Perform calculation
        calc_result = calculator.calculate(data)

        # Format response to match expected API format
        result = {
            'success': calc_result.is_valid(),
            'input_data': calc_result.input_data,
            'results': calc_result.results,
            'compliance': calc_result.compliance,
            'warnings': calc_result.warnings,
            'errors': calc_result.errors,
            'metadata': calc_result.metadata
        }

        if result['success']:
            logger.info("Air duct calculation completed", input_data=data)
            return jsonify(result)
        else:
            logger.warning("Air duct calculation failed validation",
                         errors=result.get('errors', []),
                         warnings=result.get('warnings', []))
            return jsonify(result), 400

    except Exception as e:
        logger.error("Air duct calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/validate', methods=['POST'])
def validate_air_duct_input():
    """Validate air duct calculation input without performing calculation."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        calculator = AirDuctCalculator()
        validation_result = calculator.validate_input(data)

        result = {
            'is_valid': validation_result['is_valid'],
            'errors': validation_result['errors'],
            'warnings': validation_result['warnings']
        }

        return jsonify(result)

    except Exception as e:
        logger.error("Air duct input validation failed", error=str(e))
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/standard-sizes/<duct_type>', methods=['GET'])
def get_air_duct_standard_sizes(duct_type):
    """Get standard sizes for air ducts."""
    try:
        calculator = AirDuctCalculator()
        sizes = calculator.get_standard_sizes(duct_type)

        result = {
            'success': True,
            'duct_type': duct_type,
            'sizes': sizes
        }

        return jsonify(result)

    except Exception as e:
        logger.error("Failed to get standard sizes", error=str(e))
        return jsonify({'error': 'Failed to get standard sizes', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/materials', methods=['GET'])
def get_air_duct_materials():
    """Get available duct materials."""
    try:
        # Return material options directly
        materials = {
            'galvanized_steel': {
                'name': 'Galvanized Steel',
                'roughness': 0.0003,
                'description': 'Standard galvanized steel ductwork'
            },
            'aluminum': {
                'name': 'Aluminum',
                'roughness': 0.0002,
                'description': 'Lightweight aluminum ductwork'
            },
            'stainless_steel': {
                'name': 'Stainless Steel',
                'roughness': 0.0002,
                'description': 'Corrosion-resistant stainless steel'
            },
            'pvc': {
                'name': 'PVC',
                'roughness': 0.0001,
                'description': 'Plastic PVC ductwork'
            },
            'fiberglass': {
                'name': 'Fiberglass',
                'roughness': 0.0005,
                'description': 'Insulated fiberglass ductwork'
            }
        }

        result = {
            'success': True,
            'materials': materials
        }

        return jsonify(result)

    except Exception as e:
        logger.error("Failed to get materials", error=str(e))
        return jsonify({'error': 'Failed to get materials', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/info', methods=['GET'])
def get_air_duct_info():
    """Get information about the air duct calculation module."""
    try:
        # Return module information
        result = {
            'module_id': 'air-duct-sizer',
            'name': 'Air Duct Sizer',
            'version': '0.1.0',
            'description': 'SMACNA-compliant air duct sizing calculations with enhanced Darcy-Weisbach pressure loss',
            'standards': ['SMACNA 2021', 'ASHRAE 2021'],
            'supported_units': ['imperial', 'metric'],
            'duct_types': ['round', 'rectangular'],
            'features': [
                'Darcy-Weisbach pressure loss calculations',
                'SMACNA equivalent diameter',
                'Hydraulic diameter calculations',
                'Aspect ratio validation',
                'Material roughness factors',
                'Velocity validation per ASHRAE'
            ],
            'parameters': {
                'required': ['airflow', 'duct_type', 'friction_rate', 'units'],
                'optional': ['material', 'insulation']
            }
        }

        return jsonify(result)

    except Exception as e:
        logger.error("Failed to get module info", error=str(e))
        return jsonify({'error': 'Failed to get module info', 'message': str(e)}), 500

@calculations_bp.route('/grease-duct', methods=['POST'])
def calculate_grease_duct():
    """
    Calculate grease duct sizing based on NFPA 96 standards.
    """
    try:
        data = request.get_json()
        
        # TODO: Implement grease duct calculation logic
        result = {
            'input': data,
            'results': {
                'duct_size': 'TBD',
                'velocity': 'TBD',
                'nfpa_compliance': True
            }
        }
        
        logger.info("Grease duct calculation completed", input_data=data)
        return jsonify(result)
        
    except Exception as e:
        logger.error("Grease duct calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@calculations_bp.route('/engine-exhaust', methods=['POST'])
def calculate_engine_exhaust():
    """
    Calculate engine exhaust sizing for generators and CHP systems.
    """
    try:
        data = request.get_json()
        
        # TODO: Implement engine exhaust calculation logic
        result = {
            'input': data,
            'results': {
                'pipe_size': 'TBD',
                'back_pressure': 'TBD',
                'temperature_rating': 'TBD'
            }
        }
        
        logger.info("Engine exhaust calculation completed", input_data=data)
        return jsonify(result)
        
    except Exception as e:
        logger.error("Engine exhaust calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@calculations_bp.route('/boiler-vent', methods=['POST'])
def calculate_boiler_vent():
    """
    Calculate boiler vent sizing for Category I-IV appliances.
    """
    try:
        data = request.get_json()
        
        # TODO: Implement boiler vent calculation logic
        result = {
            'input': data,
            'results': {
                'vent_size': 'TBD',
                'draft_pressure': 'TBD',
                'category_compliance': 'TBD'
            }
        }
        
        logger.info("Boiler vent calculation completed", input_data=data)
        return jsonify(result)
        
    except Exception as e:
        logger.error("Boiler vent calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@calculations_bp.route('/estimate', methods=['POST'])
def calculate_estimate():
    """
    Calculate project estimates including labor and materials.
    """
    try:
        data = request.get_json()
        
        # TODO: Implement estimating calculation logic
        result = {
            'input': data,
            'results': {
                'material_cost': 'TBD',
                'labor_cost': 'TBD',
                'total_cost': 'TBD',
                'line_items': []
            }
        }
        
        logger.info("Estimate calculation completed", input_data=data)
        return jsonify(result)
        
    except Exception as e:
        logger.error("Estimate calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500
