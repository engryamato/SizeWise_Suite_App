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

from app.modules.air_duct_sizer.logic.calculator import AirDuctSizerLogic

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

        # Initialize the Air Duct Sizer logic
        air_duct_logic = AirDuctSizerLogic()

        # Perform calculation
        result = air_duct_logic.calculate_duct_size(data)

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

        air_duct_logic = AirDuctSizerLogic()
        result = air_duct_logic.validate_input(data)

        return jsonify(result)

    except Exception as e:
        logger.error("Air duct input validation failed", error=str(e))
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/standard-sizes/<duct_type>', methods=['GET'])
def get_air_duct_standard_sizes(duct_type):
    """Get standard sizes for air ducts."""
    try:
        air_duct_logic = AirDuctSizerLogic()
        result = air_duct_logic.get_standard_sizes(duct_type)

        return jsonify(result)

    except Exception as e:
        logger.error("Failed to get standard sizes", error=str(e))
        return jsonify({'error': 'Failed to get standard sizes', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/materials', methods=['GET'])
def get_air_duct_materials():
    """Get available duct materials."""
    try:
        air_duct_logic = AirDuctSizerLogic()
        result = air_duct_logic.get_material_options()

        return jsonify(result)

    except Exception as e:
        logger.error("Failed to get materials", error=str(e))
        return jsonify({'error': 'Failed to get materials', 'message': str(e)}), 500

@calculations_bp.route('/air-duct/info', methods=['GET'])
def get_air_duct_info():
    """Get information about the air duct calculation module."""
    try:
        air_duct_logic = AirDuctSizerLogic()
        result = air_duct_logic.get_calculation_info()

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
