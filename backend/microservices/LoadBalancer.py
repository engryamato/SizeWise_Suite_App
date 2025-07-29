"""
Advanced Load Balancing Strategies for SizeWise Suite Microservices

Provides intelligent load balancing algorithms optimized for HVAC calculation workloads:
- Round-robin with health awareness
- Least connections with connection tracking
- Weighted distribution based on node capacity
- Sticky sessions for stateful operations
- Canary deployment support
- Geographic and latency-aware routing
"""

import asyncio
import time
import random
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import structlog

logger = structlog.get_logger()

# =============================================================================
# Load Balancer Configuration and Types
# =============================================================================

class LoadBalancingAlgorithm(Enum):
    """Load balancing algorithms."""
    ROUND_ROBIN = "round_robin"
    LEAST_CONNECTIONS = "least_connections"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    LEAST_RESPONSE_TIME = "least_response_time"
    STICKY_SESSION = "sticky_session"
    GEOGRAPHIC = "geographic"
    CANARY = "canary"
    ADAPTIVE = "adaptive"

class HealthStatus(Enum):
    """Server health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

@dataclass
class ServerNode:
    """Load balancer server node."""
    node_id: str
    host: str
    port: int
    weight: int = 100
    max_connections: int = 1000
    region: str = "default"
    zone: str = "default"
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Runtime state
    current_connections: int = 0
    total_requests: int = 0
    failed_requests: int = 0
    avg_response_time_ms: float = 0.0
    last_health_check: datetime = field(default_factory=datetime.utcnow)
    health_status: HealthStatus = HealthStatus.UNKNOWN
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 100.0
        return ((self.total_requests - self.failed_requests) / self.total_requests) * 100
    
    @property
    def connection_utilization(self) -> float:
        return (self.current_connections / self.max_connections) * 100
    
    @property
    def is_healthy(self) -> bool:
        return self.health_status == HealthStatus.HEALTHY
    
    @property
    def effective_weight(self) -> int:
        """Calculate effective weight based on health and performance."""
        if not self.is_healthy:
            return 0
        
        # Reduce weight based on connection utilization
        utilization_factor = max(0.1, 1.0 - (self.connection_utilization / 100))
        
        # Reduce weight based on response time
        response_time_factor = max(0.1, 1.0 - min(1.0, self.avg_response_time_ms / 1000))
        
        # Reduce weight based on success rate
        success_rate_factor = self.success_rate / 100
        
        return int(self.weight * utilization_factor * response_time_factor * success_rate_factor)

@dataclass
class LoadBalancerMetrics:
    """Load balancer performance metrics."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    avg_response_time_ms: float = 0.0
    requests_per_second: float = 0.0
    active_connections: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 100.0
        return (self.successful_requests / self.total_requests) * 100

class LoadBalancer(ABC):
    """Abstract base class for load balancing algorithms."""
    
    def __init__(self, nodes: List[ServerNode]):
        self.nodes = {node.node_id: node for node in nodes}
        self.metrics = LoadBalancerMetrics()
        self.session_affinity: Dict[str, str] = {}  # session_id -> node_id
        self.request_history: List[Tuple[datetime, str, float]] = []  # timestamp, node_id, response_time
        
    @abstractmethod
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select the best node for the request."""
        pass
    
    async def record_request(self, node_id: str, response_time_ms: float, success: bool):
        """Record request metrics for a node."""
        try:
            if node_id in self.nodes:
                node = self.nodes[node_id]
                node.total_requests += 1
                
                if success:
                    self.metrics.successful_requests += 1
                else:
                    node.failed_requests += 1
                    self.metrics.failed_requests += 1
                
                # Update average response time (exponential moving average)
                alpha = 0.1  # Smoothing factor
                node.avg_response_time_ms = (
                    alpha * response_time_ms + 
                    (1 - alpha) * node.avg_response_time_ms
                )
                
                # Update global metrics
                self.metrics.total_requests += 1
                self.metrics.avg_response_time_ms = (
                    alpha * response_time_ms + 
                    (1 - alpha) * self.metrics.avg_response_time_ms
                )
                
                # Record in history
                self.request_history.append((datetime.utcnow(), node_id, response_time_ms))
                
                # Keep only recent history (last 1000 requests)
                if len(self.request_history) > 1000:
                    self.request_history = self.request_history[-1000:]
                
                self.metrics.last_updated = datetime.utcnow()
                
        except Exception as e:
            logger.error("Failed to record request metrics", 
                        node_id=node_id, error=str(e))
    
    async def update_node_health(self, node_id: str, health_status: HealthStatus):
        """Update node health status."""
        try:
            if node_id in self.nodes:
                self.nodes[node_id].health_status = health_status
                self.nodes[node_id].last_health_check = datetime.utcnow()
                
                logger.debug("Node health updated", 
                           node_id=node_id, 
                           health=health_status.value)
                
        except Exception as e:
            logger.error("Failed to update node health", 
                        node_id=node_id, error=str(e))
    
    def get_healthy_nodes(self) -> List[ServerNode]:
        """Get list of healthy nodes."""
        return [node for node in self.nodes.values() if node.is_healthy]
    
    async def get_load_balancer_stats(self) -> Dict[str, Any]:
        """Get comprehensive load balancer statistics."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            
            # Calculate requests per second
            recent_requests = [
                req for req in self.request_history
                if req[0] > datetime.utcnow() - timedelta(minutes=1)
            ]
            self.metrics.requests_per_second = len(recent_requests) / 60.0
            
            # Node statistics
            node_stats = {}
            for node_id, node in self.nodes.items():
                node_stats[node_id] = {
                    'host': node.host,
                    'port': node.port,
                    'health_status': node.health_status.value,
                    'current_connections': node.current_connections,
                    'connection_utilization': node.connection_utilization,
                    'total_requests': node.total_requests,
                    'success_rate': node.success_rate,
                    'avg_response_time_ms': node.avg_response_time_ms,
                    'effective_weight': node.effective_weight,
                    'last_health_check': node.last_health_check.isoformat()
                }
            
            return {
                'algorithm': self.__class__.__name__,
                'total_nodes': len(self.nodes),
                'healthy_nodes': len(healthy_nodes),
                'metrics': {
                    'total_requests': self.metrics.total_requests,
                    'success_rate': self.metrics.success_rate,
                    'avg_response_time_ms': self.metrics.avg_response_time_ms,
                    'requests_per_second': self.metrics.requests_per_second,
                    'active_connections': sum(node.current_connections for node in self.nodes.values()),
                    'last_updated': self.metrics.last_updated.isoformat()
                },
                'nodes': node_stats,
                'session_affinity_count': len(self.session_affinity)
            }
            
        except Exception as e:
            logger.error("Failed to get load balancer stats", error=str(e))
            return {'error': str(e)}

class RoundRobinLoadBalancer(LoadBalancer):
    """Round-robin load balancing with health awareness."""
    
    def __init__(self, nodes: List[ServerNode]):
        super().__init__(nodes)
        self.current_index = 0
    
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select next node using round-robin algorithm."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                logger.warning("No healthy nodes available for round-robin selection")
                return None
            
            # Select next node in round-robin fashion
            selected_node = healthy_nodes[self.current_index % len(healthy_nodes)]
            self.current_index += 1
            
            logger.debug("Round-robin node selected", 
                        node_id=selected_node.node_id,
                        index=self.current_index - 1)
            
            return selected_node
            
        except Exception as e:
            logger.error("Failed to select node with round-robin", error=str(e))
            return None

class LeastConnectionsLoadBalancer(LoadBalancer):
    """Least connections load balancing."""
    
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node with least active connections."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                logger.warning("No healthy nodes available for least connections selection")
                return None
            
            # Find node with minimum connections
            selected_node = min(healthy_nodes, key=lambda node: node.current_connections)
            
            logger.debug("Least connections node selected", 
                        node_id=selected_node.node_id,
                        connections=selected_node.current_connections)
            
            return selected_node
            
        except Exception as e:
            logger.error("Failed to select node with least connections", error=str(e))
            return None

class WeightedRoundRobinLoadBalancer(LoadBalancer):
    """Weighted round-robin load balancing."""
    
    def __init__(self, nodes: List[ServerNode]):
        super().__init__(nodes)
        self.current_weights = {}
        self.reset_weights()
    
    def reset_weights(self):
        """Reset current weights for all nodes."""
        for node_id, node in self.nodes.items():
            self.current_weights[node_id] = 0
    
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node using weighted round-robin algorithm."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                logger.warning("No healthy nodes available for weighted round-robin selection")
                return None
            
            # Find node with highest current weight
            best_node = None
            max_current_weight = -1
            total_weight = 0
            
            for node in healthy_nodes:
                effective_weight = node.effective_weight
                total_weight += effective_weight
                
                self.current_weights[node.node_id] += effective_weight
                
                if self.current_weights[node.node_id] > max_current_weight:
                    max_current_weight = self.current_weights[node.node_id]
                    best_node = node
            
            if best_node:
                self.current_weights[best_node.node_id] -= total_weight
                
                logger.debug("Weighted round-robin node selected", 
                           node_id=best_node.node_id,
                           effective_weight=best_node.effective_weight,
                           current_weight=self.current_weights[best_node.node_id])
            
            return best_node
            
        except Exception as e:
            logger.error("Failed to select node with weighted round-robin", error=str(e))
            return None

class LeastResponseTimeLoadBalancer(LoadBalancer):
    """Least response time load balancing."""
    
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node with lowest average response time."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                logger.warning("No healthy nodes available for least response time selection")
                return None
            
            # Find node with minimum response time
            selected_node = min(healthy_nodes, key=lambda node: node.avg_response_time_ms)
            
            logger.debug("Least response time node selected", 
                        node_id=selected_node.node_id,
                        response_time=selected_node.avg_response_time_ms)
            
            return selected_node
            
        except Exception as e:
            logger.error("Failed to select node with least response time", error=str(e))
            return None

class StickySessionLoadBalancer(LoadBalancer):
    """Sticky session load balancing with fallback."""
    
    def __init__(self, nodes: List[ServerNode]):
        super().__init__(nodes)
        self.fallback_balancer = RoundRobinLoadBalancer(nodes)
    
    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node based on session affinity."""
        try:
            session_id = request_context.get('session_id') if request_context else None
            
            # Check for existing session affinity
            if session_id and session_id in self.session_affinity:
                node_id = self.session_affinity[session_id]
                if node_id in self.nodes and self.nodes[node_id].is_healthy:
                    logger.debug("Sticky session node selected", 
                               session_id=session_id,
                               node_id=node_id)
                    return self.nodes[node_id]
                else:
                    # Remove invalid session affinity
                    del self.session_affinity[session_id]
            
            # Use fallback balancer for new sessions
            selected_node = await self.fallback_balancer.select_node(request_context)
            
            # Create session affinity
            if session_id and selected_node:
                self.session_affinity[session_id] = selected_node.node_id
                logger.debug("New session affinity created", 
                           session_id=session_id,
                           node_id=selected_node.node_id)
            
            return selected_node
            
        except Exception as e:
            logger.error("Failed to select node with sticky session", error=str(e))
            return None

class CanaryLoadBalancer(LoadBalancer):
    """Canary deployment load balancing."""

    def __init__(self, nodes: List[ServerNode], canary_percentage: int = 10):
        super().__init__(nodes)
        self.canary_percentage = canary_percentage
        self.stable_balancer = WeightedRoundRobinLoadBalancer(nodes)
        self.canary_balancer = RoundRobinLoadBalancer(nodes)

    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node for canary deployment."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                return None

            # Separate canary and stable nodes
            canary_nodes = [node for node in healthy_nodes
                          if node.metadata.get('deployment_type') == 'canary']
            stable_nodes = [node for node in healthy_nodes
                          if node.metadata.get('deployment_type') != 'canary']

            # Route to canary based on percentage
            if canary_nodes and random.randint(1, 100) <= self.canary_percentage:
                selected_node = random.choice(canary_nodes)
                logger.debug("Canary node selected",
                           node_id=selected_node.node_id,
                           canary_percentage=self.canary_percentage)
                return selected_node
            elif stable_nodes:
                # Use weighted round-robin for stable nodes
                self.stable_balancer.nodes = {node.node_id: node for node in stable_nodes}
                return await self.stable_balancer.select_node(request_context)
            else:
                # Fallback to any available node
                return healthy_nodes[0] if healthy_nodes else None

        except Exception as e:
            logger.error("Failed to select node with canary deployment", error=str(e))
            return None

class GeographicLoadBalancer(LoadBalancer):
    """Geographic load balancing based on client location."""

    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node based on geographic proximity."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                return None

            client_region = request_context.get('client_region', 'default') if request_context else 'default'
            client_zone = request_context.get('client_zone', 'default') if request_context else 'default'

            # Prefer nodes in same region and zone
            same_zone_nodes = [node for node in healthy_nodes
                             if node.region == client_region and node.zone == client_zone]
            if same_zone_nodes:
                selected_node = min(same_zone_nodes, key=lambda node: node.current_connections)
                logger.debug("Geographic node selected (same zone)",
                           node_id=selected_node.node_id,
                           region=client_region, zone=client_zone)
                return selected_node

            # Fallback to same region
            same_region_nodes = [node for node in healthy_nodes
                               if node.region == client_region]
            if same_region_nodes:
                selected_node = min(same_region_nodes, key=lambda node: node.current_connections)
                logger.debug("Geographic node selected (same region)",
                           node_id=selected_node.node_id,
                           region=client_region)
                return selected_node

            # Fallback to any healthy node
            selected_node = min(healthy_nodes, key=lambda node: node.avg_response_time_ms)
            logger.debug("Geographic node selected (fallback)",
                       node_id=selected_node.node_id)
            return selected_node

        except Exception as e:
            logger.error("Failed to select node with geographic balancing", error=str(e))
            return None

class AdaptiveLoadBalancer(LoadBalancer):
    """Adaptive load balancing that switches algorithms based on conditions."""

    def __init__(self, nodes: List[ServerNode]):
        super().__init__(nodes)
        self.algorithms = {
            'round_robin': RoundRobinLoadBalancer(nodes),
            'least_connections': LeastConnectionsLoadBalancer(nodes),
            'weighted': WeightedRoundRobinLoadBalancer(nodes),
            'least_response_time': LeastResponseTimeLoadBalancer(nodes),
            'geographic': GeographicLoadBalancer(nodes)
        }
        self.current_algorithm = 'weighted'
        self.last_adaptation = datetime.utcnow()
        self.adaptation_interval = timedelta(minutes=5)

    async def select_node(self, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Select node using adaptive algorithm selection."""
        try:
            # Check if we should adapt the algorithm
            if datetime.utcnow() - self.last_adaptation > self.adaptation_interval:
                await self._adapt_algorithm()
                self.last_adaptation = datetime.utcnow()

            # Use current algorithm
            balancer = self.algorithms[self.current_algorithm]

            # Sync node state with current balancer
            balancer.nodes = self.nodes
            balancer.metrics = self.metrics

            selected_node = await balancer.select_node(request_context)

            if selected_node:
                logger.debug("Adaptive node selected",
                           node_id=selected_node.node_id,
                           algorithm=self.current_algorithm)

            return selected_node

        except Exception as e:
            logger.error("Failed to select node with adaptive balancing", error=str(e))
            return None

    async def _adapt_algorithm(self):
        """Adapt load balancing algorithm based on current conditions."""
        try:
            healthy_nodes = self.get_healthy_nodes()
            if not healthy_nodes:
                return

            # Calculate system metrics
            avg_utilization = sum(node.connection_utilization for node in healthy_nodes) / len(healthy_nodes)
            avg_response_time = sum(node.avg_response_time_ms for node in healthy_nodes) / len(healthy_nodes)
            success_rate = sum(node.success_rate for node in healthy_nodes) / len(healthy_nodes)

            # Adaptation logic
            if avg_response_time > 500:  # High latency
                new_algorithm = 'least_response_time'
            elif avg_utilization > 80:  # High load
                new_algorithm = 'least_connections'
            elif success_rate < 95:  # Low success rate
                new_algorithm = 'weighted'
            elif len(set(node.region for node in healthy_nodes)) > 1:  # Multi-region
                new_algorithm = 'geographic'
            else:
                new_algorithm = 'weighted'  # Default

            if new_algorithm != self.current_algorithm:
                logger.info("Load balancing algorithm adapted",
                          old_algorithm=self.current_algorithm,
                          new_algorithm=new_algorithm,
                          avg_utilization=avg_utilization,
                          avg_response_time=avg_response_time,
                          success_rate=success_rate)
                self.current_algorithm = new_algorithm

        except Exception as e:
            logger.error("Failed to adapt load balancing algorithm", error=str(e))

class LoadBalancerManager:
    """Manager for multiple load balancers and routing strategies."""

    def __init__(self):
        self.load_balancers: Dict[str, LoadBalancer] = {}
        self.routing_rules: Dict[str, str] = {}  # service_name -> load_balancer_name
        self.default_load_balancer = 'adaptive'

    def register_load_balancer(self, name: str, load_balancer: LoadBalancer):
        """Register a load balancer."""
        self.load_balancers[name] = load_balancer
        logger.info("Load balancer registered", name=name, type=type(load_balancer).__name__)

    def set_routing_rule(self, service_name: str, load_balancer_name: str):
        """Set routing rule for a service."""
        if load_balancer_name in self.load_balancers:
            self.routing_rules[service_name] = load_balancer_name
            logger.info("Routing rule set",
                       service=service_name,
                       load_balancer=load_balancer_name)
        else:
            raise ValueError(f"Load balancer '{load_balancer_name}' not found")

    async def route_request(self, service_name: str, request_context: Dict[str, Any] = None) -> Optional[ServerNode]:
        """Route request to appropriate load balancer."""
        try:
            # Get load balancer for service
            load_balancer_name = self.routing_rules.get(service_name, self.default_load_balancer)

            if load_balancer_name not in self.load_balancers:
                logger.error("Load balancer not found",
                           service=service_name,
                           load_balancer=load_balancer_name)
                return None

            load_balancer = self.load_balancers[load_balancer_name]
            selected_node = await load_balancer.select_node(request_context)

            if selected_node:
                logger.debug("Request routed",
                           service=service_name,
                           load_balancer=load_balancer_name,
                           node_id=selected_node.node_id)

            return selected_node

        except Exception as e:
            logger.error("Failed to route request",
                        service=service_name, error=str(e))
            return None

    async def record_request_result(self, service_name: str, node_id: str,
                                  response_time_ms: float, success: bool):
        """Record request result for all relevant load balancers."""
        try:
            load_balancer_name = self.routing_rules.get(service_name, self.default_load_balancer)

            if load_balancer_name in self.load_balancers:
                load_balancer = self.load_balancers[load_balancer_name]
                await load_balancer.record_request(node_id, response_time_ms, success)

        except Exception as e:
            logger.error("Failed to record request result",
                        service=service_name, error=str(e))

    async def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics for all load balancers."""
        try:
            stats = {
                'load_balancers': {},
                'routing_rules': self.routing_rules,
                'default_load_balancer': self.default_load_balancer,
                'total_load_balancers': len(self.load_balancers)
            }

            for name, load_balancer in self.load_balancers.items():
                stats['load_balancers'][name] = await load_balancer.get_load_balancer_stats()

            return stats

        except Exception as e:
            logger.error("Failed to get comprehensive stats", error=str(e))
            return {'error': str(e)}

# Global load balancer manager
load_balancer_manager = None

def initialize_load_balancer_manager() -> LoadBalancerManager:
    """Initialize the global load balancer manager."""
    global load_balancer_manager
    load_balancer_manager = LoadBalancerManager()
    return load_balancer_manager

def get_load_balancer_manager() -> LoadBalancerManager:
    """Get the global load balancer manager instance."""
    if load_balancer_manager is None:
        raise RuntimeError("Load balancer manager not initialized")
    return load_balancer_manager
