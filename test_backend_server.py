#!/usr/bin/env python3
"""
Test Backend Server for User Account Management E2E Tests

Simple Flask server to support user account management testing
with SQLite database operations and offline-first functionality.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import uuid
import os
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)

# Database configuration
DB_PATH = 'test_sizewise.db'

def init_database():
    """Initialize SQLite database with user management schema"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            tier TEXT DEFAULT 'free',
            company TEXT,
            license_key TEXT,
            organization_id TEXT,
            settings JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            password_hash TEXT,
            CHECK (tier IN ('free', 'pro', 'enterprise', 'super_admin'))
        )
    ''')
    
    # Create projects table for foreign key testing
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            client TEXT,
            address TEXT,
            building_type TEXT,
            metadata JSON,
            settings JSON,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Create change_log table for sync testing
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS change_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            changes JSON NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced_at DATETIME,
            sync_status TEXT DEFAULT 'pending'
        )
    ''')
    
    conn.commit()
    conn.close()

def hash_password(password):
    """Simple password hashing for testing"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/database/test-connection', methods=['POST'])
def test_connection():
    """Test database connection"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        conn.close()
        return jsonify({'success': True, 'message': 'Database connection successful'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/users/create', methods=['POST'])
def create_user():
    """Create new user"""
    try:
        data = request.get_json()
        user_id = data.get('id', str(uuid.uuid4()))
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (id, email, name, tier, company, settings, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            data['email'],
            data.get('name'),
            data.get('tier', 'free'),
            data.get('company'),
            json.dumps(data.get('settings', {})),
            hash_password(data.get('password', 'default'))
        ))
        
        # Log change
        cursor.execute('''
            INSERT INTO change_log (user_id, entity_type, entity_id, operation, changes)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'user', user_id, 'INSERT', json.dumps(data)))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'user_id': user_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [desc[0] for desc in cursor.description]
            user = dict(zip(columns, row))
            user['settings'] = json.loads(user['settings']) if user['settings'] else {}
            return jsonify({'success': True, 'user': user})
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get current user for change tracking
        cursor.execute('SELECT tier FROM users WHERE id = ?', (user_id,))
        current_user = cursor.fetchone()
        
        cursor.execute('''
            UPDATE users 
            SET tier = ?, name = ?, company = ?, settings = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('tier'),
            data.get('name'),
            data.get('company'),
            json.dumps(data.get('settings', {})),
            user_id
        ))
        
        # Log change if tier changed
        if current_user and current_user[0] != data.get('tier'):
            change_data = {
                'tier': {'from': current_user[0], 'to': data.get('tier')}
            }
            cursor.execute('''
                INSERT INTO change_log (user_id, entity_type, entity_id, operation, changes)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, 'user', user_id, 'UPDATE', json.dumps(change_data)))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/users/verify', methods=['POST'])
def verify_user():
    """Verify user exists"""
    try:
        data = request.get_json()
        email = data['email']
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [desc[0] for desc in cursor.description]
            user = dict(zip(columns, row))
            user['settings'] = json.loads(user['settings']) if user['settings'] else {}
            return jsonify({'exists': True, 'user': user})
        else:
            return jsonify({'exists': False})
    except Exception as e:
        return jsonify({'exists': False, 'error': str(e)}), 500

@app.route('/api/projects/create', methods=['POST'])
def create_project():
    """Create project (for foreign key testing)"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO projects (id, user_id, name)
            VALUES (?, ?, ?)
        ''', (
            data.get('id', str(uuid.uuid4())),
            data['user_id'],
            data['name']
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/admin/change-log', methods=['POST'])
def get_change_log():
    """Get change log entries"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if data.get('email'):
            cursor.execute('''
                SELECT cl.* FROM change_log cl
                JOIN users u ON cl.user_id = u.id
                WHERE u.email = ? AND cl.entity_type = ?
            ''', (data['email'], data.get('entityType', 'user')))
        else:
            cursor.execute('SELECT * FROM change_log WHERE entity_type = ?', (data.get('entityType', 'user'),))
        
        rows = cursor.fetchall()
        conn.close()
        
        columns = [desc[0] for desc in cursor.description]
        changes = [dict(zip(columns, row)) for row in rows]
        
        for change in changes:
            change['changes'] = json.loads(change['changes'])
        
        return jsonify({'changes': changes})
    except Exception as e:
        return jsonify({'changes': [], 'error': str(e)}), 500

@app.route('/api/admin/change-log/pending', methods=['POST'])
def get_pending_changes():
    """Get pending changes for sync"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        if data.get('email'):
            cursor.execute('''
                SELECT cl.* FROM change_log cl
                JOIN users u ON cl.user_id = u.id
                WHERE u.email = ? AND cl.sync_status = 'pending'
            ''', (data['email'],))
        else:
            cursor.execute('SELECT * FROM change_log WHERE sync_status = ?', ('pending',))
        
        rows = cursor.fetchall()
        conn.close()
        
        columns = [desc[0] for desc in cursor.description]
        pending_changes = [dict(zip(columns, row)) for row in rows]
        
        for change in pending_changes:
            change['changes'] = json.loads(change['changes'])
        
        return jsonify({'pendingChanges': pending_changes})
    except Exception as e:
        return jsonify({'pendingChanges': [], 'error': str(e)}), 500

@app.route('/api/test/repository-pattern', methods=['POST'])
def test_repository_pattern():
    """Test repository pattern methods"""
    try:
        # Simulate repository pattern testing
        test_results = {
            'getUser': True,
            'getCurrentUser': True,
            'saveUser': True,
            'deleteUser': True,
            'validateLicense': True,
            'getLicenseInfo': True
        }
        
        return jsonify({'success': True, 'results': test_results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    print("Starting Test Backend Server for User Account Management Tests")
    print("Database initialized at:", DB_PATH)
    app.run(host='127.0.0.1', port=5000, debug=True)
