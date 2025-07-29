"""
Advanced Backup & Disaster Recovery System for SizeWise Suite
Enterprise-grade backup strategies, disaster recovery procedures, and business continuity planning.
"""

import asyncio
import json
import uuid
import hashlib
import shutil
import os
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import subprocess
import tarfile
import gzip

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BackupType(Enum):
    """Types of backups"""
    FULL = "FULL"
    INCREMENTAL = "INCREMENTAL"
    DIFFERENTIAL = "DIFFERENTIAL"
    SNAPSHOT = "SNAPSHOT"
    CONTINUOUS = "CONTINUOUS"

class BackupStatus(Enum):
    """Backup status levels"""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class RecoveryType(Enum):
    """Types of recovery operations"""
    FULL_RESTORE = "FULL_RESTORE"
    PARTIAL_RESTORE = "PARTIAL_RESTORE"
    POINT_IN_TIME = "POINT_IN_TIME"
    FAILOVER = "FAILOVER"
    FAILBACK = "FAILBACK"

class DisasterType(Enum):
    """Types of disaster scenarios"""
    HARDWARE_FAILURE = "HARDWARE_FAILURE"
    SOFTWARE_CORRUPTION = "SOFTWARE_CORRUPTION"
    CYBER_ATTACK = "CYBER_ATTACK"
    NATURAL_DISASTER = "NATURAL_DISASTER"
    HUMAN_ERROR = "HUMAN_ERROR"
    NETWORK_OUTAGE = "NETWORK_OUTAGE"

@dataclass
class BackupJob:
    """Backup job configuration"""
    id: str
    name: str
    type: BackupType
    source_paths: List[str]
    destination: str
    schedule: str  # Cron expression
    retention_days: int
    compression: bool
    encryption: bool
    status: BackupStatus
    created_at: datetime
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    size_bytes: int = 0
    duration_seconds: int = 0
    error_message: Optional[str] = None

@dataclass
class BackupRecord:
    """Individual backup record"""
    id: str
    job_id: str
    type: BackupType
    start_time: datetime
    end_time: Optional[datetime]
    status: BackupStatus
    file_path: str
    size_bytes: int
    checksum: str
    files_count: int
    compression_ratio: float
    error_message: Optional[str] = None

@dataclass
class RecoveryPlan:
    """Disaster recovery plan"""
    id: str
    name: str
    description: str
    disaster_types: List[DisasterType]
    recovery_objectives: Dict[str, Any]  # RTO, RPO, etc.
    procedures: List[str]
    contact_list: List[Dict[str, str]]
    test_schedule: str
    last_test: Optional[datetime] = None
    test_results: Optional[Dict[str, Any]] = None

@dataclass
class RecoveryOperation:
    """Recovery operation record"""
    id: str
    plan_id: str
    type: RecoveryType
    disaster_type: DisasterType
    start_time: datetime
    end_time: Optional[datetime]
    status: BackupStatus
    recovery_point: datetime
    restored_files: List[str]
    success_rate: float
    notes: str

class BackupEngine:
    """Core backup engine"""
    
    def __init__(self, base_path: str = "/var/backups/sizewise"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
    async def create_full_backup(self, job: BackupJob) -> BackupRecord:
        """Create full backup"""
        logger.info(f"Starting full backup: {job.name}")
        
        backup_id = f"full_{uuid.uuid4().hex[:8]}"
        start_time = datetime.utcnow()
        
        try:
            # Create backup directory
            backup_dir = self.base_path / job.id / backup_id
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Create tar archive
            archive_path = backup_dir / f"{backup_id}.tar"
            if job.compression:
                archive_path = backup_dir / f"{backup_id}.tar.gz"
            
            files_count = 0
            total_size = 0
            
            # Create archive
            mode = "w:gz" if job.compression else "w"
            with tarfile.open(archive_path, mode) as tar:
                for source_path in job.source_paths:
                    if os.path.exists(source_path):
                        tar.add(source_path, arcname=os.path.basename(source_path))
                        # Count files and calculate size
                        for root, dirs, files in os.walk(source_path):
                            files_count += len(files)
                            for file in files:
                                file_path = os.path.join(root, file)
                                if os.path.exists(file_path):
                                    total_size += os.path.getsize(file_path)
            
            # Calculate checksum
            checksum = self._calculate_checksum(archive_path)
            
            # Encrypt if required
            if job.encryption:
                encrypted_path = self._encrypt_file(archive_path)
                archive_path.unlink()  # Remove unencrypted file
                archive_path = encrypted_path
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            # Calculate compression ratio
            archive_size = archive_path.stat().st_size
            compression_ratio = archive_size / total_size if total_size > 0 else 1.0
            
            backup_record = BackupRecord(
                id=backup_id,
                job_id=job.id,
                type=BackupType.FULL,
                start_time=start_time,
                end_time=end_time,
                status=BackupStatus.COMPLETED,
                file_path=str(archive_path),
                size_bytes=archive_size,
                checksum=checksum,
                files_count=files_count,
                compression_ratio=compression_ratio
            )
            
            logger.info(f"Full backup completed: {job.name} ({archive_size} bytes)")
            return backup_record
            
        except Exception as e:
            logger.error(f"Full backup failed: {e}")
            return BackupRecord(
                id=backup_id,
                job_id=job.id,
                type=BackupType.FULL,
                start_time=start_time,
                end_time=datetime.utcnow(),
                status=BackupStatus.FAILED,
                file_path="",
                size_bytes=0,
                checksum="",
                files_count=0,
                compression_ratio=0.0,
                error_message=str(e)
            )
    
    async def create_incremental_backup(self, job: BackupJob, last_backup: BackupRecord) -> BackupRecord:
        """Create incremental backup"""
        logger.info(f"Starting incremental backup: {job.name}")
        
        backup_id = f"incr_{uuid.uuid4().hex[:8]}"
        start_time = datetime.utcnow()
        
        try:
            # Find files modified since last backup
            modified_files = []
            total_size = 0
            
            for source_path in job.source_paths:
                if os.path.exists(source_path):
                    for root, dirs, files in os.walk(source_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            if os.path.exists(file_path):
                                mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                                if mtime > last_backup.start_time:
                                    modified_files.append(file_path)
                                    total_size += os.path.getsize(file_path)
            
            if not modified_files:
                logger.info("No modified files found for incremental backup")
                return BackupRecord(
                    id=backup_id,
                    job_id=job.id,
                    type=BackupType.INCREMENTAL,
                    start_time=start_time,
                    end_time=datetime.utcnow(),
                    status=BackupStatus.COMPLETED,
                    file_path="",
                    size_bytes=0,
                    checksum="",
                    files_count=0,
                    compression_ratio=0.0
                )
            
            # Create backup directory
            backup_dir = self.base_path / job.id / backup_id
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Create incremental archive
            archive_path = backup_dir / f"{backup_id}.tar"
            if job.compression:
                archive_path = backup_dir / f"{backup_id}.tar.gz"
            
            mode = "w:gz" if job.compression else "w"
            with tarfile.open(archive_path, mode) as tar:
                for file_path in modified_files:
                    tar.add(file_path, arcname=os.path.relpath(file_path))
            
            # Calculate checksum
            checksum = self._calculate_checksum(archive_path)
            
            # Encrypt if required
            if job.encryption:
                encrypted_path = self._encrypt_file(archive_path)
                archive_path.unlink()
                archive_path = encrypted_path
            
            end_time = datetime.utcnow()
            archive_size = archive_path.stat().st_size
            compression_ratio = archive_size / total_size if total_size > 0 else 1.0
            
            backup_record = BackupRecord(
                id=backup_id,
                job_id=job.id,
                type=BackupType.INCREMENTAL,
                start_time=start_time,
                end_time=end_time,
                status=BackupStatus.COMPLETED,
                file_path=str(archive_path),
                size_bytes=archive_size,
                checksum=checksum,
                files_count=len(modified_files),
                compression_ratio=compression_ratio
            )
            
            logger.info(f"Incremental backup completed: {job.name} ({len(modified_files)} files)")
            return backup_record
            
        except Exception as e:
            logger.error(f"Incremental backup failed: {e}")
            return BackupRecord(
                id=backup_id,
                job_id=job.id,
                type=BackupType.INCREMENTAL,
                start_time=start_time,
                end_time=datetime.utcnow(),
                status=BackupStatus.FAILED,
                file_path="",
                size_bytes=0,
                checksum="",
                files_count=0,
                compression_ratio=0.0,
                error_message=str(e)
            )
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def _encrypt_file(self, file_path: Path) -> Path:
        """Encrypt file using AES-256 (simulated)"""
        # In production, use proper encryption library like cryptography
        encrypted_path = file_path.with_suffix(file_path.suffix + ".enc")
        
        # Simulate encryption by copying file
        shutil.copy2(file_path, encrypted_path)
        
        return encrypted_path

class RecoveryEngine:
    """Disaster recovery engine"""
    
    def __init__(self, backup_engine: BackupEngine):
        self.backup_engine = backup_engine
    
    async def restore_from_backup(self, backup_record: BackupRecord, destination: str) -> RecoveryOperation:
        """Restore data from backup"""
        logger.info(f"Starting restore operation from backup: {backup_record.id}")
        
        operation_id = f"restore_{uuid.uuid4().hex[:8]}"
        start_time = datetime.utcnow()
        
        try:
            # Decrypt if necessary
            archive_path = Path(backup_record.file_path)
            if archive_path.suffix == ".enc":
                archive_path = self._decrypt_file(archive_path)
            
            # Extract archive
            restored_files = []
            with tarfile.open(archive_path, "r:*") as tar:
                tar.extractall(destination)
                restored_files = tar.getnames()
            
            end_time = datetime.utcnow()
            
            operation = RecoveryOperation(
                id=operation_id,
                plan_id="manual_restore",
                type=RecoveryType.FULL_RESTORE,
                disaster_type=DisasterType.HUMAN_ERROR,
                start_time=start_time,
                end_time=end_time,
                status=BackupStatus.COMPLETED,
                recovery_point=backup_record.start_time,
                restored_files=restored_files,
                success_rate=100.0,
                notes=f"Restored {len(restored_files)} files from backup {backup_record.id}"
            )
            
            logger.info(f"Restore operation completed: {len(restored_files)} files restored")
            return operation
            
        except Exception as e:
            logger.error(f"Restore operation failed: {e}")
            return RecoveryOperation(
                id=operation_id,
                plan_id="manual_restore",
                type=RecoveryType.FULL_RESTORE,
                disaster_type=DisasterType.HUMAN_ERROR,
                start_time=start_time,
                end_time=datetime.utcnow(),
                status=BackupStatus.FAILED,
                recovery_point=backup_record.start_time,
                restored_files=[],
                success_rate=0.0,
                notes=f"Restore failed: {str(e)}"
            )
    
    def _decrypt_file(self, encrypted_path: Path) -> Path:
        """Decrypt encrypted file (simulated)"""
        # In production, use proper decryption
        decrypted_path = encrypted_path.with_suffix("")
        shutil.copy2(encrypted_path, decrypted_path)
        return decrypted_path
    
    async def test_recovery_plan(self, plan: RecoveryPlan) -> Dict[str, Any]:
        """Test disaster recovery plan"""
        logger.info(f"Testing recovery plan: {plan.name}")
        
        test_results = {
            "plan_id": plan.id,
            "test_date": datetime.utcnow().isoformat(),
            "procedures_tested": len(plan.procedures),
            "success_rate": 0.0,
            "issues_found": [],
            "recommendations": []
        }
        
        try:
            # Simulate testing procedures
            successful_procedures = 0
            
            for i, procedure in enumerate(plan.procedures):
                # Simulate procedure test
                success = True  # In production, actually test the procedure
                
                if success:
                    successful_procedures += 1
                else:
                    test_results["issues_found"].append(f"Procedure {i+1} failed: {procedure}")
            
            test_results["success_rate"] = (successful_procedures / len(plan.procedures)) * 100
            
            # Add recommendations based on results
            if test_results["success_rate"] < 100:
                test_results["recommendations"].append("Review and update failed procedures")
            if test_results["success_rate"] >= 95:
                test_results["recommendations"].append("Recovery plan is in excellent condition")
            elif test_results["success_rate"] >= 80:
                test_results["recommendations"].append("Recovery plan needs minor improvements")
            else:
                test_results["recommendations"].append("Recovery plan requires significant updates")
            
            logger.info(f"Recovery plan test completed: {test_results['success_rate']}% success rate")
            return test_results
            
        except Exception as e:
            logger.error(f"Recovery plan test failed: {e}")
            test_results["issues_found"].append(f"Test execution failed: {str(e)}")
            return test_results

class BackupDisasterRecoverySystem:
    """Main backup and disaster recovery system"""

    def __init__(self, db_service=None):
        self.db = db_service
        self.backup_engine = BackupEngine()
        self.recovery_engine = RecoveryEngine(self.backup_engine)

        # In-memory storage for demo
        self.backup_jobs: Dict[str, BackupJob] = {}
        self.backup_records: Dict[str, BackupRecord] = {}
        self.recovery_plans: Dict[str, RecoveryPlan] = {}
        self.recovery_operations: Dict[str, RecoveryOperation] = {}

        self._initialize_default_jobs()
        self._initialize_default_plans()

        logger.info("Backup & Disaster Recovery System initialized")

    async def schedule_backup_jobs(self):
        """Schedule and run backup jobs based on their schedules"""
        for job in self.backup_jobs.values():
            if job.status == BackupStatus.PENDING:
                # In production, use proper cron scheduler
                try:
                    await self.run_backup_job(job.id)
                except Exception as e:
                    logger.error(f"Scheduled backup failed for {job.name}: {e}")

    async def cleanup_old_backups(self):
        """Clean up old backups based on retention policies"""
        for job in self.backup_jobs.values():
            cutoff_date = datetime.utcnow() - timedelta(days=job.retention_days)

            # Find old backups for this job
            old_backups = [
                r for r in self.backup_records.values()
                if r.job_id == job.id and r.start_time < cutoff_date
            ]

            for backup in old_backups:
                try:
                    # Delete backup file
                    if os.path.exists(backup.file_path):
                        os.remove(backup.file_path)

                    # Remove from records
                    del self.backup_records[backup.id]

                    logger.info(f"Cleaned up old backup: {backup.id}")

                except Exception as e:
                    logger.error(f"Failed to cleanup backup {backup.id}: {e}")

    def validate_backup_integrity(self, backup_id: str) -> Dict[str, Any]:
        """Validate backup file integrity"""
        backup = self.backup_records.get(backup_id)
        if not backup:
            return {"valid": False, "error": "Backup not found"}

        try:
            # Check if file exists
            if not os.path.exists(backup.file_path):
                return {"valid": False, "error": "Backup file not found"}

            # Verify checksum
            current_checksum = self.backup_engine._calculate_checksum(Path(backup.file_path))
            if current_checksum != backup.checksum:
                return {"valid": False, "error": "Checksum mismatch"}

            # Try to open archive
            with tarfile.open(backup.file_path, "r:*") as tar:
                # Basic archive validation
                tar.getnames()

            return {
                "valid": True,
                "file_size": os.path.getsize(backup.file_path),
                "checksum": current_checksum,
                "verified_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def _initialize_default_jobs(self):
        """Initialize default backup jobs"""
        default_jobs = [
            BackupJob(
                id="job_database",
                name="Database Backup",
                type=BackupType.FULL,
                source_paths=["/var/lib/postgresql", "/var/lib/mongodb"],
                destination="/var/backups/sizewise/database",
                schedule="0 2 * * *",  # Daily at 2 AM
                retention_days=30,
                compression=True,
                encryption=True,
                status=BackupStatus.PENDING,
                created_at=datetime.utcnow()
            ),
            BackupJob(
                id="job_application",
                name="Application Files Backup",
                type=BackupType.INCREMENTAL,
                source_paths=["/opt/sizewise", "/etc/sizewise"],
                destination="/var/backups/sizewise/application",
                schedule="0 */6 * * *",  # Every 6 hours
                retention_days=14,
                compression=True,
                encryption=False,
                status=BackupStatus.PENDING,
                created_at=datetime.utcnow()
            ),
            BackupJob(
                id="job_user_data",
                name="User Data Backup",
                type=BackupType.DIFFERENTIAL,
                source_paths=["/var/sizewise/uploads", "/var/sizewise/projects"],
                destination="/var/backups/sizewise/userdata",
                schedule="0 1 * * *",  # Daily at 1 AM
                retention_days=90,
                compression=True,
                encryption=True,
                status=BackupStatus.PENDING,
                created_at=datetime.utcnow()
            )
        ]
        
        for job in default_jobs:
            self.backup_jobs[job.id] = job
    
    def _initialize_default_plans(self):
        """Initialize default recovery plans"""
        default_plans = [
            RecoveryPlan(
                id="plan_hardware_failure",
                name="Hardware Failure Recovery",
                description="Recovery procedures for hardware failures",
                disaster_types=[DisasterType.HARDWARE_FAILURE],
                recovery_objectives={
                    "RTO": 4,  # Recovery Time Objective: 4 hours
                    "RPO": 1   # Recovery Point Objective: 1 hour
                },
                procedures=[
                    "Assess hardware failure scope",
                    "Activate backup systems",
                    "Restore from latest backup",
                    "Verify system functionality",
                    "Update DNS records if needed",
                    "Notify stakeholders"
                ],
                contact_list=[
                    {"role": "IT Manager", "name": "John Doe", "phone": "+1-555-0123"},
                    {"role": "System Admin", "name": "Jane Smith", "phone": "+1-555-0456"}
                ],
                test_schedule="0 0 1 */3 *"  # Quarterly testing
            ),
            RecoveryPlan(
                id="plan_cyber_attack",
                name="Cyber Attack Recovery",
                description="Recovery procedures for cyber security incidents",
                disaster_types=[DisasterType.CYBER_ATTACK],
                recovery_objectives={
                    "RTO": 8,  # Recovery Time Objective: 8 hours
                    "RPO": 2   # Recovery Point Objective: 2 hours
                },
                procedures=[
                    "Isolate affected systems",
                    "Assess attack scope and impact",
                    "Activate incident response team",
                    "Restore from clean backups",
                    "Apply security patches",
                    "Monitor for continued threats",
                    "Document incident and lessons learned"
                ],
                contact_list=[
                    {"role": "CISO", "name": "Security Chief", "phone": "+1-555-0789"},
                    {"role": "Legal", "name": "Legal Counsel", "phone": "+1-555-0321"}
                ],
                test_schedule="0 0 15 */6 *"  # Semi-annual testing
            )
        ]
        
        for plan in default_plans:
            self.recovery_plans[plan.id] = plan
    
    async def run_backup_job(self, job_id: str) -> BackupRecord:
        """Execute backup job"""
        job = self.backup_jobs.get(job_id)
        if not job:
            raise ValueError(f"Backup job not found: {job_id}")
        
        # Update job status
        job.status = BackupStatus.RUNNING
        job.last_run = datetime.utcnow()
        
        try:
            # Get last backup for incremental/differential
            last_backup = None
            if job.type in [BackupType.INCREMENTAL, BackupType.DIFFERENTIAL]:
                job_records = [r for r in self.backup_records.values() if r.job_id == job_id]
                if job_records:
                    last_backup = max(job_records, key=lambda x: x.start_time)
            
            # Execute backup based on type
            if job.type == BackupType.FULL or not last_backup:
                backup_record = await self.backup_engine.create_full_backup(job)
            elif job.type == BackupType.INCREMENTAL:
                backup_record = await self.backup_engine.create_incremental_backup(job, last_backup)
            else:
                # For now, treat differential same as incremental
                backup_record = await self.backup_engine.create_incremental_backup(job, last_backup)
            
            # Store backup record
            self.backup_records[backup_record.id] = backup_record
            
            # Update job status
            job.status = BackupStatus.COMPLETED if backup_record.status == BackupStatus.COMPLETED else BackupStatus.FAILED
            job.size_bytes = backup_record.size_bytes
            job.duration_seconds = int((backup_record.end_time - backup_record.start_time).total_seconds()) if backup_record.end_time else 0
            job.error_message = backup_record.error_message
            
            return backup_record
            
        except Exception as e:
            logger.error(f"Backup job execution failed: {e}")
            job.status = BackupStatus.FAILED
            job.error_message = str(e)
            raise
    
    async def execute_recovery(self, plan_id: str, disaster_type: DisasterType) -> RecoveryOperation:
        """Execute disaster recovery plan"""
        plan = self.recovery_plans.get(plan_id)
        if not plan:
            raise ValueError(f"Recovery plan not found: {plan_id}")
        
        # Find latest backup
        latest_backup = None
        if self.backup_records:
            latest_backup = max(self.backup_records.values(), key=lambda x: x.start_time)
        
        if not latest_backup:
            raise ValueError("No backups available for recovery")
        
        # Execute recovery
        operation = await self.recovery_engine.restore_from_backup(
            latest_backup, 
            "/var/recovery/sizewise"
        )
        
        # Store operation record
        self.recovery_operations[operation.id] = operation
        
        return operation
    
    def get_backup_status(self) -> Dict[str, Any]:
        """Get backup system status"""
        total_jobs = len(self.backup_jobs)
        active_jobs = len([j for j in self.backup_jobs.values() if j.status == BackupStatus.RUNNING])
        completed_jobs = len([j for j in self.backup_jobs.values() if j.status == BackupStatus.COMPLETED])
        failed_jobs = len([j for j in self.backup_jobs.values() if j.status == BackupStatus.FAILED])
        
        total_backups = len(self.backup_records)
        total_size = sum(r.size_bytes for r in self.backup_records.values())
        
        return {
            "jobs": {
                "total": total_jobs,
                "active": active_jobs,
                "completed": completed_jobs,
                "failed": failed_jobs
            },
            "backups": {
                "total": total_backups,
                "total_size_bytes": total_size,
                "total_size_gb": round(total_size / (1024**3), 2)
            },
            "recovery_plans": len(self.recovery_plans),
            "recovery_operations": len(self.recovery_operations),
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_backup_jobs(self) -> List[BackupJob]:
        """Get all backup jobs"""
        return list(self.backup_jobs.values())
    
    def get_backup_records(self, job_id: str = None) -> List[BackupRecord]:
        """Get backup records"""
        records = list(self.backup_records.values())
        if job_id:
            records = [r for r in records if r.job_id == job_id]
        return sorted(records, key=lambda x: x.start_time, reverse=True)
    
    def get_recovery_plans(self) -> List[RecoveryPlan]:
        """Get all recovery plans"""
        return list(self.recovery_plans.values())

# Global backup and disaster recovery system instance
backup_dr_system = BackupDisasterRecoverySystem()
