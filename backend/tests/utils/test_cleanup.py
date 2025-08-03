"""
Test Cleanup Utilities for SizeWise Suite Backend

Provides comprehensive cleanup utilities for test data, temporary files,
and database resources to ensure clean test environments.
"""

import os
import shutil
import tempfile
import sqlite3
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
import glob
import time

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


logger = logging.getLogger(__name__)


class TestCleanupManager:
    """Manages cleanup of test resources and data"""
    
    def __init__(self):
        self.temp_directories: List[str] = []
        self.temp_files: List[str] = []
        self.test_databases: List[Dict[str, Any]] = []
        self.redis_keys: List[str] = []
        self.cleanup_callbacks: List[callable] = []
    
    def register_temp_directory(self, directory: str):
        """Register temporary directory for cleanup"""
        if directory and os.path.exists(directory):
            self.temp_directories.append(directory)
            logger.debug(f"Registered temp directory for cleanup: {directory}")
    
    def register_temp_file(self, file_path: str):
        """Register temporary file for cleanup"""
        if file_path and os.path.exists(file_path):
            self.temp_files.append(file_path)
            logger.debug(f"Registered temp file for cleanup: {file_path}")
    
    def register_test_database(self, db_config: Dict[str, Any]):
        """Register test database for cleanup"""
        self.test_databases.append(db_config)
        logger.debug(f"Registered test database for cleanup: {db_config.get('name', 'unknown')}")
    
    def register_redis_key(self, key: str):
        """Register Redis key for cleanup"""
        self.redis_keys.append(key)
        logger.debug(f"Registered Redis key for cleanup: {key}")
    
    def register_cleanup_callback(self, callback: callable):
        """Register custom cleanup callback"""
        self.cleanup_callbacks.append(callback)
        logger.debug(f"Registered cleanup callback: {callback.__name__}")
    
    def cleanup_temp_directories(self):
        """Clean up temporary directories"""
        for directory in self.temp_directories:
            try:
                if os.path.exists(directory):
                    shutil.rmtree(directory, ignore_errors=True)
                    logger.info(f"Cleaned up temp directory: {directory}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory {directory}: {e}")
        
        self.temp_directories.clear()
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
        
        self.temp_files.clear()
    
    def cleanup_test_databases(self):
        """Clean up test databases"""
        for db_config in self.test_databases:
            try:
                db_type = db_config.get('type', 'sqlite')
                
                if db_type == 'sqlite':
                    self._cleanup_sqlite_database(db_config)
                elif db_type == 'postgresql':
                    self._cleanup_postgresql_database(db_config)
                elif db_type == 'mongodb':
                    self._cleanup_mongodb_database(db_config)
                
            except Exception as e:
                logger.warning(f"Failed to cleanup test database {db_config}: {e}")
        
        self.test_databases.clear()
    
    def _cleanup_sqlite_database(self, db_config: Dict[str, Any]):
        """Clean up SQLite test database"""
        db_path = db_config.get('path')
        if db_path and os.path.exists(db_path):
            try:
                # Close any open connections
                if 'connection' in db_config and db_config['connection']:
                    db_config['connection'].close()
                
                # Remove database file
                os.remove(db_path)
                logger.info(f"Cleaned up SQLite database: {db_path}")
                
                # Remove journal and WAL files if they exist
                for suffix in ['-journal', '-wal', '-shm']:
                    journal_path = db_path + suffix
                    if os.path.exists(journal_path):
                        os.remove(journal_path)
                        logger.debug(f"Cleaned up SQLite journal file: {journal_path}")
                        
            except Exception as e:
                logger.warning(f"Failed to cleanup SQLite database {db_path}: {e}")
    
    def _cleanup_postgresql_database(self, db_config: Dict[str, Any]):
        """Clean up PostgreSQL test database"""
        if not POSTGRES_AVAILABLE:
            return
        
        try:
            # Close existing connection
            if 'connection' in db_config and db_config['connection']:
                db_config['connection'].close()
            
            # Connect to default database to drop test database
            admin_conn = psycopg2.connect(
                host=db_config.get('host', 'localhost'),
                port=db_config.get('port', 5432),
                user=db_config.get('user', 'test'),
                password=db_config.get('password', 'test'),
                database='postgres'
            )
            admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            
            cursor = admin_conn.cursor()
            database_name = db_config.get('database')
            
            # Terminate active connections to the test database
            cursor.execute(f"""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = '{database_name}' AND pid <> pg_backend_pid()
            """)
            
            # Drop test database
            cursor.execute(f"DROP DATABASE IF EXISTS {database_name}")
            
            cursor.close()
            admin_conn.close()
            
            logger.info(f"Cleaned up PostgreSQL database: {database_name}")
            
        except Exception as e:
            logger.warning(f"Failed to cleanup PostgreSQL database: {e}")
    
    def _cleanup_mongodb_database(self, db_config: Dict[str, Any]):
        """Clean up MongoDB test database"""
        if not MONGODB_AVAILABLE:
            return
        
        try:
            client = pymongo.MongoClient(
                host=db_config.get('host', 'localhost'),
                port=db_config.get('port', 27017)
            )
            
            database_name = db_config.get('database')
            client.drop_database(database_name)
            client.close()
            
            logger.info(f"Cleaned up MongoDB database: {database_name}")
            
        except Exception as e:
            logger.warning(f"Failed to cleanup MongoDB database: {e}")
    
    def cleanup_redis_keys(self):
        """Clean up Redis test keys"""
        if not REDIS_AVAILABLE or not self.redis_keys:
            return
        
        try:
            redis_client = redis.Redis(
                host=os.getenv('TEST_REDIS_HOST', 'localhost'),
                port=int(os.getenv('TEST_REDIS_PORT', '6379')),
                db=int(os.getenv('TEST_REDIS_DB', '1'))
            )
            
            if self.redis_keys:
                deleted_count = redis_client.delete(*self.redis_keys)
                logger.info(f"Cleaned up {deleted_count} Redis keys")
            
            self.redis_keys.clear()
            
        except Exception as e:
            logger.warning(f"Failed to cleanup Redis keys: {e}")
    
    def run_cleanup_callbacks(self):
        """Run custom cleanup callbacks"""
        for callback in self.cleanup_callbacks:
            try:
                callback()
                logger.debug(f"Executed cleanup callback: {callback.__name__}")
            except Exception as e:
                logger.warning(f"Cleanup callback {callback.__name__} failed: {e}")
        
        self.cleanup_callbacks.clear()
    
    def cleanup_all(self):
        """Run all cleanup operations"""
        logger.info("Starting comprehensive test cleanup...")
        
        # Run custom callbacks first
        self.run_cleanup_callbacks()
        
        # Clean up databases
        self.cleanup_test_databases()
        
        # Clean up Redis keys
        self.cleanup_redis_keys()
        
        # Clean up files and directories
        self.cleanup_temp_files()
        self.cleanup_temp_directories()
        
        logger.info("Test cleanup completed")


class GlobalTestCleanup:
    """Global test cleanup manager for pytest session"""
    
    def __init__(self):
        self.cleanup_manager = TestCleanupManager()
        self.test_artifacts_dir = None
        self.max_artifact_age_days = 7  # Keep artifacts for 7 days
    
    def setup_test_artifacts_directory(self):
        """Setup directory for test artifacts"""
        base_dir = os.path.join(tempfile.gettempdir(), 'sizewise_test_artifacts')
        timestamp = int(time.time())
        self.test_artifacts_dir = os.path.join(base_dir, f"test_run_{timestamp}")
        
        os.makedirs(self.test_artifacts_dir, exist_ok=True)
        logger.info(f"Test artifacts directory: {self.test_artifacts_dir}")
        
        return self.test_artifacts_dir
    
    def cleanup_old_test_artifacts(self):
        """Clean up old test artifacts"""
        base_dir = os.path.join(tempfile.gettempdir(), 'sizewise_test_artifacts')
        
        if not os.path.exists(base_dir):
            return
        
        current_time = time.time()
        max_age_seconds = self.max_artifact_age_days * 24 * 60 * 60
        
        for item in os.listdir(base_dir):
            item_path = os.path.join(base_dir, item)
            
            if os.path.isdir(item_path):
                try:
                    # Check if directory is older than max age
                    dir_age = current_time - os.path.getctime(item_path)
                    
                    if dir_age > max_age_seconds:
                        shutil.rmtree(item_path, ignore_errors=True)
                        logger.info(f"Cleaned up old test artifacts: {item_path}")
                        
                except Exception as e:
                    logger.warning(f"Failed to cleanup old artifacts {item_path}: {e}")
    
    def cleanup_test_patterns(self):
        """Clean up files matching test patterns"""
        patterns = [
            'test_*.db',
            'test_*.sqlite',
            'test_*.log',
            '*_test.db',
            '*_test.sqlite',
            'sizewise_test_*',
            '.pytest_cache/**/*',
            '__pycache__/**/*',
            '*.pyc'
        ]
        
        for pattern in patterns:
            try:
                files = glob.glob(pattern, recursive=True)
                for file_path in files:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        logger.debug(f"Cleaned up test file: {file_path}")
                    elif os.path.isdir(file_path) and '__pycache__' in file_path:
                        shutil.rmtree(file_path, ignore_errors=True)
                        logger.debug(f"Cleaned up cache directory: {file_path}")
                        
            except Exception as e:
                logger.warning(f"Failed to cleanup pattern {pattern}: {e}")
    
    def session_cleanup(self):
        """Cleanup at end of test session"""
        logger.info("Starting session cleanup...")
        
        # Run main cleanup
        self.cleanup_manager.cleanup_all()
        
        # Clean up test patterns
        self.cleanup_test_patterns()
        
        # Clean up old artifacts
        self.cleanup_old_test_artifacts()
        
        logger.info("Session cleanup completed")


# Global cleanup manager instance
global_cleanup = GlobalTestCleanup()


def register_for_cleanup(resource_type: str, resource_info: Any):
    """Register resource for cleanup"""
    if resource_type == 'temp_dir':
        global_cleanup.cleanup_manager.register_temp_directory(resource_info)
    elif resource_type == 'temp_file':
        global_cleanup.cleanup_manager.register_temp_file(resource_info)
    elif resource_type == 'database':
        global_cleanup.cleanup_manager.register_test_database(resource_info)
    elif resource_type == 'redis_key':
        global_cleanup.cleanup_manager.register_redis_key(resource_info)
    elif resource_type == 'callback':
        global_cleanup.cleanup_manager.register_cleanup_callback(resource_info)


def cleanup_test_environment():
    """Clean up entire test environment"""
    global_cleanup.session_cleanup()


def create_temp_directory(prefix: str = "sizewise_test_") -> str:
    """Create temporary directory and register for cleanup"""
    temp_dir = tempfile.mkdtemp(prefix=prefix)
    register_for_cleanup('temp_dir', temp_dir)
    return temp_dir


def create_temp_file(suffix: str = ".tmp", prefix: str = "sizewise_test_") -> str:
    """Create temporary file and register for cleanup"""
    fd, temp_file = tempfile.mkstemp(suffix=suffix, prefix=prefix)
    os.close(fd)  # Close file descriptor
    register_for_cleanup('temp_file', temp_file)
    return temp_file


def ensure_clean_test_environment():
    """Ensure clean test environment before running tests"""
    # Clean up any leftover test files
    global_cleanup.cleanup_test_patterns()
    
    # Setup fresh artifacts directory
    global_cleanup.setup_test_artifacts_directory()
    
    logger.info("Test environment prepared")


# Context manager for test resource cleanup
class TestResourceManager:
    """Context manager for automatic test resource cleanup"""
    
    def __init__(self):
        self.local_cleanup = TestCleanupManager()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.local_cleanup.cleanup_all()
    
    def register_temp_directory(self, directory: str):
        self.local_cleanup.register_temp_directory(directory)
    
    def register_temp_file(self, file_path: str):
        self.local_cleanup.register_temp_file(file_path)
    
    def register_database(self, db_config: Dict[str, Any]):
        self.local_cleanup.register_test_database(db_config)
    
    def register_callback(self, callback: callable):
        self.local_cleanup.register_cleanup_callback(callback)


def with_test_resources():
    """Context manager for test resources with automatic cleanup"""
    return TestResourceManager()


# Pytest hooks for automatic cleanup
def pytest_sessionstart(session):
    """Called after the Session object has been created"""
    ensure_clean_test_environment()


def pytest_sessionfinish(session, exitstatus):
    """Called after whole test run finished"""
    cleanup_test_environment()


def pytest_runtest_teardown(item, nextitem):
    """Called after each test item has been run"""
    # Clean up any test-specific resources
    # This is handled by individual test fixtures
