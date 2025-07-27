#!/usr/bin/env python3
"""
Database initialization script for SizeWise Suite Auth Server
This script ensures the database is properly initialized before the app starts
"""

import os
import sys
import logging
from app import app, init_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Initialize the database"""
    try:
        logger.info("Initializing SizeWise Auth Server database...")
        
        # Initialize database with app context
        with app.app_context():
            init_database()
            
        logger.info("Database initialization completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
