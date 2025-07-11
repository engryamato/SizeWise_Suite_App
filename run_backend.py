#!/usr/bin/env python3
"""
SizeWise Suite Backend Runner

Simple script to run the Flask backend with proper Python path setup.
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Now import and run the Flask app
from backend.app import create_app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '127.0.0.1')
    
    print(f"Starting SizeWise Suite backend on {host}:{port}")
    app.run(host=host, port=port, debug=app.config['DEBUG'])
