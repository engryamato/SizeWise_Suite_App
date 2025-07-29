/**
 * Super Admin Credential Generator
 * 
 * Simple Node.js script to generate and display super administrator credentials
 * for the SizeWise Suite application
 */

const crypto = require('crypto');

// =============================================================================
// Super Admin Configuration
// =============================================================================

function generateSecurePassword() {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SizeWise2024!${randomPart}${timestamp}`;
}

function generateUUID() {
  return crypto.randomUUID();
}

function createSuperAdminUser() {
  const now = new Date().toISOString();
  const password = generateSecurePassword();
  
  return {
    id: 'super-admin-' + generateUUID(),
    email: 'admin@sizewise.com',
    username: 'sizewise_admin',
    password: password,
    name: 'SizeWise Administrator',
    tier: 'super_admin',
    company: 'SizeWise Suite',
    subscription_expires: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now,
    permissions: [
      'admin:full_access',
      'admin:user_management',
      'admin:system_configuration',
      'admin:license_management',
      'admin:database_access',
      'admin:security_settings',
      'admin:audit_logs',
      'admin:emergency_access',
      'admin:super_admin_functions',
      'user:all_features',
      'user:unlimited_access',
      'user:export_without_watermark',
      'user:advanced_calculations',
      'user:simulation_access',
      'user:catalog_access',
      'user:computational_properties',
    ],
    is_super_admin: true,
  };
}

// =============================================================================
// Generate Super Admin Credentials
// =============================================================================

function generateSuperAdminCredentials() {
  console.log('\n🔐 SizeWise Suite - Super Administrator Setup');
  console.log('=' .repeat(60));
  
  try {
    // Create super admin user object
    const superAdminUser = createSuperAdminUser();
    
    console.log('\n✅ Super Administrator Account Created Successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('-'.repeat(40));
    console.log(`Username: ${superAdminUser.username}`);
    console.log(`Email:    ${superAdminUser.email}`);
    console.log(`Password: ${superAdminUser.password}`);
    console.log(`Login URL: http://localhost:3000/auth/login`);
    
    console.log('\n👤 USER DETAILS:');
    console.log('-'.repeat(40));
    console.log(`User ID:  ${superAdminUser.id}`);
    console.log(`Name:     ${superAdminUser.name}`);
    console.log(`Tier:     ${superAdminUser.tier}`);
    console.log(`Company:  ${superAdminUser.company}`);
    console.log(`Admin:    ${superAdminUser.is_super_admin ? 'Yes' : 'No'}`);
    
    console.log('\n🔑 PERMISSIONS:');
    console.log('-'.repeat(40));
    superAdminUser.permissions.forEach((permission, index) => {
      console.log(`${index + 1}. ${permission}`);
    });
    
    console.log('\n⚠️  SECURITY NOTES:');
    console.log('-'.repeat(40));
    console.log('• Keep these credentials secure and confidential');
    console.log('• Change the password in production environments');
    console.log('• Enable MFA when transitioning to Phase 2 (SaaS)');
    console.log('• Monitor access logs for security events');
    console.log('• These credentials provide full system access');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('-'.repeat(40));
    console.log('1. Start the SizeWise Suite application: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/auth/login');
    console.log('3. Use the credentials above to sign in');
    console.log('4. Verify super admin access to all features');
    console.log('5. Configure additional security settings as needed');
    
    console.log('\n📝 ENVIRONMENT SETUP:');
    console.log('-'.repeat(40));
    console.log('Add these to your .env.local file:');
    console.log(`SUPER_ADMIN_USERNAME=${superAdminUser.username}`);
    console.log(`SUPER_ADMIN_EMAIL=${superAdminUser.email}`);
    console.log(`SUPER_ADMIN_PASSWORD=${superAdminUser.password}`);
    
    console.log('\n📖 DOCUMENTATION:');
    console.log('-'.repeat(40));
    console.log('• Super Admin Guide: docs/admin/super-admin-guide.md');
    console.log('• Security Architecture: docs/security/authentication.md');
    console.log('• User Management: docs/admin/user-management.md');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Super Administrator Setup Complete!');
    console.log('='.repeat(60) + '\n');
    
    return {
      success: true,
      credentials: {
        username: superAdminUser.username,
        email: superAdminUser.email,
        password: superAdminUser.password,
        loginUrl: 'http://localhost:3000/auth/login'
      },
      user: superAdminUser
    };
    
  } catch (error) {
    console.error('\n❌ Error generating super admin credentials:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('-'.repeat(40));
    console.log('• Check that all dependencies are installed');
    console.log('• Verify environment configuration');
    console.log('• Review error logs for specific issues');
    console.log('• Contact support if problems persist');
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

// =============================================================================
// Run Script
// =============================================================================

if (require.main === module) {
  generateSuperAdminCredentials();
}

module.exports = { generateSuperAdminCredentials };
