// Simple test script for weather functionality
const axios = require('axios');

const testWeatherAPI = async () => {
  try {
    console.log('🌤️ Testing Weather API...\n');
    
    // Test weather API with different areas
    const testAreas = [
      { area: 'Colombo', lat: 6.9271, lon: 79.8612 },
      { area: 'Kandy', lat: 7.2906, lon: 80.6337 },
      { area: 'Galle', lat: 6.0329, lon: 80.2170 }
    ];
    
    for (const testArea of testAreas) {
      console.log(`📍 Testing weather for ${testArea.area}...`);
      
      try {
        const response = await axios.get(
          `http://localhost:5000/api/weather?area=${encodeURIComponent(testArea.area)}&lat=${testArea.lat}&lon=${testArea.lon}`
        );
        
        if (response.data.success) {
          const weather = response.data.weather;
          console.log(`✅ ${testArea.area}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%`);
        } else {
          console.log(`❌ ${testArea.area}: API returned error`);
        }
      } catch (error) {
        console.log(`❌ ${testArea.area}: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Weather API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testWeatherAPI();
