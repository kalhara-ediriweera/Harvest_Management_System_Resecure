const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');

// GET /api/weather?area=Colombo&lat=6.9271&lon=79.8612
router.get('/', getWeather);

module.exports = router;
