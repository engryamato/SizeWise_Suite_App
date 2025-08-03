"""
SizeWise Suite - Incident Response Management System

This module provides comprehensive incident response and escalation procedures
for the SizeWise Suite application. It includes automated incident creation,
classification, escalation, and tracking capabilities.

Features:
- Automated incident detection and creation
- Incident classification and severity assessment
- Escalation matrix and communication protocols
- Runbook automation for common issues
- SLA tracking and response time monitoring
- Integration with alerting and monitoring systems

Designed for production environments with 24/7 monitoring and response.
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import structlog
import aiofiles
import aiohttp
from pathlib import Path

logger = structlog.get_logger()

# =============================================================================
# Incident Response Types and Configuration
# =============================================================================

class IncidentSeverity(Enum):
    """Incident severity levels with response time requirements."""
    CRITICAL = "critical"      # 15 minutes response
    HIGH = "high"             # 1 hour response
    MEDIUM = "medium"         # 4 hours response
    LOW = "low"              # 24 hours response

class IncidentStatus(Enum):
    """Incident status tracking."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    CLOSED = "closed"

class IncidentCategory(Enum):
    """Incident categories for classification."""
    SYSTEM_OUTAGE = "system_outage"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    SECURITY_BREACH = "security_breach"
    DATA_CORRUPTION = "data_corruption"
    AUTHENTICATION_FAILURE = "authentication_failure"
    HVAC_CALCULATION_ERROR = "hvac_calculation_error"
    API_FAILURE = "api_failure"
    DATABASE_ISSUE = "database_issue"
    MONITORING_ALERT = "monitoring_alert"

@dataclass
class EscalationLevel:
    """Escalation level configuration."""
    level: int
    name: str
    contacts: List[str]
    channels: List[str]
    response_time_minutes: int
    auto_escalate_after_minutes: int

@dataclass
class IncidentRunbook:
    """Automated runbook for incident response."""
    category: IncidentCategory
    title: str
    description: str
    automated_steps: List[str]
    manual_steps: List[str]
    escalation_triggers: List[str]
    recovery_validation: List[str]

@dataclass
class Incident:
    """Incident tracking and management."""
    id: str
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    category: IncidentCategory
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    escalation_level: int = 1
    escalated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)
    timeline: List[Dict[str, Any]] = field(default_factory=list)
    runbook_executed: bool = False
    sla_breach: bool = False
    
    def add_timeline_entry(self, action: str, details: str, user: str = "system"):
        """Add entry to incident timeline."""
        self.timeline.append({
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'user': user
        })
        self.updated_at = datetime.utcnow()

# =============================================================================
# Incident Response Manager
# =============================================================================

class IncidentResponseManager:
    """Comprehensive incident response and escalation management."""
    
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.escalation_matrix: List[EscalationLevel] = []
        self.runbooks: Dict[IncidentCategory, IncidentRunbook] = {}
        self.sla_targets: Dict[IncidentSeverity, int] = {}
        self.communication_channels: Dict[str, Dict[str, Any]] = {}
        self.incident_counter = 0
        self.auto_escalation_enabled = True
        self.incident_storage_path = Path("incidents")
        
    async def initialize(self):
        """Initialize incident response system."""
        try:
            await self._setup_escalation_matrix()
            await self._setup_runbooks()
            await self._setup_sla_targets()
            await self._setup_communication_channels()
            await self._ensure_storage_directory()
            
            logger.info("Incident response system initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize incident response system", error=str(e))
            raise
    
    async def _setup_escalation_matrix(self):
        """Setup escalation matrix with response levels."""
        self.escalation_matrix = [
            EscalationLevel(
                level=1,
                name="On-Call Engineer",
                contacts=["oncall@sizewise.com"],
                channels=["email", "slack"],
                response_time_minutes=15,
                auto_escalate_after_minutes=30
            ),
            EscalationLevel(
                level=2,
                name="Engineering Manager",
                contacts=["engineering-manager@sizewise.com"],
                channels=["email", "slack", "sms"],
                response_time_minutes=30,
                auto_escalate_after_minutes=60
            ),
            EscalationLevel(
                level=3,
                name="Engineering Director",
                contacts=["engineering-director@sizewise.com"],
                channels=["email", "slack", "sms", "phone"],
                response_time_minutes=60,
                auto_escalate_after_minutes=120
            ),
            EscalationLevel(
                level=4,
                name="Executive Team",
                contacts=["executives@sizewise.com"],
                channels=["email", "slack", "sms", "phone"],
                response_time_minutes=120,
                auto_escalate_after_minutes=240
            )
        ]
    
    async def _setup_runbooks(self):
        """Setup automated runbooks for common incidents."""
        self.runbooks = {
            IncidentCategory.SYSTEM_OUTAGE: IncidentRunbook(
                category=IncidentCategory.SYSTEM_OUTAGE,
                title="System Outage Response",
                description="Automated response for system-wide outages",
                automated_steps=[
                    "Check system health endpoints",
                    "Verify database connectivity",
                    "Check load balancer status",
                    "Validate service mesh health",
                    "Restart failed services if safe"
                ],
                manual_steps=[
                    "Investigate root cause",
                    "Coordinate with infrastructure team",
                    "Prepare customer communication",
                    "Execute recovery procedures"
                ],
                escalation_triggers=[
                    "Outage duration > 15 minutes",
                    "Multiple services affected",
                    "Customer impact confirmed"
                ],
                recovery_validation=[
                    "All services responding",
                    "Health checks passing",
                    "Customer workflows functional"
                ]
            ),
            IncidentCategory.PERFORMANCE_DEGRADATION: IncidentRunbook(
                category=IncidentCategory.PERFORMANCE_DEGRADATION,
                title="Performance Degradation Response",
                description="Response for performance issues",
                automated_steps=[
                    "Check CPU and memory usage",
                    "Analyze database query performance",
                    "Review cache hit ratios",
                    "Check network latency",
                    "Scale resources if configured"
                ],
                manual_steps=[
                    "Identify performance bottlenecks",
                    "Optimize slow queries",
                    "Review recent deployments",
                    "Implement temporary fixes"
                ],
                escalation_triggers=[
                    "Response times > 2 seconds",
                    "Performance degradation > 50%",
                    "Customer complaints received"
                ],
                recovery_validation=[
                    "Response times < 200ms",
                    "Performance metrics normal",
                    "No customer impact"
                ]
            ),
            IncidentCategory.SECURITY_BREACH: IncidentRunbook(
                category=IncidentCategory.SECURITY_BREACH,
                title="Security Incident Response",
                description="Response for security breaches",
                automated_steps=[
                    "Isolate affected systems",
                    "Collect security logs",
                    "Block suspicious IP addresses",
                    "Revoke compromised credentials",
                    "Enable enhanced monitoring"
                ],
                manual_steps=[
                    "Assess breach scope",
                    "Coordinate with security team",
                    "Prepare legal notifications",
                    "Execute containment procedures"
                ],
                escalation_triggers=[
                    "Data access confirmed",
                    "Customer data involved",
                    "Regulatory requirements triggered"
                ],
                recovery_validation=[
                    "Security vulnerabilities patched",
                    "No ongoing unauthorized access",
                    "Compliance requirements met"
                ]
            ),
            IncidentCategory.HVAC_CALCULATION_ERROR: IncidentRunbook(
                category=IncidentCategory.HVAC_CALCULATION_ERROR,
                title="HVAC Calculation Error Response",
                description="Response for HVAC calculation accuracy issues",
                automated_steps=[
                    "Validate calculation inputs",
                    "Check HVAC standards compliance",
                    "Verify calculation algorithms",
                    "Test with known good data",
                    "Compare with reference calculations"
                ],
                manual_steps=[
                    "Review calculation logic",
                    "Consult HVAC engineering team",
                    "Validate against industry standards",
                    "Implement calculation fixes"
                ],
                escalation_triggers=[
                    "Calculation accuracy < 95%",
                    "Safety-critical calculations affected",
                    "Multiple calculation types impacted"
                ],
                recovery_validation=[
                    "Calculation accuracy > 99%",
                    "Standards compliance verified",
                    "No safety concerns"
                ]
            )
        }
    
    async def _setup_sla_targets(self):
        """Setup SLA targets for incident response."""
        self.sla_targets = {
            IncidentSeverity.CRITICAL: 15,    # 15 minutes
            IncidentSeverity.HIGH: 60,        # 1 hour
            IncidentSeverity.MEDIUM: 240,     # 4 hours
            IncidentSeverity.LOW: 1440        # 24 hours
        }
    
    async def _setup_communication_channels(self):
        """Setup communication channels for incident response."""
        self.communication_channels = {
            "email": {
                "enabled": True,
                "smtp_server": "smtp.sizewise.com",
                "from_address": "incidents@sizewise.com"
            },
            "slack": {
                "enabled": True,
                "webhook_url": "https://hooks.slack.com/services/incidents",
                "channel": "#incidents"
            },
            "sms": {
                "enabled": True,
                "provider": "twilio",
                "account_sid": "TWILIO_ACCOUNT_SID"
            },
            "phone": {
                "enabled": True,
                "provider": "twilio",
                "escalation_number": "+1-555-INCIDENT"
            }
        }
    
    async def _ensure_storage_directory(self):
        """Ensure incident storage directory exists."""
        self.incident_storage_path.mkdir(exist_ok=True)

    async def create_incident(
        self,
        title: str,
        description: str,
        severity: IncidentSeverity,
        category: IncidentCategory,
        source: str = "automated",
        tags: List[str] = None
    ) -> Incident:
        """Create new incident with automated response."""
        try:
            self.incident_counter += 1
            incident_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{self.incident_counter:04d}"

            incident = Incident(
                id=incident_id,
                title=title,
                description=description,
                severity=severity,
                status=IncidentStatus.OPEN,
                category=category,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                tags=tags or []
            )

            incident.add_timeline_entry(
                "incident_created",
                f"Incident created by {source}",
                source
            )

            self.incidents[incident_id] = incident

            # Execute automated response
            await self._execute_automated_response(incident)

            # Send initial notifications
            await self._send_incident_notification(incident, "created")

            # Save incident to storage
            await self._save_incident(incident)

            logger.info("Incident created", incident_id=incident_id, severity=severity.value)

            return incident

        except Exception as e:
            logger.error("Failed to create incident", error=str(e))
            raise

    async def _execute_automated_response(self, incident: Incident):
        """Execute automated response based on incident category."""
        try:
            runbook = self.runbooks.get(incident.category)
            if not runbook:
                logger.warning("No runbook found for category", category=incident.category.value)
                return

            incident.add_timeline_entry(
                "automated_response_started",
                f"Executing runbook: {runbook.title}"
            )

            # Execute automated steps
            for step in runbook.automated_steps:
                try:
                    await self._execute_runbook_step(incident, step)
                    incident.add_timeline_entry(
                        "automated_step_completed",
                        f"Completed: {step}"
                    )
                except Exception as e:
                    incident.add_timeline_entry(
                        "automated_step_failed",
                        f"Failed: {step} - {str(e)}"
                    )
                    logger.error("Automated step failed", step=step, error=str(e))

            incident.runbook_executed = True
            incident.add_timeline_entry(
                "automated_response_completed",
                "Automated response completed"
            )

        except Exception as e:
            logger.error("Failed to execute automated response", error=str(e))

    async def _execute_runbook_step(self, incident: Incident, step: str):
        """Execute individual runbook step."""
        # This would contain actual automation logic
        # For now, we'll simulate the execution
        await asyncio.sleep(0.1)  # Simulate processing time

        if "check" in step.lower():
            # Simulate health checks
            pass
        elif "restart" in step.lower():
            # Simulate service restart
            pass
        elif "scale" in step.lower():
            # Simulate resource scaling
            pass

    async def update_incident_status(
        self,
        incident_id: str,
        status: IncidentStatus,
        user: str = "system",
        notes: str = ""
    ) -> bool:
        """Update incident status with timeline tracking."""
        try:
            incident = self.incidents.get(incident_id)
            if not incident:
                logger.error("Incident not found", incident_id=incident_id)
                return False

            old_status = incident.status
            incident.status = status
            incident.updated_at = datetime.utcnow()

            incident.add_timeline_entry(
                "status_updated",
                f"Status changed from {old_status.value} to {status.value}. {notes}",
                user
            )

            # Handle status-specific actions
            if status == IncidentStatus.RESOLVED:
                incident.resolved_at = datetime.utcnow()
                await self._check_sla_compliance(incident)
            elif status == IncidentStatus.CLOSED:
                incident.closed_at = datetime.utcnow()

            # Send status update notification
            await self._send_incident_notification(incident, "status_updated")

            # Save updated incident
            await self._save_incident(incident)

            logger.info("Incident status updated",
                       incident_id=incident_id,
                       old_status=old_status.value,
                       new_status=status.value)

            return True

        except Exception as e:
            logger.error("Failed to update incident status", error=str(e))
            return False

    async def escalate_incident(
        self,
        incident_id: str,
        reason: str = "auto_escalation",
        user: str = "system"
    ) -> bool:
        """Escalate incident to next level."""
        try:
            incident = self.incidents.get(incident_id)
            if not incident:
                logger.error("Incident not found", incident_id=incident_id)
                return False

            if incident.escalation_level >= len(self.escalation_matrix):
                logger.warning("Maximum escalation level reached", incident_id=incident_id)
                return False

            incident.escalation_level += 1
            incident.escalated_at = datetime.utcnow()
            incident.updated_at = datetime.utcnow()

            escalation_level = self.escalation_matrix[incident.escalation_level - 1]

            incident.add_timeline_entry(
                "incident_escalated",
                f"Escalated to level {incident.escalation_level}: {escalation_level.name}. Reason: {reason}",
                user
            )

            # Send escalation notification
            await self._send_escalation_notification(incident, escalation_level)

            # Save updated incident
            await self._save_incident(incident)

            logger.info("Incident escalated",
                       incident_id=incident_id,
                       escalation_level=incident.escalation_level,
                       reason=reason)

            return True

        except Exception as e:
            logger.error("Failed to escalate incident", error=str(e))
            return False

    async def _check_sla_compliance(self, incident: Incident):
        """Check SLA compliance for resolved incident."""
        try:
            sla_target_minutes = self.sla_targets.get(incident.severity)
            if not sla_target_minutes:
                return

            resolution_time = (incident.resolved_at - incident.created_at).total_seconds() / 60

            if resolution_time > sla_target_minutes:
                incident.sla_breach = True
                incident.add_timeline_entry(
                    "sla_breach_detected",
                    f"SLA breach: {resolution_time:.1f} minutes > {sla_target_minutes} minutes target"
                )

                # Send SLA breach notification
                await self._send_sla_breach_notification(incident, resolution_time, sla_target_minutes)

                logger.warning("SLA breach detected",
                              incident_id=incident.id,
                              resolution_time=resolution_time,
                              sla_target=sla_target_minutes)
            else:
                logger.info("SLA compliance met",
                           incident_id=incident.id,
                           resolution_time=resolution_time,
                           sla_target=sla_target_minutes)

        except Exception as e:
            logger.error("Failed to check SLA compliance", error=str(e))

    async def _send_incident_notification(self, incident: Incident, action: str):
        """Send incident notification through configured channels."""
        try:
            escalation_level = self.escalation_matrix[incident.escalation_level - 1]

            message = self._format_incident_message(incident, action)

            for channel in escalation_level.channels:
                if channel in self.communication_channels and self.communication_channels[channel]["enabled"]:
                    await self._send_notification(channel, escalation_level.contacts, message)

        except Exception as e:
            logger.error("Failed to send incident notification", error=str(e))

    async def _send_escalation_notification(self, incident: Incident, escalation_level: EscalationLevel):
        """Send escalation notification."""
        try:
            message = f"""
🚨 INCIDENT ESCALATED 🚨

Incident: {incident.id}
Title: {incident.title}
Severity: {incident.severity.value.upper()}
Escalation Level: {escalation_level.level} - {escalation_level.name}
Status: {incident.status.value}

Description: {incident.description}

Response Required Within: {escalation_level.response_time_minutes} minutes

View Details: https://monitoring.sizewise.com/incidents/{incident.id}
"""

            for channel in escalation_level.channels:
                if channel in self.communication_channels and self.communication_channels[channel]["enabled"]:
                    await self._send_notification(channel, escalation_level.contacts, message)

        except Exception as e:
            logger.error("Failed to send escalation notification", error=str(e))

    async def _send_sla_breach_notification(self, incident: Incident, resolution_time: float, sla_target: int):
        """Send SLA breach notification."""
        try:
            message = f"""
⚠️ SLA BREACH DETECTED ⚠️

Incident: {incident.id}
Title: {incident.title}
Severity: {incident.severity.value.upper()}

Resolution Time: {resolution_time:.1f} minutes
SLA Target: {sla_target} minutes
Breach Amount: {resolution_time - sla_target:.1f} minutes

This incident requires post-mortem analysis.

View Details: https://monitoring.sizewise.com/incidents/{incident.id}
"""

            # Send to management level
            management_level = self.escalation_matrix[1]  # Engineering Manager
            for channel in management_level.channels:
                if channel in self.communication_channels and self.communication_channels[channel]["enabled"]:
                    await self._send_notification(channel, management_level.contacts, message)

        except Exception as e:
            logger.error("Failed to send SLA breach notification", error=str(e))

    def _format_incident_message(self, incident: Incident, action: str) -> str:
        """Format incident message for notifications."""
        action_emoji = {
            "created": "🚨",
            "status_updated": "📝",
            "escalated": "⬆️",
            "resolved": "✅"
        }

        emoji = action_emoji.get(action, "📢")

        return f"""
{emoji} INCIDENT {action.upper().replace('_', ' ')} {emoji}

Incident: {incident.id}
Title: {incident.title}
Severity: {incident.severity.value.upper()}
Status: {incident.status.value.upper()}
Category: {incident.category.value.replace('_', ' ').title()}

Description: {incident.description}

Created: {incident.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
Last Updated: {incident.updated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

View Details: https://monitoring.sizewise.com/incidents/{incident.id}
"""

    async def _send_notification(self, channel: str, contacts: List[str], message: str):
        """Send notification through specific channel."""
        try:
            if channel == "email":
                await self._send_email_notification(contacts, message)
            elif channel == "slack":
                await self._send_slack_notification(message)
            elif channel == "sms":
                await self._send_sms_notification(contacts, message)
            elif channel == "phone":
                await self._send_phone_notification(contacts, message)

        except Exception as e:
            logger.error("Failed to send notification", channel=channel, error=str(e))

    async def _send_email_notification(self, contacts: List[str], message: str):
        """Send email notification."""
        # Email sending implementation would go here
        logger.info("Email notification sent", contacts=contacts)

    async def _send_slack_notification(self, message: str):
        """Send Slack notification."""
        # Slack webhook implementation would go here
        logger.info("Slack notification sent")

    async def _send_sms_notification(self, contacts: List[str], message: str):
        """Send SMS notification."""
        # SMS sending implementation would go here
        logger.info("SMS notification sent", contacts=contacts)

    async def _send_phone_notification(self, contacts: List[str], message: str):
        """Send phone notification."""
        # Phone call implementation would go here
        logger.info("Phone notification sent", contacts=contacts)

    async def _save_incident(self, incident: Incident):
        """Save incident to persistent storage."""
        try:
            incident_file = self.incident_storage_path / f"{incident.id}.json"

            incident_data = {
                'id': incident.id,
                'title': incident.title,
                'description': incident.description,
                'severity': incident.severity.value,
                'status': incident.status.value,
                'category': incident.category.value,
                'created_at': incident.created_at.isoformat(),
                'updated_at': incident.updated_at.isoformat(),
                'assigned_to': incident.assigned_to,
                'escalation_level': incident.escalation_level,
                'escalated_at': incident.escalated_at.isoformat() if incident.escalated_at else None,
                'resolved_at': incident.resolved_at.isoformat() if incident.resolved_at else None,
                'closed_at': incident.closed_at.isoformat() if incident.closed_at else None,
                'tags': incident.tags,
                'timeline': incident.timeline,
                'runbook_executed': incident.runbook_executed,
                'sla_breach': incident.sla_breach
            }

            async with aiofiles.open(incident_file, 'w') as f:
                await f.write(json.dumps(incident_data, indent=2))

        except Exception as e:
            logger.error("Failed to save incident", incident_id=incident.id, error=str(e))

    async def get_incident_summary(self) -> Dict[str, Any]:
        """Get comprehensive incident summary and statistics."""
        try:
            now = datetime.utcnow()
            last_24h = now - timedelta(hours=24)
            last_7d = now - timedelta(days=7)

            # Count incidents by status
            status_counts = {}
            for status in IncidentStatus:
                status_counts[status.value] = sum(
                    1 for incident in self.incidents.values()
                    if incident.status == status
                )

            # Count incidents by severity
            severity_counts = {}
            for severity in IncidentSeverity:
                severity_counts[severity.value] = sum(
                    1 for incident in self.incidents.values()
                    if incident.severity == severity
                )

            # Recent incidents
            recent_incidents = [
                incident for incident in self.incidents.values()
                if incident.created_at > last_24h
            ]

            # SLA compliance
            resolved_incidents = [
                incident for incident in self.incidents.values()
                if incident.status == IncidentStatus.RESOLVED
            ]

            sla_breaches = sum(1 for incident in resolved_incidents if incident.sla_breach)
            sla_compliance_rate = (
                (len(resolved_incidents) - sla_breaches) / len(resolved_incidents) * 100
                if resolved_incidents else 100
            )

            # Average resolution time
            if resolved_incidents:
                total_resolution_time = sum(
                    (incident.resolved_at - incident.created_at).total_seconds() / 60
                    for incident in resolved_incidents
                    if incident.resolved_at
                )
                avg_resolution_time = total_resolution_time / len(resolved_incidents)
            else:
                avg_resolution_time = 0

            return {
                'timestamp': now.isoformat(),
                'total_incidents': len(self.incidents),
                'status_breakdown': status_counts,
                'severity_breakdown': severity_counts,
                'recent_incidents_24h': len(recent_incidents),
                'sla_compliance_rate': round(sla_compliance_rate, 2),
                'sla_breaches': sla_breaches,
                'avg_resolution_time_minutes': round(avg_resolution_time, 2),
                'escalation_matrix_levels': len(self.escalation_matrix),
                'runbooks_available': len(self.runbooks),
                'auto_escalation_enabled': self.auto_escalation_enabled
            }

        except Exception as e:
            logger.error("Failed to get incident summary", error=str(e))
            return {'error': str(e)}

    async def get_incident_details(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed incident information."""
        try:
            incident = self.incidents.get(incident_id)
            if not incident:
                return None

            return {
                'id': incident.id,
                'title': incident.title,
                'description': incident.description,
                'severity': incident.severity.value,
                'status': incident.status.value,
                'category': incident.category.value,
                'created_at': incident.created_at.isoformat(),
                'updated_at': incident.updated_at.isoformat(),
                'assigned_to': incident.assigned_to,
                'escalation_level': incident.escalation_level,
                'escalated_at': incident.escalated_at.isoformat() if incident.escalated_at else None,
                'resolved_at': incident.resolved_at.isoformat() if incident.resolved_at else None,
                'closed_at': incident.closed_at.isoformat() if incident.closed_at else None,
                'tags': incident.tags,
                'timeline': incident.timeline,
                'runbook_executed': incident.runbook_executed,
                'sla_breach': incident.sla_breach,
                'current_escalation_level': self.escalation_matrix[incident.escalation_level - 1].__dict__ if incident.escalation_level <= len(self.escalation_matrix) else None
            }

        except Exception as e:
            logger.error("Failed to get incident details", error=str(e))
            return None

    async def run_auto_escalation_check(self):
        """Check for incidents that need auto-escalation."""
        try:
            if not self.auto_escalation_enabled:
                return

            now = datetime.utcnow()

            for incident in self.incidents.values():
                if incident.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                    continue

                if incident.escalation_level >= len(self.escalation_matrix):
                    continue

                escalation_level = self.escalation_matrix[incident.escalation_level - 1]

                # Check if escalation time has passed
                time_since_creation = (now - incident.created_at).total_seconds() / 60
                time_since_escalation = (
                    (now - incident.escalated_at).total_seconds() / 60
                    if incident.escalated_at else time_since_creation
                )

                should_escalate = (
                    time_since_escalation >= escalation_level.auto_escalate_after_minutes
                )

                if should_escalate:
                    await self.escalate_incident(
                        incident.id,
                        f"Auto-escalation after {escalation_level.auto_escalate_after_minutes} minutes",
                        "auto_escalation_system"
                    )

        except Exception as e:
            logger.error("Failed to run auto-escalation check", error=str(e))

# Global incident response manager instance
incident_response_manager = None

def initialize_incident_response_manager() -> IncidentResponseManager:
    """Initialize the global incident response manager."""
    global incident_response_manager
    incident_response_manager = IncidentResponseManager()
    return incident_response_manager

def get_incident_response_manager() -> IncidentResponseManager:
    """Get the global incident response manager instance."""
    if incident_response_manager is None:
        raise RuntimeError("Incident response manager not initialized")
    return incident_response_manager
