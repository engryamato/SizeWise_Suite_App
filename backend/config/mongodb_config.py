"""
MongoDB Configuration for SizeWise Suite Backend

Provides MongoDB connection management alongside existing PostgreSQL setup.
Supports connection pooling, error handling, and environment-based configuration.
"""

import os
import asyncio
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import structlog

# Import secure credential manager
try:
    from backend.security.credential_manager import get_credential_manager
except ImportError:
    # Fallback for development
    def get_credential_manager():
        return None

logger = structlog.get_logger()

class MongoDBConfig:
    """MongoDB configuration and connection management."""
    
    def __init__(self):
        self.connection_string = self._get_connection_string()
        self.database_name = os.getenv('MONGODB_DATABASE', 'sizewise_spatial')
        self.client: Optional[MongoClient] = None
        self.async_client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        
    def _get_connection_string(self) -> str:
        """Get MongoDB connection string from secure credential manager."""
        # Try to get credential manager
        credential_manager = get_credential_manager()

        if credential_manager:
            # Use secure credential manager
            connection_string = credential_manager.get_credential('database', 'mongodb_connection_string')

            if not connection_string:
                # Build from individual components using credential manager
                username = credential_manager.get_credential('database', 'mongodb_username')
                password = credential_manager.get_credential('database', 'mongodb_password')
                host = credential_manager.get_credential('database', 'mongodb_host', 'localhost')
                options = os.getenv('MONGODB_OPTIONS', 'retryWrites=true&w=majority&appName=SizeWiseSpatial')

                if username and password and host:
                    connection_string = f"mongodb+srv://{username}:{password}@{host}/?{options}"
                else:
                    logger.warning("MongoDB credentials not found in credential manager, using fallback")
                    connection_string = None
        else:
            # Fallback to environment variables (for development)
            connection_string = os.getenv('MONGODB_CONNECTION_STRING')

            if not connection_string:
                username = os.getenv('MONGODB_USERNAME')
                password = os.getenv('MONGODB_PASSWORD')
                host = os.getenv('MONGODB_HOST', 'localhost')
                options = os.getenv('MONGODB_OPTIONS', 'retryWrites=true&w=majority&appName=SizeWiseSpatial')

                if username and password:
                    connection_string = f"mongodb+srv://{username}:{password}@{host}/?{options}"
                else:
                    logger.error("MongoDB credentials not configured. Set MONGODB_USERNAME and MONGODB_PASSWORD environment variables.")
                    connection_string = "mongodb://localhost:27017/sizewise_db"  # Local fallback

        return connection_string
    
    def get_sync_client(self) -> MongoClient:
        """Get synchronous MongoDB client with connection pooling."""
        if not self.client:
            try:
                self.client = MongoClient(
                    self.connection_string,
                    maxPoolSize=50,
                    minPoolSize=5,
                    maxIdleTimeMS=30000,
                    waitQueueTimeoutMS=5000,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                    socketTimeoutMS=20000,
                    retryWrites=True,
                    retryReads=True
                )
                
                # Test connection
                self.client.admin.command('ping')
                logger.info("MongoDB sync client connected successfully")
                
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error("Failed to connect to MongoDB", error=str(e))
                raise
                
        return self.client
    
    def get_async_client(self) -> AsyncIOMotorClient:
        """Get asynchronous MongoDB client with connection pooling."""
        if not self.async_client:
            try:
                self.async_client = AsyncIOMotorClient(
                    self.connection_string,
                    maxPoolSize=50,
                    minPoolSize=5,
                    maxIdleTimeMS=30000,
                    waitQueueTimeoutMS=5000,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                    socketTimeoutMS=20000,
                    retryWrites=True,
                    retryReads=True
                )
                
                logger.info("MongoDB async client initialized")
                
            except Exception as e:
                logger.error("Failed to initialize MongoDB async client", error=str(e))
                raise
                
        return self.async_client
    
    def get_database(self, async_client: bool = True) -> AsyncIOMotorDatabase:
        """Get MongoDB database instance."""
        if async_client:
            client = self.get_async_client()
            return client[self.database_name]
        else:
            client = self.get_sync_client()
            return client[self.database_name]
    
    async def test_connection(self) -> bool:
        """Test MongoDB connection asynchronously."""
        try:
            client = self.get_async_client()
            await client.admin.command('ping')
            logger.info("MongoDB connection test successful")
            return True
        except Exception as e:
            logger.error("MongoDB connection test failed", error=str(e))
            return False
    
    def close_connections(self):
        """Close all MongoDB connections."""
        if self.client:
            self.client.close()
            logger.info("MongoDB sync client closed")
            
        if self.async_client:
            self.async_client.close()
            logger.info("MongoDB async client closed")

# Global MongoDB configuration instance
mongodb_config = MongoDBConfig()

def get_mongodb_database(async_client: bool = True) -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    return mongodb_config.get_database(async_client=async_client)

def get_mongodb_client(async_client: bool = True):
    """Get MongoDB client instance."""
    if async_client:
        return mongodb_config.get_async_client()
    else:
        return mongodb_config.get_sync_client()

async def init_mongodb_collections():
    """Initialize MongoDB collections and indexes."""
    try:
        db = get_mongodb_database()
        
        # Create collections if they don't exist
        collections = [
            'projects',
            'calculations',
            'user_data',
            'spatial_data',
            'hvac_systems',
            'duct_layouts'
        ]
        
        existing_collections = await db.list_collection_names()
        
        for collection_name in collections:
            if collection_name not in existing_collections:
                await db.create_collection(collection_name)
                logger.info(f"Created MongoDB collection: {collection_name}")
        
        # Create indexes for better performance
        await create_indexes(db)
        
        logger.info("MongoDB collections initialized successfully")
        
    except Exception as e:
        logger.error("Failed to initialize MongoDB collections", error=str(e))
        raise

async def create_indexes(db: AsyncIOMotorDatabase):
    """Create indexes for MongoDB collections."""
    try:
        # Projects collection indexes
        await db.projects.create_index("user_id")
        await db.projects.create_index("created_at")
        await db.projects.create_index([("user_id", 1), ("name", 1)])
        
        # Calculations collection indexes
        await db.calculations.create_index("project_id")
        await db.calculations.create_index("calculation_type")
        await db.calculations.create_index([("project_id", 1), ("created_at", -1)])
        
        # Spatial data collection indexes
        await db.spatial_data.create_index("project_id")
        await db.spatial_data.create_index([("project_id", 1), ("layer_type", 1)])
        
        # HVAC systems collection indexes
        await db.hvac_systems.create_index("project_id")
        await db.hvac_systems.create_index([("project_id", 1), ("system_type", 1)])
        
        logger.info("MongoDB indexes created successfully")
        
    except Exception as e:
        logger.error("Failed to create MongoDB indexes", error=str(e))
        raise
