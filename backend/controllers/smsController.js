// ===== SMS CONTROLLER FOR CROP NOTIFICATIONS =====
const { 
  sendCropRegistrationSMS, 
  sendFertilizationReminderSMS, 
  sendHarvestReminderSMS,
  sendSMS
} = require('../services/smsService');

// ===== SEND CROP REGISTRATION SMS =====
const sendCropRegistration = async (req, res) => {
  try {
    const { 
      phoneNumber, 
      farmerName, 
      paddyType, 
      plantedDate, 
      landArea, 
      fertilizationDate, 
      harvestDate 
    } = req.body;

    // ===== VALIDATION =====
    if (!phoneNumber || !farmerName || !paddyType || !plantedDate || !landArea || !fertilizationDate || !harvestDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending crop registration SMS' 
      });
    }

    // ===== PHONE NUMBER VALIDATION =====
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use international format (e.g., +94712345678)' 
      });
    }

    // ===== SEND SMS =====
    const result = await sendCropRegistrationSMS(
      phoneNumber, 
      farmerName, 
      paddyType, 
      plantedDate, 
      landArea, 
      fertilizationDate, 
      harvestDate
    );

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Crop registration SMS sent successfully',
        messageSid: result.messageSid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send crop registration SMS',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendCropRegistration controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending SMS',
      error: error.message 
    });
  }
};

// ===== SEND FERTILIZATION REMINDER SMS =====
const sendFertilizationReminder = async (req, res) => {
  try {
    const { phoneNumber, farmerName, paddyType, fertilizationDate } = req.body;

    // ===== VALIDATION =====
    if (!phoneNumber || !farmerName || !paddyType || !fertilizationDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending fertilization reminder SMS' 
      });
    }

    // ===== PHONE NUMBER VALIDATION =====
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use international format (e.g., +94712345678)' 
      });
    }

    // ===== SEND SMS =====
    const result = await sendFertilizationReminderSMS(phoneNumber, farmerName, paddyType, fertilizationDate);

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Fertilization reminder SMS sent successfully',
        messageSid: result.messageSid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send fertilization reminder SMS',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendFertilizationReminder controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending SMS',
      error: error.message 
    });
  }
};

// ===== SEND HARVEST REMINDER SMS =====
const sendHarvestReminder = async (req, res) => {
  try {
    const { phoneNumber, farmerName, paddyType, harvestDate } = req.body;

    // ===== VALIDATION =====
    if (!phoneNumber || !farmerName || !paddyType || !harvestDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending harvest reminder SMS' 
      });
    }

    // ===== PHONE NUMBER VALIDATION =====
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneNumber.startsWith('+')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use international format (e.g., +94712345678)' 
      });
    }

    // ===== SEND SMS =====
    const result = await sendHarvestReminderSMS(phoneNumber, farmerName, paddyType, harvestDate);

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Harvest reminder SMS sent successfully',
        messageSid: result.messageSid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send harvest reminder SMS',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendHarvestReminder controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending SMS',
      error: error.message 
    });
  }
};

// ===== SEND GENERIC SMS =====
const sendGenericSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // ===== VALIDATION =====
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and message are required' 
      });
    }

    // ===== PHONE NUMBER VALIDATION =====
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use international format (e.g., +94712345678)' 
      });
    }

    // ===== MESSAGE VALIDATION =====
    if (message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    // ===== SEND SMS =====
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'SMS sent successfully',
        messageSid: result.messageSid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send SMS',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendGenericSMS controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending SMS',
      error: error.message 
    });
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports = {
  sendCropRegistration,
  sendFertilizationReminder,
  sendHarvestReminder,
  sendGenericSMS
};
