// ===== TEST SIMPLE SMS (NO EMOJIS) =====
require('dotenv').config();
const { sendSMS } = require('./services/smsService');

// Test simple SMS without emojis
const testSimpleSMS = async () => {
  try {
    console.log('🧪 Testing simple SMS (no emojis)...');
    
    const phoneNumber = '+94707827148'; // Your verified number
    const message = `Hello Lasiru! Your Samba paddy cultivation has been registered successfully. Planted Date: 2025-10-23, Land Area: 5 hectares. Thank you for using GoviZen!`;
    
    console.log('📱 Sending simple SMS to:', phoneNumber);
    console.log('📝 Message:', message);
    
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      console.log('✅ Simple SMS sent successfully!');
      console.log('Message SID:', result.messageSid);
      console.log('📋 Check your phone for the message');
    } else {
      console.log('❌ Simple SMS failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testSimpleSMS();
}

module.exports = { testSimpleSMS };
