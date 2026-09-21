// ===== TEST SMS FUNCTIONALITY =====
require('dotenv').config();
const { sendCropRegistrationSMS } = require('./services/smsService');

// Test SMS sending
const testSMS = async () => {
  try {
    console.log('🧪 Testing SMS functionality...');
    
    // Test data
    const testData = {
      phoneNumber: '+94712345678', // Replace with a valid Sri Lankan phone number for testing
      farmerName: 'John Doe',
      paddyType: 'Nadu',
      plantedDate: '2024-01-15',
      landArea: '2.5',
      fertilizationDate: '2024-01-30',
      harvestDate: '2024-04-15'
    };

    console.log('📱 Sending test SMS to:', testData.phoneNumber);
    
    const result = await sendCropRegistrationSMS(
      testData.phoneNumber,
      testData.farmerName,
      testData.paddyType,
      testData.plantedDate,
      testData.landArea,
      testData.fertilizationDate,
      testData.harvestDate
    );

    if (result.success) {
      console.log('✅ SMS test successful!');
      console.log('Message SID:', result.messageSid);
    } else {
      console.log('❌ SMS test failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testSMS();
}

module.exports = { testSMS };
