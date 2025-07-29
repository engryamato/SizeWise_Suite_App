"""
Distributed Caching System for SizeWise Suite Microservices

Provides Redis cluster integration with intelligent cache distribution including:
- Multi-tier caching with local and distributed layers
- Intelligent cache partitioning and sharding
- Cache coherence and invalidation strategies
- Performance monitoring and optimization
- Integration with existing service mesh
"""

import asyncio
import time
import json
import hashlib
import uuid
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import structlog
import redis.asyncio as redis
from redis.asyncio.cluster import RedisCluster
from contextlib import asynccontextmanager

logger = structlog.get_logger()

# =============================================================================
# Distributed Cache Configuration and Types
# =============================================================================

class CacheStrategy(Enum):
    """Cache distribution strategies."""
    CONSISTENT_HASH = "consistent_hash"
    ROUND_ROBIN = "round_robin"
    LOCALITY_AWARE = "locality_aware"
    WORKLOAD_BASED = "workload_based"

class CacheLevel(Enum):
    """Cache hierarchy levels."""
    L1_LOCAL = "l1_local"      # In-memory local cache
    L2_DISTRIBUTED = "l2_distributed"  # Redis distributed cache
    L3_PERSISTENT = "l3_persistent"    # Database-backed cache

@dataclass
class CacheNode:
    """Distributed cache node configuration."""
    node_id: str
    host: str
    port: int
    weight: int = 100
    region: str = "default"
    is_master: bool = True
    max_memory: str = "1gb"
    eviction_policy: str = "allkeys-lru"

@dataclass
class CacheMetrics:
    """Cache performance metrics."""
    hit_count: int = 0
    miss_count: int = 0
    eviction_count: int = 0
    memory_usage_bytes: int = 0
    network_latency_ms: float = 0.0
    throughput_ops_sec: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def hit_ratio(self) -> float:
        total = self.hit_count + self.miss_count
        return (self.hit_count / total * 100) if total > 0 else 0.0

@dataclass
class CacheEntry:
    """Distributed cache entry with metadata."""
    key: str
    value: Any
    ttl_seconds: int
    created_at: datetime
    accessed_at: datetime
    access_count: int = 0
    size_bytes: int = 0
    tags: List[str] = field(default_factory=list)
    
    @property
    def is_expired(self) -> bool:
        if self.ttl_seconds <= 0:
            return False
        return datetime.utcnow() > self.created_at + timedelta(seconds=self.ttl_seconds)

class DistributedCache:
    """
    Distributed caching system with Redis cluster integration.
    
    Features:
    - Multi-tier caching (L1 local, L2 distributed, L3 persistent)
    - Intelligent cache partitioning and sharding
    - Cache coherence and invalidation
    - Performance monitoring and optimization
    - Service mesh integration
    """
    
    def __init__(self, cache_nodes: List[CacheNode], strategy: CacheStrategy = CacheStrategy.CONSISTENT_HASH):
        self.cache_nodes = cache_nodes
        self.strategy = strategy
        
        # Cache clients
        self.redis_cluster = None
        self.redis_clients: Dict[str, redis.Redis] = {}
        
        # Local L1 cache
        self.local_cache: Dict[str, CacheEntry] = {}
        self.local_cache_max_size = 10000
        
        # Cache metrics
        self.node_metrics: Dict[str, CacheMetrics] = {}
        self.global_metrics = CacheMetrics()
        
        # Cache coherence
        self.invalidation_queue: List[str] = []
        self.cache_version = 1
        
        # Performance optimization
        self.hot_keys: Dict[str, int] = {}  # Key access frequency
        self.cache_warming_enabled = True
        self.prefetch_enabled = True
        
        # Consistent hashing ring for cache distribution
        self.hash_ring: Dict[int, str] = {}
        self._build_hash_ring()
        
    async def initialize(self):
        """Initialize distributed cache system."""
        try:
            # Initialize Redis cluster connection
            if len(self.cache_nodes) > 1:
                await self._initialize_redis_cluster()
            else:
                await self._initialize_single_redis()
            
            # Initialize node metrics
            for node in self.cache_nodes:
                self.node_metrics[node.node_id] = CacheMetrics()
            
            # Start background tasks
            asyncio.create_task(self._metrics_collector())
            asyncio.create_task(self._cache_warmer())
            asyncio.create_task(self._invalidation_processor())
            asyncio.create_task(self._local_cache_cleaner())
            
            logger.info("Distributed cache initialized successfully",
                       nodes=len(self.cache_nodes),
                       strategy=self.strategy.value)
            
        except Exception as e:
            logger.error("Failed to initialize distributed cache", error=str(e))
            raise
    
    async def _initialize_redis_cluster(self):
        """Initialize Redis cluster connection."""
        try:
            startup_nodes = [
                {"host": node.host, "port": node.port}
                for node in self.cache_nodes
            ]
            
            self.redis_cluster = RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=True,
                skip_full_coverage_check=True,
                max_connections=20,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test cluster connection
            await self.redis_cluster.ping()
            logger.info("Redis cluster connection established")
            
        except Exception as e:
            logger.error("Failed to initialize Redis cluster", error=str(e))
            raise
    
    async def _initialize_single_redis(self):
        """Initialize single Redis connection."""
        try:
            node = self.cache_nodes[0]
            self.redis_clients[node.node_id] = redis.Redis(
                host=node.host,
                port=node.port,
                decode_responses=True,
                max_connections=20,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            await self.redis_clients[node.node_id].ping()
            logger.info("Redis connection established", node_id=node.node_id)
            
        except Exception as e:
            logger.error("Failed to initialize Redis connection", error=str(e))
            raise
    
    def _build_hash_ring(self):
        """Build consistent hash ring for cache distribution."""
        try:
            self.hash_ring = {}
            
            # Add virtual nodes for better distribution
            virtual_nodes_per_node = 150
            
            for node in self.cache_nodes:
                for i in range(virtual_nodes_per_node):
                    virtual_key = f"{node.node_id}:{i}"
                    hash_value = int(hashlib.md5(virtual_key.encode()).hexdigest(), 16)
                    self.hash_ring[hash_value] = node.node_id
            
            logger.info("Consistent hash ring built",
                       total_virtual_nodes=len(self.hash_ring))
            
        except Exception as e:
            logger.error("Failed to build hash ring", error=str(e))
            raise
    
    def _get_node_for_key(self, key: str) -> str:
        """Get cache node for key using consistent hashing."""
        try:
            if self.strategy == CacheStrategy.CONSISTENT_HASH:
                key_hash = int(hashlib.md5(key.encode()).hexdigest(), 16)
                
                # Find the first node with hash >= key_hash
                sorted_hashes = sorted(self.hash_ring.keys())
                for hash_value in sorted_hashes:
                    if hash_value >= key_hash:
                        return self.hash_ring[hash_value]
                
                # Wrap around to first node
                return self.hash_ring[sorted_hashes[0]]
            
            elif self.strategy == CacheStrategy.ROUND_ROBIN:
                # Simple round-robin based on key hash
                key_hash = hash(key)
                return self.cache_nodes[key_hash % len(self.cache_nodes)].node_id
            
            else:
                # Default to first node
                return self.cache_nodes[0].node_id
                
        except Exception as e:
            logger.error("Failed to get node for key", key=key, error=str(e))
            return self.cache_nodes[0].node_id
    
    # Multi-tier Cache Operations
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from multi-tier cache."""
        start_time = time.time()
        
        try:
            # L1: Check local cache first
            if key in self.local_cache:
                entry = self.local_cache[key]
                if not entry.is_expired:
                    entry.accessed_at = datetime.utcnow()
                    entry.access_count += 1
                    self._update_hot_keys(key)
                    
                    self.global_metrics.hit_count += 1
                    logger.debug("L1 cache hit", key=key)
                    return entry.value
                else:
                    # Remove expired entry
                    del self.local_cache[key]
            
            # L2: Check distributed cache
            value = await self._get_from_distributed_cache(key)
            if value is not None:
                # Store in L1 cache for future access
                await self._store_in_local_cache(key, value, ttl_seconds=300)
                
                self.global_metrics.hit_count += 1
                logger.debug("L2 cache hit", key=key)
                return value
            
            # Cache miss
            self.global_metrics.miss_count += 1
            logger.debug("Cache miss", key=key)
            return default
            
        except Exception as e:
            logger.error("Cache get failed", key=key, error=str(e))
            return default
        
        finally:
            latency_ms = (time.time() - start_time) * 1000
            self.global_metrics.network_latency_ms = (
                (self.global_metrics.network_latency_ms + latency_ms) / 2
            )
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 3600, tags: List[str] = None) -> bool:
        """Set value in multi-tier cache."""
        try:
            # Store in L1 local cache
            await self._store_in_local_cache(key, value, ttl_seconds, tags or [])
            
            # Store in L2 distributed cache
            success = await self._store_in_distributed_cache(key, value, ttl_seconds, tags or [])
            
            if success:
                self._update_hot_keys(key)
                logger.debug("Cache set successful", key=key, ttl=ttl_seconds)
            
            return success
            
        except Exception as e:
            logger.error("Cache set failed", key=key, error=str(e))
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from all cache tiers."""
        try:
            # Remove from L1 local cache
            if key in self.local_cache:
                del self.local_cache[key]
            
            # Remove from L2 distributed cache
            success = await self._delete_from_distributed_cache(key)
            
            # Add to invalidation queue for other nodes
            self.invalidation_queue.append(key)
            
            logger.debug("Cache delete successful", key=key)
            return success
            
        except Exception as e:
            logger.error("Cache delete failed", key=key, error=str(e))
            return False
    
    async def invalidate_by_tags(self, tags: List[str]) -> int:
        """Invalidate cache entries by tags."""
        try:
            invalidated_count = 0
            
            # Invalidate from local cache
            keys_to_remove = []
            for key, entry in self.local_cache.items():
                if any(tag in entry.tags for tag in tags):
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self.local_cache[key]
                invalidated_count += 1
            
            # Invalidate from distributed cache
            # Note: This would require scanning all keys in production
            # For now, we'll add tags to invalidation queue
            for tag in tags:
                self.invalidation_queue.append(f"tag:{tag}")
            
            logger.info("Cache invalidation by tags completed",
                       tags=tags, invalidated_count=invalidated_count)
            
            return invalidated_count
            
        except Exception as e:
            logger.error("Cache invalidation by tags failed", tags=tags, error=str(e))
            return 0
    
    async def _store_in_local_cache(self, key: str, value: Any, ttl_seconds: int, tags: List[str] = None):
        """Store entry in L1 local cache."""
        try:
            # Check cache size limit
            if len(self.local_cache) >= self.local_cache_max_size:
                await self._evict_local_cache_entries()
            
            entry = CacheEntry(
                key=key,
                value=value,
                ttl_seconds=ttl_seconds,
                created_at=datetime.utcnow(),
                accessed_at=datetime.utcnow(),
                size_bytes=len(str(value).encode('utf-8')),
                tags=tags or []
            )
            
            self.local_cache[key] = entry
            
        except Exception as e:
            logger.error("Failed to store in local cache", key=key, error=str(e))
    
    async def _get_from_distributed_cache(self, key: str) -> Any:
        """Get value from L2 distributed cache."""
        try:
            if self.redis_cluster:
                # Use Redis cluster
                value = await self.redis_cluster.get(key)
                if value:
                    return json.loads(value)
            else:
                # Use single Redis instance
                node_id = self._get_node_for_key(key)
                if node_id in self.redis_clients:
                    value = await self.redis_clients[node_id].get(key)
                    if value:
                        return json.loads(value)
            
            return None
            
        except Exception as e:
            logger.error("Failed to get from distributed cache", key=key, error=str(e))
            return None
    
    async def _store_in_distributed_cache(self, key: str, value: Any, ttl_seconds: int, tags: List[str]) -> bool:
        """Store value in L2 distributed cache."""
        try:
            serialized_value = json.dumps(value)
            
            if self.redis_cluster:
                # Use Redis cluster
                await self.redis_cluster.setex(key, ttl_seconds, serialized_value)
                
                # Store tags separately for invalidation
                if tags:
                    for tag in tags:
                        await self.redis_cluster.sadd(f"tag:{tag}", key)
                        await self.redis_cluster.expire(f"tag:{tag}", ttl_seconds)
            else:
                # Use single Redis instance
                node_id = self._get_node_for_key(key)
                if node_id in self.redis_clients:
                    client = self.redis_clients[node_id]
                    await client.setex(key, ttl_seconds, serialized_value)
                    
                    # Store tags
                    if tags:
                        for tag in tags:
                            await client.sadd(f"tag:{tag}", key)
                            await client.expire(f"tag:{tag}", ttl_seconds)
            
            return True
            
        except Exception as e:
            logger.error("Failed to store in distributed cache", key=key, error=str(e))
            return False
    
    async def _delete_from_distributed_cache(self, key: str) -> bool:
        """Delete key from L2 distributed cache."""
        try:
            if self.redis_cluster:
                result = await self.redis_cluster.delete(key)
                return result > 0
            else:
                node_id = self._get_node_for_key(key)
                if node_id in self.redis_clients:
                    result = await self.redis_clients[node_id].delete(key)
                    return result > 0
            
            return False
            
        except Exception as e:
            logger.error("Failed to delete from distributed cache", key=key, error=str(e))
            return False

    def _update_hot_keys(self, key: str):
        """Update hot key tracking for cache optimization."""
        try:
            self.hot_keys[key] = self.hot_keys.get(key, 0) + 1

            # Keep only top 1000 hot keys
            if len(self.hot_keys) > 1000:
                # Sort by access count and keep top 1000
                sorted_keys = sorted(self.hot_keys.items(), key=lambda x: x[1], reverse=True)
                self.hot_keys = dict(sorted_keys[:1000])

        except Exception as e:
            logger.error("Failed to update hot keys", key=key, error=str(e))

    async def _evict_local_cache_entries(self):
        """Evict entries from L1 local cache using LRU policy."""
        try:
            # Sort by last accessed time (LRU)
            sorted_entries = sorted(
                self.local_cache.items(),
                key=lambda x: x[1].accessed_at
            )

            # Remove oldest 20% of entries
            evict_count = max(1, len(sorted_entries) // 5)
            for i in range(evict_count):
                key, _ = sorted_entries[i]
                del self.local_cache[key]
                self.global_metrics.eviction_count += 1

            logger.debug("Local cache eviction completed", evicted=evict_count)

        except Exception as e:
            logger.error("Failed to evict local cache entries", error=str(e))

    # Background Tasks
    async def _metrics_collector(self):
        """Background task to collect cache metrics."""
        while True:
            try:
                await asyncio.sleep(30)  # Collect metrics every 30 seconds

                # Update memory usage for local cache
                total_memory = sum(
                    entry.size_bytes for entry in self.local_cache.values()
                )
                self.global_metrics.memory_usage_bytes = total_memory

                # Calculate throughput
                total_ops = self.global_metrics.hit_count + self.global_metrics.miss_count
                if hasattr(self, '_last_ops_count'):
                    ops_diff = total_ops - self._last_ops_count
                    self.global_metrics.throughput_ops_sec = ops_diff / 30.0
                self._last_ops_count = total_ops

                # Update node metrics from Redis
                await self._collect_redis_metrics()

                self.global_metrics.last_updated = datetime.utcnow()

            except Exception as e:
                logger.error("Error in metrics collector", error=str(e))

    async def _collect_redis_metrics(self):
        """Collect metrics from Redis nodes."""
        try:
            if self.redis_cluster:
                # Get cluster info
                info = await self.redis_cluster.info()
                if 'used_memory' in info:
                    self.global_metrics.memory_usage_bytes += info['used_memory']
            else:
                # Get metrics from individual nodes
                for node_id, client in self.redis_clients.items():
                    try:
                        info = await client.info('memory')
                        if node_id in self.node_metrics:
                            self.node_metrics[node_id].memory_usage_bytes = info.get('used_memory', 0)
                    except Exception as e:
                        logger.warning("Failed to get metrics from node",
                                     node_id=node_id, error=str(e))

        except Exception as e:
            logger.error("Failed to collect Redis metrics", error=str(e))

    async def _cache_warmer(self):
        """Background task to warm cache with frequently accessed data."""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes

                if not self.cache_warming_enabled:
                    continue

                # Warm cache with hot keys that are not in L1
                hot_keys_to_warm = [
                    key for key, count in self.hot_keys.items()
                    if count > 10 and key not in self.local_cache
                ]

                for key in hot_keys_to_warm[:50]:  # Warm top 50 hot keys
                    try:
                        value = await self._get_from_distributed_cache(key)
                        if value is not None:
                            await self._store_in_local_cache(key, value, ttl_seconds=600)
                    except Exception as e:
                        logger.warning("Failed to warm cache for key", key=key, error=str(e))

                if hot_keys_to_warm:
                    logger.info("Cache warming completed",
                               warmed_keys=len(hot_keys_to_warm[:50]))

            except Exception as e:
                logger.error("Error in cache warmer", error=str(e))

    async def _invalidation_processor(self):
        """Background task to process cache invalidation queue."""
        while True:
            try:
                await asyncio.sleep(10)  # Process every 10 seconds

                if not self.invalidation_queue:
                    continue

                # Process invalidation queue
                keys_to_process = self.invalidation_queue.copy()
                self.invalidation_queue.clear()

                for key in keys_to_process:
                    try:
                        if key.startswith('tag:'):
                            # Tag-based invalidation
                            tag = key[4:]  # Remove 'tag:' prefix
                            await self._invalidate_by_tag_distributed(tag)
                        else:
                            # Direct key invalidation
                            await self._delete_from_distributed_cache(key)
                    except Exception as e:
                        logger.warning("Failed to process invalidation",
                                     key=key, error=str(e))

                if keys_to_process:
                    logger.debug("Invalidation processing completed",
                               processed=len(keys_to_process))

            except Exception as e:
                logger.error("Error in invalidation processor", error=str(e))

    async def _invalidate_by_tag_distributed(self, tag: str):
        """Invalidate cache entries by tag in distributed cache."""
        try:
            if self.redis_cluster:
                # Get all keys with this tag
                keys = await self.redis_cluster.smembers(f"tag:{tag}")
                if keys:
                    # Delete all keys
                    await self.redis_cluster.delete(*keys)
                    # Delete the tag set
                    await self.redis_cluster.delete(f"tag:{tag}")
            else:
                # Process for each Redis client
                for client in self.redis_clients.values():
                    try:
                        keys = await client.smembers(f"tag:{tag}")
                        if keys:
                            await client.delete(*keys)
                            await client.delete(f"tag:{tag}")
                    except Exception as e:
                        logger.warning("Failed to invalidate by tag on node",
                                     tag=tag, error=str(e))

        except Exception as e:
            logger.error("Failed to invalidate by tag in distributed cache",
                        tag=tag, error=str(e))

    async def _local_cache_cleaner(self):
        """Background task to clean expired entries from local cache."""
        while True:
            try:
                await asyncio.sleep(60)  # Clean every minute

                expired_keys = []
                for key, entry in self.local_cache.items():
                    if entry.is_expired:
                        expired_keys.append(key)

                for key in expired_keys:
                    del self.local_cache[key]

                if expired_keys:
                    logger.debug("Local cache cleanup completed",
                               expired_keys=len(expired_keys))

            except Exception as e:
                logger.error("Error in local cache cleaner", error=str(e))

    # Performance and Monitoring
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        try:
            # Calculate cache efficiency
            total_requests = self.global_metrics.hit_count + self.global_metrics.miss_count
            hit_ratio = self.global_metrics.hit_ratio

            # Get top hot keys
            top_hot_keys = sorted(
                self.hot_keys.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]

            # Local cache statistics
            local_cache_stats = {
                'size': len(self.local_cache),
                'max_size': self.local_cache_max_size,
                'memory_usage_mb': self.global_metrics.memory_usage_bytes / (1024 * 1024),
                'utilization_percent': (len(self.local_cache) / self.local_cache_max_size) * 100
            }

            # Node statistics
            node_stats = {}
            for node_id, metrics in self.node_metrics.items():
                node_stats[node_id] = {
                    'memory_usage_mb': metrics.memory_usage_bytes / (1024 * 1024),
                    'hit_ratio': metrics.hit_ratio,
                    'last_updated': metrics.last_updated.isoformat()
                }

            return {
                'global_metrics': {
                    'total_requests': total_requests,
                    'hit_count': self.global_metrics.hit_count,
                    'miss_count': self.global_metrics.miss_count,
                    'hit_ratio_percent': hit_ratio,
                    'eviction_count': self.global_metrics.eviction_count,
                    'avg_latency_ms': self.global_metrics.network_latency_ms,
                    'throughput_ops_sec': self.global_metrics.throughput_ops_sec,
                    'last_updated': self.global_metrics.last_updated.isoformat()
                },
                'local_cache': local_cache_stats,
                'nodes': node_stats,
                'hot_keys': dict(top_hot_keys),
                'cache_configuration': {
                    'strategy': self.strategy.value,
                    'node_count': len(self.cache_nodes),
                    'cache_warming_enabled': self.cache_warming_enabled,
                    'prefetch_enabled': self.prefetch_enabled
                }
            }

        except Exception as e:
            logger.error("Failed to get cache statistics", error=str(e))
            return {'error': str(e)}

    async def optimize_cache_configuration(self) -> Dict[str, Any]:
        """Analyze cache performance and provide optimization recommendations."""
        try:
            stats = await self.get_cache_statistics()
            recommendations = []

            # Analyze hit ratio
            hit_ratio = stats['global_metrics']['hit_ratio_percent']
            if hit_ratio < 70:
                recommendations.append({
                    'type': 'hit_ratio',
                    'severity': 'high',
                    'message': f'Low cache hit ratio ({hit_ratio:.1f}%). Consider increasing cache size or TTL.',
                    'suggested_action': 'Increase local_cache_max_size or default TTL values'
                })

            # Analyze memory usage
            local_utilization = stats['local_cache']['utilization_percent']
            if local_utilization > 90:
                recommendations.append({
                    'type': 'memory',
                    'severity': 'medium',
                    'message': f'High local cache utilization ({local_utilization:.1f}%).',
                    'suggested_action': 'Increase local_cache_max_size or enable more aggressive eviction'
                })

            # Analyze hot keys
            hot_keys_count = len(stats['hot_keys'])
            if hot_keys_count > 100:
                recommendations.append({
                    'type': 'hot_keys',
                    'severity': 'low',
                    'message': f'Many hot keys detected ({hot_keys_count}). Consider cache warming.',
                    'suggested_action': 'Enable cache warming for frequently accessed keys'
                })

            # Analyze latency
            avg_latency = stats['global_metrics']['avg_latency_ms']
            if avg_latency > 50:
                recommendations.append({
                    'type': 'latency',
                    'severity': 'medium',
                    'message': f'High average latency ({avg_latency:.1f}ms).',
                    'suggested_action': 'Consider adding more cache nodes or optimizing network'
                })

            return {
                'analysis_timestamp': datetime.utcnow().isoformat(),
                'performance_score': min(100, hit_ratio + (100 - avg_latency)),
                'recommendations': recommendations,
                'current_stats': stats
            }

        except Exception as e:
            logger.error("Failed to optimize cache configuration", error=str(e))
            return {'error': str(e)}

# Global distributed cache instance
distributed_cache = None

async def initialize_distributed_cache(cache_nodes: List[CacheNode],
                                     strategy: CacheStrategy = CacheStrategy.CONSISTENT_HASH):
    """Initialize the global distributed cache."""
    global distributed_cache
    distributed_cache = DistributedCache(cache_nodes, strategy)
    await distributed_cache.initialize()
    return distributed_cache

def get_distributed_cache() -> DistributedCache:
    """Get the global distributed cache instance."""
    if distributed_cache is None:
        raise RuntimeError("Distributed cache not initialized")
    return distributed_cache
