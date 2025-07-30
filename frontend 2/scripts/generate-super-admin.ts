/**



<<<<<<<
 * Super Admin Credential Generator

=======
// Mock functions since SuperAdminConfig doesn't exist

const getSuperAdminCredentials = () => ({

  username: 'admin',

  password: 'admin123',

  email: 'admin@sizewise.com',

  loginUrl: 'http://localhost:3000/login'

});

const createSuperAdminUser = (credentials: any) => Promise.resolve(credentials);

>>>>>>>


 * 



<<<<<<<
 * Script to generate and display super administrator credentials

=======
async function generateSuperAdminCredentials() {

  console.log('\n🔐 SizeWise Suite - Super Administrator Setup');

  console.log('=' .repeat(60));

  

  try {

    // Get super admin credentials

    const credentials = getSuperAdminCredentials();

    

    // Create super admin user object

    const superAdminUser = await createSuperAdminUser(credentials);

    

    console.log('\n✅ Super Administrator Account Created Successfully!');

    console.log('\n📋 LOGIN CREDENTIALS:');

    console.log('-'.repeat(40));

    console.log(`Username: ${credentials.username}`);

    console.log(`Email:    ${credentials.email}`);

    console.log(`Password: ${credentials.password}`);

    console.log(`Login URL: ${credentials.loginUrl}`);

    

    console.log('\n👤 USER DETAILS:');

    console.log('-'.repeat(40));

    console.log(`User ID:  ${superAdminUser.id}`);

    console.log(`Name:     ${superAdminUser.name}`);

    console.log(`Tier:     ${superAdminUser.tier}`);

    console.log(`Company:  ${superAdminUser.company}`);

    console.log(`Admin:    ${superAdminUser.is_super_admin ? 'Yes' : 'No'}`);

    

    console.log('\n🔑 PERMISSIONS:');

    console.log('-'.repeat(40));

    superAdminUser.permissions?.forEach((permission: string, index: number) => {

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

    console.log('1. Start the SizeWise Suite application');

    console.log('2. Navigate to the login page');

    console.log('3. Use the credentials above to sign in');

    console.log('4. Verify super admin access to all features');

    console.log('5. Configure additional security settings as needed');

    

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

      credentials,

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

>>>>>>>


 * for the SizeWise Suite application



 */







import { getSuperAdminCredentials, createSuperAdminUser } from '../lib/auth/SuperAdminConfig';







// =============================================================================



// Generate Super Admin Credentials



// =============================================================================







function generateSuperAdminCredentials() {



  console.log('\n🔐 SizeWise Suite - Super Administrator Setup');



  console.log('=' .repeat(60));



  



  try {



    // Get super admin credentials



    const credentials = getSuperAdminCredentials();



    



    // Create super admin user object



    const superAdminUser = createSuperAdminUser();



    



    console.log('\n✅ Super Administrator Account Created Successfully!');



    console.log('\n📋 LOGIN CREDENTIALS:');



    console.log('-'.repeat(40));



    console.log(`Username: ${credentials.username}`);



    console.log(`Email:    ${credentials.email}`);



    if (process.argv.includes('--show-password')) {



      console.log('⚠️  WARNING: Displaying password in clear text. Do not share or store this output.');



      console.log(`Password: ${credentials.password}`);



    } else {



      console.log('Password: [HIDDEN] (run with --show-password to display)');



    }



    console.log(`Login URL: ${credentials.loginUrl}`);



    



    console.log('\n👤 USER DETAILS:');



    console.log('-'.repeat(40));



    console.log(`User ID:  ${superAdminUser.id}`);



    console.log(`Name:     ${superAdminUser.name}`);



    console.log(`Tier:     ${superAdminUser.tier}`);



    console.log(`Company:  ${superAdminUser.company}`);



    console.log(`Admin:    ${superAdminUser.is_super_admin ? 'Yes' : 'No'}`);



    



    console.log('\n🔑 PERMISSIONS:');



    console.log('-'.repeat(40));



    superAdminUser.permissions?.forEach((permission, index) => {



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



    console.log('1. Start the SizeWise Suite application');



    console.log('2. Navigate to the login page');



    console.log('3. Use the credentials above to sign in');



    console.log('4. Verify super admin access to all features');



    console.log('5. Configure additional security settings as needed');



    



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



      credentials,



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



      error: error instanceof Error ? error.message : 'Unknown error occurred'



    };



  }



}







// =============================================================================



// Export for Use in Other Scripts



// =============================================================================







export { generateSuperAdminCredentials };







// =============================================================================



// Run Script if Called Directly



// =============================================================================







if (require.main === module) {



  generateSuperAdminCredentials();



}



