// ===== EMAIL CONTROLLER FOR CROP REMINDERS =====
const { 
  sendCropRegistrationEmail, 
  sendFertilizationReminderEmail, 
  sendHarvestReminderEmail 
} = require('../services/emailService');

// ===== SEND CROP REGISTRATION EMAIL =====
const sendCropRegistration = async (req, res) => {
  try {
    const { 
      farmerEmail, 
      farmerName, 
      paddyType, 
      plantedDate, 
      landArea, 
      fertilizationDate, 
      harvestDate 
    } = req.body;

    // ===== VALIDATION =====
    if (!farmerEmail || !farmerName || !paddyType || !plantedDate || !landArea || !fertilizationDate || !harvestDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending crop registration email' 
      });
    }

    // ===== EMAIL VALIDATION =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(farmerEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // ===== SEND EMAIL =====
    const result = await sendCropRegistrationEmail(
      farmerEmail, 
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
        message: 'Crop registration email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send crop registration email',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendCropRegistration controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending email',
      error: error.message 
    });
  }
};

// ===== SEND FERTILIZATION REMINDER EMAIL =====
const sendFertilizationReminder = async (req, res) => {
  try {
    const { 
      farmerEmail, 
      farmerName, 
      paddyType, 
      fertilizationDate, 
      plantedDate 
    } = req.body;

    // ===== VALIDATION =====
    if (!farmerEmail || !farmerName || !paddyType || !fertilizationDate || !plantedDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending fertilization reminder email' 
      });
    }

    // ===== EMAIL VALIDATION =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(farmerEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // ===== SEND EMAIL =====
    const result = await sendFertilizationReminderEmail(
      farmerEmail, 
      farmerName, 
      paddyType, 
      fertilizationDate, 
      plantedDate
    );

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Fertilization reminder email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send fertilization reminder email',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendFertilizationReminder controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending email',
      error: error.message 
    });
  }
};

// ===== SEND HARVEST REMINDER EMAIL =====
const sendHarvestReminder = async (req, res) => {
  try {
    const { 
      farmerEmail, 
      farmerName, 
      paddyType, 
      harvestDate, 
      plantedDate 
    } = req.body;

    // ===== VALIDATION =====
    if (!farmerEmail || !farmerName || !paddyType || !harvestDate || !plantedDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required for sending harvest reminder email' 
      });
    }

    // ===== EMAIL VALIDATION =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(farmerEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // ===== SEND EMAIL =====
    const result = await sendHarvestReminderEmail(
      farmerEmail, 
      farmerName, 
      paddyType, 
      harvestDate, 
      plantedDate
    );

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Harvest reminder email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send harvest reminder email',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in sendHarvestReminder controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending email',
      error: error.message 
    });
  }
};

// ===== TEST EMAIL FUNCTIONALITY =====
const testEmail = async (req, res) => {
  try {
    const { testEmail: email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test email address is required' 
      });
    }

    // ===== EMAIL VALIDATION =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // ===== SEND TEST EMAIL =====
    const result = await sendCropRegistrationEmail(
      email,
      'Test Farmer',
      'Nadu',
      '2024-01-15',
      '2.5',
      '2024-01-30',
      '2024-04-15'
    );

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in testEmail controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while sending test email',
      error: error.message 
    });
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports = {
  sendCropRegistration,
  sendFertilizationReminder,
  sendHarvestReminder,
  testEmail
};
