const axios = require('axios');

// Simple weather service with fallback data for Sri Lankan areas
const getWeatherData = async (lat, lon, areaName) => {
  try {
    // For demo purposes, we'll use a mock weather service
    // In production, you would use a real weather API like OpenWeatherMap
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate realistic weather data based on area
    const weatherData = generateMockWeatherData(areaName, lat, lon);
    
    return {
      success: true,
      data: weatherData
    };
  } catch (error) {
    console.error('Weather service error:', error);
    return {
      success: false,
      error: error.message,
      data: generateMockWeatherData(areaName, lat, lon) // Fallback data
    };
  }
};

// Generate mock weather data based on Sri Lankan climate patterns
const generateMockWeatherData = (areaName, lat, lon) => {
  // Base temperature varies by latitude (north is warmer)
  const baseTemp = 25 + (9.5 - lat) * 2; // Warmer in north
  
  // Add some randomness
  const tempVariation = (Math.random() - 0.5) * 8; // ±4°C variation
  const temperature = Math.round(baseTemp + tempVariation);
  
  // Humidity varies by region
  const humidity = Math.round(65 + Math.random() * 25); // 65-90%
  
  // Wind speed
  const windSpeed = Math.round(2 + Math.random() * 8); // 2-10 m/s
  
  // Weather conditions based on Sri Lankan climate
  const conditions = [
    'Partly cloudy', 'Sunny', 'Light rain', 'Overcast', 
    'Scattered clouds', 'Clear sky', 'Light drizzle'
  ];
  const description = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    temperature,
    description,
    humidity,
    windSpeed,
    area: areaName,
    coordinates: { lat, lon },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getWeatherData
};
