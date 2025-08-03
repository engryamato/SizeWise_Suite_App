"""
Advanced HVAC Compliance Checker

Extends existing compliance system with ASHRAE 90.2 and IECC 2024 standards
Part of Phase 1 bridging plan for comprehensive HVAC standards support

@see docs/post-implementation-bridging-plan.md Task 1.2
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

from .compliance_management_system import (
    ComplianceFramework, 
    ComplianceRequirement, 
    ComplianceStatus,
    ComplianceAssessment,
    ComplianceReport
)

logger = logging.getLogger(__name__)


class AdvancedStandard(Enum):
    """Advanced HVAC compliance standards"""
    ASHRAE_90_2 = "ASHRAE_90_2"
    IECC_2024 = "IECC_2024"


@dataclass
class HVACDesign:
    """HVAC design parameters for compliance checking"""
    system_type: str
    airflow_cfm: float
    fan_power_watts: float
    duct_insulation_r_value: float
    duct_leakage_cfm: float
    climate_zone: str
    building_type: str
    conditioned_area_sqft: float
    equipment_efficiency: Dict[str, float]
    controls: Dict[str, Any]


@dataclass
class ComplianceResult:
    """Result of compliance checking"""
    standard: str
    is_compliant: bool
    compliance_percentage: float
    violations: List[str]
    recommendations: List[str]
    critical_issues: int
    warnings: int
    energy_savings_potential: Optional[float] = None
    cost_impact: Optional[str] = None


class AdvancedComplianceChecker:
    """
    Advanced compliance checker extending existing system
    Adds ASHRAE 90.2 and IECC 2024 compliance checking
    """
    
    def __init__(self):
        """Initialize advanced compliance checker"""
        self.ashrae_902_limits = self._initialize_ashrae_902_limits()
        self.iecc_2024_limits = self._initialize_iecc_2024_limits()
        logger.info("Advanced compliance checker initialized")
    
    def _initialize_ashrae_902_limits(self) -> Dict[str, Any]:
        """Initialize ASHRAE 90.2 compliance limits"""
        return {
            "fan_power_limits": {
                # Fan power limits by system type (W/CFM)
                "constant_volume": 1.25,
                "variable_volume": 1.0,
                "single_zone": 0.75,
                "multi_zone": 1.0
            },
            "duct_insulation": {
                # Minimum R-values by climate zone
                "zone_1": {"supply": 4.2, "return": 3.5},
                "zone_2": {"supply": 4.2, "return": 3.5},
                "zone_3": {"supply": 6.0, "return": 3.5},
                "zone_4": {"supply": 6.0, "return": 3.5},
                "zone_5": {"supply": 8.0, "return": 6.0},
                "zone_6": {"supply": 8.0, "return": 6.0},
                "zone_7": {"supply": 8.0, "return": 6.0},
                "zone_8": {"supply": 8.0, "return": 6.0}
            },
            "duct_leakage": {
                # Maximum leakage rates (CFM/100 sq ft @ 1" w.g.)
                "supply": 4.0,
                "return": 6.0,
                "exhaust": 6.0
            },
            "equipment_efficiency": {
                # Minimum efficiency requirements
                "air_conditioner": {
                    "seer_minimum": 14.0,
                    "eer_minimum": 11.0
                },
                "heat_pump": {
                    "seer_minimum": 14.0,
                    "hspf_minimum": 8.2
                },
                "furnace": {
                    "afue_minimum": 80.0
                }
            },
            "controls": {
                "automatic_shutoff": True,
                "demand_control_ventilation": True,
                "economizer_required": True
            }
        }
    
    def _initialize_iecc_2024_limits(self) -> Dict[str, Any]:
        """Initialize IECC 2024 compliance limits"""
        return {
            "fan_power_limits": {
                # Enhanced fan power limits (W/CFM)
                "constant_volume": 1.0,
                "variable_volume": 0.8,
                "single_zone": 0.6,
                "multi_zone": 0.8
            },
            "duct_insulation": {
                # Enhanced R-values by climate zone
                "zone_1": {"supply": 6.0, "return": 4.0},
                "zone_2": {"supply": 6.0, "return": 4.0},
                "zone_3": {"supply": 8.0, "return": 6.0},
                "zone_4": {"supply": 8.0, "return": 6.0},
                "zone_5": {"supply": 10.0, "return": 8.0},
                "zone_6": {"supply": 10.0, "return": 8.0},
                "zone_7": {"supply": 12.0, "return": 10.0},
                "zone_8": {"supply": 12.0, "return": 10.0}
            },
            "duct_leakage": {
                # Stricter leakage rates (CFM/100 sq ft @ 1" w.g.)
                "supply": 3.0,
                "return": 4.0,
                "exhaust": 4.0
            },
            "equipment_efficiency": {
                # Enhanced efficiency requirements
                "air_conditioner": {
                    "seer_minimum": 15.0,
                    "eer_minimum": 12.0
                },
                "heat_pump": {
                    "seer_minimum": 15.0,
                    "hspf_minimum": 8.8
                },
                "furnace": {
                    "afue_minimum": 85.0
                }
            },
            "controls": {
                "automatic_shutoff": True,
                "demand_control_ventilation": True,
                "economizer_required": True,
                "smart_controls": True,
                "zone_control": True
            },
            "renewable_energy": {
                "solar_ready": True,
                "renewable_percentage": 10.0  # Minimum renewable energy percentage
            }
        }
    
    def check_ashrae_902_compliance(self, design: HVACDesign) -> ComplianceResult:
        """
        Check ASHRAE 90.2 compliance for HVAC design
        
        Args:
            design: HVAC design parameters
            
        Returns:
            ComplianceResult with detailed compliance analysis
        """
        logger.info(f"Starting ASHRAE 90.2 compliance check for {design.system_type}")
        
        violations = []
        recommendations = []
        warnings = 0
        critical_issues = 0
        
        limits = self.ashrae_902_limits
        
        # Fan power compliance check
        fan_power_per_cfm = design.fan_power_watts / design.airflow_cfm
        fan_limit = limits["fan_power_limits"].get(design.system_type, 1.25)
        
        if fan_power_per_cfm > fan_limit:
            violations.append(
                f"Fan power {fan_power_per_cfm:.2f} W/CFM exceeds ASHRAE 90.2 limit of {fan_limit} W/CFM"
            )
            critical_issues += 1
            recommendations.append("Consider variable speed drives or more efficient fan selection")
        
        # Duct insulation compliance check
        climate_zone = f"zone_{design.climate_zone}"
        if climate_zone in limits["duct_insulation"]:
            required_r_value = limits["duct_insulation"][climate_zone]["supply"]
            if design.duct_insulation_r_value < required_r_value:
                violations.append(
                    f"Duct insulation R-{design.duct_insulation_r_value} below ASHRAE 90.2 minimum R-{required_r_value} for climate zone {design.climate_zone}"
                )
                critical_issues += 1
                recommendations.append(f"Increase duct insulation to minimum R-{required_r_value}")
        
        # Duct leakage compliance check
        duct_leakage_rate = (design.duct_leakage_cfm / design.conditioned_area_sqft) * 100
        max_leakage = limits["duct_leakage"]["supply"]
        
        if duct_leakage_rate > max_leakage:
            violations.append(
                f"Duct leakage rate {duct_leakage_rate:.1f} CFM/100 sq ft exceeds ASHRAE 90.2 limit of {max_leakage} CFM/100 sq ft"
            )
            critical_issues += 1
            recommendations.append("Improve duct sealing and testing procedures")
        
        # Equipment efficiency checks
        for equipment_type, efficiency in design.equipment_efficiency.items():
            if equipment_type in limits["equipment_efficiency"]:
                min_efficiency = limits["equipment_efficiency"][equipment_type]
                for metric, value in efficiency.items():
                    if metric in min_efficiency and value < min_efficiency[metric]:
                        violations.append(
                            f"{equipment_type} {metric.upper()} {value} below ASHRAE 90.2 minimum {min_efficiency[metric]}"
                        )
                        warnings += 1
                        recommendations.append(f"Upgrade {equipment_type} to meet minimum efficiency requirements")
        
        # Controls compliance check
        required_controls = limits["controls"]
        for control, required in required_controls.items():
            if control not in design.controls or design.controls[control] != required:
                violations.append(f"Missing required control: {control}")
                warnings += 1
                recommendations.append(f"Install {control.replace('_', ' ')} system")
        
        # Calculate compliance percentage
        total_checks = 4 + len(design.equipment_efficiency) + len(required_controls)
        passed_checks = total_checks - len(violations)
        compliance_percentage = (passed_checks / total_checks) * 100
        
        # Calculate energy savings potential
        energy_savings = self._calculate_energy_savings_ashrae_902(design, violations)
        
        result = ComplianceResult(
            standard="ASHRAE 90.2",
            is_compliant=len(violations) == 0,
            compliance_percentage=compliance_percentage,
            violations=violations,
            recommendations=recommendations,
            critical_issues=critical_issues,
            warnings=warnings,
            energy_savings_potential=energy_savings,
            cost_impact="Medium" if critical_issues > 0 else "Low"
        )
        
        logger.info(f"ASHRAE 90.2 compliance check completed: {compliance_percentage:.1f}% compliant")
        return result

    def check_iecc_2024_compliance(self, design: HVACDesign) -> ComplianceResult:
        """
        Check IECC 2024 compliance for HVAC design

        Args:
            design: HVAC design parameters

        Returns:
            ComplianceResult with detailed compliance analysis
        """
        logger.info(f"Starting IECC 2024 compliance check for {design.system_type}")

        violations = []
        recommendations = []
        warnings = 0
        critical_issues = 0

        limits = self.iecc_2024_limits

        # Enhanced fan power compliance check
        fan_power_per_cfm = design.fan_power_watts / design.airflow_cfm
        fan_limit = limits["fan_power_limits"].get(design.system_type, 1.0)

        if fan_power_per_cfm > fan_limit:
            violations.append(
                f"Fan power {fan_power_per_cfm:.2f} W/CFM exceeds IECC 2024 limit of {fan_limit} W/CFM"
            )
            critical_issues += 1
            recommendations.append("Consider high-efficiency fans with variable speed drives")

        # Enhanced duct insulation compliance check
        climate_zone = f"zone_{design.climate_zone}"
        if climate_zone in limits["duct_insulation"]:
            required_r_value = limits["duct_insulation"][climate_zone]["supply"]
            if design.duct_insulation_r_value < required_r_value:
                violations.append(
                    f"Duct insulation R-{design.duct_insulation_r_value} below IECC 2024 minimum R-{required_r_value} for climate zone {design.climate_zone}"
                )
                critical_issues += 1
                recommendations.append(f"Increase duct insulation to minimum R-{required_r_value}")

        # Stricter duct leakage compliance check
        duct_leakage_rate = (design.duct_leakage_cfm / design.conditioned_area_sqft) * 100
        max_leakage = limits["duct_leakage"]["supply"]

        if duct_leakage_rate > max_leakage:
            violations.append(
                f"Duct leakage rate {duct_leakage_rate:.1f} CFM/100 sq ft exceeds IECC 2024 limit of {max_leakage} CFM/100 sq ft"
            )
            critical_issues += 1
            recommendations.append("Implement enhanced duct sealing with post-construction testing")

        # Enhanced equipment efficiency checks
        for equipment_type, efficiency in design.equipment_efficiency.items():
            if equipment_type in limits["equipment_efficiency"]:
                min_efficiency = limits["equipment_efficiency"][equipment_type]
                for metric, value in efficiency.items():
                    if metric in min_efficiency and value < min_efficiency[metric]:
                        violations.append(
                            f"{equipment_type} {metric.upper()} {value} below IECC 2024 minimum {min_efficiency[metric]}"
                        )
                        warnings += 1
                        recommendations.append(f"Upgrade {equipment_type} to high-efficiency model")

        # Enhanced controls compliance check
        required_controls = limits["controls"]
        for control, required in required_controls.items():
            if control not in design.controls or design.controls[control] != required:
                violations.append(f"Missing required IECC 2024 control: {control}")
                warnings += 1
                recommendations.append(f"Install {control.replace('_', ' ')} system")

        # Renewable energy compliance check
        renewable_req = limits["renewable_energy"]
        if "renewable_percentage" not in design.controls or design.controls.get("renewable_percentage", 0) < renewable_req["renewable_percentage"]:
            violations.append(
                f"Renewable energy percentage below IECC 2024 minimum {renewable_req['renewable_percentage']}%"
            )
            warnings += 1
            recommendations.append("Consider solar panels or other renewable energy systems")

        # Calculate compliance percentage
        total_checks = 5 + len(design.equipment_efficiency) + len(required_controls)
        passed_checks = total_checks - len(violations)
        compliance_percentage = (passed_checks / total_checks) * 100

        # Calculate energy savings potential
        energy_savings = self._calculate_energy_savings_iecc_2024(design, violations)

        result = ComplianceResult(
            standard="IECC 2024",
            is_compliant=len(violations) == 0,
            compliance_percentage=compliance_percentage,
            violations=violations,
            recommendations=recommendations,
            critical_issues=critical_issues,
            warnings=warnings,
            energy_savings_potential=energy_savings,
            cost_impact="High" if critical_issues > 2 else "Medium" if critical_issues > 0 else "Low"
        )

        logger.info(f"IECC 2024 compliance check completed: {compliance_percentage:.1f}% compliant")
        return result

    def check_all_advanced_standards(self, design: HVACDesign) -> Dict[str, ComplianceResult]:
        """
        Check compliance against all advanced standards

        Args:
            design: HVAC design parameters

        Returns:
            Dictionary of compliance results by standard
        """
        results = {}

        try:
            results["ASHRAE_90_2"] = self.check_ashrae_902_compliance(design)
        except Exception as e:
            logger.error(f"ASHRAE 90.2 compliance check failed: {e}")
            results["ASHRAE_90_2"] = self._create_error_result("ASHRAE 90.2", str(e))

        try:
            results["IECC_2024"] = self.check_iecc_2024_compliance(design)
        except Exception as e:
            logger.error(f"IECC 2024 compliance check failed: {e}")
            results["IECC_2024"] = self._create_error_result("IECC 2024", str(e))

        return results

    def _calculate_energy_savings_ashrae_902(self, design: HVACDesign, violations: List[str]) -> float:
        """Calculate potential energy savings for ASHRAE 90.2 compliance"""
        savings = 0.0

        # Fan power savings
        if any("Fan power" in v for v in violations):
            savings += 15.0  # 15% potential savings from fan efficiency

        # Insulation savings
        if any("insulation" in v for v in violations):
            savings += 10.0  # 10% potential savings from better insulation

        # Duct leakage savings
        if any("leakage" in v for v in violations):
            savings += 12.0  # 12% potential savings from duct sealing

        # Equipment efficiency savings
        if any("efficiency" in v for v in violations):
            savings += 8.0   # 8% potential savings from efficient equipment

        return min(savings, 35.0)  # Cap at 35% total savings

    def _calculate_energy_savings_iecc_2024(self, design: HVACDesign, violations: List[str]) -> float:
        """Calculate potential energy savings for IECC 2024 compliance"""
        savings = 0.0

        # Enhanced fan power savings
        if any("Fan power" in v for v in violations):
            savings += 20.0  # 20% potential savings from high-efficiency fans

        # Enhanced insulation savings
        if any("insulation" in v for v in violations):
            savings += 15.0  # 15% potential savings from enhanced insulation

        # Enhanced duct leakage savings
        if any("leakage" in v for v in violations):
            savings += 18.0  # 18% potential savings from enhanced sealing

        # Enhanced equipment efficiency savings
        if any("efficiency" in v for v in violations):
            savings += 12.0  # 12% potential savings from high-efficiency equipment

        # Renewable energy savings
        if any("renewable" in v for v in violations):
            savings += 10.0  # 10% potential savings from renewable energy

        return min(savings, 50.0)  # Cap at 50% total savings

    def _create_error_result(self, standard: str, error_message: str) -> ComplianceResult:
        """Create error result for failed compliance checks"""
        return ComplianceResult(
            standard=standard,
            is_compliant=False,
            compliance_percentage=0.0,
            violations=[f"Compliance check failed: {error_message}"],
            recommendations=["Review system configuration and retry compliance check"],
            critical_issues=1,
            warnings=0,
            energy_savings_potential=0.0,
            cost_impact="Unknown"
        )
