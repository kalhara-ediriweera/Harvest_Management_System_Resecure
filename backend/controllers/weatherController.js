const { getWeatherData } = require('../services/weatherService');

// Get weather data for a specific area
const getWeather = async (req, res) => {
  try {
    const { area, lat, lon } = req.query;
    
    if (!area) {
      return res.status(400).json({ 
        success: false, 
        message: 'Area name is required' 
      });
    }
    
    // Use provided coordinates or default to Colombo if not provided
    const latitude = parseFloat(lat) || 6.9271;
    const longitude = parseFloat(lon) || 79.8612;
    
    const weatherResult = await getWeatherData(latitude, longitude, area);
    
    if (weatherResult.success) {
      res.json({
        success: true,
        weather: weatherResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data',
        weather: weatherResult.data // Return fallback data
      });
    }
  } catch (error) {
    console.error('Weather controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getWeather
};
