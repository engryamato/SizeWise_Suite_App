"""
Enhanced MongoDB Service Layer for SizeWise Suite

Provides high-level MongoDB operations with performance optimizations including:
- Intelligent query caching and optimization
- Bulk operations for better performance
- Aggregation pipeline optimizations
- Spatial query optimizations
- Connection pooling and monitoring
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import UpdateOne, InsertOne, DeleteOne
from pymongo.errors import BulkWriteError
import structlog
import asyncio
import time
from ..config.mongodb_config import get_mongodb_database
from ..database.PerformanceOptimizer import db_performance_optimizer, optimized_query_cache

logger = structlog.get_logger()

class EnhancedMongoDBService:
    """Enhanced service layer for MongoDB operations with performance optimizations."""

    def __init__(self):
        self.db = get_mongodb_database()
        self.query_cache_enabled = True
        self.bulk_operation_threshold = 10  # Use bulk operations for 10+ items
        self.performance_metrics = {
            'query_count': 0,
            'cache_hits': 0,
            'bulk_operations': 0,
            'avg_query_time': 0.0
        }

    async def _track_query_performance(self, operation_name: str, start_time: float):
        """Track query performance metrics."""
        query_time = time.time() - start_time
        self.performance_metrics['query_count'] += 1

        # Update rolling average
        current_avg = self.performance_metrics['avg_query_time']
        count = self.performance_metrics['query_count']
        self.performance_metrics['avg_query_time'] = (current_avg * (count - 1) + query_time) / count

        # Log slow queries
        if query_time > 1.0:
            logger.warning("Slow MongoDB query detected",
                         operation=operation_name,
                         query_time=query_time)

    # Enhanced Project Management with Performance Optimizations
    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Create a new project in MongoDB with performance tracking."""
        start_time = time.time()
        try:
            project_data['created_at'] = datetime.utcnow()
            project_data['updated_at'] = datetime.utcnow()

            # Add performance metadata
            project_data['_performance'] = {
                'created_via': 'enhanced_service',
                'version': '2.0'
            }

            result = await self.db.projects.insert_one(project_data)
            project_id = str(result.inserted_id)

            # Invalidate related cache entries
            if self.query_cache_enabled:
                await self._invalidate_project_cache(project_data.get('user_id'))

            logger.info("Project created in MongoDB",
                       project_id=project_id,
                       query_time=time.time() - start_time)

            await self._track_query_performance('create_project', start_time)
            return project_id

        except Exception as e:
            logger.error("Failed to create project in MongoDB", error=str(e))
            raise
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID from MongoDB with intelligent caching."""
        start_time = time.time()
        cache_key = f"project:{project_id}"

        try:
            # Check cache first
            if self.query_cache_enabled:
                async with optimized_query_cache(cache_key, ttl=1800) as cached_result:
                    if cached_result is not None:
                        self.performance_metrics['cache_hits'] += 1
                        return cached_result

            # Query database
            project = await self.db.projects.find_one(
                {"_id": ObjectId(project_id)},
                # Optimize projection - exclude large fields if not needed
                {"calculation_history": 0, "large_spatial_data": 0}
            )

            if project:
                project['_id'] = str(project['_id'])

                # Cache the result
                if self.query_cache_enabled:
                    await db_performance_optimizer.optimize_query_cache(
                        cache_key, project, ttl=1800
                    )

            await self._track_query_performance('get_project', start_time)
            return project

        except Exception as e:
            logger.error("Failed to get project from MongoDB",
                        project_id=project_id, error=str(e))
            return None
    
    async def update_project(self, project_id: str, update_data: Dict[str, Any]) -> bool:
        """Update project in MongoDB."""
        try:
            update_data['updated_at'] = datetime.utcnow()
            
            result = await self.db.projects.update_one(
                {"_id": ObjectId(project_id)},
                {"$set": update_data}
            )
            
            success = result.modified_count > 0
            if success:
                logger.info("Project updated in MongoDB", project_id=project_id)
            return success
            
        except Exception as e:
            logger.error("Failed to update project in MongoDB", project_id=project_id, error=str(e))
            return False
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete project from MongoDB."""
        try:
            # Delete related data first
            await self.db.calculations.delete_many({"project_id": project_id})
            await self.db.spatial_data.delete_many({"project_id": project_id})
            await self.db.hvac_systems.delete_many({"project_id": project_id})
            await self.db.duct_layouts.delete_many({"project_id": project_id})
            
            # Delete project
            result = await self.db.projects.delete_one({"_id": ObjectId(project_id)})
            
            success = result.deleted_count > 0
            if success:
                logger.info("Project deleted from MongoDB", project_id=project_id)
            return success
            
        except Exception as e:
            logger.error("Failed to delete project from MongoDB", project_id=project_id, error=str(e))
            return False
    
    async def _invalidate_project_cache(self, user_id: str = None):
        """Invalidate project-related cache entries."""
        try:
            if not self.query_cache_enabled or not db_performance_optimizer.redis_client:
                return

            # Invalidate user's project list cache
            if user_id:
                cache_keys = [
                    f"projects:user:{user_id}",
                    f"projects:user:{user_id}:*"
                ]
                for key in cache_keys:
                    db_performance_optimizer.redis_client.delete(key)

        except Exception as e:
            logger.warning("Failed to invalidate project cache", error=str(e))

    # Enhanced Spatial Data Management with Bulk Operations
    async def save_spatial_data(self, project_id: str, spatial_data: Dict[str, Any]) -> str:
        """Save spatial data for a project with performance optimizations."""
        start_time = time.time()
        try:
            spatial_data['project_id'] = project_id
            spatial_data['created_at'] = datetime.utcnow()
            spatial_data['updated_at'] = datetime.utcnow()

            # Add spatial indexing hints for better query performance
            if 'geometry' in spatial_data:
                spatial_data['_spatial_indexed'] = True

            # Add bounds for faster spatial queries
            if 'coordinates' in spatial_data:
                spatial_data['bounds'] = self._calculate_bounds(spatial_data['coordinates'])

            result = await self.db.spatial_data.insert_one(spatial_data)
            spatial_id = str(result.inserted_id)

            # Invalidate spatial cache
            if self.query_cache_enabled:
                await self._invalidate_spatial_cache(project_id)

            logger.info("Spatial data saved to MongoDB",
                       project_id=project_id,
                       spatial_id=spatial_id,
                       query_time=time.time() - start_time)

            await self._track_query_performance('save_spatial_data', start_time)
            return spatial_id

        except Exception as e:
            logger.error("Failed to save spatial data to MongoDB",
                        project_id=project_id, error=str(e))
            raise

    async def bulk_save_spatial_data(self, project_id: str, spatial_data_list: List[Dict[str, Any]]) -> List[str]:
        """Bulk save spatial data for better performance."""
        start_time = time.time()
        try:
            if len(spatial_data_list) < self.bulk_operation_threshold:
                # Use individual inserts for small batches
                results = []
                for spatial_data in spatial_data_list:
                    result_id = await self.save_spatial_data(project_id, spatial_data)
                    results.append(result_id)
                return results

            # Prepare bulk operations
            operations = []
            current_time = datetime.utcnow()

            for spatial_data in spatial_data_list:
                spatial_data['project_id'] = project_id
                spatial_data['created_at'] = current_time
                spatial_data['updated_at'] = current_time
                spatial_data['_spatial_indexed'] = True

                # Add bounds for spatial queries
                if 'coordinates' in spatial_data:
                    spatial_data['bounds'] = self._calculate_bounds(spatial_data['coordinates'])

                operations.append(InsertOne(spatial_data))

            # Execute bulk operation
            result = await self.db.spatial_data.bulk_write(operations, ordered=False)

            # Get inserted IDs
            inserted_ids = [str(oid) for oid in result.inserted_ids.values()]

            # Invalidate cache
            if self.query_cache_enabled:
                await self._invalidate_spatial_cache(project_id)

            self.performance_metrics['bulk_operations'] += 1

            logger.info("Bulk spatial data saved to MongoDB",
                       project_id=project_id,
                       count=len(inserted_ids),
                       query_time=time.time() - start_time)

            await self._track_query_performance('bulk_save_spatial_data', start_time)
            return inserted_ids

        except BulkWriteError as e:
            logger.error("Bulk write error for spatial data",
                        project_id=project_id,
                        errors=e.details)
            raise
        except Exception as e:
            logger.error("Failed to bulk save spatial data to MongoDB",
                        project_id=project_id, error=str(e))
            raise
    
    async def get_spatial_data(self, project_id: str, layer_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get spatial data for a project."""
        try:
            query = {"project_id": project_id}
            if layer_type:
                query["layer_type"] = layer_type
            
            cursor = self.db.spatial_data.find(query).sort("created_at", -1)
            spatial_data = []
            
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])
                spatial_data.append(doc)
            
            return spatial_data
            
        except Exception as e:
            logger.error("Failed to get spatial data from MongoDB", 
                        project_id=project_id, error=str(e))
            return []
    
    # HVAC System Management
    async def save_hvac_system(self, project_id: str, system_data: Dict[str, Any]) -> str:
        """Save HVAC system data."""
        try:
            system_data['project_id'] = project_id
            system_data['created_at'] = datetime.utcnow()
            system_data['updated_at'] = datetime.utcnow()
            
            result = await self.db.hvac_systems.insert_one(system_data)
            logger.info("HVAC system saved to MongoDB", 
                       project_id=project_id, 
                       system_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to save HVAC system to MongoDB", 
                        project_id=project_id, error=str(e))
            raise
    
    async def get_hvac_systems(self, project_id: str) -> List[Dict[str, Any]]:
        """Get HVAC systems for a project."""
        try:
            cursor = self.db.hvac_systems.find({"project_id": project_id}).sort("created_at", -1)
            systems = []
            
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])
                systems.append(doc)
            
            return systems
            
        except Exception as e:
            logger.error("Failed to get HVAC systems from MongoDB", 
                        project_id=project_id, error=str(e))
            return []
    
    # Calculation Results Storage
    async def save_calculation_result(self, project_id: str, calculation_data: Dict[str, Any]) -> str:
        """Save calculation results to MongoDB."""
        try:
            calculation_data['project_id'] = project_id
            calculation_data['created_at'] = datetime.utcnow()
            
            result = await self.db.calculations.insert_one(calculation_data)
            logger.info("Calculation result saved to MongoDB", 
                       project_id=project_id, 
                       calculation_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to save calculation result to MongoDB", 
                        project_id=project_id, error=str(e))
            raise
    
    async def get_calculation_results(self, project_id: str, calculation_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get calculation results for a project."""
        try:
            query = {"project_id": project_id}
            if calculation_type:
                query["calculation_type"] = calculation_type
            
            cursor = self.db.calculations.find(query).sort("created_at", -1)
            calculations = []
            
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])
                calculations.append(doc)
            
            return calculations
            
        except Exception as e:
            logger.error("Failed to get calculation results from MongoDB", 
                        project_id=project_id, error=str(e))
            return []
    
    # User Data Management
    async def save_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Save user preferences to MongoDB."""
        try:
            preferences['user_id'] = user_id
            preferences['updated_at'] = datetime.utcnow()
            
            result = await self.db.user_data.update_one(
                {"user_id": user_id},
                {"$set": preferences},
                upsert=True
            )
            
            logger.info("User preferences saved to MongoDB", user_id=user_id)
            return True
            
        except Exception as e:
            logger.error("Failed to save user preferences to MongoDB", 
                        user_id=user_id, error=str(e))
            return False
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences from MongoDB."""
        try:
            preferences = await self.db.user_data.find_one({"user_id": user_id})
            if preferences:
                preferences['_id'] = str(preferences['_id'])
            return preferences
            
        except Exception as e:
            logger.error("Failed to get user preferences from MongoDB", 
                        user_id=user_id, error=str(e))
            return None

    def _calculate_bounds(self, coordinates: List[List[float]]) -> Dict[str, float]:
        """Calculate bounding box for spatial coordinates."""
        if not coordinates:
            return {}

        min_x = min_y = float('inf')
        max_x = max_y = float('-inf')

        for coord in coordinates:
            if len(coord) >= 2:
                x, y = coord[0], coord[1]
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

        return {
            'min_x': min_x,
            'max_x': max_x,
            'min_y': min_y,
            'max_y': max_y
        }

    async def _invalidate_spatial_cache(self, project_id: str):
        """Invalidate spatial data cache entries."""
        try:
            if not self.query_cache_enabled or not db_performance_optimizer.redis_client:
                return

            cache_keys = [
                f"spatial:project:{project_id}",
                f"spatial:project:{project_id}:*"
            ]

            for key in cache_keys:
                db_performance_optimizer.redis_client.delete(key)

        except Exception as e:
            logger.warning("Failed to invalidate spatial cache", error=str(e))

    # Enhanced Aggregation Queries for HVAC Analytics
    async def get_project_analytics(self, project_id: str) -> Dict[str, Any]:
        """Get comprehensive project analytics using optimized aggregation."""
        start_time = time.time()
        cache_key = f"analytics:project:{project_id}"

        try:
            # Check cache first
            if self.query_cache_enabled:
                cached_result = await db_performance_optimizer.get_cached_query(cache_key)
                if cached_result:
                    self.performance_metrics['cache_hits'] += 1
                    return cached_result

            # Optimized aggregation pipeline
            pipeline = [
                {"$match": {"project_id": project_id}},
                {"$group": {
                    "_id": "$calculation_type",
                    "count": {"$sum": 1},
                    "avg_cfm": {"$avg": "$result_data.cfm"},
                    "total_cfm": {"$sum": "$result_data.cfm"},
                    "avg_pressure": {"$avg": "$result_data.pressure_drop"},
                    "last_calculation": {"$max": "$created_at"}
                }},
                {"$sort": {"count": -1}}
            ]

            # Execute aggregation
            cursor = self.db.calculations.aggregate(pipeline)
            analytics = await cursor.to_list(length=None)

            # Add summary statistics
            summary = {
                "total_calculations": sum(item["count"] for item in analytics),
                "calculation_types": len(analytics),
                "total_system_cfm": sum(item.get("total_cfm", 0) for item in analytics),
                "generated_at": datetime.utcnow().isoformat()
            }

            result = {
                "summary": summary,
                "by_type": analytics
            }

            # Cache the result
            if self.query_cache_enabled:
                await db_performance_optimizer.optimize_query_cache(
                    cache_key, result, ttl=900  # 15 minutes
                )

            await self._track_query_performance('get_project_analytics', start_time)
            return result

        except Exception as e:
            logger.error("Failed to get project analytics",
                        project_id=project_id, error=str(e))
            return {}

    # Enhanced Spatial Queries with Geographic Optimization
    async def find_spatial_data_in_bounds(self,
                                         project_id: str,
                                         bounds: Dict[str, float],
                                         layer_type: str = None) -> List[Dict[str, Any]]:
        """Find spatial data within geographic bounds using optimized queries."""
        start_time = time.time()

        try:
            # Build optimized query
            query = {
                "project_id": project_id,
                "bounds.min_x": {"$lte": bounds["max_x"]},
                "bounds.max_x": {"$gte": bounds["min_x"]},
                "bounds.min_y": {"$lte": bounds["max_y"]},
                "bounds.max_y": {"$gte": bounds["min_y"]}
            }

            if layer_type:
                query["layer_type"] = layer_type

            # Use projection to limit data transfer
            projection = {
                "large_geometry_data": 0,  # Exclude large fields
                "raw_coordinates": 0
            }

            cursor = self.db.spatial_data.find(query, projection).sort("created_at", -1)
            spatial_data = await cursor.to_list(length=1000)  # Limit results

            # Convert ObjectIds to strings
            for doc in spatial_data:
                doc['_id'] = str(doc['_id'])

            await self._track_query_performance('find_spatial_data_in_bounds', start_time)
            return spatial_data

        except Exception as e:
            logger.error("Failed to find spatial data in bounds",
                        project_id=project_id, error=str(e))
            return []

    # Performance Monitoring and Metrics
    async def get_service_metrics(self) -> Dict[str, Any]:
        """Get MongoDB service performance metrics."""
        try:
            # Get database stats
            db_stats = await self.db.command("dbStats")

            # Get collection stats
            collections_stats = {}
            for collection_name in ['projects', 'spatial_data', 'calculations', 'hvac_systems']:
                try:
                    stats = await self.db.command("collStats", collection_name)
                    collections_stats[collection_name] = {
                        "count": stats.get("count", 0),
                        "size": stats.get("size", 0),
                        "avgObjSize": stats.get("avgObjSize", 0),
                        "indexSizes": stats.get("indexSizes", {})
                    }
                except Exception:
                    collections_stats[collection_name] = {"error": "Stats not available"}

            return {
                "service_metrics": self.performance_metrics,
                "database_stats": {
                    "collections": db_stats.get("collections", 0),
                    "dataSize": db_stats.get("dataSize", 0),
                    "indexSize": db_stats.get("indexSize", 0),
                    "storageSize": db_stats.get("storageSize", 0)
                },
                "collection_stats": collections_stats,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error("Failed to get service metrics", error=str(e))
            return {"error": str(e)}

    async def optimize_collections(self):
        """Optimize MongoDB collections for better performance."""
        try:
            # Compact collections to reclaim space
            collections = ['projects', 'spatial_data', 'calculations', 'hvac_systems']

            for collection_name in collections:
                try:
                    await self.db.command("compact", collection_name)
                    logger.info("Compacted collection", collection=collection_name)
                except Exception as e:
                    logger.warning("Failed to compact collection",
                                 collection=collection_name, error=str(e))

            # Update collection statistics
            await self.db.command("planCacheClear")
            logger.info("MongoDB collections optimized")

        except Exception as e:
            logger.error("Failed to optimize collections", error=str(e))

# Global enhanced MongoDB service instance
mongodb_service = EnhancedMongoDBService()

# Backward compatibility alias
MongoDBService = EnhancedMongoDBService
