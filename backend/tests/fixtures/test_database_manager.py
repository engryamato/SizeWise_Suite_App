"""
Test Database Manager for SizeWise Suite Backend

Provides comprehensive database setup, cleanup, and isolation for tests.
Supports multiple database backends and ensures test data integrity.
"""

import os
import sqlite3
import asyncio
import tempfile
import shutil
from typing import Dict, List, Any, Optional, Union
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path
import json
import logging

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

try:
    import pymongo
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from .test_data_factory import TestDataFactory, TestUser, TestProject, TestCalculation


logger = logging.getLogger(__name__)


class TestDatabaseManager:
    """Manages test databases with isolation and cleanup"""
    
    def __init__(self, db_type: str = "sqlite", test_name: str = "test"):
        """
        Initialize test database manager
        
        Args:
            db_type: Type of database ("sqlite", "postgresql", "mongodb")
            test_name: Name for test database isolation
        """
        self.db_type = db_type.lower()
        self.test_name = test_name
        self.temp_dir = None
        self.db_path = None
        self.connection = None
        self.test_data_factory = TestDataFactory()
        
        # Database configurations
        self.sqlite_config = {
            "database": f"test_{test_name}.db",
            "timeout": 30.0,
            "check_same_thread": False
        }
        
        self.postgres_config = {
            "host": os.getenv("TEST_POSTGRES_HOST", "localhost"),
            "port": int(os.getenv("TEST_POSTGRES_PORT", "5432")),
            "user": os.getenv("TEST_POSTGRES_USER", "test"),
            "password": os.getenv("TEST_POSTGRES_PASSWORD", "test"),
            "database": f"sizewise_test_{test_name}"
        }
        
        self.mongodb_config = {
            "host": os.getenv("TEST_MONGODB_HOST", "localhost"),
            "port": int(os.getenv("TEST_MONGODB_PORT", "27017")),
            "database": f"sizewise_test_{test_name}"
        }
        
        self.redis_config = {
            "host": os.getenv("TEST_REDIS_HOST", "localhost"),
            "port": int(os.getenv("TEST_REDIS_PORT", "6379")),
            "db": int(os.getenv("TEST_REDIS_DB", "1"))
        }
    
    @contextmanager
    def setup_test_database(self):
        """Context manager for test database setup and cleanup"""
        try:
            self.create_test_database()
            self.initialize_schema()
            yield self
        finally:
            self.cleanup_test_database()
    
    def create_test_database(self):
        """Create isolated test database"""
        if self.db_type == "sqlite":
            self._create_sqlite_database()
        elif self.db_type == "postgresql":
            self._create_postgresql_database()
        elif self.db_type == "mongodb":
            self._create_mongodb_database()
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    def _create_sqlite_database(self):
        """Create SQLite test database"""
        self.temp_dir = tempfile.mkdtemp(prefix=f"sizewise_test_{self.test_name}_")
        self.db_path = os.path.join(self.temp_dir, self.sqlite_config["database"])
        
        self.connection = sqlite3.connect(
            self.db_path,
            timeout=self.sqlite_config["timeout"],
            check_same_thread=self.sqlite_config["check_same_thread"]
        )
        self.connection.row_factory = sqlite3.Row
        
        logger.info(f"Created SQLite test database: {self.db_path}")
    
    def _create_postgresql_database(self):
        """Create PostgreSQL test database"""
        if not POSTGRES_AVAILABLE:
            raise ImportError("psycopg2 not available for PostgreSQL testing")
        
        # Connect to default database to create test database
        admin_conn = psycopg2.connect(
            host=self.postgres_config["host"],
            port=self.postgres_config["port"],
            user=self.postgres_config["user"],
            password=self.postgres_config["password"],
            database="postgres"
        )
        admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = admin_conn.cursor()
        
        # Drop database if exists
        cursor.execute(f"DROP DATABASE IF EXISTS {self.postgres_config['database']}")
        
        # Create test database
        cursor.execute(f"CREATE DATABASE {self.postgres_config['database']}")
        
        cursor.close()
        admin_conn.close()
        
        # Connect to test database
        self.connection = psycopg2.connect(**self.postgres_config)
        
        logger.info(f"Created PostgreSQL test database: {self.postgres_config['database']}")
    
    def _create_mongodb_database(self):
        """Create MongoDB test database"""
        if not MONGODB_AVAILABLE:
            raise ImportError("pymongo not available for MongoDB testing")
        
        client = pymongo.MongoClient(
            host=self.mongodb_config["host"],
            port=self.mongodb_config["port"]
        )
        
        # Drop database if exists
        client.drop_database(self.mongodb_config["database"])
        
        # Create test database
        self.connection = client[self.mongodb_config["database"]]
        
        logger.info(f"Created MongoDB test database: {self.mongodb_config['database']}")
    
    def initialize_schema(self):
        """Initialize database schema for testing"""
        if self.db_type == "sqlite":
            self._initialize_sqlite_schema()
        elif self.db_type == "postgresql":
            self._initialize_postgresql_schema()
        elif self.db_type == "mongodb":
            self._initialize_mongodb_schema()
    
    def _initialize_sqlite_schema(self):
        """Initialize SQLite schema"""
        cursor = self.connection.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                tier TEXT DEFAULT 'free',
                company TEXT,
                license_key TEXT,
                organization_id TEXT,
                settings TEXT,
                created_at TEXT,
                updated_at TEXT,
                password_hash TEXT,
                is_active BOOLEAN DEFAULT 1,
                CHECK (tier IN ('trial', 'free', 'premium', 'enterprise'))
            )
        ''')
        
        # Projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                project_type TEXT,
                location TEXT,
                codes TEXT,
                rooms TEXT,
                segments TEXT,
                equipment TEXT,
                created_at TEXT,
                updated_at TEXT,
                sync_status TEXT DEFAULT 'local',
                version INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Calculations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS calculations (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                calculation_type TEXT,
                inputs TEXT,
                results TEXT,
                metadata TEXT,
                created_at TEXT,
                is_valid BOOLEAN DEFAULT 1,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Test metadata table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS test_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_name TEXT,
                scenario_name TEXT,
                created_at TEXT,
                data_count INTEGER
            )
        ''')
        
        self.connection.commit()
        logger.info("Initialized SQLite schema")
    
    def _initialize_postgresql_schema(self):
        """Initialize PostgreSQL schema"""
        cursor = self.connection.cursor()
        
        # Enable UUID extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                tier VARCHAR(50) DEFAULT 'free',
                company VARCHAR(255),
                license_key VARCHAR(255),
                organization_id UUID,
                settings JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                password_hash VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                CHECK (tier IN ('trial', 'free', 'premium', 'enterprise'))
            )
        ''')
        
        # Projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                project_type VARCHAR(50),
                location VARCHAR(255),
                codes JSONB,
                rooms JSONB,
                segments JSONB,
                equipment JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_status VARCHAR(50) DEFAULT 'local',
                version INTEGER DEFAULT 1
            )
        ''')
        
        # Calculations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS calculations (
                id UUID PRIMARY KEY,
                project_id UUID NOT NULL REFERENCES projects(id),
                user_id UUID NOT NULL REFERENCES users(id),
                calculation_type VARCHAR(50),
                inputs JSONB,
                results JSONB,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_valid BOOLEAN DEFAULT TRUE
            )
        ''')
        
        self.connection.commit()
        logger.info("Initialized PostgreSQL schema")
    
    def _initialize_mongodb_schema(self):
        """Initialize MongoDB collections and indexes"""
        # Create collections with validation
        self.connection.create_collection("users", validator={
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["id", "email", "tier"],
                "properties": {
                    "id": {"bsonType": "string"},
                    "email": {"bsonType": "string"},
                    "tier": {"enum": ["trial", "free", "premium", "enterprise"]}
                }
            }
        })
        
        self.connection.create_collection("projects")
        self.connection.create_collection("calculations")
        
        # Create indexes
        self.connection.users.create_index("email", unique=True)
        self.connection.projects.create_index("user_id")
        self.connection.calculations.create_index([("project_id", 1), ("user_id", 1)])
        
        logger.info("Initialized MongoDB schema")
    
    def insert_test_data(self, scenario_data: Dict[str, Any]):
        """Insert test scenario data into database"""
        if self.db_type == "sqlite":
            self._insert_sqlite_data(scenario_data)
        elif self.db_type == "postgresql":
            self._insert_postgresql_data(scenario_data)
        elif self.db_type == "mongodb":
            self._insert_mongodb_data(scenario_data)
        
        # Record test metadata
        self._record_test_metadata(scenario_data)
    
    def _insert_sqlite_data(self, scenario_data: Dict[str, Any]):
        """Insert data into SQLite database"""
        cursor = self.connection.cursor()
        
        # Insert users
        for user in scenario_data["users"]:
            user_dict = self.test_data_factory.to_dict(user)
            placeholders = ", ".join(["?" for _ in user_dict])
            columns = ", ".join(user_dict.keys())
            cursor.execute(
                f"INSERT INTO users ({columns}) VALUES ({placeholders})",
                list(user_dict.values())
            )
        
        # Insert projects
        for project in scenario_data["projects"]:
            project_dict = self.test_data_factory.to_dict(project)
            placeholders = ", ".join(["?" for _ in project_dict])
            columns = ", ".join(project_dict.keys())
            cursor.execute(
                f"INSERT INTO projects ({columns}) VALUES ({placeholders})",
                list(project_dict.values())
            )
        
        # Insert calculations
        for calculation in scenario_data["calculations"]:
            calc_dict = self.test_data_factory.to_dict(calculation)
            placeholders = ", ".join(["?" for _ in calc_dict])
            columns = ", ".join(calc_dict.keys())
            cursor.execute(
                f"INSERT INTO calculations ({columns}) VALUES ({placeholders})",
                list(calc_dict.values())
            )
        
        self.connection.commit()
        logger.info(f"Inserted test data: {len(scenario_data['users'])} users, "
                   f"{len(scenario_data['projects'])} projects, "
                   f"{len(scenario_data['calculations'])} calculations")
    
    def _insert_postgresql_data(self, scenario_data: Dict[str, Any]):
        """Insert data into PostgreSQL database"""
        cursor = self.connection.cursor()
        
        # Insert users
        for user in scenario_data["users"]:
            user_dict = self.test_data_factory.to_dict(user)
            # Convert settings JSON string back to dict for JSONB
            user_dict["settings"] = json.loads(user_dict["settings"])
            
            placeholders = ", ".join(["%s" for _ in user_dict])
            columns = ", ".join(user_dict.keys())
            cursor.execute(
                f"INSERT INTO users ({columns}) VALUES ({placeholders})",
                list(user_dict.values())
            )
        
        # Insert projects
        for project in scenario_data["projects"]:
            project_dict = self.test_data_factory.to_dict(project)
            # Convert JSON strings to dicts for JSONB
            for json_field in ["codes", "rooms", "segments", "equipment"]:
                project_dict[json_field] = json.loads(project_dict[json_field])
            
            placeholders = ", ".join(["%s" for _ in project_dict])
            columns = ", ".join(project_dict.keys())
            cursor.execute(
                f"INSERT INTO projects ({columns}) VALUES ({placeholders})",
                list(project_dict.values())
            )
        
        # Insert calculations
        for calculation in scenario_data["calculations"]:
            calc_dict = self.test_data_factory.to_dict(calculation)
            # Convert JSON strings to dicts for JSONB
            for json_field in ["inputs", "results", "metadata"]:
                calc_dict[json_field] = json.loads(calc_dict[json_field])
            
            placeholders = ", ".join(["%s" for _ in calc_dict])
            columns = ", ".join(calc_dict.keys())
            cursor.execute(
                f"INSERT INTO calculations ({columns}) VALUES ({placeholders})",
                list(calc_dict.values())
            )
        
        self.connection.commit()
        logger.info(f"Inserted PostgreSQL test data")
    
    def _insert_mongodb_data(self, scenario_data: Dict[str, Any]):
        """Insert data into MongoDB database"""
        # Insert users
        user_docs = [self.test_data_factory.to_dict(user) for user in scenario_data["users"]]
        for user_doc in user_docs:
            user_doc["settings"] = json.loads(user_doc["settings"])
        self.connection.users.insert_many(user_docs)
        
        # Insert projects
        project_docs = [self.test_data_factory.to_dict(project) for project in scenario_data["projects"]]
        for project_doc in project_docs:
            for json_field in ["codes", "rooms", "segments", "equipment"]:
                project_doc[json_field] = json.loads(project_doc[json_field])
        self.connection.projects.insert_many(project_docs)
        
        # Insert calculations
        calc_docs = [self.test_data_factory.to_dict(calc) for calc in scenario_data["calculations"]]
        for calc_doc in calc_docs:
            for json_field in ["inputs", "results", "metadata"]:
                calc_doc[json_field] = json.loads(calc_doc[json_field])
        self.connection.calculations.insert_many(calc_docs)
        
        logger.info(f"Inserted MongoDB test data")
    
    def _record_test_metadata(self, scenario_data: Dict[str, Any]):
        """Record test metadata for tracking"""
        total_records = (len(scenario_data["users"]) + 
                        len(scenario_data["projects"]) + 
                        len(scenario_data["calculations"]))
        
        if self.db_type in ["sqlite", "postgresql"]:
            cursor = self.connection.cursor()
            if self.db_type == "sqlite":
                cursor.execute('''
                    INSERT INTO test_metadata (test_name, scenario_name, created_at, data_count)
                    VALUES (?, ?, ?, ?)
                ''', (self.test_name, scenario_data["name"], scenario_data["created_at"], total_records))
            else:
                cursor.execute('''
                    INSERT INTO test_metadata (test_name, scenario_name, created_at, data_count)
                    VALUES (%s, %s, %s, %s)
                ''', (self.test_name, scenario_data["name"], scenario_data["created_at"], total_records))
            self.connection.commit()
    
    def cleanup_test_database(self):
        """Clean up test database and resources"""
        try:
            if self.connection:
                if self.db_type == "sqlite":
                    self.connection.close()
                    if self.temp_dir and os.path.exists(self.temp_dir):
                        shutil.rmtree(self.temp_dir)
                        logger.info(f"Cleaned up SQLite test database: {self.temp_dir}")
                
                elif self.db_type == "postgresql":
                    self.connection.close()
                    # Drop test database
                    admin_conn = psycopg2.connect(
                        host=self.postgres_config["host"],
                        port=self.postgres_config["port"],
                        user=self.postgres_config["user"],
                        password=self.postgres_config["password"],
                        database="postgres"
                    )
                    admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                    cursor = admin_conn.cursor()
                    cursor.execute(f"DROP DATABASE IF EXISTS {self.postgres_config['database']}")
                    cursor.close()
                    admin_conn.close()
                    logger.info(f"Cleaned up PostgreSQL test database: {self.postgres_config['database']}")
                
                elif self.db_type == "mongodb":
                    self.connection.client.drop_database(self.mongodb_config["database"])
                    logger.info(f"Cleaned up MongoDB test database: {self.mongodb_config['database']}")
        
        except Exception as e:
            logger.error(f"Error during test database cleanup: {e}")
    
    def get_connection(self):
        """Get database connection for direct queries"""
        return self.connection
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Execute query and return results"""
        if self.db_type in ["sqlite", "postgresql"]:
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            
            if self.db_type == "sqlite":
                return [dict(row) for row in cursor.fetchall()]
            else:
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        elif self.db_type == "mongodb":
            # MongoDB queries would need to be handled differently
            raise NotImplementedError("Direct MongoDB queries not implemented in this method")
    
    def count_records(self, table: str) -> int:
        """Count records in a table/collection"""
        if self.db_type in ["sqlite", "postgresql"]:
            cursor = self.connection.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            return cursor.fetchone()[0]
        elif self.db_type == "mongodb":
            return self.connection[table].count_documents({})


# Convenience functions for common test database setups
def create_test_db_manager(test_name: str, db_type: str = "sqlite") -> TestDatabaseManager:
    """Create test database manager with standard configuration"""
    return TestDatabaseManager(db_type=db_type, test_name=test_name)


@contextmanager
def isolated_test_database(test_name: str, scenario_name: str = "basic_test", 
                          db_type: str = "sqlite"):
    """Context manager for isolated test database with pre-loaded data"""
    manager = create_test_db_manager(test_name, db_type)
    
    with manager.setup_test_database():
        # Load test scenario data
        if scenario_name == "basic_test":
            from .test_data_factory import create_basic_test_data
            scenario_data = create_basic_test_data()
        elif scenario_name == "performance_test":
            from .test_data_factory import create_performance_test_data
            scenario_data = create_performance_test_data()
        elif scenario_name == "tier_test":
            from .test_data_factory import create_tier_test_data
            scenario_data = create_tier_test_data()
        else:
            # Create custom scenario
            factory = TestDataFactory()
            scenario_data = factory.create_test_scenario(scenario_name)
        
        manager.insert_test_data(scenario_data)
        yield manager
