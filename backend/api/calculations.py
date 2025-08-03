"""
Calculations API Blueprint

Handles all calculation endpoints for HVAC modules.
"""

from flask import Blueprint, request, jsonify, g
import sys
import os
import structlog

# Import caching for performance optimization
try:
    from ..caching.redis_cache import cache_hvac_calculation, cache_api_response
except ImportError:
    # Fallback decorators if caching not available
    def cache_hvac_calculation(ttl=None):
        def decorator(func):
            return func
        return decorator

    def cache_api_response(ttl=None):
        def decorator(func):
            return func
        return decorator

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import the core calculator directly instead of the module wrapper
from core.calculations.air_duct_calculator import AirDuctCalculator

# Import advanced calculators for Phase 4: Cross-Platform Implementation
from core.calculations.velocity_pressure_calculator import (
    VelocityPressureCalculator, VelocityPressureMethod, VelocityPressureInput,
    DuctGeometry, ValidationLevel
)
from core.calculations.enhanced_friction_calculator import (
    EnhancedFrictionCalculator, FrictionMethod, FrictionCalculationInput,
    MaterialAge, SurfaceCondition
)
from core.calculations.air_properties_calculator import AirConditions

# Import input validation middleware
try:
    from backend.middleware.input_validator import validate_input
except ImportError:
    # Fallback for development
    def validate_input(schema_name=None, required=True):
        def decorator(f):
            return f
        return decorator

logger = structlog.get_logger()

calculations_bp = Blueprint('calculations', __name__)

@calculations_bp.route('/air-duct', methods=['POST'])
@validate_input(schema_name='air_duct_calculation', required=True)
@cache_hvac_calculation(ttl=3600)  # Cache for 1 hour
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
        # Use validated and sanitized data from middleware
        data = getattr(g, 'validated_data', None) or request.get_json()
        validation_warnings = getattr(g, 'validation_warnings', [])

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
@cache_api_response(ttl=86400)  # Cache for 24 hours (static data)
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
@cache_hvac_calculation(ttl=3600)  # Cache for 1 hour
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


@calculations_bp.route('/velocity-pressure', methods=['POST'])
def calculate_velocity_pressure():
    """
    Calculate velocity pressure using advanced methods.

    Expected input:
    {
        "velocity": float,  # FPM
        "method": str,  # optional, calculation method
        "air_conditions": {  # optional
            "temperature": float,  # °F
            "altitude": float,  # feet
            "humidity": float  # %
        },
        "validation_level": str  # optional, "none", "basic", "standard", "strict"
    }
    """
    try:
        data = request.get_json()

        if not data or 'velocity' not in data:
            return jsonify({'error': 'Velocity is required'}), 400

        # Parse method
        method_str = data.get('method', 'enhanced_formula')
        try:
            method = VelocityPressureMethod(method_str)
        except ValueError:
            method = VelocityPressureMethod.ENHANCED_FORMULA

        # Parse air conditions
        air_conditions = None
        if 'air_conditions' in data:
            ac_data = data['air_conditions']
            air_conditions = AirConditions(
                temperature=ac_data.get('temperature', 70.0),
                altitude=ac_data.get('altitude', 0.0),
                humidity=ac_data.get('humidity', 50.0),
                pressure=ac_data.get('pressure')
            )

        # Parse validation level
        validation_str = data.get('validation_level', 'standard')
        try:
            validation_level = ValidationLevel(validation_str)
        except ValueError:
            validation_level = ValidationLevel.STANDARD

        # Create input parameters
        input_params = VelocityPressureInput(
            velocity=data['velocity'],
            method=method,
            air_conditions=air_conditions,
            air_density=data.get('air_density'),
            turbulence_correction=data.get('turbulence_correction', False),
            compressibility_correction=data.get('compressibility_correction', False),
            validation_level=validation_level
        )

        # Calculate velocity pressure
        result = VelocityPressureCalculator.calculate_velocity_pressure(input_params)

        # Format response
        response = {
            'input': data,
            'results': {
                'velocity_pressure': result.velocity_pressure,
                'method': result.method.value,
                'velocity': result.velocity,
                'air_density': result.air_density,
                'density_ratio': result.density_ratio,
                'accuracy': result.accuracy,
                'corrections': {
                    'temperature': result.corrections.temperature,
                    'pressure': result.corrections.pressure,
                    'altitude': result.corrections.altitude,
                    'humidity': result.corrections.humidity,
                    'turbulence': result.corrections.turbulence,
                    'compressibility': result.corrections.compressibility,
                    'combined': result.corrections.combined
                },
                'warnings': result.warnings,
                'recommendations': result.recommendations
            },
            'metadata': {
                'calculation_time': 'instant',
                'version': VelocityPressureCalculator.VERSION,
                'standard_reference': result.calculation_details.standard_reference if result.calculation_details else None
            }
        }

        if result.uncertainty_bounds:
            response['results']['uncertainty_bounds'] = {
                'lower': result.uncertainty_bounds.lower,
                'upper': result.uncertainty_bounds.upper,
                'confidence_level': result.uncertainty_bounds.confidence_level
            }

        logger.info("Velocity pressure calculation completed",
                   velocity=data['velocity'], method=method.value)
        return jsonify(response)

    except Exception as e:
        logger.error("Velocity pressure calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500


@calculations_bp.route('/velocity-pressure/inverse', methods=['POST'])
def calculate_velocity_from_pressure():
    """
    Calculate velocity from velocity pressure (inverse calculation).

    Expected input:
    {
        "velocity_pressure": float,  # inches w.g.
        "air_conditions": {  # optional
            "temperature": float,  # °F
            "altitude": float,  # feet
            "humidity": float  # %
        }
    }
    """
    try:
        data = request.get_json()

        if not data or 'velocity_pressure' not in data:
            return jsonify({'error': 'Velocity pressure is required'}), 400

        # Parse air conditions
        air_conditions = None
        if 'air_conditions' in data:
            ac_data = data['air_conditions']
            air_conditions = AirConditions(
                temperature=ac_data.get('temperature', 70.0),
                altitude=ac_data.get('altitude', 0.0),
                humidity=ac_data.get('humidity', 50.0),
                pressure=ac_data.get('pressure')
            )

        # Calculate velocity
        result = VelocityPressureCalculator.calculate_velocity_from_pressure(
            data['velocity_pressure'],
            air_conditions,
            data.get('air_density')
        )

        # Format response
        response = {
            'input': data,
            'results': {
                'velocity': result['velocity'],
                'accuracy': result['accuracy'],
                'warnings': result['warnings']
            },
            'metadata': {
                'calculation_time': 'instant',
                'version': VelocityPressureCalculator.VERSION
            }
        }

        logger.info("Inverse velocity pressure calculation completed",
                   velocity_pressure=data['velocity_pressure'])
        return jsonify(response)

    except Exception as e:
        logger.error("Inverse velocity pressure calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500


@calculations_bp.route('/enhanced-friction', methods=['POST'])
def calculate_enhanced_friction():
    """
    Calculate friction loss using enhanced methods with material aging and environmental corrections.

    Expected input:
    {
        "velocity": float,  # FPM
        "hydraulic_diameter": float,  # inches
        "length": float,  # feet
        "material": str,  # material type
        "method": str,  # optional, calculation method
        "material_age": str,  # optional, aging condition
        "surface_condition": str,  # optional, surface condition
        "air_conditions": {  # optional
            "temperature": float,  # °F
            "altitude": float,  # feet
            "humidity": float  # %
        },
        "shape_factor": float  # optional, for rectangular ducts
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['velocity', 'hydraulic_diameter', 'length', 'material']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Parse method
        method_str = data.get('method', 'enhanced_darcy')
        try:
            method = FrictionMethod(method_str)
        except ValueError:
            method = FrictionMethod.ENHANCED_DARCY

        # Parse material age
        age_str = data.get('material_age', 'good')
        try:
            material_age = MaterialAge(age_str)
        except ValueError:
            material_age = MaterialAge.GOOD

        # Parse surface condition
        surface_str = data.get('surface_condition', 'good')
        try:
            surface_condition = SurfaceCondition(surface_str)
        except ValueError:
            surface_condition = SurfaceCondition.GOOD

        # Parse air conditions
        air_conditions = None
        if 'air_conditions' in data:
            ac_data = data['air_conditions']
            air_conditions = AirConditions(
                temperature=ac_data.get('temperature', 70.0),
                altitude=ac_data.get('altitude', 0.0),
                humidity=ac_data.get('humidity', 50.0),
                pressure=ac_data.get('pressure')
            )

        # Create input parameters
        input_params = FrictionCalculationInput(
            velocity=data['velocity'],
            hydraulic_diameter=data['hydraulic_diameter'],
            length=data['length'],
            material=data['material'],
            method=method,
            material_age=material_age,
            surface_condition=surface_condition,
            air_conditions=air_conditions,
            shape_factor=data.get('shape_factor', 1.0),
            validation_level=data.get('validation_level', 'standard')
        )

        # Calculate friction loss
        result = EnhancedFrictionCalculator.calculate_friction_loss(input_params)

        # Format response
        response = {
            'input': data,
            'results': {
                'friction_loss': result.friction_loss,
                'friction_rate': result.friction_rate,
                'friction_factor': result.friction_factor,
                'method': result.method.value,
                'flow_regime': result.flow_regime.value,
                'reynolds_number': result.reynolds_number,
                'relative_roughness': result.relative_roughness,
                'accuracy': result.accuracy,
                'material_properties': {
                    'base_roughness': result.material_properties.roughness,
                    'aging_factor': result.material_properties.aging_factor,
                    'surface_factor': result.material_properties.surface_factor,
                    'combined_roughness': result.material_properties.combined_roughness
                },
                'warnings': result.warnings,
                'recommendations': result.recommendations
            },
            'metadata': {
                'calculation_time': 'instant',
                'version': EnhancedFrictionCalculator.VERSION
            }
        }

        logger.info("Enhanced friction calculation completed",
                   velocity=data['velocity'], method=method.value, material=data['material'])
        return jsonify(response)

    except Exception as e:
        logger.error("Enhanced friction calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500


@calculations_bp.route('/advanced-calculators/info', methods=['GET'])
def get_advanced_calculators_info():
    """
    Get information about available advanced calculation methods and options.
    """
    try:
        info = {
            'velocity_pressure_calculator': {
                'version': VelocityPressureCalculator.VERSION,
                'methods': [method.value for method in VelocityPressureMethod],
                'validation_levels': [level.value for level in ValidationLevel],
                'velocity_ranges': {
                    method.value: VelocityPressureCalculator.VELOCITY_RANGES[method]
                    for method in VelocityPressureMethod
                },
                'accuracy_estimates': {
                    method.value: VelocityPressureCalculator.METHOD_ACCURACY[method]
                    for method in VelocityPressureMethod
                }
            },
            'enhanced_friction_calculator': {
                'version': EnhancedFrictionCalculator.VERSION,
                'methods': [method.value for method in FrictionMethod],
                'material_ages': [age.value for age in MaterialAge],
                'surface_conditions': [condition.value for condition in SurfaceCondition],
                'flow_regimes': [regime.value for regime in FlowRegime],
                'supported_materials': list(EnhancedFrictionCalculator.MATERIAL_ROUGHNESS.keys()),
                'aging_factors': {
                    age.value: EnhancedFrictionCalculator.AGING_FACTORS[age]
                    for age in MaterialAge
                },
                'surface_factors': {
                    condition.value: EnhancedFrictionCalculator.SURFACE_FACTORS[condition]
                    for condition in SurfaceCondition
                },
                'accuracy_estimates': {
                    method.value: EnhancedFrictionCalculator.METHOD_ACCURACY[method]
                    for method in FrictionMethod
                }
            }
        }

        return jsonify(info)

    except Exception as e:
        logger.error("Failed to get advanced calculators info", error=str(e))
        return jsonify({'error': 'Failed to get info', 'message': str(e)}), 500

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
