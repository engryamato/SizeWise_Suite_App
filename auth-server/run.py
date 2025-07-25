#!/usr/bin/env python3
"""
SizeWise Suite Authentication Server
Production-ready entry point with proper configuration
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, init_database

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Get configuration from environment
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting SizeWise Auth Server")
    print(f"   Environment: {os.environ.get('FLASK_ENV', 'production')}")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Debug: {debug}")
    
    # Run the application
    app.run(host=host, port=port, debug=debug)
