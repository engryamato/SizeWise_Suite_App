"""
Analytics API Routes for SizeWise Suite
Advanced reporting and analytics endpoints.
"""

from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
import asyncio
import json
import io
import csv
from typing import Dict, Any, List

from ..analytics.advanced_reporting_analytics import (
    analytics_system,
    ReportType,
    ChartType,
    AggregationType,
    TimeRange
)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    """Get analytics dashboard overview"""
    try:
        # Get system status
        status = analytics_system.get_analytics_status()
        
        # Get KPIs
        kpis = analytics_system.get_kpis()
        kpi_data = [
            {
                "id": kpi.id,
                "name": kpi.name,
                "description": kpi.description,
                "value": kpi.value,
                "target": kpi.target,
                "unit": kpi.unit,
                "trend": kpi.trend,
                "change_percent": kpi.change_percent,
                "last_updated": kpi.last_updated.isoformat()
            }
            for kpi in kpis
        ]
        
        # Get recent reports
        recent_reports = list(analytics_system.report_instances.values())[-10:]
        report_data = [
            {
                "id": report.id,
                "name": report.name,
                "template_id": report.template_id,
                "generated_at": report.generated_at.isoformat(),
                "generated_by": report.generated_by,
                "status": report.status
            }
            for report in recent_reports
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "system_status": status,
                "kpis": kpi_data,
                "recent_reports": report_data,
                "dashboards": len(analytics_system.dashboards),
                "templates": len(analytics_system.report_templates)
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/kpis', methods=['GET'])
def get_kpis():
    """Get all KPIs"""
    try:
        kpis = analytics_system.get_kpis()
        kpi_data = [
            {
                "id": kpi.id,
                "name": kpi.name,
                "description": kpi.description,
                "value": kpi.value,
                "target": kpi.target,
                "unit": kpi.unit,
                "trend": kpi.trend,
                "change_percent": kpi.change_percent,
                "last_updated": kpi.last_updated.isoformat(),
                "achievement_rate": (kpi.value / kpi.target * 100) if kpi.target > 0 else 0
            }
            for kpi in kpis
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "kpis": kpi_data,
                "total_count": len(kpi_data)
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/dashboards', methods=['GET'])
def get_dashboards():
    """Get all dashboards"""
    try:
        dashboards = analytics_system.get_dashboards()
        dashboard_data = [
            {
                "id": dashboard.id,
                "name": dashboard.name,
                "description": dashboard.description,
                "widget_count": len(dashboard.widgets),
                "refresh_interval": dashboard.refresh_interval,
                "access_level": dashboard.access_level,
                "created_by": dashboard.created_by,
                "created_at": dashboard.created_at.isoformat()
            }
            for dashboard in dashboards
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "dashboards": dashboard_data,
                "total_count": len(dashboard_data)
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/dashboards/<dashboard_id>', methods=['GET'])
def get_dashboard_data(dashboard_id):
    """Get specific dashboard data"""
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            dashboard_data = loop.run_until_complete(
                analytics_system.get_dashboard_data(dashboard_id)
            )
        finally:
            loop.close()
        
        return jsonify({
            "status": "success",
            "data": dashboard_data
        })
        
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 404
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/reports/templates', methods=['GET'])
def get_report_templates():
    """Get all report templates"""
    try:
        templates = analytics_system.get_report_templates()
        template_data = [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "type": template.type.value,
                "chart_count": len(template.charts),
                "is_public": template.is_public,
                "created_by": template.created_by,
                "created_at": template.created_at.isoformat()
            }
            for template in templates
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "templates": template_data,
                "total_count": len(template_data)
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/reports/generate', methods=['POST'])
def generate_report():
    """Generate report from template"""
    try:
        data = request.get_json()
        template_id = data.get('template_id')
        parameters = data.get('parameters', {})
        
        if not template_id:
            return jsonify({
                "status": "error",
                "message": "Template ID is required"
            }), 400
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            report = loop.run_until_complete(
                analytics_system.generate_report(template_id, parameters)
            )
        finally:
            loop.close()
        
        return jsonify({
            "status": "success",
            "data": {
                "report_id": report.id,
                "name": report.name,
                "template_id": report.template_id,
                "generated_at": report.generated_at.isoformat(),
                "status": report.status,
                "data": report.data
            }
        })
        
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 404
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/reports', methods=['GET'])
def get_reports():
    """Get all generated reports"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        reports = list(analytics_system.report_instances.values())
        
        # Sort by generation date (newest first)
        reports.sort(key=lambda x: x.generated_at, reverse=True)
        
        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_reports = reports[start_idx:end_idx]
        
        report_data = [
            {
                "id": report.id,
                "name": report.name,
                "template_id": report.template_id,
                "generated_at": report.generated_at.isoformat(),
                "generated_by": report.generated_by,
                "status": report.status,
                "has_data": bool(report.data)
            }
            for report in paginated_reports
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "reports": report_data,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": len(reports),
                    "pages": (len(reports) + per_page - 1) // per_page
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get specific report"""
    try:
        report = analytics_system.report_instances.get(report_id)
        if not report:
            return jsonify({
                "status": "error",
                "message": "Report not found"
            }), 404
        
        return jsonify({
            "status": "success",
            "data": {
                "id": report.id,
                "name": report.name,
                "template_id": report.template_id,
                "generated_at": report.generated_at.isoformat(),
                "generated_by": report.generated_by,
                "parameters": report.parameters,
                "status": report.status,
                "data": report.data
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/reports/<report_id>/export', methods=['GET'])
def export_report(report_id):
    """Export report data"""
    try:
        report = analytics_system.report_instances.get(report_id)
        if not report:
            return jsonify({
                "status": "error",
                "message": "Report not found"
            }), 404
        
        export_format = request.args.get('format', 'json').lower()
        
        if export_format == 'json':
            # Export as JSON
            output = io.StringIO()
            json.dump({
                "report": {
                    "id": report.id,
                    "name": report.name,
                    "generated_at": report.generated_at.isoformat(),
                    "data": report.data
                }
            }, output, indent=2)
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='application/json',
                as_attachment=True,
                download_name=f"report_{report_id}.json"
            )
            
        elif export_format == 'csv':
            # Export as CSV (flatten data)
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow(['Chart', 'Data Type', 'Value'])
            
            # Write data
            for chart_id, chart_data in report.data.items():
                if isinstance(chart_data, dict) and 'data' in chart_data:
                    data = chart_data['data']
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict):
                                for key, value in item.items():
                                    writer.writerow([chart_id, key, value])
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f"report_{report_id}.csv"
            )
        
        else:
            return jsonify({
                "status": "error",
                "message": "Unsupported export format. Use 'json' or 'csv'"
            }), 400
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@analytics_bp.route('/api/analytics/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        status = analytics_system.get_analytics_status()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "system_status": status
        })
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }), 500
