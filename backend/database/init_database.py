#!/usr/bin/env python3
"""
Database Initialization Script
SizeWise Suite - Phase 4: Performance Optimization

This script initializes the SQLite database with the base schema
before running performance index migrations.
"""

import sqlite3
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database(database_path: str = "backend/database/sizewise.db"):
    """Initialize the database with base schema."""
    
    # Get schema file path
    current_dir = Path(__file__).parent
    schema_file = current_dir / "schema.sql"
    
    logger.info(f"Initializing database: {database_path}")
    logger.info(f"Using schema file: {schema_file}")
    
    try:
        # Ensure database directory exists
        os.makedirs(os.path.dirname(database_path), exist_ok=True)
        
        # Read schema SQL
        with open(schema_file, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        # Connect to database
        connection = sqlite3.connect(database_path)
        connection.row_factory = sqlite3.Row
        
        # Execute schema
        logger.info("Creating database schema...")
        connection.executescript(schema_sql)
        connection.commit()
        
        # Verify tables were created
        cursor = connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        logger.info(f"Created {len(tables)} tables: {', '.join(tables)}")
        
        # Insert some test data for performance testing
        logger.info("Inserting test data...")
        insert_test_data(connection)
        
        connection.close()
        logger.info("Database initialization completed successfully!")
        
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

def insert_test_data(connection):
    """Insert test data for performance testing."""
    
    # Insert test user
    connection.execute("""
        INSERT OR IGNORE INTO users (id, email, name, tier, created_at)
        VALUES ('test-user-123', 'test@sizewise.com', 'Test User', 'pro', datetime('now'))
    """)
    
    # Insert test organization
    connection.execute("""
        INSERT OR IGNORE INTO organizations (id, name, tier, created_at)
        VALUES ('test-org-456', 'Test Organization', 'enterprise', datetime('now'))
    """)
    
    # Insert test projects
    for i in range(10):
        connection.execute("""
            INSERT OR IGNORE INTO projects (id, user_id, name, building_type, status, created_at, last_modified)
            VALUES (?, 'test-user-123', ?, ?, 'active', datetime('now'), datetime('now'))
        """, (f'test-project-{i}', f'Test HVAC Project {i}', 'office' if i % 2 == 0 else 'hospital'))
    
    # Insert test project segments
    for project_i in range(5):
        for segment_i in range(20):
            connection.execute("""
                INSERT OR IGNORE INTO project_segments (id, project_id, user_id, name, segment_type, created_at, updated_at)
                VALUES (?, ?, 'test-user-123', ?, ?, datetime('now'), datetime('now'))
            """, (
                f'test-segment-{project_i}-{segment_i}',
                f'test-project-{project_i}',
                f'Duct Segment {segment_i}',
                'duct' if segment_i % 3 == 0 else ('fitting' if segment_i % 3 == 1 else 'equipment')
            ))
    
    # Insert test feature flags
    features = ['unlimited_projects', 'advanced_calculations', '3d_visualization', 'ai_optimization']
    for feature in features:
        connection.execute("""
            INSERT OR IGNORE INTO feature_flags (id, user_id, feature_name, enabled, tier_required, created_at)
            VALUES (?, 'test-user-123', ?, 1, 'pro', datetime('now'))
        """, (f'flag-{feature}', feature))
    
    # Insert test change log entries
    for i in range(50):
        connection.execute("""
            INSERT OR IGNORE INTO change_log (user_id, entity_type, entity_id, operation, changes, timestamp, sync_status)
            VALUES ('test-user-123', 'project', ?, 'UPDATE', '{"name": "Updated"}', datetime('now'), ?)
        """, (f'test-project-{i % 5}', 'pending' if i % 3 == 0 else 'synced'))
    
    connection.commit()
    logger.info("Test data inserted successfully")

def main():
    """Main function."""
    success = init_database()
    return 0 if success else 1

if __name__ == "__main__":
    exit(exit_code := main())
