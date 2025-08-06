"""
Unit tests for Multi-Factor Authentication (MFA) functionality
"""

import unittest
import json
import pyotp
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from app import app, db, User
import tempfile
import os


class MFATestCase(unittest.TestCase):
    def setUp(self):
        """Set up test database and client"""
        self.db_fd, self.db_path = tempfile.mkstemp()
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{self.db_path}'
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        db.create_all()
        
        # Create a test user
        self.test_user = User(
            email='test@example.com',
            name='Test User',
            tier='premium'
        )
        self.test_user.set_password('testpassword123')
        db.session.add(self.test_user)
        db.session.commit()
        
        # Login the test user to get token
        login_response = self.client.post('/api/auth/login', 
            json={
                'email': 'test@example.com',
                'password': 'testpassword123'
            })
        
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        self.access_token = login_data['token']
        self.headers = {'Authorization': f'Bearer {self.access_token}'}

    def tearDown(self):
        """Clean up after tests"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        os.close(self.db_fd)
        os.unlink(self.db_path)

    def test_mfa_setup_success(self):
        """Test successful MFA setup"""
        response = self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('secret', data)
        self.assertIn('qr_code', data)
        self.assertIn('backup_codes', data)
        self.assertIn('provisioning_uri', data)
        
        # Verify secret is valid base32
        self.assertTrue(pyotp.TOTP(data['secret']))
        
        # Verify backup codes are generated
        self.assertEqual(len(data['backup_codes']), 10)
        
        # Check user record is updated
        user = User.query.get(self.test_user.id)
        self.assertIsNotNone(user.mfa_secret)
        self.assertIsNotNone(user.backup_codes)
        self.assertFalse(user.is_mfa_enabled)  # Not enabled until verified

    def test_mfa_setup_without_auth(self):
        """Test MFA setup without authentication"""
        response = self.client.post('/api/auth/mfa/setup')
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'Token is missing')

    def test_mfa_verify_success(self):
        """Test successful MFA verification"""
        # First setup MFA
        setup_response = self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        setup_data = json.loads(setup_response.data)
        secret = setup_data['secret']
        
        # Generate TOTP token
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        # Verify MFA
        verify_response = self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': token})
        
        self.assertEqual(verify_response.status_code, 200)
        
        verify_data = json.loads(verify_response.data)
        self.assertTrue(verify_data['success'])
        
        # Check MFA is now enabled
        user = User.query.get(self.test_user.id)
        self.assertTrue(user.is_mfa_enabled)

    def test_mfa_verify_with_backup_code(self):
        """Test MFA verification with backup code"""
        # Setup MFA
        setup_response = self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        setup_data = json.loads(setup_response.data)
        backup_codes = setup_data['backup_codes']
        backup_code = backup_codes[0]
        
        # Verify with backup code
        verify_response = self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': backup_code})
        
        self.assertEqual(verify_response.status_code, 200)
        
        verify_data = json.loads(verify_response.data)
        self.assertTrue(verify_data['success'])
        self.assertIn('backup_codes_remaining', verify_data)
        self.assertEqual(verify_data['backup_codes_remaining'], 9)
        
        # Check MFA is enabled and backup code is removed
        user = User.query.get(self.test_user.id)
        self.assertTrue(user.is_mfa_enabled)
        remaining_codes = json.loads(user.backup_codes)
        self.assertEqual(len(remaining_codes), 9)
        self.assertNotIn(backup_code, remaining_codes)

    def test_mfa_verify_invalid_token(self):
        """Test MFA verification with invalid token"""
        # Setup MFA
        self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        # Try with invalid token
        verify_response = self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': '000000'})
        
        self.assertEqual(verify_response.status_code, 401)
        
        verify_data = json.loads(verify_response.data)
        self.assertEqual(verify_data['error'], 'Invalid MFA token')

    def test_mfa_verify_without_setup(self):
        """Test MFA verification without prior setup"""
        verify_response = self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': '123456'})
        
        self.assertEqual(verify_response.status_code, 400)
        
        verify_data = json.loads(verify_response.data)
        self.assertEqual(verify_data['error'], 'MFA not set up for this user')

    def test_mfa_status(self):
        """Test MFA status endpoint"""
        # Check status before setup
        status_response = self.client.get('/api/auth/mfa/status', 
            headers=self.headers)
        
        self.assertEqual(status_response.status_code, 200)
        
        status_data = json.loads(status_response.data)
        self.assertTrue(status_data['success'])
        self.assertFalse(status_data['is_mfa_enabled'])
        self.assertFalse(status_data['has_mfa_secret'])
        self.assertEqual(status_data['backup_codes_remaining'], 0)
        
        # Setup and verify MFA
        setup_response = self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        setup_data = json.loads(setup_response.data)
        secret = setup_data['secret']
        
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': token})
        
        # Check status after setup and verification
        status_response = self.client.get('/api/auth/mfa/status', 
            headers=self.headers)
        
        status_data = json.loads(status_response.data)
        self.assertTrue(status_data['success'])
        self.assertTrue(status_data['is_mfa_enabled'])
        self.assertTrue(status_data['has_mfa_secret'])
        self.assertEqual(status_data['backup_codes_remaining'], 10)

    def test_mfa_disable_success(self):
        """Test successful MFA disable"""
        # Setup and enable MFA first
        setup_response = self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        setup_data = json.loads(setup_response.data)
        secret = setup_data['secret']
        
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        self.client.post('/api/auth/mfa/verify', 
            headers=self.headers,
            json={'token': token})
        
        # Now disable MFA
        disable_response = self.client.post('/api/auth/mfa/disable', 
            headers=self.headers,
            json={'password': 'testpassword123'})
        
        self.assertEqual(disable_response.status_code, 200)
        
        disable_data = json.loads(disable_response.data)
        self.assertTrue(disable_data['success'])
        
        # Check MFA is disabled
        user = User.query.get(self.test_user.id)
        self.assertFalse(user.is_mfa_enabled)
        self.assertIsNone(user.mfa_secret)
        self.assertIsNone(user.backup_codes)

    def test_mfa_disable_wrong_password(self):
        """Test MFA disable with wrong password"""
        # Setup MFA
        self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        # Try to disable with wrong password
        disable_response = self.client.post('/api/auth/mfa/disable', 
            headers=self.headers,
            json={'password': 'wrongpassword'})
        
        self.assertEqual(disable_response.status_code, 401)
        
        disable_data = json.loads(disable_response.data)
        self.assertEqual(disable_data['error'], 'Invalid password')

    def test_mfa_token_validation(self):
        """Test MFA token format validation"""
        # Setup MFA
        self.client.post('/api/auth/mfa/setup', 
            headers=self.headers)
        
        # Test invalid token formats
        invalid_tokens = ['12345', '1234567', 'abcdef', '']
        
        for token in invalid_tokens:
            verify_response = self.client.post('/api/auth/mfa/verify', 
                headers=self.headers,
                json={'token': token})
            
            # Should still return 401 for invalid format
            self.assertIn(verify_response.status_code, [400, 401])


if __name__ == '__main__':
    unittest.main()
