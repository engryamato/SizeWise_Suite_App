"""
Enhanced PostgreSQL Service Layer for SizeWise Suite

Provides high-level PostgreSQL operations with performance optimizations including:
- Advanced connection pooling and query optimization
- Intelligent query caching and prepared statements
- Bulk operations for better performance
- Query plan analysis and optimization
- Connection monitoring and health checks
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
import structlog
from sqlalchemy import create_engine, text, MetaData, Table, select, insert, update, delete
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.sql import func
from contextlib import contextmanager, asynccontextmanager
import psycopg2
from psycopg2.extras import execute_batch, execute_values
from ..database.PerformanceOptimizer import db_performance_optimizer, optimized_query_cache

logger = structlog.get_logger()

# =============================================================================
# Enhanced PostgreSQL Service Configuration
# =============================================================================

@dataclass
class QueryPerformanceMetrics:
    """Query performance tracking."""
    query_count: int = 0
    cache_hits: int = 0
    slow_queries: int = 0
    avg_query_time: float = 0.0
    bulk_operations: int = 0
    prepared_statements: int = 0

class EnhancedPostgreSQLService:
    """Enhanced PostgreSQL service with performance optimizations."""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = None
        self.SessionLocal = None
        self.metadata = MetaData()
        
        # Performance tracking
        self.metrics = QueryPerformanceMetrics()
        self.query_cache_enabled = True
        self.prepared_statements = {}
        self.bulk_operation_threshold = 50
        
        # Query performance tracking
        self.query_times = {}
        self.slow_queries = []
        
    async def initialize(self):
        """Initialize enhanced PostgreSQL connection with optimizations."""
        try:
            # Create optimized engine
            self.engine = create_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=20,
                max_overflow=30,
                pool_timeout=30,
                pool_recycle=3600,
                pool_pre_ping=True,
                echo=False,  # Disable SQL logging for performance
                future=True,
                # PostgreSQL-specific optimizations
                connect_args={
                    "options": "-c statement_timeout=30s -c work_mem=256MB"
                }
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Reflect database metadata for dynamic queries
            self.metadata.reflect(bind=self.engine)
            
            # Set up query monitoring
            self._setup_query_monitoring()
            
            # Prepare common statements
            await self._prepare_common_statements()
            
            logger.info("Enhanced PostgreSQL service initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize PostgreSQL service", error=str(e))
            raise
    
    def _setup_query_monitoring(self):
        """Set up query performance monitoring."""
        from sqlalchemy import event
        
        @event.listens_for(self.engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            context._query_start_time = time.time()
            context._query_statement = statement
        
        @event.listens_for(self.engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - context._query_start_time
            
            # Track query performance
            self.metrics.query_count += 1
            
            # Update rolling average
            current_avg = self.metrics.avg_query_time
            count = self.metrics.query_count
            self.metrics.avg_query_time = (current_avg * (count - 1) + total_time) / count
            
            # Track by query type
            query_type = statement.split()[0].upper() if statement else "UNKNOWN"
            if query_type not in self.query_times:
                self.query_times[query_type] = []
            
            self.query_times[query_type].append(total_time)
            
            # Log slow queries (>1 second)
            if total_time > 1.0:
                self.metrics.slow_queries += 1
                self.slow_queries.append({
                    'query': statement[:200] + "..." if len(statement) > 200 else statement,
                    'time': total_time,
                    'timestamp': datetime.utcnow(),
                    'parameters': str(parameters)[:100] if parameters else None
                })
                
                logger.warning("Slow PostgreSQL query detected",
                             query_time=total_time,
                             query_preview=statement[:100])
    
    async def _prepare_common_statements(self):
        """Prepare commonly used SQL statements for better performance."""
        try:
            common_statements = {
                'get_user_projects': """
                    SELECT p.*, COUNT(ps.id) as segment_count 
                    FROM projects p 
                    LEFT JOIN project_segments ps ON p.id = ps.project_id 
                    WHERE p.user_id = %s 
                    GROUP BY p.id 
                    ORDER BY p.updated_at DESC 
                    LIMIT %s
                """,
                'get_project_segments': """
                    SELECT * FROM project_segments 
                    WHERE project_id = %s 
                    ORDER BY created_at ASC
                """,
                'get_calculation_results': """
                    SELECT * FROM calculations 
                    WHERE project_id = %s AND calculation_type = %s 
                    ORDER BY created_at DESC 
                    LIMIT %s
                """,
                'update_project_timestamp': """
                    UPDATE projects 
                    SET updated_at = CURRENT_TIMESTAMP 
                    WHERE id = %s
                """
            }
            
            self.prepared_statements = common_statements
            self.metrics.prepared_statements = len(common_statements)
            
            logger.info("Prepared common SQL statements", 
                       count=len(common_statements))
            
        except Exception as e:
            logger.error("Failed to prepare statements", error=str(e))
    
    @contextmanager
    def get_db_session(self):
        """Get database session with automatic cleanup."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    # Enhanced Project Operations
    async def get_user_projects_optimized(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user projects with optimized query and caching."""
        start_time = time.time()
        cache_key = f"projects:user:{user_id}:limit:{limit}"
        
        try:
            # Check cache first
            if self.query_cache_enabled:
                cached_result = await db_performance_optimizer.get_cached_query(cache_key)
                if cached_result:
                    self.metrics.cache_hits += 1
                    return cached_result
            
            # Use prepared statement for better performance
            with self.get_db_session() as session:
                result = session.execute(
                    text(self.prepared_statements['get_user_projects']),
                    {"user_id": user_id, "limit": limit}
                )
                
                projects = []
                for row in result:
                    project_dict = dict(row._mapping)
                    projects.append(project_dict)
            
            # Cache the result
            if self.query_cache_enabled:
                await db_performance_optimizer.optimize_query_cache(
                    cache_key, projects, ttl=1800  # 30 minutes
                )
            
            query_time = time.time() - start_time
            logger.debug("Retrieved user projects", 
                        user_id=user_id, 
                        count=len(projects),
                        query_time=query_time)
            
            return projects
            
        except Exception as e:
            logger.error("Failed to get user projects", 
                        user_id=user_id, error=str(e))
            return []
    
    async def bulk_insert_segments(self, project_id: str, segments_data: List[Dict[str, Any]]) -> List[str]:
        """Bulk insert project segments for better performance."""
        start_time = time.time()
        
        try:
            if len(segments_data) < self.bulk_operation_threshold:
                # Use individual inserts for small batches
                return await self._individual_insert_segments(project_id, segments_data)
            
            # Prepare data for bulk insert
            current_time = datetime.utcnow()
            insert_data = []
            
            for segment_data in segments_data:
                segment_data.update({
                    'project_id': project_id,
                    'created_at': current_time,
                    'updated_at': current_time
                })
                insert_data.append(segment_data)
            
            # Execute bulk insert using execute_values for better performance
            with self.get_db_session() as session:
                # Get the segments table
                segments_table = self.metadata.tables.get('project_segments')
                if not segments_table:
                    raise ValueError("project_segments table not found")
                
                # Execute bulk insert
                result = session.execute(
                    insert(segments_table).returning(segments_table.c.id),
                    insert_data
                )
                
                inserted_ids = [str(row[0]) for row in result]
                
                # Update project timestamp
                session.execute(
                    text(self.prepared_statements['update_project_timestamp']),
                    {"project_id": project_id}
                )
            
            self.metrics.bulk_operations += 1
            
            query_time = time.time() - start_time
            logger.info("Bulk inserted segments", 
                       project_id=project_id,
                       count=len(inserted_ids),
                       query_time=query_time)
            
            return inserted_ids
            
        except Exception as e:
            logger.error("Failed to bulk insert segments", 
                        project_id=project_id, error=str(e))
            raise
    
    async def _individual_insert_segments(self, project_id: str, segments_data: List[Dict[str, Any]]) -> List[str]:
        """Insert segments individually for small batches."""
        inserted_ids = []
        
        with self.get_db_session() as session:
            segments_table = self.metadata.tables.get('project_segments')
            current_time = datetime.utcnow()
            
            for segment_data in segments_data:
                segment_data.update({
                    'project_id': project_id,
                    'created_at': current_time,
                    'updated_at': current_time
                })
                
                result = session.execute(
                    insert(segments_table).returning(segments_table.c.id),
                    segment_data
                )
                
                inserted_ids.append(str(result.scalar()))
        
        return inserted_ids
    
    # Advanced Query Optimization
    async def get_project_analytics_optimized(self, project_id: str) -> Dict[str, Any]:
        """Get project analytics using optimized SQL queries."""
        start_time = time.time()
        cache_key = f"analytics:project:{project_id}"
        
        try:
            # Check cache first
            if self.query_cache_enabled:
                cached_result = await db_performance_optimizer.get_cached_query(cache_key)
                if cached_result:
                    self.metrics.cache_hits += 1
                    return cached_result
            
            # Optimized analytics query using CTEs and window functions
            analytics_query = text("""
                WITH segment_stats AS (
                    SELECT 
                        segment_type,
                        COUNT(*) as count,
                        AVG(CAST(calculation_data->>'cfm' AS FLOAT)) as avg_cfm,
                        SUM(CAST(calculation_data->>'cfm' AS FLOAT)) as total_cfm,
                        AVG(CAST(calculation_data->>'pressure_drop' AS FLOAT)) as avg_pressure
                    FROM project_segments 
                    WHERE project_id = :project_id 
                    GROUP BY segment_type
                ),
                calculation_stats AS (
                    SELECT 
                        calculation_type,
                        COUNT(*) as calc_count,
                        MAX(created_at) as last_calculation
                    FROM calculations 
                    WHERE project_id = :project_id 
                    GROUP BY calculation_type
                )
                SELECT 
                    'segments' as data_type,
                    json_agg(segment_stats.*) as data
                FROM segment_stats
                UNION ALL
                SELECT 
                    'calculations' as data_type,
                    json_agg(calculation_stats.*) as data
                FROM calculation_stats
            """)
            
            with self.get_db_session() as session:
                result = session.execute(analytics_query, {"project_id": project_id})
                
                analytics = {}
                for row in result:
                    analytics[row.data_type] = row.data
            
            # Cache the result
            if self.query_cache_enabled:
                await db_performance_optimizer.optimize_query_cache(
                    cache_key, analytics, ttl=900  # 15 minutes
                )
            
            query_time = time.time() - start_time
            logger.debug("Retrieved project analytics", 
                        project_id=project_id,
                        query_time=query_time)
            
            return analytics
            
        except Exception as e:
            logger.error("Failed to get project analytics", 
                        project_id=project_id, error=str(e))
            return {}
    
    # Performance Monitoring and Health Checks
    async def get_service_metrics(self) -> Dict[str, Any]:
        """Get PostgreSQL service performance metrics."""
        try:
            with self.get_db_session() as session:
                # Get connection stats
                connection_stats = session.execute(text("""
                    SELECT 
                        state,
                        COUNT(*) as count
                    FROM pg_stat_activity 
                    WHERE datname = current_database()
                    GROUP BY state
                """)).fetchall()
                
                # Get cache hit ratio
                cache_stats = session.execute(text("""
                    SELECT 
                        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio,
                        sum(heap_blks_hit) as cache_hits,
                        sum(heap_blks_read) as disk_reads
                    FROM pg_statio_user_tables
                """)).fetchone()
                
                # Get table sizes
                table_sizes = session.execute(text("""
                    SELECT 
                        schemaname,
                        tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                    LIMIT 10
                """)).fetchall()
            
            return {
                "service_metrics": {
                    "query_count": self.metrics.query_count,
                    "cache_hits": self.metrics.cache_hits,
                    "slow_queries": self.metrics.slow_queries,
                    "avg_query_time": self.metrics.avg_query_time,
                    "bulk_operations": self.metrics.bulk_operations,
                    "prepared_statements": self.metrics.prepared_statements
                },
                "database_stats": {
                    "connections": {row.state: row.count for row in connection_stats},
                    "cache_hit_ratio": float(cache_stats.cache_hit_ratio) if cache_stats.cache_hit_ratio else 0,
                    "cache_hits": cache_stats.cache_hits or 0,
                    "disk_reads": cache_stats.disk_reads or 0
                },
                "table_sizes": [
                    {
                        "table": f"{row.schemaname}.{row.tablename}",
                        "size": row.size,
                        "size_bytes": row.size_bytes
                    }
                    for row in table_sizes
                ],
                "query_performance": {
                    query_type: {
                        "count": len(times),
                        "avg_time": sum(times) / len(times) if times else 0,
                        "max_time": max(times) if times else 0
                    }
                    for query_type, times in self.query_times.items()
                },
                "recent_slow_queries": self.slow_queries[-5:],  # Last 5 slow queries
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to get service metrics", error=str(e))
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        try:
            start_time = time.time()
            
            with self.get_db_session() as session:
                # Test basic connectivity
                session.execute(text("SELECT 1"))
                
                # Check if critical tables exist
                tables_check = session.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('users', 'projects', 'project_segments')
                """)).fetchall()
                
                # Check for long-running queries
                long_queries = session.execute(text("""
                    SELECT COUNT(*) as count
                    FROM pg_stat_activity 
                    WHERE state = 'active' 
                    AND query_start < NOW() - INTERVAL '5 minutes'
                    AND datname = current_database()
                """)).scalar()
            
            response_time = time.time() - start_time
            
            return {
                "status": "healthy",
                "response_time": response_time,
                "tables_available": len(tables_check),
                "long_running_queries": long_queries,
                "connection_pool": {
                    "size": self.engine.pool.size(),
                    "checked_in": self.engine.pool.checkedin(),
                    "checked_out": self.engine.pool.checkedout()
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def cleanup(self):
        """Cleanup database connections and resources."""
        try:
            if self.engine:
                self.engine.dispose()
            
            logger.info("PostgreSQL service cleanup completed")
            
        except Exception as e:
            logger.error("Error during PostgreSQL cleanup", error=str(e))

# Global enhanced PostgreSQL service instance
postgresql_service = None

async def initialize_postgresql_service(database_url: str):
    """Initialize the global PostgreSQL service."""
    global postgresql_service
    postgresql_service = EnhancedPostgreSQLService(database_url)
    await postgresql_service.initialize()
    return postgresql_service

def get_postgresql_service() -> EnhancedPostgreSQLService:
    """Get the global PostgreSQL service instance."""
    if postgresql_service is None:
        raise RuntimeError("PostgreSQL service not initialized")
    return postgresql_service
