"""
Compliance Management System for SizeWise Suite
Comprehensive compliance framework supporting SOC 2, GDPR, HIPAA, and industry-specific regulations.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComplianceFramework(Enum):
    """Supported compliance frameworks"""
    SOC2 = "SOC2"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    ASHRAE = "ASHRAE"
    NFPA = "NFPA"
    SMACNA = "SMACNA"
    ISO27001 = "ISO27001"
    PCI_DSS = "PCI_DSS"

class ComplianceStatus(Enum):
    """Compliance status levels"""
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT"
    UNDER_REVIEW = "UNDER_REVIEW"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class DataClassification(Enum):
    """Data classification levels"""
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"
    PII = "PII"  # Personally Identifiable Information
    PHI = "PHI"  # Protected Health Information

@dataclass
class ComplianceRequirement:
    """Individual compliance requirement"""
    id: str
    framework: ComplianceFramework
    title: str
    description: str
    control_id: str
    category: str
    mandatory: bool
    implementation_guidance: str
    evidence_required: List[str]
    testing_procedures: List[str]
    remediation_steps: List[str]

@dataclass
class ComplianceAssessment:
    """Compliance assessment result"""
    id: str
    requirement_id: str
    status: ComplianceStatus
    score: float  # 0-100
    evidence_provided: List[str]
    gaps_identified: List[str]
    recommendations: List[str]
    assessor: str
    assessment_date: datetime
    next_review_date: datetime
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL

@dataclass
class DataGovernancePolicy:
    """Data governance policy definition"""
    id: str
    name: str
    description: str
    data_types: List[DataClassification]
    retention_period_days: int
    encryption_required: bool
    access_controls: List[str]
    backup_required: bool
    deletion_procedures: List[str]
    compliance_frameworks: List[ComplianceFramework]

@dataclass
class ComplianceReport:
    """Compliance report structure"""
    id: str
    framework: ComplianceFramework
    report_date: datetime
    overall_score: float
    compliant_requirements: int
    total_requirements: int
    critical_gaps: List[str]
    recommendations: List[str]
    next_assessment_date: datetime
    generated_by: str

class SOC2ComplianceManager:
    """SOC 2 compliance management"""
    
    def __init__(self):
        self.trust_service_criteria = {
            "security": "Security - Protection against unauthorized access",
            "availability": "Availability - System operation and usability",
            "processing_integrity": "Processing Integrity - Complete and accurate processing",
            "confidentiality": "Confidentiality - Information designated as confidential",
            "privacy": "Privacy - Personal information collection, use, retention, and disposal"
        }
    
    def get_requirements(self) -> List[ComplianceRequirement]:
        """Get SOC 2 compliance requirements"""
        requirements = []
        
        # Security criteria requirements
        requirements.extend([
            ComplianceRequirement(
                id="soc2_sec_1",
                framework=ComplianceFramework.SOC2,
                title="Access Controls",
                description="Logical and physical access controls restrict access to system resources",
                control_id="CC6.1",
                category="security",
                mandatory=True,
                implementation_guidance="Implement role-based access controls, multi-factor authentication, and regular access reviews",
                evidence_required=["Access control policies", "User access reports", "MFA implementation"],
                testing_procedures=["Review access control configurations", "Test MFA implementation", "Validate user provisioning"],
                remediation_steps=["Implement RBAC", "Enable MFA", "Conduct access reviews"]
            ),
            ComplianceRequirement(
                id="soc2_sec_2",
                framework=ComplianceFramework.SOC2,
                title="System Monitoring",
                description="System activities are monitored and logged",
                control_id="CC7.1",
                category="security",
                mandatory=True,
                implementation_guidance="Implement comprehensive logging and monitoring of system activities",
                evidence_required=["Monitoring policies", "Log retention procedures", "Security event logs"],
                testing_procedures=["Review monitoring configurations", "Test log collection", "Validate alerting"],
                remediation_steps=["Implement SIEM", "Configure log retention", "Set up alerting"]
            ),
            ComplianceRequirement(
                id="soc2_sec_3",
                framework=ComplianceFramework.SOC2,
                title="Data Encryption",
                description="Data is encrypted in transit and at rest",
                control_id="CC6.7",
                category="security",
                mandatory=True,
                implementation_guidance="Implement encryption for data at rest and in transit using industry standards",
                evidence_required=["Encryption policies", "TLS certificates", "Encryption implementation"],
                testing_procedures=["Verify encryption implementation", "Test TLS configuration", "Review key management"],
                remediation_steps=["Implement AES-256 encryption", "Configure TLS 1.3", "Establish key management"]
            )
        ])
        
        return requirements

class GDPRComplianceManager:
    """GDPR compliance management"""
    
    def __init__(self):
        self.data_subject_rights = [
            "right_to_information",
            "right_of_access",
            "right_to_rectification",
            "right_to_erasure",
            "right_to_restrict_processing",
            "right_to_data_portability",
            "right_to_object",
            "rights_related_to_automated_decision_making"
        ]
    
    def get_requirements(self) -> List[ComplianceRequirement]:
        """Get GDPR compliance requirements"""
        requirements = []
        
        requirements.extend([
            ComplianceRequirement(
                id="gdpr_art_6",
                framework=ComplianceFramework.GDPR,
                title="Lawful Basis for Processing",
                description="Processing must have a lawful basis under Article 6",
                control_id="Art. 6",
                category="data_processing",
                mandatory=True,
                implementation_guidance="Identify and document lawful basis for all data processing activities",
                evidence_required=["Data processing register", "Lawful basis documentation", "Consent records"],
                testing_procedures=["Review processing activities", "Validate lawful basis", "Check consent mechanisms"],
                remediation_steps=["Document lawful basis", "Implement consent management", "Update privacy notices"]
            ),
            ComplianceRequirement(
                id="gdpr_art_32",
                framework=ComplianceFramework.GDPR,
                title="Security of Processing",
                description="Implement appropriate technical and organizational measures",
                control_id="Art. 32",
                category="security",
                mandatory=True,
                implementation_guidance="Implement encryption, access controls, and security monitoring",
                evidence_required=["Security policies", "Encryption implementation", "Access controls"],
                testing_procedures=["Security assessment", "Penetration testing", "Access control review"],
                remediation_steps=["Implement encryption", "Configure access controls", "Establish monitoring"]
            ),
            ComplianceRequirement(
                id="gdpr_art_33",
                framework=ComplianceFramework.GDPR,
                title="Breach Notification",
                description="Notify supervisory authority of personal data breaches within 72 hours",
                control_id="Art. 33",
                category="incident_response",
                mandatory=True,
                implementation_guidance="Establish breach detection and notification procedures",
                evidence_required=["Incident response plan", "Breach notification procedures", "Training records"],
                testing_procedures=["Test incident response", "Review notification procedures", "Validate timelines"],
                remediation_steps=["Develop incident response plan", "Implement breach detection", "Train staff"]
            )
        ])
        
        return requirements

class HIPAAComplianceManager:
    """HIPAA compliance management"""
    
    def __init__(self):
        self.safeguards = {
            "administrative": "Administrative Safeguards",
            "physical": "Physical Safeguards", 
            "technical": "Technical Safeguards"
        }
    
    def get_requirements(self) -> List[ComplianceRequirement]:
        """Get HIPAA compliance requirements"""
        requirements = []
        
        requirements.extend([
            ComplianceRequirement(
                id="hipaa_164_308",
                framework=ComplianceFramework.HIPAA,
                title="Administrative Safeguards",
                description="Implement administrative safeguards for PHI protection",
                control_id="164.308",
                category="administrative",
                mandatory=True,
                implementation_guidance="Establish security officer, workforce training, and access management",
                evidence_required=["Security policies", "Training records", "Access management procedures"],
                testing_procedures=["Review policies", "Validate training", "Test access controls"],
                remediation_steps=["Appoint security officer", "Implement training", "Establish access management"]
            ),
            ComplianceRequirement(
                id="hipaa_164_312",
                framework=ComplianceFramework.HIPAA,
                title="Technical Safeguards",
                description="Implement technical safeguards for PHI protection",
                control_id="164.312",
                category="technical",
                mandatory=True,
                implementation_guidance="Implement access controls, audit controls, and encryption",
                evidence_required=["Technical controls documentation", "Audit logs", "Encryption implementation"],
                testing_procedures=["Test access controls", "Review audit logs", "Verify encryption"],
                remediation_steps=["Implement access controls", "Configure audit logging", "Enable encryption"]
            )
        ])
        
        return requirements

class ComplianceManagementSystem:
    """Main compliance management system"""
    
    def __init__(self, db_service=None):
        self.db = db_service
        self.soc2_manager = SOC2ComplianceManager()
        self.gdpr_manager = GDPRComplianceManager()
        self.hipaa_manager = HIPAAComplianceManager()
        
        # In-memory storage for demo
        self.requirements: Dict[str, ComplianceRequirement] = {}
        self.assessments: Dict[str, ComplianceAssessment] = {}
        self.policies: Dict[str, DataGovernancePolicy] = {}
        self.reports: Dict[str, ComplianceReport] = {}
        
        self._initialize_requirements()
        self._initialize_default_policies()
        
        logger.info("Compliance Management System initialized")
    
    def _initialize_requirements(self):
        """Initialize compliance requirements from all frameworks"""
        all_requirements = []
        all_requirements.extend(self.soc2_manager.get_requirements())
        all_requirements.extend(self.gdpr_manager.get_requirements())
        all_requirements.extend(self.hipaa_manager.get_requirements())
        
        for req in all_requirements:
            self.requirements[req.id] = req
        
        logger.info(f"Initialized {len(all_requirements)} compliance requirements")
    
    def _initialize_default_policies(self):
        """Initialize default data governance policies"""
        default_policies = [
            DataGovernancePolicy(
                id="policy_pii",
                name="Personal Information Protection Policy",
                description="Policy for handling personally identifiable information",
                data_types=[DataClassification.PII],
                retention_period_days=2555,  # 7 years
                encryption_required=True,
                access_controls=["role_based_access", "mfa_required"],
                backup_required=True,
                deletion_procedures=["secure_deletion", "certificate_of_destruction"],
                compliance_frameworks=[ComplianceFramework.GDPR, ComplianceFramework.SOC2]
            ),
            DataGovernancePolicy(
                id="policy_hvac_data",
                name="HVAC Engineering Data Policy",
                description="Policy for handling HVAC engineering and calculation data",
                data_types=[DataClassification.CONFIDENTIAL],
                retention_period_days=3650,  # 10 years
                encryption_required=True,
                access_controls=["role_based_access"],
                backup_required=True,
                deletion_procedures=["secure_deletion"],
                compliance_frameworks=[ComplianceFramework.ASHRAE, ComplianceFramework.SOC2]
            )
        ]
        
        for policy in default_policies:
            self.policies[policy.id] = policy
    
    async def conduct_assessment(self, framework: ComplianceFramework, assessor: str) -> ComplianceReport:
        """Conduct compliance assessment for specified framework"""
        logger.info(f"Starting compliance assessment for {framework.value}")
        
        framework_requirements = [req for req in self.requirements.values() if req.framework == framework]
        assessments = []
        
        for requirement in framework_requirements:
            # Simulate assessment (in production, this would involve actual testing)
            assessment = await self._assess_requirement(requirement, assessor)
            assessments.append(assessment)
            self.assessments[assessment.id] = assessment
        
        # Generate compliance report
        report = self._generate_compliance_report(framework, assessments, assessor)
        self.reports[report.id] = report
        
        logger.info(f"Completed compliance assessment for {framework.value}")
        return report
    
    async def _assess_requirement(self, requirement: ComplianceRequirement, assessor: str) -> ComplianceAssessment:
        """Assess individual compliance requirement"""
        # Simulate assessment logic (in production, this would involve actual testing)
        import random
        
        # Simulate assessment score based on requirement criticality
        base_score = 85 if requirement.mandatory else 75
        score = base_score + random.randint(-15, 15)
        score = max(0, min(100, score))
        
        status = ComplianceStatus.COMPLIANT if score >= 80 else ComplianceStatus.PARTIALLY_COMPLIANT
        if score < 60:
            status = ComplianceStatus.NON_COMPLIANT
        
        gaps = []
        recommendations = []
        
        if score < 80:
            gaps.append(f"Implementation gap identified for {requirement.title}")
            recommendations.extend(requirement.remediation_steps)
        
        risk_level = "LOW"
        if score < 70:
            risk_level = "MEDIUM"
        if score < 60:
            risk_level = "HIGH"
        if score < 40:
            risk_level = "CRITICAL"
        
        assessment = ComplianceAssessment(
            id=f"assess_{uuid.uuid4().hex[:8]}",
            requirement_id=requirement.id,
            status=status,
            score=score,
            evidence_provided=requirement.evidence_required[:2],  # Simulate partial evidence
            gaps_identified=gaps,
            recommendations=recommendations,
            assessor=assessor,
            assessment_date=datetime.utcnow(),
            next_review_date=datetime.utcnow() + timedelta(days=365),
            risk_level=risk_level
        )
        
        return assessment
    
    def _generate_compliance_report(self, framework: ComplianceFramework, assessments: List[ComplianceAssessment], assessor: str) -> ComplianceReport:
        """Generate compliance report from assessments"""
        total_requirements = len(assessments)
        compliant_requirements = len([a for a in assessments if a.status == ComplianceStatus.COMPLIANT])
        
        overall_score = sum(a.score for a in assessments) / total_requirements if total_requirements > 0 else 0
        
        critical_gaps = []
        recommendations = []
        
        for assessment in assessments:
            if assessment.risk_level in ["HIGH", "CRITICAL"]:
                critical_gaps.extend(assessment.gaps_identified)
            recommendations.extend(assessment.recommendations)
        
        # Remove duplicates
        critical_gaps = list(set(critical_gaps))
        recommendations = list(set(recommendations))
        
        report = ComplianceReport(
            id=f"report_{framework.value.lower()}_{uuid.uuid4().hex[:8]}",
            framework=framework,
            report_date=datetime.utcnow(),
            overall_score=overall_score,
            compliant_requirements=compliant_requirements,
            total_requirements=total_requirements,
            critical_gaps=critical_gaps,
            recommendations=recommendations,
            next_assessment_date=datetime.utcnow() + timedelta(days=365),
            generated_by=assessor
        )
        
        return report
    
    def get_compliance_status(self, framework: ComplianceFramework = None) -> Dict[str, Any]:
        """Get current compliance status"""
        if framework:
            framework_reports = [r for r in self.reports.values() if r.framework == framework]
            if framework_reports:
                latest_report = max(framework_reports, key=lambda x: x.report_date)
                return {
                    "framework": framework.value,
                    "overall_score": latest_report.overall_score,
                    "compliance_percentage": (latest_report.compliant_requirements / latest_report.total_requirements) * 100,
                    "critical_gaps": len(latest_report.critical_gaps),
                    "last_assessment": latest_report.report_date.isoformat(),
                    "next_assessment": latest_report.next_assessment_date.isoformat()
                }
        
        # Overall compliance status across all frameworks
        all_scores = [r.overall_score for r in self.reports.values()]
        overall_score = sum(all_scores) / len(all_scores) if all_scores else 0
        
        return {
            "overall_score": overall_score,
            "frameworks_assessed": len(set(r.framework for r in self.reports.values())),
            "total_requirements": len(self.requirements),
            "total_assessments": len(self.assessments),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_data_governance_policies(self) -> List[DataGovernancePolicy]:
        """Get all data governance policies"""
        return list(self.policies.values())
    
    def create_data_governance_policy(self, policy: DataGovernancePolicy) -> bool:
        """Create new data governance policy"""
        try:
            self.policies[policy.id] = policy
            logger.info(f"Created data governance policy: {policy.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to create policy: {e}")
            return False
    
    async def generate_compliance_dashboard_data(self) -> Dict[str, Any]:
        """Generate data for compliance dashboard"""
        dashboard_data = {
            "overview": self.get_compliance_status(),
            "frameworks": {},
            "recent_assessments": [],
            "critical_gaps": [],
            "upcoming_reviews": []
        }
        
        # Framework-specific data
        for framework in ComplianceFramework:
            status = self.get_compliance_status(framework)
            if status:
                dashboard_data["frameworks"][framework.value] = status
        
        # Recent assessments
        recent_assessments = sorted(
            self.assessments.values(),
            key=lambda x: x.assessment_date,
            reverse=True
        )[:10]
        
        dashboard_data["recent_assessments"] = [
            {
                "id": a.id,
                "requirement_id": a.requirement_id,
                "status": a.status.value,
                "score": a.score,
                "risk_level": a.risk_level,
                "assessment_date": a.assessment_date.isoformat()
            }
            for a in recent_assessments
        ]
        
        # Critical gaps
        critical_assessments = [a for a in self.assessments.values() if a.risk_level in ["HIGH", "CRITICAL"]]
        for assessment in critical_assessments:
            dashboard_data["critical_gaps"].extend(assessment.gaps_identified)
        
        # Upcoming reviews
        upcoming_reviews = [
            a for a in self.assessments.values()
            if a.next_review_date <= datetime.utcnow() + timedelta(days=30)
        ]
        
        dashboard_data["upcoming_reviews"] = [
            {
                "requirement_id": a.requirement_id,
                "next_review_date": a.next_review_date.isoformat(),
                "risk_level": a.risk_level
            }
            for a in upcoming_reviews
        ]
        
        return dashboard_data
    
    async def export_compliance_report(self, framework: ComplianceFramework, format: str = "json") -> str:
        """Export compliance report in specified format"""
        framework_reports = [r for r in self.reports.values() if r.framework == framework]
        if not framework_reports:
            raise ValueError(f"No reports found for framework {framework.value}")
        
        latest_report = max(framework_reports, key=lambda x: x.report_date)
        
        if format.lower() == "json":
            return json.dumps(asdict(latest_report), default=str, indent=2)
        elif format.lower() == "csv":
            # Implement CSV export logic
            pass
        elif format.lower() == "pdf":
            # Implement PDF export logic
            pass
        
        return json.dumps(asdict(latest_report), default=str, indent=2)


# Global compliance system instance
compliance_system = ComplianceManagementSystem()
