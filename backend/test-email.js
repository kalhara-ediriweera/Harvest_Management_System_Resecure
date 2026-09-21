// ===== EMAIL FUNCTIONALITY TEST SCRIPT =====
require('dotenv').config();
const { sendCropRegistrationEmail } = require('./services/emailService');

// ===== TEST EMAIL FUNCTIONALITY =====
const testEmailFunctionality = async () => {
  console.log('🧪 Testing email functionality...');
  
  // Test data
  const testData = {
    farmerEmail: 'test@example.com', // Replace with your test email
    farmerName: 'Test Farmer',
    paddyType: 'Nadu',
    plantedDate: '2024-01-15',
    landArea: '2.5',
    fertilizationDate: '2024-01-30',
    harvestDate: '2024-04-15'
  };

  try {
    console.log('📧 Sending test email...');
    const result = await sendCropRegistrationEmail(
      testData.farmerEmail,
      testData.farmerName,
      testData.paddyType,
      testData.plantedDate,
      testData.landArea,
      testData.fertilizationDate,
      testData.harvestDate
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Test email failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error during email test:', error);
  }
};

// ===== CHECK ENVIRONMENT VARIABLES =====
const checkEnvironmentVariables = () => {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('📝 Please create a .env file with the following variables:');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    return false;
  }

  return true;
};

// ===== MAIN TEST FUNCTION =====
const runTests = async () => {
  console.log('🚀 Starting email functionality tests...\n');
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    console.log('\n❌ Environment setup incomplete. Please configure email settings first.');
    return;
  }

  console.log('\n📧 Environment variables configured correctly!');
  
  // Test email functionality
  await testEmailFunctionality();
  
  console.log('\n🏁 Email tests completed!');
  console.log('📝 Check your email inbox for the test message.');
  console.log('💡 If you don\'t receive the email, check your spam folder.');
};

// ===== RUN TESTS =====
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEmailFunctionality, checkEnvironmentVariables };
