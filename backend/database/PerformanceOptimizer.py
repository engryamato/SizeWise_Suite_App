"""
Database Performance Optimizer for SizeWise Suite

Provides comprehensive database performance optimization including:
- Advanced connection pooling for PostgreSQL and MongoDB
- Intelligent indexing strategies for HVAC data
- Query optimization and caching
- Performance monitoring and metrics
- Automatic tuning recommendations
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import psutil
import structlog
from sqlalchemy import create_engine, text, event
from sqlalchemy.pool import QueuePool, StaticPool
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, IndexModel, ASCENDING, DESCENDING, TEXT, GEO2D
import redis
from contextlib import asynccontextmanager

logger = structlog.get_logger()

# =============================================================================
# Performance Configuration Classes
# =============================================================================

@dataclass
class PostgreSQLConfig:
    """PostgreSQL performance configuration."""
    # Connection Pool Settings
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    pool_pre_ping: bool = True
    
    # Performance Settings
    statement_timeout: str = "30s"
    work_mem: str = "256MB"
    shared_buffers: str = "512MB"
    effective_cache_size: str = "2GB"
    random_page_cost: float = 1.1
    
    # HVAC-specific optimizations
    enable_partitioning: bool = True
    enable_parallel_queries: bool = True
    max_parallel_workers: int = 4

@dataclass
class MongoDBConfig:
    """MongoDB performance configuration."""
    # Connection Pool Settings
    max_pool_size: int = 50
    min_pool_size: int = 5
    max_idle_time_ms: int = 30000
    connect_timeout_ms: int = 20000
    server_selection_timeout_ms: int = 30000
    
    # Performance Settings
    read_preference: str = "secondaryPreferred"
    write_concern: Dict[str, Any] = field(default_factory=lambda: {"w": "majority", "j": True})
    read_concern: str = "majority"
    
    # Spatial data optimizations
    enable_sharding: bool = False
    enable_compression: bool = True
    compression_algorithm: str = "zstd"

@dataclass
class CacheConfig:
    """Redis cache configuration."""
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    max_connections: int = 50
    socket_timeout: int = 30
    socket_connect_timeout: int = 30
    
    # Cache strategies
    default_ttl: int = 3600  # 1 hour
    calculation_ttl: int = 7200  # 2 hours
    spatial_data_ttl: int = 1800  # 30 minutes

@dataclass
class PerformanceMetrics:
    """Database performance metrics."""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # PostgreSQL metrics
    pg_active_connections: int = 0
    pg_idle_connections: int = 0
    pg_query_avg_time: float = 0.0
    pg_slow_queries: int = 0
    pg_cache_hit_ratio: float = 0.0
    
    # MongoDB metrics
    mongo_connections: int = 0
    mongo_query_avg_time: float = 0.0
    mongo_index_hit_ratio: float = 0.0
    mongo_memory_usage: int = 0
    
    # Cache metrics
    cache_hit_ratio: float = 0.0
    cache_memory_usage: int = 0
    cache_evictions: int = 0
    
    # System metrics
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    disk_io: float = 0.0

# =============================================================================
# Database Performance Optimizer
# =============================================================================

class DatabasePerformanceOptimizer:
    """Comprehensive database performance optimization system."""
    
    def __init__(self, 
                 pg_config: PostgreSQLConfig = None,
                 mongo_config: MongoDBConfig = None,
                 cache_config: CacheConfig = None):
        self.pg_config = pg_config or PostgreSQLConfig()
        self.mongo_config = mongo_config or MongoDBConfig()
        self.cache_config = cache_config or CacheConfig()
        
        # Performance tracking
        self.metrics_history: List[PerformanceMetrics] = []
        self.query_times: Dict[str, List[float]] = {}
        self.slow_queries: List[Dict[str, Any]] = []
        
        # Connection pools
        self.pg_engine = None
        self.mongo_client = None
        self.redis_client = None
        
        # Optimization flags
        self.auto_optimization_enabled = True
        self.monitoring_enabled = True
        
    async def initialize(self, database_url: str, mongo_url: str):
        """Initialize optimized database connections."""
        try:
            # Initialize PostgreSQL with optimized pool
            await self._initialize_postgresql(database_url)
            
            # Initialize MongoDB with optimized settings
            await self._initialize_mongodb(mongo_url)
            
            # Initialize Redis cache
            await self._initialize_redis()
            
            # Create optimized indexes
            await self._create_optimized_indexes()
            
            # Start performance monitoring
            if self.monitoring_enabled:
                asyncio.create_task(self._performance_monitor())
            
            logger.info("Database performance optimizer initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize database performance optimizer", error=str(e))
            raise
    
    async def _initialize_postgresql(self, database_url: str):
        """Initialize PostgreSQL with performance optimizations."""
        try:
            # Create engine with optimized pool settings
            self.pg_engine = create_engine(
                database_url,
                poolclass=QueuePool,
                pool_size=self.pg_config.pool_size,
                max_overflow=self.pg_config.max_overflow,
                pool_timeout=self.pg_config.pool_timeout,
                pool_recycle=self.pg_config.pool_recycle,
                pool_pre_ping=self.pg_config.pool_pre_ping,
                echo=False,  # Disable SQL logging for performance
                future=True
            )
            
            # Configure PostgreSQL performance settings
            await self._configure_postgresql_performance()
            
            # Set up query monitoring
            self._setup_postgresql_monitoring()
            
            logger.info("PostgreSQL performance optimization initialized",
                       pool_size=self.pg_config.pool_size,
                       max_overflow=self.pg_config.max_overflow)
            
        except Exception as e:
            logger.error("Failed to initialize PostgreSQL optimization", error=str(e))
            raise
    
    async def _initialize_mongodb(self, mongo_url: str):
        """Initialize MongoDB with performance optimizations."""
        try:
            # Create client with optimized settings
            self.mongo_client = AsyncIOMotorClient(
                mongo_url,
                maxPoolSize=self.mongo_config.max_pool_size,
                minPoolSize=self.mongo_config.min_pool_size,
                maxIdleTimeMS=self.mongo_config.max_idle_time_ms,
                connectTimeoutMS=self.mongo_config.connect_timeout_ms,
                serverSelectionTimeoutMS=self.mongo_config.server_selection_timeout_ms,
                readPreference=self.mongo_config.read_preference,
                writeConcern=self.mongo_config.write_concern,
                readConcern=self.mongo_config.read_concern,
                compressors=["zstd", "zlib"] if self.mongo_config.enable_compression else None
            )
            
            # Test connection
            await self.mongo_client.admin.command('ping')
            
            logger.info("MongoDB performance optimization initialized",
                       max_pool_size=self.mongo_config.max_pool_size,
                       compression=self.mongo_config.enable_compression)
            
        except Exception as e:
            logger.error("Failed to initialize MongoDB optimization", error=str(e))
            raise
    
    async def _initialize_redis(self):
        """Initialize Redis cache with optimized settings."""
        try:
            self.redis_client = redis.Redis(
                host=self.cache_config.host,
                port=self.cache_config.port,
                db=self.cache_config.db,
                max_connections=self.cache_config.max_connections,
                socket_timeout=self.cache_config.socket_timeout,
                socket_connect_timeout=self.cache_config.socket_connect_timeout,
                decode_responses=True
            )
            
            # Test connection
            self.redis_client.ping()
            
            logger.info("Redis cache optimization initialized",
                       max_connections=self.cache_config.max_connections)
            
        except Exception as e:
            logger.warning("Redis cache not available, continuing without cache", error=str(e))
            self.redis_client = None
    
    async def _configure_postgresql_performance(self):
        """Configure PostgreSQL performance settings."""
        try:
            with self.pg_engine.connect() as conn:
                # Set session-level performance parameters
                performance_settings = [
                    f"SET statement_timeout = '{self.pg_config.statement_timeout}'",
                    f"SET work_mem = '{self.pg_config.work_mem}'",
                    "SET enable_seqscan = off",  # Prefer index scans for HVAC queries
                    "SET random_page_cost = 1.1",  # Optimized for SSD storage
                    "SET effective_cache_size = '2GB'",
                    "SET shared_preload_libraries = 'pg_stat_statements'"
                ]
                
                for setting in performance_settings:
                    try:
                        conn.execute(text(setting))
                    except Exception as e:
                        logger.warning("Failed to set PostgreSQL parameter", 
                                     setting=setting, error=str(e))
                
                conn.commit()
            
            logger.info("PostgreSQL performance settings configured")
            
        except Exception as e:
            logger.error("Failed to configure PostgreSQL performance", error=str(e))
    
    def _setup_postgresql_monitoring(self):
        """Set up PostgreSQL query monitoring."""
        @event.listens_for(self.pg_engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            context._query_start_time = time.time()
        
        @event.listens_for(self.pg_engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - context._query_start_time
            
            # Track query performance
            query_type = statement.split()[0].upper() if statement else "UNKNOWN"
            if query_type not in self.query_times:
                self.query_times[query_type] = []
            
            self.query_times[query_type].append(total_time)
            
            # Log slow queries (>1 second)
            if total_time > 1.0:
                self.slow_queries.append({
                    'query': statement[:200] + "..." if len(statement) > 200 else statement,
                    'time': total_time,
                    'timestamp': datetime.utcnow()
                })
                
                logger.warning("Slow PostgreSQL query detected",
                             query_time=total_time,
                             query_preview=statement[:100])
    
    async def _create_optimized_indexes(self):
        """Create optimized indexes for HVAC data."""
        try:
            # PostgreSQL indexes
            await self._create_postgresql_indexes()
            
            # MongoDB indexes
            await self._create_mongodb_indexes()
            
            logger.info("Optimized database indexes created")
            
        except Exception as e:
            logger.error("Failed to create optimized indexes", error=str(e))
    
    async def _create_postgresql_indexes(self):
        """Create PostgreSQL indexes optimized for HVAC queries."""
        try:
            with self.pg_engine.connect() as conn:
                # HVAC-specific indexes
                indexes = [
                    # Project performance indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_name_search ON projects USING gin(to_tsvector('english', project_name))",
                    
                    # Segment performance indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_segments_project_type ON project_segments(project_id, segment_type)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_segments_calculations ON project_segments USING gin(calculation_data)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_segments_geometry ON project_segments USING gin(geometry_data)",
                    
                    # Calculation performance indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calculations_project_time ON calculations(project_id, created_at DESC)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calculations_type_result ON calculations(calculation_type, result_data)",
                    
                    # Change log performance
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_changelog_sync ON change_log(sync_status, timestamp) WHERE sync_status != 'synced'",
                    
                    # Spatial data indexes (if using PostGIS)
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_spatial_bounds ON spatial_data USING gist(bounds) WHERE bounds IS NOT NULL"
                ]
                
                for index_sql in indexes:
                    try:
                        conn.execute(text(index_sql))
                        logger.debug("Created PostgreSQL index", index=index_sql.split()[-1])
                    except Exception as e:
                        if "already exists" not in str(e):
                            logger.warning("Failed to create PostgreSQL index", 
                                         index=index_sql, error=str(e))
                
                conn.commit()
            
        except Exception as e:
            logger.error("Failed to create PostgreSQL indexes", error=str(e))
    
    async def _create_mongodb_indexes(self):
        """Create MongoDB indexes optimized for spatial and calculation data."""
        try:
            db = self.mongo_client.sizewise_spatial
            
            # Project collection indexes
            await db.projects.create_indexes([
                IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
                IndexModel([("project_name", TEXT)]),
                IndexModel([("updated_at", DESCENDING)]),
                IndexModel([("project_type", ASCENDING), ("status", ASCENDING)])
            ])
            
            # Spatial data collection indexes
            await db.spatial_data.create_indexes([
                IndexModel([("project_id", ASCENDING), ("layer_type", ASCENDING)]),
                IndexModel([("geometry", GEO2D)]),  # 2D spatial index
                IndexModel([("bounds", GEO2D)]),    # Bounding box queries
                IndexModel([("created_at", DESCENDING)]),
                IndexModel([("project_id", ASCENDING), ("updated_at", DESCENDING)])
            ])
            
            # HVAC systems collection indexes
            await db.hvac_systems.create_indexes([
                IndexModel([("project_id", ASCENDING), ("system_type", ASCENDING)]),
                IndexModel([("equipment_data.cfm", ASCENDING)]),
                IndexModel([("equipment_data.pressure", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)])
            ])
            
            # Calculations collection indexes
            await db.calculations.create_indexes([
                IndexModel([("project_id", ASCENDING), ("calculation_type", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)]),
                IndexModel([("result_data.cfm", ASCENDING)]),
                IndexModel([("result_data.pressure_drop", ASCENDING)]),
                IndexModel([("project_id", ASCENDING), ("created_at", DESCENDING)])
            ])
            
            # Duct layouts collection indexes
            await db.duct_layouts.create_indexes([
                IndexModel([("project_id", ASCENDING), ("layout_type", ASCENDING)]),
                IndexModel([("segments.start_point", GEO2D)]),
                IndexModel([("segments.end_point", GEO2D)]),
                IndexModel([("created_at", DESCENDING)])
            ])
            
            # User data collection indexes
            await db.user_data.create_indexes([
                IndexModel([("user_id", ASCENDING)], unique=True),
                IndexModel([("updated_at", DESCENDING)])
            ])
            
            logger.info("MongoDB indexes created successfully")
            
        except Exception as e:
            logger.error("Failed to create MongoDB indexes", error=str(e))
    
    async def _performance_monitor(self):
        """Continuous performance monitoring."""
        while self.monitoring_enabled:
            try:
                metrics = await self._collect_performance_metrics()
                self.metrics_history.append(metrics)
                
                # Keep only last 24 hours of metrics
                cutoff_time = datetime.utcnow() - timedelta(hours=24)
                self.metrics_history = [m for m in self.metrics_history if m.timestamp > cutoff_time]
                
                # Auto-optimization if enabled
                if self.auto_optimization_enabled:
                    await self._auto_optimize(metrics)
                
                # Sleep for 5 minutes between collections
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error("Performance monitoring error", error=str(e))
                await asyncio.sleep(60)  # Shorter sleep on error
    
    async def _collect_performance_metrics(self) -> PerformanceMetrics:
        """Collect comprehensive performance metrics."""
        metrics = PerformanceMetrics()
        
        try:
            # System metrics
            metrics.cpu_usage = psutil.cpu_percent()
            metrics.memory_usage = psutil.virtual_memory().percent
            metrics.disk_io = psutil.disk_io_counters().read_bytes + psutil.disk_io_counters().write_bytes
            
            # PostgreSQL metrics
            if self.pg_engine:
                with self.pg_engine.connect() as conn:
                    # Connection metrics
                    result = conn.execute(text("""
                        SELECT state, count(*) 
                        FROM pg_stat_activity 
                        WHERE datname = current_database() 
                        GROUP BY state
                    """))
                    
                    for row in result:
                        if row[0] == 'active':
                            metrics.pg_active_connections = row[1]
                        elif row[0] == 'idle':
                            metrics.pg_idle_connections = row[1]
                    
                    # Cache hit ratio
                    result = conn.execute(text("""
                        SELECT 
                            sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
                        FROM pg_statio_user_tables
                    """))
                    
                    row = result.fetchone()
                    if row and row[0]:
                        metrics.pg_cache_hit_ratio = float(row[0])
            
            # MongoDB metrics
            if self.mongo_client:
                db = self.mongo_client.sizewise_spatial
                server_status = await db.command("serverStatus")
                
                metrics.mongo_connections = server_status.get('connections', {}).get('current', 0)
                metrics.mongo_memory_usage = server_status.get('mem', {}).get('resident', 0) * 1024 * 1024  # MB to bytes
            
            # Redis metrics
            if self.redis_client:
                info = self.redis_client.info()
                metrics.cache_hit_ratio = float(info.get('keyspace_hits', 0)) / max(1, float(info.get('keyspace_hits', 0)) + float(info.get('keyspace_misses', 0))) * 100
                metrics.cache_memory_usage = info.get('used_memory', 0)
                metrics.cache_evictions = info.get('evicted_keys', 0)
            
            # Calculate average query times
            if self.query_times:
                all_times = []
                for times in self.query_times.values():
                    all_times.extend(times[-100:])  # Last 100 queries per type
                
                if all_times:
                    metrics.pg_query_avg_time = sum(all_times) / len(all_times)
            
            metrics.pg_slow_queries = len([q for q in self.slow_queries if q['timestamp'] > datetime.utcnow() - timedelta(hours=1)])
            
        except Exception as e:
            logger.error("Failed to collect performance metrics", error=str(e))
        
        return metrics
    
    async def _auto_optimize(self, metrics: PerformanceMetrics):
        """Automatic performance optimization based on metrics."""
        try:
            recommendations = []
            
            # Check PostgreSQL performance
            if metrics.pg_cache_hit_ratio < 95:
                recommendations.append("Increase PostgreSQL shared_buffers")
            
            if metrics.pg_query_avg_time > 0.5:
                recommendations.append("Optimize slow PostgreSQL queries")
            
            if metrics.pg_active_connections > self.pg_config.pool_size * 0.8:
                recommendations.append("Consider increasing PostgreSQL pool size")
            
            # Check MongoDB performance
            if metrics.mongo_memory_usage > 1024 * 1024 * 1024:  # 1GB
                recommendations.append("Monitor MongoDB memory usage")
            
            # Check cache performance
            if metrics.cache_hit_ratio < 80:
                recommendations.append("Improve cache hit ratio")
            
            # Check system resources
            if metrics.cpu_usage > 80:
                recommendations.append("High CPU usage detected")
            
            if metrics.memory_usage > 85:
                recommendations.append("High memory usage detected")
            
            if recommendations:
                logger.info("Performance optimization recommendations", 
                           recommendations=recommendations)
            
        except Exception as e:
            logger.error("Auto-optimization error", error=str(e))
    
    async def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        try:
            if not self.metrics_history:
                return {"error": "No performance data available"}
            
            latest_metrics = self.metrics_history[-1]
            
            # Calculate averages over last hour
            hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_metrics = [m for m in self.metrics_history if m.timestamp > hour_ago]
            
            if recent_metrics:
                avg_cpu = sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics)
                avg_memory = sum(m.memory_usage for m in recent_metrics) / len(recent_metrics)
                avg_pg_cache = sum(m.pg_cache_hit_ratio for m in recent_metrics) / len(recent_metrics)
                avg_cache_hit = sum(m.cache_hit_ratio for m in recent_metrics) / len(recent_metrics)
            else:
                avg_cpu = avg_memory = avg_pg_cache = avg_cache_hit = 0
            
            return {
                "timestamp": latest_metrics.timestamp.isoformat(),
                "current_metrics": {
                    "postgresql": {
                        "active_connections": latest_metrics.pg_active_connections,
                        "idle_connections": latest_metrics.pg_idle_connections,
                        "cache_hit_ratio": latest_metrics.pg_cache_hit_ratio,
                        "avg_query_time": latest_metrics.pg_query_avg_time,
                        "slow_queries_last_hour": latest_metrics.pg_slow_queries
                    },
                    "mongodb": {
                        "connections": latest_metrics.mongo_connections,
                        "memory_usage_mb": latest_metrics.mongo_memory_usage / (1024 * 1024),
                        "index_hit_ratio": latest_metrics.mongo_index_hit_ratio
                    },
                    "cache": {
                        "hit_ratio": latest_metrics.cache_hit_ratio,
                        "memory_usage_mb": latest_metrics.cache_memory_usage / (1024 * 1024),
                        "evictions": latest_metrics.cache_evictions
                    },
                    "system": {
                        "cpu_usage": latest_metrics.cpu_usage,
                        "memory_usage": latest_metrics.memory_usage,
                        "disk_io_bytes": latest_metrics.disk_io
                    }
                },
                "hourly_averages": {
                    "cpu_usage": round(avg_cpu, 2),
                    "memory_usage": round(avg_memory, 2),
                    "pg_cache_hit_ratio": round(avg_pg_cache, 2),
                    "cache_hit_ratio": round(avg_cache_hit, 2)
                },
                "query_performance": {
                    query_type: {
                        "count": len(times),
                        "avg_time": sum(times) / len(times) if times else 0,
                        "max_time": max(times) if times else 0
                    }
                    for query_type, times in self.query_times.items()
                },
                "slow_queries": self.slow_queries[-10:],  # Last 10 slow queries
                "recommendations": await self._generate_recommendations(latest_metrics)
            }
            
        except Exception as e:
            logger.error("Failed to generate performance report", error=str(e))
            return {"error": str(e)}
    
    async def _generate_recommendations(self, metrics: PerformanceMetrics) -> List[str]:
        """Generate performance optimization recommendations."""
        recommendations = []
        
        # PostgreSQL recommendations
        if metrics.pg_cache_hit_ratio < 95:
            recommendations.append("Increase PostgreSQL shared_buffers to improve cache hit ratio")
        
        if metrics.pg_query_avg_time > 0.5:
            recommendations.append("Analyze and optimize slow queries using EXPLAIN ANALYZE")
        
        if metrics.pg_active_connections > self.pg_config.pool_size * 0.8:
            recommendations.append("Consider increasing connection pool size")
        
        # MongoDB recommendations
        if metrics.mongo_memory_usage > 1024 * 1024 * 1024:  # 1GB
            recommendations.append("Monitor MongoDB memory usage and consider adding indexes")
        
        # Cache recommendations
        if metrics.cache_hit_ratio < 80:
            recommendations.append("Improve cache strategy or increase cache TTL")
        
        if metrics.cache_evictions > 100:
            recommendations.append("Consider increasing cache memory allocation")
        
        # System recommendations
        if metrics.cpu_usage > 80:
            recommendations.append("High CPU usage - consider scaling or optimizing queries")
        
        if metrics.memory_usage > 85:
            recommendations.append("High memory usage - monitor for memory leaks")
        
        return recommendations
    
    async def optimize_query_cache(self, query_key: str, result: Any, ttl: int = None):
        """Cache query results for performance optimization."""
        if not self.redis_client:
            return
        
        try:
            cache_ttl = ttl or self.cache_config.default_ttl
            
            # Determine TTL based on query type
            if "calculation" in query_key.lower():
                cache_ttl = self.cache_config.calculation_ttl
            elif "spatial" in query_key.lower():
                cache_ttl = self.cache_config.spatial_data_ttl
            
            # Cache the result
            import json
            self.redis_client.setex(
                f"query_cache:{query_key}",
                cache_ttl,
                json.dumps(result, default=str)
            )
            
        except Exception as e:
            logger.warning("Failed to cache query result", query_key=query_key, error=str(e))
    
    async def get_cached_query(self, query_key: str) -> Optional[Any]:
        """Retrieve cached query result."""
        if not self.redis_client:
            return None
        
        try:
            import json
            cached_result = self.redis_client.get(f"query_cache:{query_key}")
            if cached_result:
                return json.loads(cached_result)
            
        except Exception as e:
            logger.warning("Failed to retrieve cached query", query_key=query_key, error=str(e))
        
        return None
    
    async def cleanup(self):
        """Cleanup database connections and resources."""
        try:
            self.monitoring_enabled = False
            
            if self.pg_engine:
                self.pg_engine.dispose()
            
            if self.mongo_client:
                self.mongo_client.close()
            
            if self.redis_client:
                self.redis_client.close()
            
            logger.info("Database performance optimizer cleanup completed")
            
        except Exception as e:
            logger.error("Error during cleanup", error=str(e))

# =============================================================================
# Global Performance Optimizer Instance
# =============================================================================

# Global instance for application use
db_performance_optimizer = DatabasePerformanceOptimizer()

async def initialize_database_optimization(database_url: str, mongo_url: str):
    """Initialize database performance optimization."""
    await db_performance_optimizer.initialize(database_url, mongo_url)

async def get_performance_report() -> Dict[str, Any]:
    """Get current database performance report."""
    return await db_performance_optimizer.get_performance_report()

@asynccontextmanager
async def optimized_query_cache(query_key: str, ttl: int = None):
    """Context manager for automatic query caching."""
    # Check cache first
    cached_result = await db_performance_optimizer.get_cached_query(query_key)
    if cached_result is not None:
        yield cached_result
        return
    
    # Execute query and cache result
    result = yield None
    if result is not None:
        await db_performance_optimizer.optimize_query_cache(query_key, result, ttl)
    
    yield result
