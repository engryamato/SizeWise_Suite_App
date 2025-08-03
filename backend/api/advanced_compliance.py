"""
Advanced HVAC Compliance API Endpoints

New API endpoints for ASHRAE 90.2 and IECC 2024 compliance checking
Part of Phase 1 bridging plan for comprehensive HVAC standards support

@see docs/post-implementation-bridging-plan.md Task 1.2
"""

import logging
from flask import Blueprint, request, jsonify
from typing import Dict, Any

from ..compliance.advanced_compliance_checker import (
    AdvancedComplianceChecker,
    HVACDesign,
    ComplianceResult
)

logger = logging.getLogger(__name__)

# Create blueprint for advanced compliance endpoints
advanced_compliance_bp = Blueprint('advanced_compliance', __name__, url_prefix='/api/compliance')

# Initialize advanced compliance checker
compliance_checker = AdvancedComplianceChecker()


@advanced_compliance_bp.route('/ashrae-902', methods=['POST'])
def validate_ashrae_902():
    """
    Validate HVAC design against ASHRAE 90.2 standards
    
    Expected JSON payload:
    {
        "system_type": "variable_volume",
        "airflow_cfm": 5000,
        "fan_power_watts": 4000,
        "duct_insulation_r_value": 6.0,
        "duct_leakage_cfm": 150,
        "climate_zone": "4",
        "building_type": "office",
        "conditioned_area_sqft": 10000,
        "equipment_efficiency": {
            "air_conditioner": {"seer": 14.5, "eer": 11.2}
        },
        "controls": {
            "automatic_shutoff": true,
            "demand_control_ventilation": true,
            "economizer_required": true
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'system_type', 'airflow_cfm', 'fan_power_watts', 
            'duct_insulation_r_value', 'duct_leakage_cfm', 
            'climate_zone', 'building_type', 'conditioned_area_sqft'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Create HVAC design object
        design = HVACDesign(
            system_type=data['system_type'],
            airflow_cfm=float(data['airflow_cfm']),
            fan_power_watts=float(data['fan_power_watts']),
            duct_insulation_r_value=float(data['duct_insulation_r_value']),
            duct_leakage_cfm=float(data['duct_leakage_cfm']),
            climate_zone=str(data['climate_zone']),
            building_type=data['building_type'],
            conditioned_area_sqft=float(data['conditioned_area_sqft']),
            equipment_efficiency=data.get('equipment_efficiency', {}),
            controls=data.get('controls', {})
        )
        
        # Perform ASHRAE 90.2 compliance check
        result = compliance_checker.check_ashrae_902_compliance(design)
        
        # Format response
        response = {
            'input': data,
            'compliance': {
                'standard': result.standard,
                'is_compliant': result.is_compliant,
                'compliance_percentage': result.compliance_percentage,
                'violations': result.violations,
                'recommendations': result.recommendations,
                'critical_issues': result.critical_issues,
                'warnings': result.warnings,
                'energy_savings_potential': result.energy_savings_potential,
                'cost_impact': result.cost_impact
            },
            'timestamp': data.get('timestamp', None)
        }
        
        logger.info(f"ASHRAE 90.2 validation completed: {result.compliance_percentage:.1f}% compliant")
        return jsonify(response)
        
    except ValueError as e:
        logger.error(f"ASHRAE 90.2 validation failed - invalid data: {e}")
        return jsonify({'error': 'Invalid data format', 'message': str(e)}), 400
        
    except Exception as e:
        logger.error(f"ASHRAE 90.2 validation failed: {e}")
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500


@advanced_compliance_bp.route('/iecc-2024', methods=['POST'])
def validate_iecc_2024():
    """
    Validate HVAC design against IECC 2024 standards
    
    Expected JSON payload: Same as ASHRAE 90.2 with additional fields:
    {
        ... (same as ASHRAE 90.2)
        "controls": {
            ... (same as ASHRAE 90.2)
            "smart_controls": true,
            "zone_control": true,
            "renewable_percentage": 15.0
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields (same as ASHRAE 90.2)
        required_fields = [
            'system_type', 'airflow_cfm', 'fan_power_watts', 
            'duct_insulation_r_value', 'duct_leakage_cfm', 
            'climate_zone', 'building_type', 'conditioned_area_sqft'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Create HVAC design object
        design = HVACDesign(
            system_type=data['system_type'],
            airflow_cfm=float(data['airflow_cfm']),
            fan_power_watts=float(data['fan_power_watts']),
            duct_insulation_r_value=float(data['duct_insulation_r_value']),
            duct_leakage_cfm=float(data['duct_leakage_cfm']),
            climate_zone=str(data['climate_zone']),
            building_type=data['building_type'],
            conditioned_area_sqft=float(data['conditioned_area_sqft']),
            equipment_efficiency=data.get('equipment_efficiency', {}),
            controls=data.get('controls', {})
        )
        
        # Perform IECC 2024 compliance check
        result = compliance_checker.check_iecc_2024_compliance(design)
        
        # Format response
        response = {
            'input': data,
            'compliance': {
                'standard': result.standard,
                'is_compliant': result.is_compliant,
                'compliance_percentage': result.compliance_percentage,
                'violations': result.violations,
                'recommendations': result.recommendations,
                'critical_issues': result.critical_issues,
                'warnings': result.warnings,
                'energy_savings_potential': result.energy_savings_potential,
                'cost_impact': result.cost_impact
            },
            'timestamp': data.get('timestamp', None)
        }
        
        logger.info(f"IECC 2024 validation completed: {result.compliance_percentage:.1f}% compliant")
        return jsonify(response)
        
    except ValueError as e:
        logger.error(f"IECC 2024 validation failed - invalid data: {e}")
        return jsonify({'error': 'Invalid data format', 'message': str(e)}), 400
        
    except Exception as e:
        logger.error(f"IECC 2024 validation failed: {e}")
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500


@advanced_compliance_bp.route('/all-advanced', methods=['POST'])
def validate_all_advanced_standards():
    """
    Validate HVAC design against all advanced standards (ASHRAE 90.2 and IECC 2024)
    
    Expected JSON payload: Same as individual endpoints
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'system_type', 'airflow_cfm', 'fan_power_watts', 
            'duct_insulation_r_value', 'duct_leakage_cfm', 
            'climate_zone', 'building_type', 'conditioned_area_sqft'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Create HVAC design object
        design = HVACDesign(
            system_type=data['system_type'],
            airflow_cfm=float(data['airflow_cfm']),
            fan_power_watts=float(data['fan_power_watts']),
            duct_insulation_r_value=float(data['duct_insulation_r_value']),
            duct_leakage_cfm=float(data['duct_leakage_cfm']),
            climate_zone=str(data['climate_zone']),
            building_type=data['building_type'],
            conditioned_area_sqft=float(data['conditioned_area_sqft']),
            equipment_efficiency=data.get('equipment_efficiency', {}),
            controls=data.get('controls', {})
        )
        
        # Perform compliance checks for all advanced standards
        results = compliance_checker.check_all_advanced_standards(design)
        
        # Format response
        response = {
            'input': data,
            'compliance_results': {},
            'summary': {
                'total_standards': len(results),
                'compliant_standards': sum(1 for r in results.values() if r.is_compliant),
                'average_compliance': sum(r.compliance_percentage for r in results.values()) / len(results),
                'total_critical_issues': sum(r.critical_issues for r in results.values()),
                'total_warnings': sum(r.warnings for r in results.values())
            },
            'timestamp': data.get('timestamp', None)
        }
        
        # Add individual results
        for standard, result in results.items():
            response['compliance_results'][standard] = {
                'standard': result.standard,
                'is_compliant': result.is_compliant,
                'compliance_percentage': result.compliance_percentage,
                'violations': result.violations,
                'recommendations': result.recommendations,
                'critical_issues': result.critical_issues,
                'warnings': result.warnings,
                'energy_savings_potential': result.energy_savings_potential,
                'cost_impact': result.cost_impact
            }
        
        logger.info(f"All advanced standards validation completed: {response['summary']['average_compliance']:.1f}% average compliance")
        return jsonify(response)
        
    except ValueError as e:
        logger.error(f"Advanced standards validation failed - invalid data: {e}")
        return jsonify({'error': 'Invalid data format', 'message': str(e)}), 400
        
    except Exception as e:
        logger.error(f"Advanced standards validation failed: {e}")
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500


@advanced_compliance_bp.route('/standards-info', methods=['GET'])
def get_standards_info():
    """
    Get information about supported advanced standards
    """
    try:
        info = {
            'supported_standards': [
                {
                    'name': 'ASHRAE 90.2',
                    'description': 'Energy-Efficient Design of Low-Rise Residential Buildings',
                    'endpoint': '/api/compliance/ashrae-902',
                    'version': '2018',
                    'focus_areas': [
                        'Fan power limits',
                        'Duct insulation requirements',
                        'Duct leakage limits',
                        'Equipment efficiency',
                        'Control systems'
                    ]
                },
                {
                    'name': 'IECC 2024',
                    'description': 'International Energy Conservation Code 2024',
                    'endpoint': '/api/compliance/iecc-2024',
                    'version': '2024',
                    'focus_areas': [
                        'Enhanced fan power limits',
                        'Improved insulation requirements',
                        'Stricter duct leakage limits',
                        'High-efficiency equipment',
                        'Smart control systems',
                        'Renewable energy integration'
                    ]
                }
            ],
            'combined_endpoint': '/api/compliance/all-advanced',
            'backward_compatibility': {
                'existing_endpoints_preserved': True,
                'existing_api_unchanged': True,
                'note': 'All existing compliance endpoints remain fully functional'
            }
        }
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Standards info request failed: {e}")
        return jsonify({'error': 'Failed to retrieve standards info', 'message': str(e)}), 500
