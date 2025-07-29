"""
Advanced Reporting & Analytics System for SizeWise Suite
Executive dashboards, custom report builders, data visualization, and business intelligence integration.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import logging
import statistics
from collections import defaultdict
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportType(Enum):
    """Types of reports"""
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    PROJECT_PERFORMANCE = "PROJECT_PERFORMANCE"
    FINANCIAL_ANALYSIS = "FINANCIAL_ANALYSIS"
    COMPLIANCE_REPORT = "COMPLIANCE_REPORT"
    ENERGY_EFFICIENCY = "ENERGY_EFFICIENCY"
    EQUIPMENT_UTILIZATION = "EQUIPMENT_UTILIZATION"
    USER_ACTIVITY = "USER_ACTIVITY"
    SYSTEM_PERFORMANCE = "SYSTEM_PERFORMANCE"
    CUSTOM = "CUSTOM"

class ChartType(Enum):
    """Types of charts"""
    LINE = "LINE"
    BAR = "BAR"
    PIE = "PIE"
    AREA = "AREA"
    SCATTER = "SCATTER"
    HEATMAP = "HEATMAP"
    GAUGE = "GAUGE"
    TABLE = "TABLE"

class AggregationType(Enum):
    """Data aggregation types"""
    SUM = "SUM"
    AVERAGE = "AVERAGE"
    COUNT = "COUNT"
    MIN = "MIN"
    MAX = "MAX"
    MEDIAN = "MEDIAN"
    PERCENTILE = "PERCENTILE"

class TimeRange(Enum):
    """Time range options"""
    LAST_24_HOURS = "LAST_24_HOURS"
    LAST_7_DAYS = "LAST_7_DAYS"
    LAST_30_DAYS = "LAST_30_DAYS"
    LAST_90_DAYS = "LAST_90_DAYS"
    LAST_YEAR = "LAST_YEAR"
    CUSTOM = "CUSTOM"

@dataclass
class DataSource:
    """Data source configuration"""
    id: str
    name: str
    type: str  # database, api, file, etc.
    connection_string: str
    query: str
    refresh_interval: int  # minutes
    last_updated: Optional[datetime] = None

@dataclass
class ChartConfig:
    """Chart configuration"""
    id: str
    title: str
    type: ChartType
    data_source: str
    x_axis: str
    y_axis: str
    aggregation: AggregationType
    filters: Dict[str, Any]
    styling: Dict[str, Any]

@dataclass
class ReportTemplate:
    """Report template"""
    id: str
    name: str
    description: str
    type: ReportType
    charts: List[ChartConfig]
    layout: Dict[str, Any]
    parameters: Dict[str, Any]
    created_by: str
    created_at: datetime
    is_public: bool = False

@dataclass
class ReportInstance:
    """Generated report instance"""
    id: str
    template_id: str
    name: str
    generated_at: datetime
    generated_by: str
    parameters: Dict[str, Any]
    data: Dict[str, Any]
    file_path: Optional[str] = None
    status: str = "COMPLETED"

@dataclass
class Dashboard:
    """Executive dashboard"""
    id: str
    name: str
    description: str
    widgets: List[ChartConfig]
    layout: Dict[str, Any]
    refresh_interval: int  # minutes
    access_level: str  # PUBLIC, PRIVATE, ROLE_BASED
    created_by: str
    created_at: datetime

@dataclass
class KPI:
    """Key Performance Indicator"""
    id: str
    name: str
    description: str
    value: float
    target: float
    unit: str
    trend: str  # UP, DOWN, STABLE
    change_percent: float
    last_updated: datetime

class DataProcessor:
    """Data processing and aggregation engine"""
    
    def __init__(self):
        self.data_cache: Dict[str, Any] = {}
        self.cache_expiry: Dict[str, datetime] = {}
    
    async def process_data(self, data_source: DataSource, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Process data from source with filters"""
        try:
            # Check cache first
            cache_key = f"{data_source.id}_{hash(str(filters))}"
            if self._is_cache_valid(cache_key):
                return self.data_cache[cache_key]
            
            # Simulate data processing
            if data_source.type == "projects":
                data = await self._get_project_data(filters)
            elif data_source.type == "calculations":
                data = await self._get_calculation_data(filters)
            elif data_source.type == "users":
                data = await self._get_user_data(filters)
            elif data_source.type == "system":
                data = await self._get_system_data(filters)
            else:
                data = await self._get_sample_data(data_source, filters)
            
            # Cache the result
            self.data_cache[cache_key] = data
            self.cache_expiry[cache_key] = datetime.utcnow() + timedelta(minutes=data_source.refresh_interval)
            
            return data
            
        except Exception as e:
            logger.error(f"Data processing failed: {e}")
            return []
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.data_cache:
            return False
        
        expiry = self.cache_expiry.get(cache_key)
        if not expiry or datetime.utcnow() > expiry:
            return False
        
        return True
    
    async def _get_project_data(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get project data"""
        # Simulate project data
        projects = []
        for i in range(50):
            project = {
                "id": f"proj_{i:03d}",
                "name": f"Project {i+1}",
                "status": np.random.choice(["Active", "Completed", "On Hold", "Cancelled"], p=[0.4, 0.3, 0.2, 0.1]),
                "budget": np.random.uniform(50000, 500000),
                "actual_cost": np.random.uniform(40000, 450000),
                "start_date": datetime.utcnow() - timedelta(days=np.random.randint(1, 365)),
                "completion_percentage": np.random.uniform(0, 100),
                "team_size": np.random.randint(3, 15),
                "client_satisfaction": np.random.uniform(3.0, 5.0),
                "energy_savings": np.random.uniform(10, 40),  # percentage
                "hvac_type": np.random.choice(["Commercial", "Residential", "Industrial", "Healthcare"]),
                "region": np.random.choice(["North America", "Europe", "Asia", "Other"])
            }
            projects.append(project)
        
        # Apply filters
        if filters:
            filtered_projects = []
            for project in projects:
                include = True
                
                if "status" in filters and project["status"] not in filters["status"]:
                    include = False
                if "hvac_type" in filters and project["hvac_type"] not in filters["hvac_type"]:
                    include = False
                if "region" in filters and project["region"] not in filters["region"]:
                    include = False
                if "date_range" in filters:
                    start_date = filters["date_range"].get("start")
                    end_date = filters["date_range"].get("end")
                    if start_date and project["start_date"] < start_date:
                        include = False
                    if end_date and project["start_date"] > end_date:
                        include = False
                
                if include:
                    filtered_projects.append(project)
            
            return filtered_projects
        
        return projects
    
    async def _get_calculation_data(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get calculation data"""
        calculations = []
        for i in range(200):
            calc = {
                "id": f"calc_{i:03d}",
                "type": np.random.choice(["Load Calculation", "Duct Sizing", "Equipment Selection", "Energy Analysis"]),
                "project_id": f"proj_{np.random.randint(0, 50):03d}",
                "created_at": datetime.utcnow() - timedelta(days=np.random.randint(1, 365)),
                "execution_time": np.random.uniform(0.5, 30.0),  # seconds
                "accuracy": np.random.uniform(95, 99.9),  # percentage
                "complexity": np.random.choice(["Simple", "Medium", "Complex"]),
                "user_id": f"user_{np.random.randint(1, 20):03d}",
                "iterations": np.random.randint(1, 10),
                "energy_impact": np.random.uniform(-20, 30)  # percentage change
            }
            calculations.append(calc)
        
        return calculations
    
    async def _get_user_data(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get user activity data"""
        users = []
        for i in range(20):
            user = {
                "id": f"user_{i+1:03d}",
                "name": f"User {i+1}",
                "role": np.random.choice(["Engineer", "Manager", "Analyst", "Admin"]),
                "login_count": np.random.randint(50, 300),
                "last_login": datetime.utcnow() - timedelta(days=np.random.randint(0, 30)),
                "projects_count": np.random.randint(5, 25),
                "calculations_count": np.random.randint(20, 150),
                "avg_session_duration": np.random.uniform(30, 180),  # minutes
                "efficiency_score": np.random.uniform(70, 95),
                "department": np.random.choice(["HVAC Design", "Energy Analysis", "Project Management", "Quality Assurance"])
            }
            users.append(user)
        
        return users
    
    async def _get_system_data(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get system performance data"""
        # Generate hourly data for the last 30 days
        system_data = []
        base_time = datetime.utcnow() - timedelta(days=30)
        
        for hour in range(30 * 24):
            timestamp = base_time + timedelta(hours=hour)
            data_point = {
                "timestamp": timestamp,
                "cpu_usage": np.random.uniform(20, 80),
                "memory_usage": np.random.uniform(40, 90),
                "disk_usage": np.random.uniform(30, 70),
                "network_io": np.random.uniform(100, 1000),  # MB/s
                "active_users": np.random.randint(5, 50),
                "response_time": np.random.uniform(100, 2000),  # ms
                "error_rate": np.random.uniform(0, 5),  # percentage
                "throughput": np.random.uniform(100, 1000)  # requests/minute
            }
            system_data.append(data_point)
        
        return system_data
    
    async def _get_sample_data(self, data_source: DataSource, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get sample data for custom sources"""
        # Generate sample data based on data source configuration
        sample_data = []
        for i in range(100):
            data_point = {
                "id": i,
                "value": np.random.uniform(0, 100),
                "category": np.random.choice(["A", "B", "C", "D"]),
                "timestamp": datetime.utcnow() - timedelta(days=np.random.randint(0, 365)),
                "metric": np.random.uniform(10, 1000)
            }
            sample_data.append(data_point)
        
        return sample_data
    
    def aggregate_data(self, data: List[Dict[str, Any]], field: str, aggregation: AggregationType) -> float:
        """Aggregate data field"""
        if not data:
            return 0.0
        
        values = [item.get(field, 0) for item in data if field in item]
        if not values:
            return 0.0
        
        if aggregation == AggregationType.SUM:
            return sum(values)
        elif aggregation == AggregationType.AVERAGE:
            return statistics.mean(values)
        elif aggregation == AggregationType.COUNT:
            return len(values)
        elif aggregation == AggregationType.MIN:
            return min(values)
        elif aggregation == AggregationType.MAX:
            return max(values)
        elif aggregation == AggregationType.MEDIAN:
            return statistics.median(values)
        else:
            return statistics.mean(values)

class ReportGenerator:
    """Report generation engine"""
    
    def __init__(self, data_processor: DataProcessor):
        self.data_processor = data_processor
    
    async def generate_report(self, template: ReportTemplate, parameters: Dict[str, Any] = None) -> ReportInstance:
        """Generate report from template"""
        logger.info(f"Generating report: {template.name}")
        
        report_id = f"report_{uuid.uuid4().hex[:8]}"
        report_data = {}
        
        try:
            # Process each chart in the template
            for chart in template.charts:
                chart_data = await self._generate_chart_data(chart, parameters)
                report_data[chart.id] = chart_data
            
            # Create report instance
            report = ReportInstance(
                id=report_id,
                template_id=template.id,
                name=f"{template.name} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                generated_at=datetime.utcnow(),
                generated_by=parameters.get("user_id", "system") if parameters else "system",
                parameters=parameters or {},
                data=report_data,
                status="COMPLETED"
            )
            
            logger.info(f"Report generated successfully: {report_id}")
            return report
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return ReportInstance(
                id=report_id,
                template_id=template.id,
                name=f"{template.name} - FAILED",
                generated_at=datetime.utcnow(),
                generated_by=parameters.get("user_id", "system") if parameters else "system",
                parameters=parameters or {},
                data={},
                status="FAILED"
            )
    
    async def _generate_chart_data(self, chart: ChartConfig, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate data for a specific chart"""
        # Get data source
        data_source = DataSource(
            id=chart.data_source,
            name=chart.data_source,
            type=chart.data_source,
            connection_string="",
            query="",
            refresh_interval=15
        )
        
        # Apply filters from chart config and parameters
        filters = chart.filters.copy()
        if parameters:
            filters.update(parameters)
        
        # Get raw data
        raw_data = await self.data_processor.process_data(data_source, filters)
        
        # Process data based on chart type
        if chart.type == ChartType.LINE or chart.type == ChartType.AREA:
            return self._process_time_series_data(raw_data, chart)
        elif chart.type == ChartType.BAR:
            return self._process_categorical_data(raw_data, chart)
        elif chart.type == ChartType.PIE:
            return self._process_pie_data(raw_data, chart)
        elif chart.type == ChartType.SCATTER:
            return self._process_scatter_data(raw_data, chart)
        elif chart.type == ChartType.TABLE:
            return self._process_table_data(raw_data, chart)
        elif chart.type == ChartType.GAUGE:
            return self._process_gauge_data(raw_data, chart)
        else:
            return {"data": raw_data, "chart_type": chart.type.value}
    
    def _process_time_series_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for time series charts"""
        # Group data by time periods
        time_groups = defaultdict(list)
        
        for item in data:
            if chart.x_axis in item:
                time_key = item[chart.x_axis]
                if isinstance(time_key, datetime):
                    time_key = time_key.strftime('%Y-%m-%d')
                time_groups[time_key].append(item)
        
        # Aggregate values for each time period
        chart_data = []
        for time_key, group_data in sorted(time_groups.items()):
            aggregated_value = self.data_processor.aggregate_data(group_data, chart.y_axis, chart.aggregation)
            chart_data.append({
                "x": time_key,
                "y": aggregated_value
            })
        
        return {
            "data": chart_data,
            "chart_type": chart.type.value,
            "title": chart.title,
            "x_label": chart.x_axis,
            "y_label": chart.y_axis
        }
    
    def _process_categorical_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for bar charts"""
        # Group data by categories
        category_groups = defaultdict(list)
        
        for item in data:
            if chart.x_axis in item:
                category = item[chart.x_axis]
                category_groups[category].append(item)
        
        # Aggregate values for each category
        chart_data = []
        for category, group_data in category_groups.items():
            aggregated_value = self.data_processor.aggregate_data(group_data, chart.y_axis, chart.aggregation)
            chart_data.append({
                "category": category,
                "value": aggregated_value
            })
        
        # Sort by value descending
        chart_data.sort(key=lambda x: x["value"], reverse=True)
        
        return {
            "data": chart_data,
            "chart_type": chart.type.value,
            "title": chart.title,
            "x_label": chart.x_axis,
            "y_label": chart.y_axis
        }
    
    def _process_pie_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for pie charts"""
        # Count occurrences of each category
        category_counts = defaultdict(int)
        
        for item in data:
            if chart.x_axis in item:
                category = item[chart.x_axis]
                category_counts[category] += 1
        
        # Convert to chart data
        chart_data = []
        total = sum(category_counts.values())
        
        for category, count in category_counts.items():
            percentage = (count / total * 100) if total > 0 else 0
            chart_data.append({
                "label": category,
                "value": count,
                "percentage": round(percentage, 1)
            })
        
        # Sort by value descending
        chart_data.sort(key=lambda x: x["value"], reverse=True)
        
        return {
            "data": chart_data,
            "chart_type": chart.type.value,
            "title": chart.title,
            "total": total
        }
    
    def _process_scatter_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for scatter plots"""
        chart_data = []
        
        for item in data:
            if chart.x_axis in item and chart.y_axis in item:
                chart_data.append({
                    "x": item[chart.x_axis],
                    "y": item[chart.y_axis],
                    "label": item.get("name", item.get("id", ""))
                })
        
        return {
            "data": chart_data,
            "chart_type": chart.type.value,
            "title": chart.title,
            "x_label": chart.x_axis,
            "y_label": chart.y_axis
        }
    
    def _process_table_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for tables"""
        # Limit to first 100 rows for performance
        table_data = data[:100]
        
        # Get column headers
        columns = set()
        for item in table_data:
            columns.update(item.keys())
        
        return {
            "data": table_data,
            "chart_type": chart.type.value,
            "title": chart.title,
            "columns": sorted(list(columns)),
            "row_count": len(table_data),
            "total_rows": len(data)
        }
    
    def _process_gauge_data(self, data: List[Dict[str, Any]], chart: ChartConfig) -> Dict[str, Any]:
        """Process data for gauge charts"""
        if not data:
            return {
                "data": {"value": 0, "max": 100},
                "chart_type": chart.type.value,
                "title": chart.title
            }
        
        # Calculate aggregated value
        value = self.data_processor.aggregate_data(data, chart.y_axis, chart.aggregation)
        
        # Determine max value (could be from chart config or calculated)
        max_value = chart.styling.get("max_value", 100)
        
        return {
            "data": {
                "value": round(value, 2),
                "max": max_value,
                "percentage": round((value / max_value * 100), 1) if max_value > 0 else 0
            },
            "chart_type": chart.type.value,
            "title": chart.title
        }

class AdvancedReportingAnalyticsSystem:
    """Main advanced reporting and analytics system"""
    
    def __init__(self, db_service=None):
        self.db = db_service
        self.data_processor = DataProcessor()
        self.report_generator = ReportGenerator(self.data_processor)
        
        # In-memory storage for demo
        self.data_sources: Dict[str, DataSource] = {}
        self.report_templates: Dict[str, ReportTemplate] = {}
        self.report_instances: Dict[str, ReportInstance] = {}
        self.dashboards: Dict[str, Dashboard] = {}
        self.kpis: Dict[str, KPI] = {}
        
        self._initialize_default_templates()
        self._initialize_default_dashboards()
        self._initialize_default_kpis()
        
        logger.info("Advanced Reporting & Analytics System initialized")
    
    def _initialize_default_templates(self):
        """Initialize default report templates"""
        # Executive Summary Template
        executive_template = ReportTemplate(
            id="exec_summary",
            name="Executive Summary",
            description="High-level overview of business performance",
            type=ReportType.EXECUTIVE_SUMMARY,
            charts=[
                ChartConfig(
                    id="project_status_pie",
                    title="Project Status Distribution",
                    type=ChartType.PIE,
                    data_source="projects",
                    x_axis="status",
                    y_axis="count",
                    aggregation=AggregationType.COUNT,
                    filters={},
                    styling={}
                ),
                ChartConfig(
                    id="monthly_revenue",
                    title="Monthly Revenue Trend",
                    type=ChartType.LINE,
                    data_source="projects",
                    x_axis="start_date",
                    y_axis="budget",
                    aggregation=AggregationType.SUM,
                    filters={},
                    styling={}
                ),
                ChartConfig(
                    id="top_performers",
                    title="Top Performing Projects",
                    type=ChartType.BAR,
                    data_source="projects",
                    x_axis="name",
                    y_axis="client_satisfaction",
                    aggregation=AggregationType.AVERAGE,
                    filters={"status": ["Completed"]},
                    styling={}
                )
            ],
            layout={"columns": 2, "rows": 2},
            parameters={},
            created_by="system",
            created_at=datetime.utcnow(),
            is_public=True
        )
        
        self.report_templates[executive_template.id] = executive_template
        
        # Project Performance Template
        project_template = ReportTemplate(
            id="project_performance",
            name="Project Performance Analysis",
            description="Detailed analysis of project metrics and KPIs",
            type=ReportType.PROJECT_PERFORMANCE,
            charts=[
                ChartConfig(
                    id="budget_vs_actual",
                    title="Budget vs Actual Cost",
                    type=ChartType.SCATTER,
                    data_source="projects",
                    x_axis="budget",
                    y_axis="actual_cost",
                    aggregation=AggregationType.AVERAGE,
                    filters={},
                    styling={}
                ),
                ChartConfig(
                    id="completion_progress",
                    title="Project Completion Progress",
                    type=ChartType.BAR,
                    data_source="projects",
                    x_axis="name",
                    y_axis="completion_percentage",
                    aggregation=AggregationType.AVERAGE,
                    filters={"status": ["Active"]},
                    styling={}
                ),
                ChartConfig(
                    id="energy_savings",
                    title="Energy Savings by Project Type",
                    type=ChartType.BAR,
                    data_source="projects",
                    x_axis="hvac_type",
                    y_axis="energy_savings",
                    aggregation=AggregationType.AVERAGE,
                    filters={},
                    styling={}
                )
            ],
            layout={"columns": 2, "rows": 2},
            parameters={},
            created_by="system",
            created_at=datetime.utcnow(),
            is_public=True
        )
        
        self.report_templates[project_template.id] = project_template
    
    def _initialize_default_dashboards(self):
        """Initialize default dashboards"""
        executive_dashboard = Dashboard(
            id="exec_dashboard",
            name="Executive Dashboard",
            description="Real-time executive overview",
            widgets=[
                ChartConfig(
                    id="total_projects_gauge",
                    title="Total Active Projects",
                    type=ChartType.GAUGE,
                    data_source="projects",
                    x_axis="status",
                    y_axis="count",
                    aggregation=AggregationType.COUNT,
                    filters={"status": ["Active"]},
                    styling={"max_value": 100}
                ),
                ChartConfig(
                    id="revenue_trend",
                    title="Revenue Trend (30 days)",
                    type=ChartType.LINE,
                    data_source="projects",
                    x_axis="start_date",
                    y_axis="budget",
                    aggregation=AggregationType.SUM,
                    filters={},
                    styling={}
                ),
                ChartConfig(
                    id="user_activity",
                    title="User Activity",
                    type=ChartType.BAR,
                    data_source="users",
                    x_axis="department",
                    y_axis="login_count",
                    aggregation=AggregationType.SUM,
                    filters={},
                    styling={}
                )
            ],
            layout={"columns": 3, "rows": 2},
            refresh_interval=15,
            access_level="ROLE_BASED",
            created_by="system",
            created_at=datetime.utcnow()
        )
        
        self.dashboards[executive_dashboard.id] = executive_dashboard
    
    def _initialize_default_kpis(self):
        """Initialize default KPIs"""
        kpis = [
            KPI(
                id="total_revenue",
                name="Total Revenue",
                description="Total revenue from all projects",
                value=2500000.0,
                target=3000000.0,
                unit="USD",
                trend="UP",
                change_percent=12.5,
                last_updated=datetime.utcnow()
            ),
            KPI(
                id="project_success_rate",
                name="Project Success Rate",
                description="Percentage of projects completed on time and budget",
                value=87.5,
                target=90.0,
                unit="%",
                trend="UP",
                change_percent=3.2,
                last_updated=datetime.utcnow()
            ),
            KPI(
                id="avg_energy_savings",
                name="Average Energy Savings",
                description="Average energy savings across all projects",
                value=23.8,
                target=25.0,
                unit="%",
                trend="STABLE",
                change_percent=0.5,
                last_updated=datetime.utcnow()
            ),
            KPI(
                id="customer_satisfaction",
                name="Customer Satisfaction",
                description="Average customer satisfaction score",
                value=4.3,
                target=4.5,
                unit="/5",
                trend="UP",
                change_percent=2.1,
                last_updated=datetime.utcnow()
            )
        ]
        
        for kpi in kpis:
            self.kpis[kpi.id] = kpi
    
    async def generate_report(self, template_id: str, parameters: Dict[str, Any] = None) -> ReportInstance:
        """Generate report from template"""
        template = self.report_templates.get(template_id)
        if not template:
            raise ValueError(f"Report template not found: {template_id}")
        
        report = await self.report_generator.generate_report(template, parameters)
        self.report_instances[report.id] = report
        
        return report
    
    async def get_dashboard_data(self, dashboard_id: str) -> Dict[str, Any]:
        """Get dashboard data"""
        dashboard = self.dashboards.get(dashboard_id)
        if not dashboard:
            raise ValueError(f"Dashboard not found: {dashboard_id}")
        
        dashboard_data = {
            "id": dashboard.id,
            "name": dashboard.name,
            "description": dashboard.description,
            "layout": dashboard.layout,
            "widgets": []
        }
        
        # Generate data for each widget
        for widget in dashboard.widgets:
            widget_data = await self.report_generator._generate_chart_data(widget)
            dashboard_data["widgets"].append({
                "id": widget.id,
                "title": widget.title,
                "type": widget.type.value,
                "data": widget_data
            })
        
        return dashboard_data
    
    def get_kpis(self) -> List[KPI]:
        """Get all KPIs"""
        return list(self.kpis.values())
    
    def get_report_templates(self) -> List[ReportTemplate]:
        """Get all report templates"""
        return list(self.report_templates.values())
    
    def get_dashboards(self) -> List[Dashboard]:
        """Get all dashboards"""
        return list(self.dashboards.values())
    
    def get_analytics_status(self) -> Dict[str, Any]:
        """Get analytics system status"""
        return {
            "report_templates": len(self.report_templates),
            "generated_reports": len(self.report_instances),
            "dashboards": len(self.dashboards),
            "kpis": len(self.kpis),
            "data_sources": len(self.data_sources),
            "cache_size": len(self.data_processor.data_cache),
            "last_updated": datetime.utcnow().isoformat()
        }

# Global advanced reporting and analytics system instance
analytics_system = AdvancedReportingAnalyticsSystem()
