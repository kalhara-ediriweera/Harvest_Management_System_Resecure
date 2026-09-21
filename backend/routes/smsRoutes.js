// ===== SMS ROUTES FOR CROP NOTIFICATIONS =====
const express = require('express');
const router = express.Router();

const smsController = require('../controllers/smsController');
const { protect } = require('../middlewares/auth');

// ===== SMS ROUTES =====

// Send crop registration SMS
router.post('/send-crop-registration', protect, smsController.sendCropRegistration);

// Send fertilization reminder SMS
router.post('/send-fertilization-reminder', protect, smsController.sendFertilizationReminder);

// Send harvest reminder SMS
router.post('/send-harvest-reminder', protect, smsController.sendHarvestReminder);

// Send generic SMS
router.post('/send-sms', protect, smsController.sendGenericSMS);

module.exports = router;
