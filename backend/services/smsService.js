// ===== SMS SERVICE FOR CROP NOTIFICATIONS =====
const twilio = require('twilio');

// ===== TWILIO CONFIGURATION =====
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// ===== SMS TEMPLATES =====

// Template for crop registration confirmation SMS
const getCropRegistrationSMSTemplate = (farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate) => {
  return `Hello ${farmerName}!

Your ${paddyType} paddy cultivation has been registered successfully!

Planted Date: ${plantedDate}
Land Area: ${landArea} hectares
Fertilization Date: ${fertilizationDate}
Harvest Date: ${harvestDate}

Thank you for using GoviZen! We'll send you reminders for important dates.

- GoviZen Team`;
};

// Template for fertilization reminder SMS
const getFertilizationReminderSMSTemplate = (farmerName, paddyType, fertilizationDate) => {
  return `Hello ${farmerName}!

Fertilization reminder for your ${paddyType} crop:
Date: ${fertilizationDate}

Please prepare your fertilizers and apply them on the scheduled date for optimal growth.

- GoviZen Team`;
};

// Template for harvest reminder SMS
const getHarvestReminderSMSTemplate = (farmerName, paddyType, harvestDate) => {
  return `Hello ${farmerName}!

Harvest reminder for your ${paddyType} crop:
Harvest Date: ${harvestDate}

Your crop is ready for harvest! Please prepare your harvesting equipment and schedule the harvest.

- GoviZen Team`;
};

// ===== SMS SENDING FUNCTIONS =====

// Send crop registration confirmation SMS
const sendCropRegistrationSMS = async (phoneNumber, farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate) => {
  try {
    // Validate phone number format (should be in international format)
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in international format (e.g., +94712345678)');
    }

    const message = getCropRegistrationSMSTemplate(farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate);
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('✅ Crop registration SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('❌ Error sending crop registration SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send fertilization reminder SMS
const sendFertilizationReminderSMS = async (phoneNumber, farmerName, paddyType, fertilizationDate) => {
  try {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in international format (e.g., +94712345678)');
    }

    const message = getFertilizationReminderSMSTemplate(farmerName, paddyType, fertilizationDate);
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('✅ Fertilization reminder SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('❌ Error sending fertilization reminder SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send harvest reminder SMS
const sendHarvestReminderSMS = async (phoneNumber, farmerName, paddyType, harvestDate) => {
  try {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in international format (e.g., +94712345678)');
    }

    const message = getHarvestReminderSMSTemplate(farmerName, paddyType, harvestDate);
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('✅ Harvest reminder SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('❌ Error sending harvest reminder SMS:', error);
    return { success: false, error: error.message };
  }
};

// Generic SMS sending function
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in international format (e.g., +94712345678)');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('✅ SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports = {
  sendCropRegistrationSMS,
  sendFertilizationReminderSMS,
  sendHarvestReminderSMS,
  sendSMS
};
