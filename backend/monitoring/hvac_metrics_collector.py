"""
HVAC-Specific Metrics Collector for SizeWise Suite

Collects detailed performance metrics for HVAC calculations, 3D visualization,
offline sync, and domain-specific operations.
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger()


@dataclass
class HVACCalculationMetric:
    """HVAC calculation performance metric."""
    calculation_type: str
    start_time: datetime
    end_time: datetime
    duration_ms: float
    input_parameters: Dict[str, Any]
    result_accuracy: Optional[float] = None
    error_occurred: bool = False
    error_message: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class OfflineSyncMetric:
    """Offline synchronization performance metric."""
    sync_type: str  # 'upload', 'download', 'conflict_resolution'
    start_time: datetime
    end_time: datetime
    duration_ms: float
    records_processed: int
    data_size_bytes: int
    success: bool
    conflicts_resolved: int = 0
    error_message: Optional[str] = None


@dataclass
class UserEngagementMetric:
    """User engagement and feature usage metric."""
    user_id: str
    session_id: str
    feature_name: str
    action: str
    timestamp: datetime
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class HVACMetricsCollector:
    """
    Specialized metrics collector for HVAC domain operations.
    
    Tracks:
    - HVAC calculation performance and accuracy
    - 3D visualization rendering performance
    - Offline-first sync performance
    - User engagement and feature usage
    - Domain-specific error patterns
    """
    
    def __init__(self):
        self.calculation_metrics: List[HVACCalculationMetric] = []
        self.sync_metrics: List[OfflineSyncMetric] = []
        self.engagement_metrics: List[UserEngagementMetric] = []
        
        # Performance tracking
        self.active_calculations: Dict[str, Dict[str, Any]] = {}
        self.active_syncs: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Aggregated statistics
        self.calculation_stats = {
            'total_calculations': 0,
            'avg_duration_ms': 0.0,
            'success_rate': 100.0,
            'accuracy_score': 100.0,
            'calculations_by_type': {},
            'hourly_volume': []
        }
        
        self.sync_stats = {
            'total_syncs': 0,
            'avg_duration_ms': 0.0,
            'success_rate': 100.0,
            'avg_records_per_sync': 0,
            'sync_efficiency': 100.0
        }
        
        self.engagement_stats = {
            'active_users': 0,
            'avg_session_duration_ms': 0.0,
            'feature_usage': {},
            'user_retention': 100.0
        }
        
        # Data retention
        self.max_metrics = 10000
        self.retention_hours = 168  # 7 days
        
        # Background tasks
        self.cleanup_task: Optional[asyncio.Task] = None
        self.aggregation_task: Optional[asyncio.Task] = None
    
    async def initialize(self):
        """Initialize the HVAC metrics collector."""
        try:
            # Start background tasks
            self.cleanup_task = asyncio.create_task(self._cleanup_old_metrics())
            self.aggregation_task = asyncio.create_task(self._update_aggregated_stats())
            
            logger.info("HVAC metrics collector initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize HVAC metrics collector", error=str(e))
            raise
    
    async def shutdown(self):
        """Shutdown the HVAC metrics collector."""
        try:
            if self.cleanup_task:
                self.cleanup_task.cancel()
            if self.aggregation_task:
                self.aggregation_task.cancel()
            
            logger.info("HVAC metrics collector shutdown completed")
            
        except Exception as e:
            logger.error("Error during HVAC metrics collector shutdown", error=str(e))
    
    # =============================================================================
    # HVAC Calculation Tracking
    # =============================================================================
    
    def start_calculation_tracking(self, calculation_id: str, calculation_type: str, 
                                 input_parameters: Dict[str, Any], 
                                 user_id: Optional[str] = None,
                                 session_id: Optional[str] = None) -> str:
        """Start tracking an HVAC calculation."""
        try:
            self.active_calculations[calculation_id] = {
                'calculation_type': calculation_type,
                'start_time': datetime.utcnow(),
                'input_parameters': input_parameters,
                'user_id': user_id,
                'session_id': session_id
            }
            
            logger.debug("Started calculation tracking", 
                        calculation_id=calculation_id, 
                        calculation_type=calculation_type)
            
            return calculation_id
            
        except Exception as e:
            logger.error("Failed to start calculation tracking", error=str(e))
            return calculation_id
    
    def complete_calculation_tracking(self, calculation_id: str, 
                                    result_accuracy: Optional[float] = None,
                                    error_occurred: bool = False,
                                    error_message: Optional[str] = None):
        """Complete tracking an HVAC calculation."""
        try:
            if calculation_id not in self.active_calculations:
                logger.warning("Calculation tracking not found", calculation_id=calculation_id)
                return
            
            calc_data = self.active_calculations.pop(calculation_id)
            end_time = datetime.utcnow()
            duration_ms = (end_time - calc_data['start_time']).total_seconds() * 1000
            
            metric = HVACCalculationMetric(
                calculation_type=calc_data['calculation_type'],
                start_time=calc_data['start_time'],
                end_time=end_time,
                duration_ms=duration_ms,
                input_parameters=calc_data['input_parameters'],
                result_accuracy=result_accuracy,
                error_occurred=error_occurred,
                error_message=error_message,
                user_id=calc_data.get('user_id'),
                session_id=calc_data.get('session_id')
            )
            
            self.calculation_metrics.append(metric)
            self._limit_metrics_list(self.calculation_metrics)
            
            # Update statistics
            self.calculation_stats['total_calculations'] += 1
            
            logger.debug("Completed calculation tracking", 
                        calculation_id=calculation_id,
                        duration_ms=duration_ms,
                        error_occurred=error_occurred)
            
        except Exception as e:
            logger.error("Failed to complete calculation tracking", error=str(e))
    
    # =============================================================================
    # Offline Sync Tracking
    # =============================================================================
    
    def start_sync_tracking(self, sync_id: str, sync_type: str) -> str:
        """Start tracking an offline sync operation."""
        try:
            self.active_syncs[sync_id] = {
                'sync_type': sync_type,
                'start_time': datetime.utcnow(),
                'records_processed': 0,
                'data_size_bytes': 0,
                'conflicts_resolved': 0
            }
            
            logger.debug("Started sync tracking", sync_id=sync_id, sync_type=sync_type)
            return sync_id
            
        except Exception as e:
            logger.error("Failed to start sync tracking", error=str(e))
            return sync_id
    
    def complete_sync_tracking(self, sync_id: str, records_processed: int,
                             data_size_bytes: int, success: bool,
                             conflicts_resolved: int = 0,
                             error_message: Optional[str] = None):
        """Complete tracking an offline sync operation."""
        try:
            if sync_id not in self.active_syncs:
                logger.warning("Sync tracking not found", sync_id=sync_id)
                return
            
            sync_data = self.active_syncs.pop(sync_id)
            end_time = datetime.utcnow()
            duration_ms = (end_time - sync_data['start_time']).total_seconds() * 1000
            
            metric = OfflineSyncMetric(
                sync_type=sync_data['sync_type'],
                start_time=sync_data['start_time'],
                end_time=end_time,
                duration_ms=duration_ms,
                records_processed=records_processed,
                data_size_bytes=data_size_bytes,
                success=success,
                conflicts_resolved=conflicts_resolved,
                error_message=error_message
            )
            
            self.sync_metrics.append(metric)
            self._limit_metrics_list(self.sync_metrics)
            
            # Update statistics
            self.sync_stats['total_syncs'] += 1
            
            logger.debug("Completed sync tracking", 
                        sync_id=sync_id,
                        duration_ms=duration_ms,
                        success=success)
            
        except Exception as e:
            logger.error("Failed to complete sync tracking", error=str(e))
    
    # =============================================================================
    # User Engagement Tracking
    # =============================================================================
    
    def track_user_engagement(self, user_id: str, session_id: str,
                            feature_name: str, action: str,
                            duration_ms: Optional[float] = None,
                            metadata: Optional[Dict[str, Any]] = None):
        """Track user engagement with features."""
        try:
            metric = UserEngagementMetric(
                user_id=user_id,
                session_id=session_id,
                feature_name=feature_name,
                action=action,
                timestamp=datetime.utcnow(),
                duration_ms=duration_ms,
                metadata=metadata or {}
            )
            
            self.engagement_metrics.append(metric)
            self._limit_metrics_list(self.engagement_metrics)
            
            logger.debug("Tracked user engagement", 
                        user_id=user_id,
                        feature_name=feature_name,
                        action=action)
            
        except Exception as e:
            logger.error("Failed to track user engagement", error=str(e))
    
    # =============================================================================
    # Statistics and Reporting
    # =============================================================================
    
    async def get_hvac_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive HVAC performance summary."""
        try:
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'calculation_performance': self.calculation_stats,
                'sync_performance': self.sync_stats,
                'user_engagement': self.engagement_stats,
                'active_operations': {
                    'calculations': len(self.active_calculations),
                    'syncs': len(self.active_syncs),
                    'sessions': len(self.active_sessions)
                },
                'data_retention': {
                    'calculation_metrics': len(self.calculation_metrics),
                    'sync_metrics': len(self.sync_metrics),
                    'engagement_metrics': len(self.engagement_metrics)
                }
            }
            
        except Exception as e:
            logger.error("Failed to get HVAC performance summary", error=str(e))
            return {'error': str(e)}
    
    async def get_calculation_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get calculation performance trends."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            recent_metrics = [
                m for m in self.calculation_metrics 
                if m.start_time > cutoff_time
            ]
            
            if not recent_metrics:
                return {'message': 'No recent calculation data'}
            
            # Calculate trends
            total_calculations = len(recent_metrics)
            avg_duration = sum(m.duration_ms for m in recent_metrics) / total_calculations
            success_rate = (sum(1 for m in recent_metrics if not m.error_occurred) / total_calculations) * 100
            
            # Group by calculation type
            by_type = {}
            for metric in recent_metrics:
                calc_type = metric.calculation_type
                if calc_type not in by_type:
                    by_type[calc_type] = []
                by_type[calc_type].append(metric)
            
            type_stats = {}
            for calc_type, metrics in by_type.items():
                type_stats[calc_type] = {
                    'count': len(metrics),
                    'avg_duration_ms': sum(m.duration_ms for m in metrics) / len(metrics),
                    'success_rate': (sum(1 for m in metrics if not m.error_occurred) / len(metrics)) * 100
                }
            
            return {
                'time_range_hours': hours,
                'total_calculations': total_calculations,
                'avg_duration_ms': avg_duration,
                'success_rate': success_rate,
                'by_calculation_type': type_stats
            }
            
        except Exception as e:
            logger.error("Failed to get calculation trends", error=str(e))
            return {'error': str(e)}
    
    # =============================================================================
    # Internal Methods
    # =============================================================================
    
    def _limit_metrics_list(self, metrics_list: List):
        """Limit the size of a metrics list."""
        if len(metrics_list) > self.max_metrics:
            metrics_list[:] = metrics_list[-self.max_metrics:]
    
    async def _cleanup_old_metrics(self):
        """Clean up old metrics data."""
        while True:
            try:
                await asyncio.sleep(3600)  # Clean up every hour
                
                cutoff_time = datetime.utcnow() - timedelta(hours=self.retention_hours)
                
                # Clean up calculation metrics
                self.calculation_metrics = [
                    m for m in self.calculation_metrics 
                    if m.start_time > cutoff_time
                ]
                
                # Clean up sync metrics
                self.sync_metrics = [
                    m for m in self.sync_metrics 
                    if m.start_time > cutoff_time
                ]
                
                # Clean up engagement metrics
                self.engagement_metrics = [
                    m for m in self.engagement_metrics 
                    if m.timestamp > cutoff_time
                ]
                
                logger.debug("HVAC metrics cleanup completed")
                
            except Exception as e:
                logger.error("Error during HVAC metrics cleanup", error=str(e))
    
    async def _update_aggregated_stats(self):
        """Update aggregated statistics."""
        while True:
            try:
                await asyncio.sleep(300)  # Update every 5 minutes
                
                # Update calculation stats
                if self.calculation_metrics:
                    recent_calcs = [
                        m for m in self.calculation_metrics 
                        if m.start_time > datetime.utcnow() - timedelta(hours=1)
                    ]
                    
                    if recent_calcs:
                        self.calculation_stats['avg_duration_ms'] = sum(
                            m.duration_ms for m in recent_calcs
                        ) / len(recent_calcs)
                        
                        self.calculation_stats['success_rate'] = (
                            sum(1 for m in recent_calcs if not m.error_occurred) / len(recent_calcs)
                        ) * 100
                
                # Update sync stats
                if self.sync_metrics:
                    recent_syncs = [
                        m for m in self.sync_metrics 
                        if m.start_time > datetime.utcnow() - timedelta(hours=1)
                    ]
                    
                    if recent_syncs:
                        self.sync_stats['avg_duration_ms'] = sum(
                            m.duration_ms for m in recent_syncs
                        ) / len(recent_syncs)
                        
                        self.sync_stats['success_rate'] = (
                            sum(1 for m in recent_syncs if m.success) / len(recent_syncs)
                        ) * 100
                
                logger.debug("HVAC aggregated statistics updated")
                
            except Exception as e:
                logger.error("Error updating HVAC aggregated stats", error=str(e))


# Global instance
hvac_metrics_collector = None

def initialize_hvac_metrics_collector() -> HVACMetricsCollector:
    """Initialize the global HVAC metrics collector."""
    global hvac_metrics_collector
    hvac_metrics_collector = HVACMetricsCollector()
    return hvac_metrics_collector

def get_hvac_metrics_collector() -> HVACMetricsCollector:
    """Get the global HVAC metrics collector instance."""
    if hvac_metrics_collector is None:
        raise RuntimeError("HVAC metrics collector not initialized")
    return hvac_metrics_collector
