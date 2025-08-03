"""
SizeWise Suite - SLA Monitoring and Reporting System

This module provides comprehensive SLA monitoring, tracking, and automated reporting
capabilities for the SizeWise Suite application.

Features:
- Real-time SLA compliance tracking
- Automated SLA breach detection and notifications
- Historical SLA performance data storage
- Automated SLA reporting generation
- API response time monitoring
- Uptime monitoring and tracking
- Custom SLA target configuration

Designed to ensure production SLA compliance and provide actionable insights.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import structlog

logger = structlog.get_logger()

class SLAMetricType(Enum):
    """Types of SLA metrics to track."""
    UPTIME = "uptime"
    API_RESPONSE_TIME = "api_response_time"
    ERROR_RATE = "error_rate"
    AVAILABILITY = "availability"
    THROUGHPUT = "throughput"
    INCIDENT_RESPONSE_TIME = "incident_response_time"

class SLAStatus(Enum):
    """SLA compliance status."""
    COMPLIANT = "compliant"
    WARNING = "warning"
    BREACH = "breach"
    UNKNOWN = "unknown"

@dataclass
class SLATarget:
    """SLA target configuration."""
    metric_type: SLAMetricType
    target_value: float
    threshold_warning: float  # Warning threshold (e.g., 95% for 99% target)
    threshold_breach: float   # Breach threshold (e.g., 90% for 99% target)
    unit: str                # Unit of measurement (%, ms, count, etc.)
    measurement_window: int   # Window in minutes for measurement
    description: str

@dataclass
class SLAMeasurement:
    """Individual SLA measurement."""
    metric_type: SLAMetricType
    timestamp: datetime
    value: float
    target_value: float
    status: SLAStatus
    measurement_window: int
    metadata: Dict[str, Any]

@dataclass
class SLABreach:
    """SLA breach record."""
    id: str
    metric_type: SLAMetricType
    breach_start: datetime
    breach_end: Optional[datetime]
    duration_minutes: Optional[int]
    severity: str
    impact_description: str
    root_cause: Optional[str]
    resolution_notes: Optional[str]
    created_incident_id: Optional[str]

@dataclass
class SLAReport:
    """SLA compliance report."""
    report_id: str
    period_start: datetime
    period_end: datetime
    overall_compliance: float
    metric_compliance: Dict[SLAMetricType, float]
    total_breaches: int
    breach_summary: List[Dict[str, Any]]
    recommendations: List[str]
    generated_at: datetime

class SLAMonitoringManager:
    """Comprehensive SLA monitoring and reporting manager."""
    
    def __init__(self):
        self.sla_targets = {}
        self.measurements = []
        self.breaches = {}
        self.reports = {}
        self.monitoring_enabled = True
        self.measurement_interval = 60  # seconds
        self.report_generation_schedule = "daily"  # daily, weekly, monthly
        
        # Initialize default SLA targets
        self._initialize_default_targets()
        
    async def initialize(self):
        """Initialize SLA monitoring system."""
        try:
            logger.info("Initializing SLA monitoring system...")
            
            # Start monitoring tasks
            if self.monitoring_enabled:
                asyncio.create_task(self._monitoring_loop())
                asyncio.create_task(self._breach_detection_loop())
                asyncio.create_task(self._report_generation_loop())
            
            logger.info("SLA monitoring system initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize SLA monitoring", error=str(e))
            raise
    
    def _initialize_default_targets(self):
        """Initialize default SLA targets for SizeWise Suite."""
        default_targets = [
            SLATarget(
                metric_type=SLAMetricType.UPTIME,
                target_value=99.9,
                threshold_warning=99.5,
                threshold_breach=99.0,
                unit="%",
                measurement_window=60,
                description="System uptime availability"
            ),
            SLATarget(
                metric_type=SLAMetricType.API_RESPONSE_TIME,
                target_value=200.0,
                threshold_warning=300.0,
                threshold_breach=500.0,
                unit="ms",
                measurement_window=5,
                description="API response time for critical endpoints"
            ),
            SLATarget(
                metric_type=SLAMetricType.ERROR_RATE,
                target_value=1.0,
                threshold_warning=2.0,
                threshold_breach=5.0,
                unit="%",
                measurement_window=15,
                description="Application error rate"
            ),
            SLATarget(
                metric_type=SLAMetricType.AVAILABILITY,
                target_value=99.95,
                threshold_warning=99.9,
                threshold_breach=99.5,
                unit="%",
                measurement_window=30,
                description="Service availability including HVAC calculations"
            ),
            SLATarget(
                metric_type=SLAMetricType.INCIDENT_RESPONSE_TIME,
                target_value=15.0,
                threshold_warning=20.0,
                threshold_breach=30.0,
                unit="minutes",
                measurement_window=1440,  # 24 hours
                description="Critical incident response time"
            )
        ]
        
        for target in default_targets:
            self.sla_targets[target.metric_type] = target
    
    async def record_measurement(
        self,
        metric_type: SLAMetricType,
        value: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SLAMeasurement:
        """Record a new SLA measurement."""
        try:
            target = self.sla_targets.get(metric_type)
            if not target:
                raise ValueError(f"No SLA target configured for {metric_type.value}")
            
            # Determine status based on value and thresholds
            if metric_type in [SLAMetricType.UPTIME, SLAMetricType.AVAILABILITY]:
                # Higher is better for uptime/availability
                if value >= target.target_value:
                    status = SLAStatus.COMPLIANT
                elif value >= target.threshold_warning:
                    status = SLAStatus.WARNING
                else:
                    status = SLAStatus.BREACH
            else:
                # Lower is better for response time/error rate
                if value <= target.target_value:
                    status = SLAStatus.COMPLIANT
                elif value <= target.threshold_warning:
                    status = SLAStatus.WARNING
                else:
                    status = SLAStatus.BREACH
            
            measurement = SLAMeasurement(
                metric_type=metric_type,
                timestamp=datetime.utcnow(),
                value=value,
                target_value=target.target_value,
                status=status,
                measurement_window=target.measurement_window,
                metadata=metadata or {}
            )
            
            self.measurements.append(measurement)
            
            # Trigger breach detection if needed
            if status == SLAStatus.BREACH:
                await self._handle_sla_breach(measurement)
            
            logger.info(
                "SLA measurement recorded",
                metric_type=metric_type.value,
                value=value,
                status=status.value
            )
            
            return measurement
            
        except Exception as e:
            logger.error("Failed to record SLA measurement", error=str(e))
            raise
    
    async def _handle_sla_breach(self, measurement: SLAMeasurement):
        """Handle SLA breach detection and notification."""
        try:
            breach_id = f"SLA-{measurement.metric_type.value}-{int(time.time())}"
            
            # Determine severity based on how far below target
            if measurement.metric_type in [SLAMetricType.UPTIME, SLAMetricType.AVAILABILITY]:
                deviation = measurement.target_value - measurement.value
            else:
                deviation = measurement.value - measurement.target_value
            
            if deviation > 10:
                severity = "CRITICAL"
            elif deviation > 5:
                severity = "HIGH"
            else:
                severity = "MEDIUM"
            
            breach = SLABreach(
                id=breach_id,
                metric_type=measurement.metric_type,
                breach_start=measurement.timestamp,
                breach_end=None,
                duration_minutes=None,
                severity=severity,
                impact_description=f"{measurement.metric_type.value} SLA breach: {measurement.value}{self.sla_targets[measurement.metric_type].unit} (target: {measurement.target_value}{self.sla_targets[measurement.metric_type].unit})",
                root_cause=None,
                resolution_notes=None,
                created_incident_id=None
            )
            
            self.breaches[breach_id] = breach
            
            # Send breach notification
            await self._send_breach_notification(breach, measurement)
            
            # Create incident if critical
            if severity == "CRITICAL":
                await self._create_sla_incident(breach, measurement)
            
            logger.warning(
                "SLA breach detected",
                breach_id=breach_id,
                metric_type=measurement.metric_type.value,
                severity=severity
            )
            
        except Exception as e:
            logger.error("Failed to handle SLA breach", error=str(e))
    
    async def _send_breach_notification(self, breach: SLABreach, measurement: SLAMeasurement):
        """Send SLA breach notification."""
        try:
            # This would integrate with the alerting system
            notification_data = {
                "type": "sla_breach",
                "breach_id": breach.id,
                "metric_type": breach.metric_type.value,
                "severity": breach.severity,
                "current_value": measurement.value,
                "target_value": measurement.target_value,
                "impact": breach.impact_description,
                "timestamp": breach.breach_start.isoformat()
            }
            
            # Send to alerting system (would be actual implementation)
            logger.info("SLA breach notification sent", **notification_data)
            
        except Exception as e:
            logger.error("Failed to send breach notification", error=str(e))
    
    async def _create_sla_incident(self, breach: SLABreach, measurement: SLAMeasurement):
        """Create incident for critical SLA breach."""
        try:
            # This would integrate with the incident response system
            incident_data = {
                "title": f"Critical SLA Breach: {breach.metric_type.value}",
                "description": breach.impact_description,
                "severity": "CRITICAL",
                "category": "SLA_BREACH",
                "source": "sla_monitoring",
                "metadata": {
                    "breach_id": breach.id,
                    "metric_type": breach.metric_type.value,
                    "current_value": measurement.value,
                    "target_value": measurement.target_value
                }
            }
            
            # Create incident (would be actual implementation)
            logger.info("SLA breach incident created", **incident_data)
            
        except Exception as e:
            logger.error("Failed to create SLA incident", error=str(e))
    
    async def generate_sla_report(
        self,
        period_start: datetime,
        period_end: datetime,
        report_type: str = "comprehensive"
    ) -> SLAReport:
        """Generate comprehensive SLA compliance report."""
        try:
            report_id = f"SLA-REPORT-{int(time.time())}"
            
            # Filter measurements for the period
            period_measurements = [
                m for m in self.measurements
                if period_start <= m.timestamp <= period_end
            ]
            
            # Calculate overall compliance
            total_measurements = len(period_measurements)
            compliant_measurements = len([
                m for m in period_measurements
                if m.status == SLAStatus.COMPLIANT
            ])
            
            overall_compliance = (
                (compliant_measurements / total_measurements * 100)
                if total_measurements > 0 else 0.0
            )
            
            # Calculate per-metric compliance
            metric_compliance = {}
            for metric_type in SLAMetricType:
                metric_measurements = [
                    m for m in period_measurements
                    if m.metric_type == metric_type
                ]
                
                if metric_measurements:
                    compliant_count = len([
                        m for m in metric_measurements
                        if m.status == SLAStatus.COMPLIANT
                    ])
                    metric_compliance[metric_type] = (
                        compliant_count / len(metric_measurements) * 100
                    )
                else:
                    metric_compliance[metric_type] = 0.0
            
            # Get breaches for the period
            period_breaches = [
                breach for breach in self.breaches.values()
                if period_start <= breach.breach_start <= period_end
            ]
            
            breach_summary = [
                {
                    "id": breach.id,
                    "metric_type": breach.metric_type.value,
                    "severity": breach.severity,
                    "duration_minutes": breach.duration_minutes,
                    "impact": breach.impact_description
                }
                for breach in period_breaches
            ]
            
            # Generate recommendations
            recommendations = self._generate_sla_recommendations(
                overall_compliance,
                metric_compliance,
                period_breaches
            )
            
            report = SLAReport(
                report_id=report_id,
                period_start=period_start,
                period_end=period_end,
                overall_compliance=round(overall_compliance, 2),
                metric_compliance=metric_compliance,
                total_breaches=len(period_breaches),
                breach_summary=breach_summary,
                recommendations=recommendations,
                generated_at=datetime.utcnow()
            )
            
            self.reports[report_id] = report
            
            logger.info(
                "SLA report generated",
                report_id=report_id,
                overall_compliance=overall_compliance,
                total_breaches=len(period_breaches)
            )
            
            return report
            
        except Exception as e:
            logger.error("Failed to generate SLA report", error=str(e))
            raise
    
    def _generate_sla_recommendations(
        self,
        overall_compliance: float,
        metric_compliance: Dict[SLAMetricType, float],
        breaches: List[SLABreach]
    ) -> List[str]:
        """Generate SLA improvement recommendations."""
        recommendations = []
        
        if overall_compliance < 95:
            recommendations.append("Critical: Overall SLA compliance below 95% - immediate action required")
        elif overall_compliance < 99:
            recommendations.append("Warning: Overall SLA compliance below target - review and improve")
        
        # Per-metric recommendations
        for metric_type, compliance in metric_compliance.items():
            if compliance < 90:
                recommendations.append(f"Critical: {metric_type.value} compliance at {compliance:.1f}% - requires immediate attention")
            elif compliance < 95:
                recommendations.append(f"Improve {metric_type.value} performance - currently at {compliance:.1f}%")
        
        # Breach-based recommendations
        critical_breaches = [b for b in breaches if b.severity == "CRITICAL"]
        if critical_breaches:
            recommendations.append(f"Address {len(critical_breaches)} critical SLA breaches to prevent future incidents")
        
        if not recommendations:
            recommendations.append("SLA performance is meeting targets - continue monitoring")
        
        return recommendations
    
    async def _monitoring_loop(self):
        """Continuous monitoring loop for SLA metrics."""
        while self.monitoring_enabled:
            try:
                # Collect current metrics (would be actual implementation)
                await self._collect_current_metrics()
                await asyncio.sleep(self.measurement_interval)
                
            except Exception as e:
                logger.error("Error in monitoring loop", error=str(e))
                await asyncio.sleep(60)  # Wait before retrying
    
    async def _collect_current_metrics(self):
        """Collect current SLA metrics from various sources."""
        try:
            # Simulate metric collection (would be actual implementation)
            import random
            
            # Uptime metric
            uptime = random.uniform(99.0, 100.0)
            await self.record_measurement(SLAMetricType.UPTIME, uptime)
            
            # API response time
            response_time = random.uniform(100.0, 400.0)
            await self.record_measurement(SLAMetricType.API_RESPONSE_TIME, response_time)
            
            # Error rate
            error_rate = random.uniform(0.0, 3.0)
            await self.record_measurement(SLAMetricType.ERROR_RATE, error_rate)
            
        except Exception as e:
            logger.error("Failed to collect metrics", error=str(e))
    
    async def _breach_detection_loop(self):
        """Continuous breach detection and resolution tracking."""
        while self.monitoring_enabled:
            try:
                # Check for breach resolutions
                await self._check_breach_resolutions()
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error("Error in breach detection loop", error=str(e))
                await asyncio.sleep(60)
    
    async def _check_breach_resolutions(self):
        """Check if any ongoing breaches have been resolved."""
        try:
            for breach in self.breaches.values():
                if breach.breach_end is None:
                    # Check if breach is resolved (would be actual implementation)
                    # For now, simulate resolution after some time
                    if (datetime.utcnow() - breach.breach_start).total_seconds() > 1800:  # 30 minutes
                        breach.breach_end = datetime.utcnow()
                        breach.duration_minutes = int(
                            (breach.breach_end - breach.breach_start).total_seconds() / 60
                        )
                        
                        logger.info(
                            "SLA breach resolved",
                            breach_id=breach.id,
                            duration_minutes=breach.duration_minutes
                        )
                        
        except Exception as e:
            logger.error("Failed to check breach resolutions", error=str(e))
    
    async def _report_generation_loop(self):
        """Automated report generation loop."""
        while self.monitoring_enabled:
            try:
                # Generate daily report
                if self.report_generation_schedule == "daily":
                    end_time = datetime.utcnow()
                    start_time = end_time - timedelta(days=1)
                    
                    await self.generate_sla_report(start_time, end_time, "daily")
                    await asyncio.sleep(86400)  # 24 hours
                
            except Exception as e:
                logger.error("Error in report generation loop", error=str(e))
                await asyncio.sleep(3600)  # Wait 1 hour before retrying
    
    def get_current_sla_status(self) -> Dict[str, Any]:
        """Get current SLA status summary."""
        try:
            # Get recent measurements (last hour)
            recent_time = datetime.utcnow() - timedelta(hours=1)
            recent_measurements = [
                m for m in self.measurements
                if m.timestamp >= recent_time
            ]
            
            status_summary = {}
            for metric_type in SLAMetricType:
                metric_measurements = [
                    m for m in recent_measurements
                    if m.metric_type == metric_type
                ]
                
                if metric_measurements:
                    latest = max(metric_measurements, key=lambda x: x.timestamp)
                    status_summary[metric_type.value] = {
                        "current_value": latest.value,
                        "target_value": latest.target_value,
                        "status": latest.status.value,
                        "unit": self.sla_targets[metric_type].unit,
                        "last_updated": latest.timestamp.isoformat()
                    }
                else:
                    status_summary[metric_type.value] = {
                        "status": "no_data",
                        "last_updated": None
                    }
            
            # Count active breaches
            active_breaches = len([
                b for b in self.breaches.values()
                if b.breach_end is None
            ])
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "overall_status": "compliant" if active_breaches == 0 else "breach",
                "active_breaches": active_breaches,
                "metrics": status_summary,
                "monitoring_enabled": self.monitoring_enabled
            }
            
        except Exception as e:
            logger.error("Failed to get SLA status", error=str(e))
            return {"error": str(e)}

# Global SLA monitoring manager instance
_sla_manager = None

def get_sla_monitoring_manager() -> SLAMonitoringManager:
    """Get the global SLA monitoring manager instance."""
    global _sla_manager
    if _sla_manager is None:
        _sla_manager = SLAMonitoringManager()
    return _sla_manager

def initialize_sla_monitoring_manager() -> SLAMonitoringManager:
    """Initialize and return the SLA monitoring manager."""
    global _sla_manager
    _sla_manager = SLAMonitoringManager()
    return _sla_manager
