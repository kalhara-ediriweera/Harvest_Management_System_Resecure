// ===== CHECK SMS DELIVERY STATUS =====
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.log('❌ Twilio credentials not found in environment variables');
  console.log('Please check your .env file has:');
  console.log('TWILIO_ACCOUNT_SID=your-account-sid');
  console.log('TWILIO_AUTH_TOKEN=your-auth-token');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Check recent SMS messages
const checkSMSStatus = async () => {
  try {
    console.log('🔍 Checking recent SMS messages...\n');
    
    // Get recent messages (last 10)
    const messages = await client.messages.list({ limit: 10 });
    
    if (messages.length === 0) {
      console.log('📭 No recent SMS messages found');
      return;
    }
    
    console.log(`📱 Found ${messages.length} recent messages:\n`);
    
    messages.forEach((message, index) => {
      console.log(`--- Message ${index + 1} ---`);
      console.log(`📞 To: ${message.to}`);
      console.log(`📞 From: ${message.from}`);
      console.log(`📅 Date: ${message.dateCreated}`);
      console.log(`📊 Status: ${message.status}`);
      console.log(`💰 Price: ${message.price || 'N/A'}`);
      console.log(`🆔 SID: ${message.sid}`);
      console.log(`📝 Body: ${message.body.substring(0, 100)}...`);
      
      // Show detailed status
      if (message.status === 'delivered') {
        console.log('✅ Status: DELIVERED');
      } else if (message.status === 'sent') {
        console.log('📤 Status: SENT (may still be delivering)');
      } else if (message.status === 'failed') {
        console.log('❌ Status: FAILED');
        console.log(`❌ Error: ${message.errorMessage || 'Unknown error'}`);
      } else if (message.status === 'undelivered') {
        console.log('❌ Status: UNDELIVERED');
        console.log(`❌ Error: ${message.errorMessage || 'Unknown error'}`);
      } else {
        console.log(`⚠️ Status: ${message.status.toUpperCase()}`);
      }
      
      console.log(''); // Empty line for readability
    });
    
    // Check account status
    console.log('🔍 Checking account status...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`💰 Account Status: ${account.status}`);
    console.log(`💰 Account Type: ${account.type}`);
    
    // Check if account is trial
    if (account.type === 'Trial') {
      console.log('\n⚠️  IMPORTANT: You are using a Twilio TRIAL account!');
      console.log('📋 Trial restrictions:');
      console.log('   - Can only send SMS to VERIFIED phone numbers');
      console.log('   - Must verify recipient numbers in Twilio Console');
      console.log('   - Go to: Phone Numbers → Manage → Verified Caller IDs');
      console.log('   - Add your phone number: +940707827148');
    }
    
  } catch (error) {
    console.error('❌ Error checking SMS status:', error.message);
  }
};

// Check verified caller IDs
const checkVerifiedNumbers = async () => {
  try {
    console.log('\n🔍 Checking verified caller IDs...');
    
    const verifiedNumbers = await client.outgoingCallerIds.list();
    
    if (verifiedNumbers.length === 0) {
      console.log('❌ No verified caller IDs found');
      console.log('📋 To verify your number:');
      console.log('   1. Go to Twilio Console');
      console.log('   2. Phone Numbers → Manage → Verified Caller IDs');
      console.log('   3. Add your number: +940707827148');
      console.log('   4. Enter the verification code you receive');
    } else {
      console.log(`✅ Found ${verifiedNumbers.length} verified numbers:`);
      verifiedNumbers.forEach((number, index) => {
        console.log(`   ${index + 1}. ${number.phoneNumber} (${number.friendlyName})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking verified numbers:', error.message);
  }
};

// Main function
const main = async () => {
  console.log('🔍 Twilio SMS Status Checker\n');
  
  await checkSMSStatus();
  await checkVerifiedNumbers();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If using Trial account: Verify your phone number in Twilio Console');
  console.log('2. Check Twilio Console → Monitor → Logs for detailed error messages');
  console.log('3. Ensure you have sufficient credits in your Twilio account');
  console.log('4. Try sending SMS to a different phone number to test');
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { checkSMSStatus, checkVerifiedNumbers };
