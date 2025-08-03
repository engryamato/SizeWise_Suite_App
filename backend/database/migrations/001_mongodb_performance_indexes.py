#!/usr/bin/env python3
"""
MongoDB Performance Indexing Migration
SizeWise Suite - Phase 4: Performance Optimization
Task: Database Indexing Improvements

This migration adds strategic indexes for HVAC-specific MongoDB collections
and optimizes performance for spatial data, calculations, and sync operations.

Target: 8 strategic indexes for HVAC calculation lookup tables
Expected improvement: 60% sync performance, <100ms query response times
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any

from pymongo import IndexModel, ASCENDING, DESCENDING, GEO2D, TEXT
from pymongo.errors import OperationFailure

from backend.config.mongodb_config import get_mongodb_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDBIndexMigration:
    """MongoDB indexing migration for HVAC performance optimization."""
    
    def __init__(self):
        self.db = None
        self.migration_log = []
        
    async def connect(self):
        """Connect to MongoDB database."""
        try:
            self.db = get_mongodb_database()
            logger.info("Connected to MongoDB for index migration")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def create_hvac_calculation_indexes(self):
        """Create indexes for HVAC calculation collections."""
        logger.info("Creating HVAC calculation indexes...")
        
        # 1. Projects collection - Core project queries
        project_indexes = [
            # User projects with status filtering
            IndexModel([("user_id", ASCENDING), ("status", ASCENDING), ("last_modified", DESCENDING)]),
            # Building type filtering for HVAC-specific queries
            IndexModel([("building_type", ASCENDING), ("user_id", ASCENDING), ("created_at", DESCENDING)]),
            # Project name search optimization
            IndexModel([("name", TEXT), ("description", TEXT)]),
            # Organization-based queries for multi-tenant support
            IndexModel([("organization_id", ASCENDING), ("status", ASCENDING)]),
        ]
        
        await self._create_collection_indexes("projects", project_indexes)
        
        # 2. Calculations collection - HVAC calculation performance
        calculation_indexes = [
            # Project calculations by type
            IndexModel([("project_id", ASCENDING), ("calculation_type", ASCENDING), ("created_at", DESCENDING)]),
            # CFM and pressure drop queries for HVAC analysis
            IndexModel([("result_data.cfm", ASCENDING)]),
            IndexModel([("result_data.pressure_drop", ASCENDING)]),
            # User-specific calculation history
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            # Calculation validation status
            IndexModel([("validation_status", ASCENDING), ("calculation_type", ASCENDING)]),
        ]
        
        await self._create_collection_indexes("calculations", calculation_indexes)
        
        # 3. Spatial data collection - 3D geometry optimization
        spatial_indexes = [
            # Project spatial layers
            IndexModel([("project_id", ASCENDING), ("layer_type", ASCENDING)]),
            # 2D spatial index for geometry queries
            IndexModel([("geometry", GEO2D)]),
            # Bounding box queries for viewport optimization
            IndexModel([("bounds", GEO2D)]),
            # Temporal spatial data queries
            IndexModel([("project_id", ASCENDING), ("updated_at", DESCENDING)]),
        ]
        
        await self._create_collection_indexes("spatial_data", spatial_indexes)
        
        # 4. HVAC systems collection - Equipment and system data
        hvac_system_indexes = [
            # System type filtering
            IndexModel([("project_id", ASCENDING), ("system_type", ASCENDING)]),
            # Equipment performance queries
            IndexModel([("equipment_data.cfm", ASCENDING)]),
            IndexModel([("equipment_data.pressure", ASCENDING)]),
            IndexModel([("equipment_data.efficiency", ASCENDING)]),
            # System creation timeline
            IndexModel([("created_at", DESCENDING)]),
        ]
        
        await self._create_collection_indexes("hvac_systems", hvac_system_indexes)
        
        # 5. Duct layouts collection - Ductwork geometry and routing
        duct_layout_indexes = [
            # Layout type and project filtering
            IndexModel([("project_id", ASCENDING), ("layout_type", ASCENDING)]),
            # Spatial indexes for duct segment endpoints
            IndexModel([("segments.start_point", GEO2D)]),
            IndexModel([("segments.end_point", GEO2D)]),
            # Duct sizing queries
            IndexModel([("segments.diameter", ASCENDING)]),
            IndexModel([("segments.width", ASCENDING), ("segments.height", ASCENDING)]),
            # Layout modification tracking
            IndexModel([("created_at", DESCENDING)]),
        ]
        
        await self._create_collection_indexes("duct_layouts", duct_layout_indexes)
        
    async def create_sync_performance_indexes(self):
        """Create indexes for synchronization performance."""
        logger.info("Creating synchronization performance indexes...")
        
        # 6. User data collection - Offline sync optimization
        user_data_indexes = [
            # User sync status tracking
            IndexModel([("user_id", ASCENDING), ("sync_status", ASCENDING), ("last_modified", DESCENDING)]),
            # Data type filtering for selective sync
            IndexModel([("data_type", ASCENDING), ("sync_status", ASCENDING)]),
            # Conflict resolution queries
            IndexModel([("sync_status", ASCENDING), ("conflict_resolution_required", ASCENDING)]),
        ]
        
        await self._create_collection_indexes("user_data", user_data_indexes)
        
        # 7. Change log collection - Audit and sync tracking
        change_log_indexes = [
            # Entity change tracking
            IndexModel([("entity_type", ASCENDING), ("entity_id", ASCENDING), ("timestamp", DESCENDING)]),
            # User activity tracking
            IndexModel([("user_id", ASCENDING), ("timestamp", DESCENDING)]),
            # Sync operation queries
            IndexModel([("sync_status", ASCENDING), ("timestamp", ASCENDING)]),
            # Operation type filtering
            IndexModel([("operation", ASCENDING), ("entity_type", ASCENDING)]),
        ]
        
        await self._create_collection_indexes("change_log", change_log_indexes)
        
        # 8. Cache collection - Performance optimization
        cache_indexes = [
            # Cache key lookup
            IndexModel([("cache_key", ASCENDING)]),
            # TTL index for automatic cache expiration
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0),
            # Cache type and user filtering
            IndexModel([("cache_type", ASCENDING), ("user_id", ASCENDING)]),
        ]
        
        await self._create_collection_indexes("cache", cache_indexes)
    
    async def _create_collection_indexes(self, collection_name: str, indexes: List[IndexModel]):
        """Create indexes for a specific collection."""
        try:
            collection = self.db[collection_name]
            
            # Check if collection exists, create if not
            if collection_name not in await self.db.list_collection_names():
                await self.db.create_collection(collection_name)
                logger.info(f"Created collection: {collection_name}")
            
            # Create indexes
            result = await collection.create_indexes(indexes)
            
            self.migration_log.append({
                "collection": collection_name,
                "indexes_created": len(result),
                "index_names": result,
                "timestamp": datetime.utcnow()
            })
            
            logger.info(f"Created {len(result)} indexes for collection '{collection_name}': {result}")
            
        except OperationFailure as e:
            logger.error(f"Failed to create indexes for collection '{collection_name}': {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating indexes for collection '{collection_name}': {e}")
            raise
    
    async def validate_indexes(self):
        """Validate that all indexes were created successfully."""
        logger.info("Validating index creation...")
        
        validation_results = {}
        
        collections_to_check = [
            "projects", "calculations", "spatial_data", "hvac_systems", 
            "duct_layouts", "user_data", "change_log", "cache"
        ]
        
        for collection_name in collections_to_check:
            try:
                collection = self.db[collection_name]
                indexes = await collection.list_indexes().to_list(length=None)
                
                validation_results[collection_name] = {
                    "total_indexes": len(indexes),
                    "index_names": [idx["name"] for idx in indexes],
                    "status": "success"
                }
                
                logger.info(f"Collection '{collection_name}': {len(indexes)} indexes")
                
            except Exception as e:
                validation_results[collection_name] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Failed to validate indexes for collection '{collection_name}': {e}")
        
        return validation_results
    
    async def run_migration(self):
        """Run the complete index migration."""
        logger.info("Starting MongoDB index migration...")
        
        try:
            await self.connect()
            
            # Create HVAC calculation indexes
            await self.create_hvac_calculation_indexes()
            
            # Create synchronization performance indexes
            await self.create_sync_performance_indexes()
            
            # Validate index creation
            validation_results = await self.validate_indexes()
            
            # Log migration summary
            total_indexes = sum(
                log_entry["indexes_created"] for log_entry in self.migration_log
            )
            
            logger.info(f"Migration completed successfully!")
            logger.info(f"Total indexes created: {total_indexes}")
            logger.info(f"Collections updated: {len(self.migration_log)}")
            
            return {
                "status": "success",
                "total_indexes_created": total_indexes,
                "migration_log": self.migration_log,
                "validation_results": validation_results
            }
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "migration_log": self.migration_log
            }

async def main():
    """Main migration execution function."""
    migration = MongoDBIndexMigration()
    result = await migration.run_migration()
    
    if result["status"] == "success":
        print("✅ MongoDB index migration completed successfully!")
        print(f"📊 Total indexes created: {result['total_indexes_created']}")
    else:
        print("❌ MongoDB index migration failed!")
        print(f"Error: {result['error']}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
