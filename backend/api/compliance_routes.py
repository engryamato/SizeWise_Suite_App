"""
Compliance API Routes for SizeWise Suite
Provides REST API endpoints for compliance management functionality.
"""

from flask import Blueprint, request, jsonify, send_file
from flask_cors import cross_origin
import asyncio
import json
import io
from datetime import datetime
import logging

from backend.compliance.compliance_management_system import (
    compliance_system,
    ComplianceFramework,
    DataGovernancePolicy,
    DataClassification
)

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
compliance_bp = Blueprint('compliance', __name__, url_prefix='/api/compliance')

@compliance_bp.route('/dashboard', methods=['GET'])
@cross_origin()
def get_compliance_dashboard():
    """Get compliance dashboard data"""
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        dashboard_data = loop.run_until_complete(
            compliance_system.generate_compliance_dashboard_data()
        )
        loop.close()
        
        return jsonify(dashboard_data), 200
    except Exception as e:
        logger.error(f"Failed to get compliance dashboard: {e}")
        return jsonify({"error": "Failed to load compliance dashboard"}), 500

@compliance_bp.route('/status', methods=['GET'])
@cross_origin()
def get_compliance_status():
    """Get overall compliance status"""
    try:
        framework_param = request.args.get('framework')
        framework = None
        
        if framework_param:
            try:
                framework = ComplianceFramework(framework_param.upper())
            except ValueError:
                return jsonify({"error": f"Invalid framework: {framework_param}"}), 400
        
        status = compliance_system.get_compliance_status(framework)
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Failed to get compliance status: {e}")
        return jsonify({"error": "Failed to get compliance status"}), 500

@compliance_bp.route('/frameworks', methods=['GET'])
@cross_origin()
def get_supported_frameworks():
    """Get list of supported compliance frameworks"""
    try:
        frameworks = [
            {
                "name": framework.value,
                "description": get_framework_description(framework)
            }
            for framework in ComplianceFramework
        ]
        return jsonify({"frameworks": frameworks}), 200
    except Exception as e:
        logger.error(f"Failed to get frameworks: {e}")
        return jsonify({"error": "Failed to get frameworks"}), 500

@compliance_bp.route('/assess/<framework>', methods=['POST'])
@cross_origin()
def conduct_assessment(framework):
    """Conduct compliance assessment for specified framework"""
    try:
        # Validate framework
        try:
            compliance_framework = ComplianceFramework(framework.upper())
        except ValueError:
            return jsonify({"error": f"Invalid framework: {framework}"}), 400
        
        # Get assessor from request
        data = request.get_json() or {}
        assessor = data.get('assessor', 'system')
        
        # Run assessment
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        report = loop.run_until_complete(
            compliance_system.conduct_assessment(compliance_framework, assessor)
        )
        loop.close()
        
        # Convert report to dict for JSON serialization
        report_dict = {
            "id": report.id,
            "framework": report.framework.value,
            "report_date": report.report_date.isoformat(),
            "overall_score": report.overall_score,
            "compliant_requirements": report.compliant_requirements,
            "total_requirements": report.total_requirements,
            "critical_gaps": report.critical_gaps,
            "recommendations": report.recommendations,
            "next_assessment_date": report.next_assessment_date.isoformat(),
            "generated_by": report.generated_by
        }
        
        return jsonify({"report": report_dict}), 200
    except Exception as e:
        logger.error(f"Failed to conduct assessment: {e}")
        return jsonify({"error": "Failed to conduct assessment"}), 500

@compliance_bp.route('/requirements', methods=['GET'])
@cross_origin()
def get_requirements():
    """Get compliance requirements"""
    try:
        framework_param = request.args.get('framework')
        
        if framework_param:
            try:
                framework = ComplianceFramework(framework_param.upper())
                requirements = [
                    req for req in compliance_system.requirements.values()
                    if req.framework == framework
                ]
            except ValueError:
                return jsonify({"error": f"Invalid framework: {framework_param}"}), 400
        else:
            requirements = list(compliance_system.requirements.values())
        
        # Convert requirements to dict for JSON serialization
        requirements_dict = []
        for req in requirements:
            requirements_dict.append({
                "id": req.id,
                "framework": req.framework.value,
                "title": req.title,
                "description": req.description,
                "control_id": req.control_id,
                "category": req.category,
                "mandatory": req.mandatory,
                "implementation_guidance": req.implementation_guidance,
                "evidence_required": req.evidence_required,
                "testing_procedures": req.testing_procedures,
                "remediation_steps": req.remediation_steps
            })
        
        return jsonify({"requirements": requirements_dict}), 200
    except Exception as e:
        logger.error(f"Failed to get requirements: {e}")
        return jsonify({"error": "Failed to get requirements"}), 500

@compliance_bp.route('/assessments', methods=['GET'])
@cross_origin()
def get_assessments():
    """Get compliance assessments"""
    try:
        framework_param = request.args.get('framework')
        limit = int(request.args.get('limit', 50))
        
        assessments = list(compliance_system.assessments.values())
        
        if framework_param:
            try:
                framework = ComplianceFramework(framework_param.upper())
                # Filter assessments by framework (need to check requirement framework)
                filtered_assessments = []
                for assessment in assessments:
                    requirement = compliance_system.requirements.get(assessment.requirement_id)
                    if requirement and requirement.framework == framework:
                        filtered_assessments.append(assessment)
                assessments = filtered_assessments
            except ValueError:
                return jsonify({"error": f"Invalid framework: {framework_param}"}), 400
        
        # Sort by assessment date (newest first) and limit
        assessments = sorted(assessments, key=lambda x: x.assessment_date, reverse=True)[:limit]
        
        # Convert assessments to dict for JSON serialization
        assessments_dict = []
        for assessment in assessments:
            assessments_dict.append({
                "id": assessment.id,
                "requirement_id": assessment.requirement_id,
                "status": assessment.status.value,
                "score": assessment.score,
                "evidence_provided": assessment.evidence_provided,
                "gaps_identified": assessment.gaps_identified,
                "recommendations": assessment.recommendations,
                "assessor": assessment.assessor,
                "assessment_date": assessment.assessment_date.isoformat(),
                "next_review_date": assessment.next_review_date.isoformat(),
                "risk_level": assessment.risk_level
            })
        
        return jsonify({"assessments": assessments_dict}), 200
    except Exception as e:
        logger.error(f"Failed to get assessments: {e}")
        return jsonify({"error": "Failed to get assessments"}), 500

@compliance_bp.route('/policies', methods=['GET'])
@cross_origin()
def get_data_governance_policies():
    """Get data governance policies"""
    try:
        policies = compliance_system.get_data_governance_policies()
        
        # Convert policies to dict for JSON serialization
        policies_dict = []
        for policy in policies:
            policies_dict.append({
                "id": policy.id,
                "name": policy.name,
                "description": policy.description,
                "data_types": [dt.value for dt in policy.data_types],
                "retention_period_days": policy.retention_period_days,
                "encryption_required": policy.encryption_required,
                "access_controls": policy.access_controls,
                "backup_required": policy.backup_required,
                "deletion_procedures": policy.deletion_procedures,
                "compliance_frameworks": [cf.value for cf in policy.compliance_frameworks]
            })
        
        return jsonify({"policies": policies_dict}), 200
    except Exception as e:
        logger.error(f"Failed to get policies: {e}")
        return jsonify({"error": "Failed to get policies"}), 500

@compliance_bp.route('/policies', methods=['POST'])
@cross_origin()
def create_data_governance_policy():
    """Create new data governance policy"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ['id', 'name', 'description', 'data_types', 'retention_period_days']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Convert data types and compliance frameworks from strings to enums
        try:
            data_types = [DataClassification(dt) for dt in data['data_types']]
            compliance_frameworks = [ComplianceFramework(cf) for cf in data.get('compliance_frameworks', [])]
        except ValueError as e:
            return jsonify({"error": f"Invalid enum value: {e}"}), 400
        
        # Create policy object
        policy = DataGovernancePolicy(
            id=data['id'],
            name=data['name'],
            description=data['description'],
            data_types=data_types,
            retention_period_days=data['retention_period_days'],
            encryption_required=data.get('encryption_required', False),
            access_controls=data.get('access_controls', []),
            backup_required=data.get('backup_required', False),
            deletion_procedures=data.get('deletion_procedures', []),
            compliance_frameworks=compliance_frameworks
        )
        
        # Create policy
        success = compliance_system.create_data_governance_policy(policy)
        
        if success:
            return jsonify({"message": "Policy created successfully", "policy_id": policy.id}), 201
        else:
            return jsonify({"error": "Failed to create policy"}), 500
            
    except Exception as e:
        logger.error(f"Failed to create policy: {e}")
        return jsonify({"error": "Failed to create policy"}), 500

@compliance_bp.route('/export/<framework>', methods=['POST'])
@cross_origin()
def export_compliance_report(framework):
    """Export compliance report"""
    try:
        # Validate framework
        try:
            compliance_framework = ComplianceFramework(framework.upper())
        except ValueError:
            return jsonify({"error": f"Invalid framework: {framework}"}), 400
        
        # Get format from request
        data = request.get_json() or {}
        format_type = data.get('format', 'json').lower()
        
        # Export report
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        report_content = loop.run_until_complete(
            compliance_system.export_compliance_report(compliance_framework, format_type)
        )
        loop.close()
        
        # Create file-like object
        file_content = io.BytesIO(report_content.encode('utf-8'))
        file_content.seek(0)
        
        # Determine filename and mimetype
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"compliance_report_{framework.lower()}_{timestamp}.{format_type}"
        
        if format_type == 'json':
            mimetype = 'application/json'
        elif format_type == 'csv':
            mimetype = 'text/csv'
        elif format_type == 'pdf':
            mimetype = 'application/pdf'
        else:
            mimetype = 'text/plain'
        
        return send_file(
            file_content,
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )
        
    except Exception as e:
        logger.error(f"Failed to export report: {e}")
        return jsonify({"error": "Failed to export report"}), 500

@compliance_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    try:
        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "requirements_loaded": len(compliance_system.requirements),
            "assessments_count": len(compliance_system.assessments),
            "policies_count": len(compliance_system.policies),
            "reports_count": len(compliance_system.reports)
        }
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

def get_framework_description(framework: ComplianceFramework) -> str:
    """Get description for compliance framework"""
    descriptions = {
        ComplianceFramework.SOC2: "Service Organization Control 2 - Trust Services Criteria",
        ComplianceFramework.GDPR: "General Data Protection Regulation - EU Privacy Law",
        ComplianceFramework.HIPAA: "Health Insurance Portability and Accountability Act",
        ComplianceFramework.ASHRAE: "American Society of Heating, Refrigerating and Air-Conditioning Engineers",
        ComplianceFramework.NFPA: "National Fire Protection Association Standards",
        ComplianceFramework.SMACNA: "Sheet Metal and Air Conditioning Contractors' National Association",
        ComplianceFramework.ISO27001: "Information Security Management System Standard",
        ComplianceFramework.PCI_DSS: "Payment Card Industry Data Security Standard"
    }
    return descriptions.get(framework, "Unknown framework")

# Error handlers
@compliance_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@compliance_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

@compliance_bp.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500
