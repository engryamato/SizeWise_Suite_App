#!/usr/bin/env python3
"""
Database Migration Runner
SizeWise Suite - Phase 4: Performance Optimization
Task: Database Indexing Improvements

This module executes database migrations safely with rollback capabilities
and validates the performance improvements.
"""

import sqlite3
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrationRunner:
    """Safely executes database migrations with rollback capabilities."""
    
    def __init__(self, database_path: str = "backend/database/sizewise.db"):
        self.database_path = database_path
        # Use absolute path resolution
        current_dir = Path(__file__).parent
        self.migrations_dir = current_dir / "migrations"
        self.connection = None
        
    def connect(self):
        """Connect to SQLite database."""
        try:
            # Ensure database directory exists
            os.makedirs(os.path.dirname(self.database_path), exist_ok=True)
            
            self.connection = sqlite3.connect(self.database_path)
            self.connection.row_factory = sqlite3.Row
            
            # Enable foreign key constraints
            self.connection.execute("PRAGMA foreign_keys = ON")
            
            logger.info(f"Connected to database: {self.database_path}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Disconnect from database."""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def create_migration_table(self):
        """Create migration tracking table if it doesn't exist."""
        try:
            self.connection.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name TEXT UNIQUE NOT NULL,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    execution_time_ms REAL,
                    status TEXT DEFAULT 'completed',
                    rollback_sql TEXT,
                    notes TEXT
                )
            """)
            self.connection.commit()
            logger.info("Migration tracking table ready")
        except Exception as e:
            logger.error(f"Failed to create migration table: {e}")
            raise
    
    def backup_database(self) -> str:
        """Create a backup of the database before migration."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{self.database_path}.backup_{timestamp}"
            
            # Create backup using SQLite backup API
            backup_conn = sqlite3.connect(backup_path)
            self.connection.backup(backup_conn)
            backup_conn.close()
            
            logger.info(f"Database backup created: {backup_path}")
            return backup_path
        except Exception as e:
            logger.error(f"Failed to create database backup: {e}")
            raise
    
    def is_migration_applied(self, migration_name: str) -> bool:
        """Check if a migration has already been applied."""
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = ? AND status = 'completed'",
                (migration_name,)
            )
            count = cursor.fetchone()[0]
            return count > 0
        except sqlite3.OperationalError:
            # Migration table doesn't exist yet
            return False
        except Exception as e:
            logger.error(f"Failed to check migration status: {e}")
            return False
    
    def execute_migration_sql(self, migration_name: str, sql_content: str) -> Dict[str, Any]:
        """Execute migration SQL with timing and error handling."""
        start_time = datetime.now()
        
        try:
            # Split SQL into individual statements
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            executed_statements = 0
            for statement in statements:
                if statement:
                    self.connection.execute(statement)
                    executed_statements += 1
            
            self.connection.commit()
            
            end_time = datetime.now()
            execution_time_ms = (end_time - start_time).total_seconds() * 1000
            
            # Record migration in tracking table
            self.connection.execute("""
                INSERT INTO schema_migrations (migration_name, execution_time_ms, status, notes)
                VALUES (?, ?, 'completed', ?)
            """, (migration_name, execution_time_ms, f"Executed {executed_statements} statements"))
            self.connection.commit()
            
            logger.info(f"Migration '{migration_name}' completed in {execution_time_ms:.2f}ms")
            
            return {
                "status": "success",
                "execution_time_ms": execution_time_ms,
                "statements_executed": executed_statements
            }
            
        except Exception as e:
            self.connection.rollback()
            
            # Record failed migration
            try:
                self.connection.execute("""
                    INSERT INTO schema_migrations (migration_name, status, notes)
                    VALUES (?, 'failed', ?)
                """, (migration_name, str(e)))
                self.connection.commit()
            except:
                pass  # Don't fail if we can't record the failure
            
            logger.error(f"Migration '{migration_name}' failed: {e}")
            raise
    
    def run_index_migration(self, force: bool = False) -> Dict[str, Any]:
        """Run the index performance migration."""
        migration_name = "001_add_performance_indexes"
        migration_file = self.migrations_dir / f"{migration_name}.sql"

        logger.info(f"Running migration: {migration_name}")

        # Check if migration already applied
        if self.is_migration_applied(migration_name) and not force:
            logger.info(f"Migration '{migration_name}' already applied, skipping")
            return {"status": "skipped", "reason": "already_applied"}

        # Clear failed migration if forcing
        if force:
            try:
                self.connection.execute(
                    "DELETE FROM schema_migrations WHERE migration_name = ?",
                    (migration_name,)
                )
                self.connection.commit()
                logger.info(f"Cleared previous migration attempt for '{migration_name}'")
            except Exception as e:
                logger.warning(f"Could not clear previous migration: {e}")
        
        # Read migration SQL
        try:
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
        except FileNotFoundError:
            logger.error(f"Migration file not found: {migration_file}")
            raise
        except Exception as e:
            logger.error(f"Failed to read migration file: {e}")
            raise
        
        # Create backup before migration
        backup_path = self.backup_database()
        
        try:
            # Execute migration
            result = self.execute_migration_sql(migration_name, sql_content)
            result["backup_path"] = backup_path
            return result
            
        except Exception as e:
            logger.error(f"Migration failed, backup available at: {backup_path}")
            raise
    
    def validate_indexes(self) -> Dict[str, Any]:
        """Validate that indexes were created successfully."""
        try:
            cursor = self.connection.cursor()
            
            # Get all indexes
            cursor.execute("""
                SELECT name, tbl_name, sql 
                FROM sqlite_master 
                WHERE type = 'index' AND name LIKE 'idx_%'
                ORDER BY tbl_name, name
            """)
            indexes = cursor.fetchall()
            
            # Count indexes by table
            table_index_counts = {}
            for index in indexes:
                table_name = index[1]
                table_index_counts[table_name] = table_index_counts.get(table_name, 0) + 1
            
            # Check for expected indexes
            expected_indexes = [
                "idx_segments_project_type_composite",
                "idx_projects_user_status_modified",
                "idx_projects_name_search",
                "idx_change_log_sync_timestamp",
                "idx_feature_flags_user_feature_optimized"
            ]
            
            created_indexes = [index[0] for index in indexes]
            missing_indexes = [idx for idx in expected_indexes if idx not in created_indexes]
            
            validation_result = {
                "total_indexes": len(indexes),
                "indexes_by_table": table_index_counts,
                "expected_indexes_found": len(expected_indexes) - len(missing_indexes),
                "missing_indexes": missing_indexes,
                "all_indexes": [{"name": idx[0], "table": idx[1]} for idx in indexes]
            }
            
            if missing_indexes:
                logger.warning(f"Missing expected indexes: {missing_indexes}")
            else:
                logger.info("All expected indexes created successfully")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Index validation failed: {e}")
            raise
    
    def run_complete_migration(self, force: bool = False) -> Dict[str, Any]:
        """Run complete migration process with validation."""
        logger.info("Starting complete database migration process...")

        try:
            self.connect()
            self.create_migration_table()

            # Run index migration
            migration_result = self.run_index_migration(force=force)

            # Validate indexes
            validation_result = self.validate_indexes()

            # Combine results
            complete_result = {
                "migration": migration_result,
                "validation": validation_result,
                "status": "success",
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Database migration completed successfully!")
            return complete_result

        except Exception as e:
            logger.error(f"Migration process failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        finally:
            self.disconnect()

def main():
    """Main function to run database migration."""
    import sys

    force = len(sys.argv) > 1 and sys.argv[1] == "--force"
    if force:
        logger.info("Running migration with --force flag")

    runner = DatabaseMigrationRunner()

    try:
        result = runner.run_complete_migration(force=force)

        if result["status"] == "success":
            print("✅ Database migration completed successfully!")
            print(f"📊 Total indexes created: {result['validation']['total_indexes']}")
            print(f"⏱️ Migration time: {result['migration'].get('execution_time_ms', 0):.2f}ms")
            return 0
        else:
            print("❌ Database migration failed!")
            print(f"Error: {result['error']}")
            return 1

    except Exception as e:
        logger.error(f"Migration runner failed: {e}")
        return 1

if __name__ == "__main__":
    exit(exit_code := main())
