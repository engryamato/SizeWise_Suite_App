#!/usr/bin/env python3
"""
Check and manage database migrations
"""

import sqlite3
import sys

def check_migrations(database_path="backend/database/sizewise.db"):
    """Check migration status."""
    try:
        connection = sqlite3.connect(database_path)
        connection.row_factory = sqlite3.Row
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM schema_migrations ORDER BY executed_at")
        migrations = cursor.fetchall()
        
        print("Migration Status:")
        print("-" * 50)
        for migration in migrations:
            print(f"Name: {migration['migration_name']}")
            print(f"Status: {migration['status']}")
            print(f"Executed: {migration['executed_at']}")
            print(f"Time: {migration['execution_time_ms']}ms")
            print(f"Notes: {migration['notes']}")
            print("-" * 50)
        
        if len(sys.argv) > 1 and sys.argv[1] == "clear":
            print("Clearing failed migrations...")
            cursor.execute("DELETE FROM schema_migrations WHERE status = 'failed'")
            connection.commit()
            print("Failed migrations cleared.")
        
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_migrations()
