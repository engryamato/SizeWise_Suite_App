"""
MongoDB Service Layer for SizeWise Suite

Provides high-level MongoDB operations for spatial data, projects, and calculations.
Works alongside existing PostgreSQL services for hybrid data storage.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from bson import ObjectId
import structlog
from ..config.mongodb_config import get_mongodb_database

logger = structlog.get_logger()

class MongoDBService:
    """Service layer for MongoDB operations."""
    
    def __init__(self):
        self.db = get_mongodb_database()
    
    # Project Management
    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Create a new project in MongoDB."""
        try:
            project_data['created_at'] = datetime.utcnow()
            project_data['updated_at'] = datetime.utcnow()
            
            result = await self.db.projects.insert_one(project_data)
            logger.info("Project created in MongoDB", project_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to create project in MongoDB", error=str(e))
            raise
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID from MongoDB."""
        try:
            project = await self.db.projects.find_one({"_id": ObjectId(project_id)})
            if project:
                project['_id'] = str(project['_id'])
            return project
            
        except Exception as e:
            logger.error("Failed to get project from MongoDB", project_id=project_id, error=str(e))
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
    
    # Spatial Data Management
    async def save_spatial_data(self, project_id: str, spatial_data: Dict[str, Any]) -> str:
        """Save spatial data for a project."""
        try:
            spatial_data['project_id'] = project_id
            spatial_data['created_at'] = datetime.utcnow()
            spatial_data['updated_at'] = datetime.utcnow()
            
            result = await self.db.spatial_data.insert_one(spatial_data)
            logger.info("Spatial data saved to MongoDB", 
                       project_id=project_id, 
                       spatial_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to save spatial data to MongoDB", 
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

# Global MongoDB service instance
mongodb_service = MongoDBService()
