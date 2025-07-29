"""
Production Metrics Collector for SizeWise Suite

Comprehensive metrics collection system that integrates with:
- Service Mesh metrics (request rates, latencies, error rates)
- Distributed Cache metrics (hit ratios, memory usage, performance)
- Load Balancer metrics (node health, response times, distribution)
- Application metrics (HVAC calculations, user sessions, system resources)
- Infrastructure metrics (CPU, memory, disk, network)

Provides Prometheus-compatible metrics export and real-time monitoring.
"""

import asyncio
import time
import psutil
import json
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import structlog
from prometheus_client import Counter, Histogram, Gauge, Info, CollectorRegistry, generate_latest

logger = structlog.get_logger()

# =============================================================================
# Metrics Types and Configuration
# =============================================================================

class MetricType(Enum):
    """Types of metrics collected."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    INFO = "info"

class AlertSeverity(Enum):
    """Alert severity levels."""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

@dataclass
class MetricDefinition:
    """Definition of a metric to collect."""
    name: str
    metric_type: MetricType
    description: str
    labels: List[str] = field(default_factory=list)
    buckets: Optional[List[float]] = None  # For histograms
    
@dataclass
class AlertRule:
    """Alert rule configuration."""
    name: str
    metric_name: str
    condition: str  # e.g., "> 0.95", "< 0.8"
    threshold: float
    severity: AlertSeverity
    duration_seconds: int = 300  # Alert after 5 minutes
    description: str = ""
    
@dataclass
class MetricSample:
    """Individual metric sample."""
    name: str
    value: Union[int, float]
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)

class MetricsCollector:
    """
    Production metrics collector for comprehensive system monitoring.
    
    Features:
    - Prometheus-compatible metrics export
    - Real-time metrics collection from all microservices
    - System resource monitoring
    - Application performance tracking
    - Alert rule evaluation
    - Historical metrics storage
    """
    
    def __init__(self):
        self.registry = CollectorRegistry()
        self.metrics: Dict[str, Any] = {}
        self.metric_definitions: Dict[str, MetricDefinition] = {}
        self.alert_rules: List[AlertRule] = []
        self.metric_history: List[MetricSample] = []
        self.active_alerts: Dict[str, Dict[str, Any]] = {}
        
        # Collection intervals
        self.system_metrics_interval = 30  # seconds
        self.microservices_metrics_interval = 15  # seconds
        self.application_metrics_interval = 60  # seconds
        
        # Initialize core metrics
        self._initialize_core_metrics()
        
        # Background tasks
        self.collection_tasks: List[asyncio.Task] = []
        
    def _initialize_core_metrics(self):
        """Initialize core Prometheus metrics."""
        try:
            # System metrics
            self.metrics['cpu_usage_percent'] = Gauge(
                'sizewise_cpu_usage_percent',
                'CPU usage percentage',
                ['instance'],
                registry=self.registry
            )
            
            self.metrics['memory_usage_bytes'] = Gauge(
                'sizewise_memory_usage_bytes',
                'Memory usage in bytes',
                ['instance', 'type'],
                registry=self.registry
            )
            
            self.metrics['disk_usage_bytes'] = Gauge(
                'sizewise_disk_usage_bytes',
                'Disk usage in bytes',
                ['instance', 'device', 'type'],
                registry=self.registry
            )
            
            # Application metrics
            self.metrics['http_requests_total'] = Counter(
                'sizewise_http_requests_total',
                'Total HTTP requests',
                ['method', 'endpoint', 'status_code'],
                registry=self.registry
            )
            
            self.metrics['http_request_duration_seconds'] = Histogram(
                'sizewise_http_request_duration_seconds',
                'HTTP request duration in seconds',
                ['method', 'endpoint'],
                buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
                registry=self.registry
            )
            
            # HVAC calculation metrics
            self.metrics['hvac_calculations_total'] = Counter(
                'sizewise_hvac_calculations_total',
                'Total HVAC calculations performed',
                ['calculation_type', 'status'],
                registry=self.registry
            )
            
            self.metrics['hvac_calculation_duration_seconds'] = Histogram(
                'sizewise_hvac_calculation_duration_seconds',
                'HVAC calculation duration in seconds',
                ['calculation_type'],
                buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
                registry=self.registry
            )
            
            # Service mesh metrics
            self.metrics['service_mesh_requests_total'] = Counter(
                'sizewise_service_mesh_requests_total',
                'Total service mesh requests',
                ['source_service', 'destination_service', 'status'],
                registry=self.registry
            )
            
            self.metrics['service_mesh_request_duration_seconds'] = Histogram(
                'sizewise_service_mesh_request_duration_seconds',
                'Service mesh request duration in seconds',
                ['source_service', 'destination_service'],
                buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
                registry=self.registry
            )
            
            # Cache metrics
            self.metrics['cache_operations_total'] = Counter(
                'sizewise_cache_operations_total',
                'Total cache operations',
                ['operation', 'cache_tier', 'status'],
                registry=self.registry
            )
            
            self.metrics['cache_hit_ratio'] = Gauge(
                'sizewise_cache_hit_ratio',
                'Cache hit ratio',
                ['cache_tier'],
                registry=self.registry
            )
            
            self.metrics['cache_memory_usage_bytes'] = Gauge(
                'sizewise_cache_memory_usage_bytes',
                'Cache memory usage in bytes',
                ['cache_tier', 'node'],
                registry=self.registry
            )
            
            # Load balancer metrics
            self.metrics['load_balancer_requests_total'] = Counter(
                'sizewise_load_balancer_requests_total',
                'Total load balancer requests',
                ['algorithm', 'node', 'status'],
                registry=self.registry
            )
            
            self.metrics['load_balancer_node_health'] = Gauge(
                'sizewise_load_balancer_node_health',
                'Load balancer node health status (1=healthy, 0=unhealthy)',
                ['algorithm', 'node'],
                registry=self.registry
            )
            
            # Database metrics
            self.metrics['database_connections_active'] = Gauge(
                'sizewise_database_connections_active',
                'Active database connections',
                ['database_type', 'database_name'],
                registry=self.registry
            )
            
            self.metrics['database_query_duration_seconds'] = Histogram(
                'sizewise_database_query_duration_seconds',
                'Database query duration in seconds',
                ['database_type', 'operation'],
                buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
                registry=self.registry
            )
            
            logger.info("Core metrics initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize core metrics", error=str(e))
            raise
    
    async def initialize(self):
        """Initialize the metrics collector."""
        try:
            # Initialize alert rules
            await self._initialize_alert_rules()
            
            # Start background collection tasks
            self.collection_tasks = [
                asyncio.create_task(self._collect_system_metrics()),
                asyncio.create_task(self._collect_microservices_metrics()),
                asyncio.create_task(self._collect_application_metrics()),
                asyncio.create_task(self._evaluate_alerts()),
                asyncio.create_task(self._cleanup_old_metrics())
            ]
            
            logger.info("Metrics collector initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize metrics collector", error=str(e))
            raise
    
    async def _initialize_alert_rules(self):
        """Initialize alert rules for monitoring."""
        try:
            self.alert_rules = [
                # System alerts
                AlertRule(
                    name="high_cpu_usage",
                    metric_name="sizewise_cpu_usage_percent",
                    condition=">",
                    threshold=85.0,
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="CPU usage is above 85% for 5 minutes"
                ),
                AlertRule(
                    name="critical_cpu_usage",
                    metric_name="sizewise_cpu_usage_percent",
                    condition=">",
                    threshold=95.0,
                    severity=AlertSeverity.CRITICAL,
                    duration_seconds=60,
                    description="CPU usage is above 95% for 1 minute"
                ),
                AlertRule(
                    name="high_memory_usage",
                    metric_name="sizewise_memory_usage_percent",
                    condition=">",
                    threshold=85.0,
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="Memory usage is above 85% for 5 minutes"
                ),
                
                # Application alerts
                AlertRule(
                    name="high_error_rate",
                    metric_name="sizewise_http_error_rate",
                    condition=">",
                    threshold=0.05,  # 5% error rate
                    severity=AlertSeverity.WARNING,
                    duration_seconds=180,
                    description="HTTP error rate is above 5% for 3 minutes"
                ),
                AlertRule(
                    name="slow_response_time",
                    metric_name="sizewise_http_response_time_p95",
                    condition=">",
                    threshold=2.0,  # 2 seconds
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="95th percentile response time is above 2 seconds"
                ),
                
                # Cache alerts
                AlertRule(
                    name="low_cache_hit_ratio",
                    metric_name="sizewise_cache_hit_ratio",
                    condition="<",
                    threshold=0.7,  # 70% hit ratio
                    severity=AlertSeverity.WARNING,
                    duration_seconds=600,
                    description="Cache hit ratio is below 70% for 10 minutes"
                ),
                
                # Service mesh alerts
                AlertRule(
                    name="service_mesh_high_latency",
                    metric_name="sizewise_service_mesh_latency_p95",
                    condition=">",
                    threshold=0.1,  # 100ms
                    severity=AlertSeverity.WARNING,
                    duration_seconds=300,
                    description="Service mesh 95th percentile latency is above 100ms"
                ),
                
                # Load balancer alerts
                AlertRule(
                    name="unhealthy_nodes",
                    metric_name="sizewise_load_balancer_healthy_nodes_ratio",
                    condition="<",
                    threshold=0.5,  # 50% healthy nodes
                    severity=AlertSeverity.CRITICAL,
                    duration_seconds=60,
                    description="Less than 50% of load balancer nodes are healthy"
                )
            ]
            
            logger.info("Alert rules initialized", count=len(self.alert_rules))
            
        except Exception as e:
            logger.error("Failed to initialize alert rules", error=str(e))
            raise
    
    async def _collect_system_metrics(self):
        """Collect system resource metrics."""
        while True:
            try:
                await asyncio.sleep(self.system_metrics_interval)
                
                # CPU metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                self.metrics['cpu_usage_percent'].labels(instance='sizewise-suite').set(cpu_percent)
                
                # Memory metrics
                memory = psutil.virtual_memory()
                self.metrics['memory_usage_bytes'].labels(
                    instance='sizewise-suite', type='used'
                ).set(memory.used)
                self.metrics['memory_usage_bytes'].labels(
                    instance='sizewise-suite', type='available'
                ).set(memory.available)
                
                # Disk metrics
                for partition in psutil.disk_partitions():
                    try:
                        disk_usage = psutil.disk_usage(partition.mountpoint)
                        device = partition.device.replace(':', '').replace('\\', '_')
                        
                        self.metrics['disk_usage_bytes'].labels(
                            instance='sizewise-suite', device=device, type='used'
                        ).set(disk_usage.used)
                        self.metrics['disk_usage_bytes'].labels(
                            instance='sizewise-suite', device=device, type='free'
                        ).set(disk_usage.free)
                    except (PermissionError, OSError):
                        continue
                
                # Store historical sample
                self.metric_history.append(MetricSample(
                    name='system_metrics',
                    value=cpu_percent,
                    labels={'type': 'cpu_usage', 'memory_usage_gb': memory.used / (1024**3)},
                    timestamp=datetime.utcnow()
                ))
                
            except Exception as e:
                logger.error("Error collecting system metrics", error=str(e))
    
    async def _collect_microservices_metrics(self):
        """Collect metrics from microservices components."""
        while True:
            try:
                await asyncio.sleep(self.microservices_metrics_interval)
                
                # Collect service mesh metrics
                await self._collect_service_mesh_metrics()
                
                # Collect cache metrics
                await self._collect_cache_metrics()
                
                # Collect load balancer metrics
                await self._collect_load_balancer_metrics()
                
            except Exception as e:
                logger.error("Error collecting microservices metrics", error=str(e))

    async def _collect_service_mesh_metrics(self):
        """Collect service mesh metrics."""
        try:
            from backend.microservices.ServiceMesh import get_service_mesh

            service_mesh = get_service_mesh()
            if service_mesh:
                metrics_data = await service_mesh.get_service_metrics()

                if 'services' in metrics_data:
                    for service_id, service_metrics in metrics_data['services'].items():
                        # Update Prometheus metrics
                        success_rate = service_metrics.get('success_rate', 100) / 100
                        error_rate = 1 - success_rate

                        # Service mesh request metrics
                        self.metrics['service_mesh_requests_total'].labels(
                            source_service='unknown',
                            destination_service=service_id,
                            status='success'
                        )._value._value = service_metrics.get('request_count', 0) * success_rate

                        self.metrics['service_mesh_requests_total'].labels(
                            source_service='unknown',
                            destination_service=service_id,
                            status='error'
                        )._value._value = service_metrics.get('request_count', 0) * error_rate

                        # Store historical sample
                        self.metric_history.append(MetricSample(
                            name='service_mesh_metrics',
                            value=service_metrics.get('avg_latency_ms', 0),
                            labels={
                                'service_id': service_id,
                                'success_rate': str(success_rate),
                                'request_count': str(service_metrics.get('request_count', 0))
                            }
                        ))

        except Exception as e:
            logger.warning("Failed to collect service mesh metrics", error=str(e))

    async def _collect_cache_metrics(self):
        """Collect distributed cache metrics."""
        try:
            from backend.microservices.DistributedCache import get_distributed_cache

            cache = get_distributed_cache()
            if cache:
                cache_stats = await cache.get_cache_statistics()

                # Update cache hit ratio
                hit_ratio = cache_stats.get('global_metrics', {}).get('hit_ratio', 0) / 100
                self.metrics['cache_hit_ratio'].labels(cache_tier='distributed').set(hit_ratio)

                # Update cache memory usage
                memory_usage = cache_stats.get('global_metrics', {}).get('memory_usage_bytes', 0)
                self.metrics['cache_memory_usage_bytes'].labels(
                    cache_tier='distributed', node='global'
                ).set(memory_usage)

                # Cache operations
                hit_count = cache_stats.get('global_metrics', {}).get('hit_count', 0)
                miss_count = cache_stats.get('global_metrics', {}).get('miss_count', 0)

                self.metrics['cache_operations_total'].labels(
                    operation='get', cache_tier='distributed', status='hit'
                )._value._value = hit_count

                self.metrics['cache_operations_total'].labels(
                    operation='get', cache_tier='distributed', status='miss'
                )._value._value = miss_count

                # Store historical sample
                self.metric_history.append(MetricSample(
                    name='cache_metrics',
                    value=hit_ratio,
                    labels={
                        'hit_count': str(hit_count),
                        'miss_count': str(miss_count),
                        'memory_usage_mb': str(memory_usage / (1024 * 1024))
                    }
                ))

        except Exception as e:
            logger.warning("Failed to collect cache metrics", error=str(e))

    async def _collect_load_balancer_metrics(self):
        """Collect load balancer metrics."""
        try:
            from backend.microservices.LoadBalancer import get_load_balancer_manager

            manager = get_load_balancer_manager()
            if manager:
                stats = await manager.get_comprehensive_stats()

                for lb_name, lb_stats in stats.get('load_balancers', {}).items():
                    if 'nodes' in lb_stats:
                        healthy_nodes = 0
                        total_nodes = len(lb_stats['nodes'])

                        for node_id, node_stats in lb_stats['nodes'].items():
                            # Node health
                            is_healthy = 1 if node_stats.get('health_status') == 'healthy' else 0
                            healthy_nodes += is_healthy

                            self.metrics['load_balancer_node_health'].labels(
                                algorithm=lb_name, node=node_id
                            ).set(is_healthy)

                            # Node requests
                            total_requests = node_stats.get('total_requests', 0)
                            success_rate = node_stats.get('success_rate', 100) / 100

                            self.metrics['load_balancer_requests_total'].labels(
                                algorithm=lb_name, node=node_id, status='success'
                            )._value._value = total_requests * success_rate

                            self.metrics['load_balancer_requests_total'].labels(
                                algorithm=lb_name, node=node_id, status='error'
                            )._value._value = total_requests * (1 - success_rate)

                        # Store historical sample
                        healthy_ratio = healthy_nodes / max(total_nodes, 1)
                        self.metric_history.append(MetricSample(
                            name='load_balancer_metrics',
                            value=healthy_ratio,
                            labels={
                                'algorithm': lb_name,
                                'healthy_nodes': str(healthy_nodes),
                                'total_nodes': str(total_nodes)
                            }
                        ))

        except Exception as e:
            logger.warning("Failed to collect load balancer metrics", error=str(e))

    async def _collect_application_metrics(self):
        """Collect application-specific metrics."""
        while True:
            try:
                await asyncio.sleep(self.application_metrics_interval)

                # Collect database connection metrics
                await self._collect_database_metrics()

                # Collect HVAC calculation metrics
                await self._collect_hvac_metrics()

            except Exception as e:
                logger.error("Error collecting application metrics", error=str(e))

    async def _collect_database_metrics(self):
        """Collect database connection and performance metrics."""
        try:
            # This would integrate with actual database connection pools
            # For now, we'll simulate some metrics

            # PostgreSQL metrics (simulated)
            self.metrics['database_connections_active'].labels(
                database_type='postgresql', database_name='sizewise'
            ).set(10)  # Would get from actual connection pool

            # MongoDB metrics (simulated)
            self.metrics['database_connections_active'].labels(
                database_type='mongodb', database_name='sizewise'
            ).set(5)  # Would get from actual connection pool

        except Exception as e:
            logger.warning("Failed to collect database metrics", error=str(e))

    async def _collect_hvac_metrics(self):
        """Collect HVAC calculation performance metrics."""
        try:
            # This would integrate with actual HVAC calculation tracking
            # For now, we'll simulate some metrics based on typical usage

            # Store historical sample for HVAC calculations
            self.metric_history.append(MetricSample(
                name='hvac_calculations',
                value=1,  # Simulated calculation
                labels={
                    'calculation_type': 'load_calculation',
                    'duration_seconds': '1.5',
                    'status': 'success'
                }
            ))

        except Exception as e:
            logger.warning("Failed to collect HVAC metrics", error=str(e))

    async def _evaluate_alerts(self):
        """Evaluate alert rules and trigger alerts."""
        while True:
            try:
                await asyncio.sleep(60)  # Evaluate alerts every minute

                current_time = datetime.utcnow()

                for alert_rule in self.alert_rules:
                    try:
                        # Get current metric value
                        metric_value = await self._get_current_metric_value(alert_rule.metric_name)

                        if metric_value is not None:
                            # Evaluate condition
                            alert_triggered = self._evaluate_alert_condition(
                                metric_value, alert_rule.condition, alert_rule.threshold
                            )

                            alert_key = f"{alert_rule.name}_{alert_rule.metric_name}"

                            if alert_triggered:
                                if alert_key not in self.active_alerts:
                                    # New alert
                                    self.active_alerts[alert_key] = {
                                        'rule': alert_rule,
                                        'first_triggered': current_time,
                                        'last_triggered': current_time,
                                        'current_value': metric_value,
                                        'trigger_count': 1
                                    }
                                else:
                                    # Update existing alert
                                    alert_data = self.active_alerts[alert_key]
                                    alert_data['last_triggered'] = current_time
                                    alert_data['current_value'] = metric_value
                                    alert_data['trigger_count'] += 1

                                    # Check if alert should fire (duration exceeded)
                                    duration = (current_time - alert_data['first_triggered']).total_seconds()
                                    if duration >= alert_rule.duration_seconds:
                                        await self._fire_alert(alert_rule, metric_value, duration)
                            else:
                                # Alert condition not met, remove if exists
                                if alert_key in self.active_alerts:
                                    await self._resolve_alert(alert_rule, metric_value)
                                    del self.active_alerts[alert_key]

                    except Exception as e:
                        logger.error("Error evaluating alert rule",
                                   rule_name=alert_rule.name, error=str(e))

            except Exception as e:
                logger.error("Error in alert evaluation", error=str(e))

    async def _get_current_metric_value(self, metric_name: str) -> Optional[float]:
        """Get current value for a metric."""
        try:
            # This is a simplified implementation
            # In a real system, you'd query the actual metric values

            if metric_name == "sizewise_cpu_usage_percent":
                return psutil.cpu_percent()
            elif metric_name == "sizewise_memory_usage_percent":
                return psutil.virtual_memory().percent
            elif metric_name in self.metrics:
                # Try to get value from Prometheus metric
                metric = self.metrics[metric_name]
                if hasattr(metric, '_value'):
                    return float(metric._value._value)

            return None

        except Exception as e:
            logger.error("Failed to get metric value", metric_name=metric_name, error=str(e))
            return None

    def _evaluate_alert_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Evaluate if alert condition is met."""
        try:
            if condition == ">":
                return value > threshold
            elif condition == "<":
                return value < threshold
            elif condition == ">=":
                return value >= threshold
            elif condition == "<=":
                return value <= threshold
            elif condition == "==":
                return abs(value - threshold) < 0.001  # Float comparison
            elif condition == "!=":
                return abs(value - threshold) >= 0.001
            else:
                logger.warning("Unknown alert condition", condition=condition)
                return False

        except Exception as e:
            logger.error("Error evaluating alert condition", error=str(e))
            return False

    async def _fire_alert(self, alert_rule: AlertRule, current_value: float, duration: float):
        """Fire an alert."""
        try:
            alert_message = {
                'alert_name': alert_rule.name,
                'severity': alert_rule.severity.value,
                'description': alert_rule.description,
                'metric_name': alert_rule.metric_name,
                'current_value': current_value,
                'threshold': alert_rule.threshold,
                'condition': alert_rule.condition,
                'duration_seconds': duration,
                'timestamp': datetime.utcnow().isoformat()
            }

            logger.warning("ALERT FIRED", **alert_message)

            # Here you would integrate with alerting systems like:
            # - Slack notifications
            # - Email alerts
            # - PagerDuty
            # - Discord webhooks
            # - etc.

        except Exception as e:
            logger.error("Failed to fire alert", alert_name=alert_rule.name, error=str(e))

    async def _resolve_alert(self, alert_rule: AlertRule, current_value: float):
        """Resolve an alert."""
        try:
            logger.info("ALERT RESOLVED",
                       alert_name=alert_rule.name,
                       metric_name=alert_rule.metric_name,
                       current_value=current_value)

        except Exception as e:
            logger.error("Failed to resolve alert", alert_name=alert_rule.name, error=str(e))

    async def _cleanup_old_metrics(self):
        """Clean up old metric history."""
        while True:
            try:
                await asyncio.sleep(3600)  # Clean up every hour

                # Keep only last 24 hours of metric history
                cutoff_time = datetime.utcnow() - timedelta(hours=24)
                self.metric_history = [
                    sample for sample in self.metric_history
                    if sample.timestamp > cutoff_time
                ]

                logger.debug("Cleaned up old metrics",
                           remaining_samples=len(self.metric_history))

            except Exception as e:
                logger.error("Error cleaning up metrics", error=str(e))

    def get_prometheus_metrics(self) -> str:
        """Get Prometheus-formatted metrics."""
        try:
            return generate_latest(self.registry).decode('utf-8')
        except Exception as e:
            logger.error("Failed to generate Prometheus metrics", error=str(e))
            return ""

    async def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary."""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()

            # Recent metric samples
            recent_samples = [
                sample for sample in self.metric_history
                if sample.timestamp > datetime.utcnow() - timedelta(minutes=5)
            ]

            return {
                'timestamp': datetime.utcnow().isoformat(),
                'system': {
                    'cpu_usage_percent': cpu_percent,
                    'memory_usage_percent': memory.percent,
                    'memory_usage_gb': memory.used / (1024**3),
                    'memory_available_gb': memory.available / (1024**3)
                },
                'alerts': {
                    'active_alerts': len(self.active_alerts),
                    'alert_rules': len(self.alert_rules),
                    'recent_alerts': [
                        {
                            'name': alert_data['rule'].name,
                            'severity': alert_data['rule'].severity.value,
                            'current_value': alert_data['current_value'],
                            'duration_seconds': (
                                datetime.utcnow() - alert_data['first_triggered']
                            ).total_seconds()
                        }
                        for alert_data in self.active_alerts.values()
                    ]
                },
                'metrics': {
                    'total_samples': len(self.metric_history),
                    'recent_samples': len(recent_samples),
                    'collection_intervals': {
                        'system_metrics': self.system_metrics_interval,
                        'microservices_metrics': self.microservices_metrics_interval,
                        'application_metrics': self.application_metrics_interval
                    }
                }
            }

        except Exception as e:
            logger.error("Failed to get metrics summary", error=str(e))
            return {'error': str(e)}

# Global metrics collector instance
metrics_collector = None

def initialize_metrics_collector() -> MetricsCollector:
    """Initialize the global metrics collector."""
    global metrics_collector
    metrics_collector = MetricsCollector()
    return metrics_collector

def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector instance."""
    if metrics_collector is None:
        raise RuntimeError("Metrics collector not initialized")
    return metrics_collector
