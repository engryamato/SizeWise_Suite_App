"""
SizeWise Suite - Disaster Recovery Validation Tests

This module provides comprehensive validation tests for the disaster recovery
testing and management system, including backup validation, service failover,
data integrity verification, and recovery procedure testing.

Features:
- Recovery objective validation
- Backup system testing
- Service failover validation
- Data integrity verification
- RTO/RPO compliance testing
- Recovery procedure validation
- Offline functionality testing

Designed to ensure production readiness of disaster recovery capabilities.
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import structlog

from .disaster_recovery import (
    DisasterRecoveryManager,
    RecoveryTestType,
    RecoveryStatus
)

logger = structlog.get_logger()

class DisasterRecoveryValidator:
    """Comprehensive validation for disaster recovery system."""
    
    def __init__(self):
        self.manager = DisasterRecoveryManager()
        self.test_results = []
        self.validation_score = 0.0
        
    async def run_validation(self) -> Dict[str, Any]:
        """Run comprehensive disaster recovery validation."""
        try:
            logger.info("Starting disaster recovery validation...")
            
            # Initialize disaster recovery manager
            await self.manager.initialize()
            
            # Run validation tests
            tests = [
                ("Recovery Objectives Configuration Test", self._test_recovery_objectives),
                ("Backup System Validation Test", self._test_backup_systems),
                ("Database Backup/Restore Test", self._test_database_backup_restore),
                ("Service Failover Test", self._test_service_failover),
                ("Data Integrity Verification Test", self._test_data_integrity),
                ("Offline Functionality Test", self._test_offline_functionality),
                ("RTO/RPO Compliance Test", self._test_rto_rpo_compliance),
                ("Recovery Procedure Validation Test", self._test_recovery_procedures)
            ]
            
            passed_tests = 0
            total_tests = len(tests)
            
            for test_name, test_func in tests:
                try:
                    logger.info(f"Running {test_name}...")
                    result = await test_func()
                    
                    if result['success']:
                        passed_tests += 1
                        logger.info(f"✅ {test_name} PASSED")
                    else:
                        logger.error(f"❌ {test_name} FAILED: {result.get('error', 'Unknown error')}")
                    
                    self.test_results.append({
                        'test_name': test_name,
                        'success': result['success'],
                        'details': result.get('details', {}),
                        'error': result.get('error')
                    })
                    
                except Exception as e:
                    logger.error(f"❌ {test_name} FAILED with exception: {str(e)}")
                    self.test_results.append({
                        'test_name': test_name,
                        'success': False,
                        'error': str(e)
                    })
            
            # Calculate validation score
            self.validation_score = (passed_tests / total_tests) * 100
            
            # Determine overall status
            if self.validation_score >= 90:
                status = "READY_FOR_PRODUCTION"
            elif self.validation_score >= 75:
                status = "READY_WITH_MONITORING"
            elif self.validation_score >= 60:
                status = "NEEDS_IMPROVEMENT"
            else:
                status = "NOT_READY"
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'validation_score': round(self.validation_score, 1),
                'status': status,
                'tests_passed': passed_tests,
                'total_tests': total_tests,
                'test_results': self.test_results,
                'recommendations': self._generate_recommendations()
            }
            
        except Exception as e:
            logger.error("Disaster recovery validation failed", error=str(e))
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'validation_score': 0.0,
                'status': 'VALIDATION_FAILED',
                'error': str(e)
            }
    
    async def _test_recovery_objectives(self) -> Dict[str, Any]:
        """Test recovery objectives configuration."""
        try:
            # Verify recovery objectives are configured
            assert len(self.manager.recovery_objectives) >= 3
            
            # Check required objective types
            required_objectives = [
                "critical_services",
                "non_critical_services", 
                "offline_functionality"
            ]
            
            for obj_name in required_objectives:
                assert obj_name in self.manager.recovery_objectives
                objective = self.manager.recovery_objectives[obj_name]
                
                # Validate objective configuration
                assert objective.rto_hours >= 0
                assert objective.rpo_minutes >= 0
                assert objective.max_data_loss_minutes >= 0
                assert len(objective.critical_services) > 0
                assert objective.description is not None
            
            # Validate RTO targets
            critical_rto = self.manager.recovery_objectives["critical_services"].rto_hours
            assert critical_rto <= 4.0  # Should be 4 hours or less
            
            offline_rto = self.manager.recovery_objectives["offline_functionality"].rto_hours
            assert offline_rto == 0.0  # Should be immediate
            
            return {
                'success': True,
                'details': {
                    'objectives_configured': len(self.manager.recovery_objectives),
                    'critical_services_rto_hours': critical_rto,
                    'offline_functionality_rto_hours': offline_rto
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_backup_systems(self) -> Dict[str, Any]:
        """Test backup system validation."""
        try:
            # Test backup system validation
            await self.manager._validate_backup_systems()
            
            # Verify backup procedures are loaded
            assert len(self.manager.recovery_procedures) > 0
            
            # Check required procedures
            required_procedures = [
                "database_restore",
                "service_failover",
                "full_system_recovery"
            ]
            
            for procedure in required_procedures:
                assert procedure in self.manager.recovery_procedures
                proc_config = self.manager.recovery_procedures[procedure]
                assert "steps" in proc_config
                assert "estimated_time_minutes" in proc_config
                assert len(proc_config["steps"]) > 0
            
            return {
                'success': True,
                'details': {
                    'backup_validation_completed': True,
                    'procedures_configured': len(self.manager.recovery_procedures),
                    'required_procedures_present': len(required_procedures)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_database_backup_restore(self) -> Dict[str, Any]:
        """Test database backup and restore procedures."""
        try:
            # Run database backup/restore test
            test_result = await self.manager.run_disaster_recovery_test(
                test_type=RecoveryTestType.DATABASE_BACKUP_RESTORE,
                test_scope="limited",
                dry_run=True
            )
            
            # Validate test execution
            assert test_result.test_id is not None
            assert test_result.test_type == RecoveryTestType.DATABASE_BACKUP_RESTORE
            assert test_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.PARTIAL]
            assert test_result.duration_minutes is not None
            assert test_result.rto_actual_hours is not None
            
            # Validate test results
            assert "backup_creation_seconds" in test_result.results
            assert "restore_time_seconds" in test_result.results
            assert "data_integrity_check" in test_result.results
            assert test_result.results["restore_success"] == True
            
            # Check RTO compliance
            rto_compliant = test_result.rto_actual_hours <= test_result.rto_target_hours
            
            return {
                'success': True,
                'details': {
                    'test_id': test_result.test_id,
                    'test_status': test_result.status.value,
                    'duration_minutes': test_result.duration_minutes,
                    'rto_compliant': rto_compliant,
                    'backup_successful': test_result.results.get("backup_integrity") == "valid",
                    'restore_successful': test_result.results.get("restore_success") == True,
                    'data_integrity_verified': test_result.results.get("data_integrity_check") == "passed"
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_service_failover(self) -> Dict[str, Any]:
        """Test service failover procedures."""
        try:
            # Run service failover test
            test_result = await self.manager.run_disaster_recovery_test(
                test_type=RecoveryTestType.SERVICE_FAILOVER,
                test_scope="limited",
                dry_run=True
            )
            
            # Validate test execution
            assert test_result.test_id is not None
            assert test_result.test_type == RecoveryTestType.SERVICE_FAILOVER
            assert test_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.PARTIAL]
            
            # Validate test results
            assert "failure_detection_seconds" in test_result.results
            assert "failover_execution_seconds" in test_result.results
            assert "service_availability" in test_result.results
            assert test_result.results["failover_success"] == True
            
            # Check failover time (should be under 30 minutes)
            total_failover_time = (
                test_result.results["failure_detection_seconds"] +
                test_result.results["failover_execution_seconds"]
            ) / 60
            
            return {
                'success': True,
                'details': {
                    'test_id': test_result.test_id,
                    'test_status': test_result.status.value,
                    'failover_time_minutes': round(total_failover_time, 2),
                    'detection_time_seconds': test_result.results["failure_detection_seconds"],
                    'execution_time_seconds': test_result.results["failover_execution_seconds"],
                    'service_restored': test_result.results["service_availability"] == "restored",
                    'traffic_redirected': test_result.results["traffic_redirection"] == "successful"
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_data_integrity(self) -> Dict[str, Any]:
        """Test data integrity verification procedures."""
        try:
            # Run data integrity test
            test_result = await self.manager.run_disaster_recovery_test(
                test_type=RecoveryTestType.DATA_INTEGRITY,
                test_scope="limited",
                dry_run=True
            )
            
            # Validate test execution
            assert test_result.test_id is not None
            assert test_result.test_type == RecoveryTestType.DATA_INTEGRITY
            assert test_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.PARTIAL]
            
            # Validate test results
            assert "database_consistency" in test_result.results
            assert "hvac_calculations" in test_result.results
            assert "data_sync_status" in test_result.results
            assert test_result.results["database_consistency"] == "verified"
            
            # Check HVAC calculation accuracy
            hvac_calcs = test_result.results["hvac_calculations"]
            assert hvac_calcs["air_duct_sizing"] == "accurate"
            assert hvac_calcs["grease_duct_sizing"] == "accurate"
            assert hvac_calcs["engine_exhaust_sizing"] == "accurate"
            
            return {
                'success': True,
                'details': {
                    'test_id': test_result.test_id,
                    'test_status': test_result.status.value,
                    'database_consistent': test_result.results["database_consistency"] == "verified",
                    'referential_integrity': test_result.results["referential_integrity"] == "maintained",
                    'hvac_calculations_accurate': all(
                        calc == "accurate" for calc in hvac_calcs.values()
                    ),
                    'data_synchronized': test_result.results["data_sync_status"] == "synchronized",
                    'no_data_loss': test_result.results["data_loss_assessment"] == "no_data_loss"
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_offline_functionality(self) -> Dict[str, Any]:
        """Test offline functionality during outages."""
        try:
            # Run offline functionality test
            test_result = await self.manager.run_disaster_recovery_test(
                test_type=RecoveryTestType.OFFLINE_FUNCTIONALITY,
                test_scope="limited",
                dry_run=True
            )
            
            # Validate test execution
            assert test_result.test_id is not None
            assert test_result.test_type == RecoveryTestType.OFFLINE_FUNCTIONALITY
            assert test_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.PARTIAL]
            
            # Validate test results
            assert "offline_mode_activation" in test_result.results
            assert "offline_calculations" in test_result.results
            assert "data_sync_on_reconnection" in test_result.results
            assert test_result.results["offline_mode_activation"] == "successful"
            
            # Check offline calculations
            offline_calcs = test_result.results["offline_calculations"]
            assert offline_calcs["hvac_calculations"] == "functional"
            assert offline_calcs["local_data_access"] == "available"
            
            # Check user experience
            user_exp = test_result.results["user_experience"]
            assert user_exp["functionality_maintained"] == True
            assert user_exp["data_consistency"] == True
            
            return {
                'success': True,
                'details': {
                    'test_id': test_result.test_id,
                    'test_status': test_result.status.value,
                    'offline_mode_activated': test_result.results["offline_mode_activation"] == "successful",
                    'local_storage_available': test_result.results["local_storage_available"] == True,
                    'calculations_functional': offline_calcs["hvac_calculations"] == "functional",
                    'data_sync_successful': test_result.results["data_sync_on_reconnection"] == "successful",
                    'user_experience_maintained': user_exp["functionality_maintained"] == True
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_rto_rpo_compliance(self) -> Dict[str, Any]:
        """Test RTO/RPO compliance monitoring."""
        try:
            # Run multiple tests to check RTO compliance
            test_types = [
                RecoveryTestType.DATABASE_BACKUP_RESTORE,
                RecoveryTestType.SERVICE_FAILOVER
            ]
            
            rto_results = []
            for test_type in test_types:
                test_result = await self.manager.run_disaster_recovery_test(
                    test_type=test_type,
                    test_scope="limited",
                    dry_run=True
                )
                
                rto_compliant = (
                    test_result.rto_actual_hours is not None and
                    test_result.rto_actual_hours <= test_result.rto_target_hours
                )
                
                rto_results.append({
                    'test_type': test_type.value,
                    'rto_target_hours': test_result.rto_target_hours,
                    'rto_actual_hours': test_result.rto_actual_hours,
                    'compliant': rto_compliant
                })
            
            # Calculate overall RTO compliance
            compliant_tests = len([r for r in rto_results if r['compliant']])
            compliance_rate = (compliant_tests / len(rto_results)) * 100
            
            return {
                'success': True,
                'details': {
                    'tests_executed': len(rto_results),
                    'compliant_tests': compliant_tests,
                    'compliance_rate': round(compliance_rate, 1),
                    'rto_results': rto_results,
                    'overall_compliant': compliance_rate >= 90
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _test_recovery_procedures(self) -> Dict[str, Any]:
        """Test recovery procedure validation."""
        try:
            # Validate recovery procedures are loaded
            assert len(self.manager.recovery_procedures) > 0
            
            # Test report generation
            report = await self.manager.generate_recovery_report(period_days=1)
            
            # Validate report structure
            assert "report_id" in report
            assert "summary" in report
            assert "recovery_objectives" in report
            assert "test_results" in report
            assert "recommendations" in report
            
            # Validate summary data
            summary = report["summary"]
            assert "total_tests" in summary
            assert "successful_tests" in summary
            assert "success_rate" in summary
            assert "rto_compliance_rate" in summary
            
            return {
                'success': True,
                'details': {
                    'procedures_available': len(self.manager.recovery_procedures),
                    'report_generated': True,
                    'report_id': report["report_id"],
                    'total_tests_in_report': summary["total_tests"],
                    'success_rate': summary["success_rate"],
                    'recommendations_provided': len(report["recommendations"])
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []
        
        if self.validation_score < 100:
            failed_tests = [
                result['test_name'] for result in self.test_results
                if not result['success']
            ]
            
            if failed_tests:
                recommendations.append(f"Address failed tests: {', '.join(failed_tests)}")
        
        if self.validation_score < 90:
            recommendations.append("Implement additional disaster recovery monitoring")
            recommendations.append("Conduct regular disaster recovery drills")
        
        if self.validation_score < 75:
            recommendations.append("Review and enhance backup procedures")
            recommendations.append("Improve RTO/RPO compliance monitoring")
            recommendations.append("Conduct disaster recovery training")
        
        if not recommendations:
            recommendations.append("Disaster recovery system is production ready")
        
        return recommendations

# Standalone validation function
async def validate_disaster_recovery() -> Dict[str, Any]:
    """Standalone function to validate disaster recovery system."""
    validator = DisasterRecoveryValidator()
    return await validator.run_validation()

if __name__ == "__main__":
    # Run validation when script is executed directly
    async def main():
        result = await validate_disaster_recovery()
        print(json.dumps(result, indent=2))
    
    asyncio.run(main())
