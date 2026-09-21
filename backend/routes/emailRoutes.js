// ===== EMAIL ROUTES FOR CROP REMINDERS =====
const express = require('express');
const { 
  sendCropRegistration, 
  sendFertilizationReminder, 
  sendHarvestReminder, 
  testEmail 
} = require('../controllers/emailController');

const router = express.Router();

// ===== EMAIL ROUTES =====

// Send crop registration confirmation email
router.post('/crop-registration', sendCropRegistration);

// Send fertilization reminder email
router.post('/fertilization-reminder', sendFertilizationReminder);

// Send harvest reminder email
router.post('/harvest-reminder', sendHarvestReminder);

// Test email functionality
router.post('/test', testEmail);

module.exports = router;
