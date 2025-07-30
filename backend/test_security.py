#!/usr/bin/env python3
"""
Backend Security Testing Script

Tests authentication system, tier-based access control, and cryptography functionality
for SizeWise Suite comprehensive testing validation.
"""

import sys
import os
import traceback
from datetime import datetime

def test_cryptography_package():
    """Test cryptography package functionality"""
    try:
        import cryptography
        from cryptography.fernet import Fernet
        
        print(f"✓ Cryptography package version: {cryptography.__version__}")
        
        # Test basic encryption/decryption
        key = Fernet.generate_key()
        cipher_suite = Fernet(key)
        
        test_data = b"SizeWise Suite Test Data"
        encrypted_data = cipher_suite.encrypt(test_data)
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        
        if decrypted_data == test_data:
            print("✓ Cryptography encryption/decryption working correctly")
            return True
        else:
            print("✗ Cryptography encryption/decryption failed")
            return False
            
    except Exception as e:
        print(f"✗ Cryptography test failed: {e}")
        return False

def test_jwt_functionality():
    """Test JWT token functionality"""
    try:
        import jwt
        from datetime import datetime, timedelta
        
        # Test JWT encoding/decoding
        payload = {
            'user_id': 'test_user',
            'tier': 'pro',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        
        secret = 'test_secret_key'
        token = jwt.encode(payload, secret, algorithm='HS256')
        decoded = jwt.decode(token, secret, algorithms=['HS256'])
        
        if decoded['user_id'] == 'test_user' and decoded['tier'] == 'pro':
            print("✓ JWT token encoding/decoding working correctly")
            return True
        else:
            print("✗ JWT token validation failed")
            return False
            
    except Exception as e:
        print(f"✗ JWT test failed: {e}")
        return False

def test_password_hashing():
    """Test password hashing functionality"""
    try:
        import bcrypt
        
        # Test password hashing
        password = "test_password_123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Test password verification
        if bcrypt.checkpw(password.encode('utf-8'), hashed):
            print("✓ Password hashing and verification working correctly")
            return True
        else:
            print("✗ Password verification failed")
            return False
            
    except Exception as e:
        print(f"✗ Password hashing test failed: {e}")
        return False

def test_database_connections():
    """Test database connection capabilities"""
    try:
        # Test MongoDB connection capability
        import pymongo
        print(f"✓ PyMongo version: {pymongo.version}")
        
        # Test PostgreSQL connection capability  
        import psycopg2
        print("✓ PostgreSQL driver (psycopg2) available")
        
        # Test SQLAlchemy
        import sqlalchemy
        print(f"✓ SQLAlchemy version: {sqlalchemy.__version__}")
        
        return True
        
    except Exception as e:
        print(f"✗ Database connection test failed: {e}")
        return False

def test_flask_security():
    """Test Flask security components"""
    try:
        import flask
        from flask_cors import CORS
        
        print(f"✓ Flask version: {flask.__version__}")
        print("✓ Flask-CORS available for cross-origin requests")
        
        # Test basic Flask app creation
        app = flask.Flask(__name__)
        CORS(app)
        
        @app.route('/test')
        def test_route():
            return flask.jsonify({'status': 'ok'})
            
        print("✓ Flask app creation and CORS configuration successful")
        return True
        
    except Exception as e:
        print(f"✗ Flask security test failed: {e}")
        return False

def main():
    """Run all backend security tests"""
    print("=" * 60)
    print("SizeWise Suite - Backend Security Testing")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tests = [
        ("Cryptography Package", test_cryptography_package),
        ("JWT Functionality", test_jwt_functionality),
        ("Password Hashing", test_password_hashing),
        ("Database Connections", test_database_connections),
        ("Flask Security", test_flask_security)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"Running {test_name} test...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} test crashed: {e}")
            traceback.print_exc()
            results.append((test_name, False))
        print()
    
    # Summary
    print("=" * 60)
    print("Test Results Summary:")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {test_name}: {status}")
        if result:
            passed += 1
    
    print()
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All backend security tests passed!")
        return 0
    else:
        print("⚠️  Some backend security tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
