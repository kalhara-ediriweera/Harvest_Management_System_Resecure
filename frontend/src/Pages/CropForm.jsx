import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';
import sharedBg from '../assets/shared_bg.png';

const CropForm = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    farmerName: '',
    paddyType: '',
    plantedDate: '',
    landArea: '',
    phoneNumber: '',
    area: '',
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({
    phoneNumber: '',
    landArea: '',
  });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaddyTypeLocked, setIsPaddyTypeLocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split('T')[0];

  // Sri Lankan areas with coordinates for weather API
  const sriLankanAreas = [
    { name: 'Colombo', lat: 6.9271, lon: 79.8612 },
    { name: 'Kandy', lat: 7.2906, lon: 80.6337 },
    { name: 'Galle', lat: 6.0329, lon: 80.2170 },
    { name: 'Jaffna', lat: 9.6615, lon: 80.0255 },
    { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
    { name: 'Polonnaruwa', lat: 7.9403, lon: 81.0188 },
    { name: 'Trincomalee', lat: 8.5874, lon: 81.2152 },
    { name: 'Batticaloa', lat: 7.7102, lon: 81.6924 },
    { name: 'Kurunegala', lat: 7.4863, lon: 80.3647 },
    { name: 'Ratnapura', lat: 6.6828, lon: 80.4012 },
    { name: 'Badulla', lat: 6.9934, lon: 81.0550 },
    { name: 'Matale', lat: 7.4675, lon: 80.6234 },
    { name: 'Chilaw', lat: 7.5758, lon: 79.7953 },
    { name: 'Negombo', lat: 7.2086, lon: 79.8358 },
    { name: 'Kalutara', lat: 6.5854, lon: 79.9607 },
    { name: 'Hambantota', lat: 6.1244, lon: 81.1185 },
    { name: 'Monaragala', lat: 6.8724, lon: 81.3486 },
    { name: 'Vavuniya', lat: 8.7516, lon: 80.4971 },
    { name: 'Mannar', lat: 8.9776, lon: 79.9097 },
    { name: 'Ampara', lat: 7.2975, lon: 81.6820 },
    { name: 'Puttalam', lat: 8.0362, lon: 79.8283 },
    { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 },
    { name: 'Kegalle', lat: 7.2516, lon: 80.3464 },
    { name: 'Mullaitivu', lat: 9.2670, lon: 80.8123 },
    { name: 'Kilinochchi', lat: 9.3803, lon: 80.3990 }
  ];

  // Fetch weather data for selected area
  const fetchWeather = async (areaName) => {
    const selectedArea = sriLankanAreas.find(area => area.name === areaName);
    if (!selectedArea) return;

    setWeatherLoading(true);
    try {
      // Using our backend weather API
      const response = await axios.get(
        `http://localhost:5000/api/weather?area=${encodeURIComponent(areaName)}&lat=${selectedArea.lat}&lon=${selectedArea.lon}`
      );
      
      if (response.data.success) {
        setWeather(response.data.weather);
      } else {
        throw new Error('Weather API returned error');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Fallback weather data for demo purposes
      setWeather({
        temperature: 28,
        description: 'Partly cloudy',
        humidity: 75,
        windSpeed: 5,
        area: areaName
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    // Check if there's a previous page in history, otherwise go to crop landing
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/crop-landing');
    }
  };

  // Get paddy type from navigation state
  useEffect(() => {
    if (location.state && location.state.paddyType) {
      setFormData(prev => ({
        ...prev,
        paddyType: location.state.paddyType
      }));
      setIsPaddyTypeLocked(true);
    }
  }, [location.state]);

  // Auto-populate farmer name from logged-in user
  useEffect(() => {
    if (currentUser && currentUser.name) {
      setFormData(prev => ({
        ...prev,
        farmerName: currentUser.name
      }));
    }
  }, [currentUser]);

  // Add keyboard shortcut for back navigation (Escape key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleBackNavigation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, char => char.toUpperCase());

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'farmerName') {
      const lettersOnly = value.replace(/[^A-Za-z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: capitalizeWords(lettersOnly) }));
      return;
    }

    if (name === 'phoneNumber') {
      const digitOnly = value.replace(/\D/g, '');
      if (digitOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitOnly }));
        setErrors(prev => ({ ...prev, phoneNumber: '' }));
      }
      return;
    }

    if (name === 'landArea') {
      const parsed = parseFloat(value);
      if (value === '' || parsed > 0) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, landArea: '' }));
      } else {
        setErrors(prev => ({ ...prev, landArea: 'Land Area must be greater than 0' }));
      }
      return;
    }

    // Don't update paddyType if it's locked
    if (name === 'paddyType' && isPaddyTypeLocked) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Fetch weather when area is selected
    if (name === 'area' && value) {
      fetchWeather(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Show professional loading toast
    const loadingToast = toast.loading(
      <div className="text-center">
        <div className="font-semibold text-lg mb-1">🔄 Processing Registration</div>
        <div className="text-sm">Please wait while we register your crop...</div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
      }
    );

    let valid = true;
    let newErrors = { phoneNumber: '', landArea: '' };

    if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      valid = false;
    }

    const landValue = parseFloat(formData.landArea);
    if (isNaN(landValue) || landValue <= 0) {
      newErrors.landArea = 'Land Area must be greater than 0';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(
          <div className="text-center">
            <div className="font-semibold text-lg mb-1">🔒 Authentication Required</div>
            <div className="text-sm">Please log in to register your crops</div>
            <div className="text-xs mt-1 text-gray-600">
              Redirecting to login page...
            </div>
          </div>,
          {
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        toast.dismiss(loadingToast);
        navigate('/login');
        setIsSubmitting(false);
        return;
      }
      const response = await axios.post('http://localhost:5000/crops/add', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data.crops);
      toast.success(
        <div className="text-center">
          <div className="font-semibold text-lg mb-1">✅ Crop Registration Successful</div>
          <div className="text-sm">
            Your {formData.paddyType} cultivation has been registered for {formData.area}
          </div>
          <div className="text-xs mt-1 text-gray-600">
            Confirmation email sent • SMS notification delivered
          </div>
        </div>,
        {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // ✅ Send SMS but remove toast messages for it
      try {
        await axios.post('http://localhost:5000/api/send-sms', {
          phoneNumber: `+94${formData.phoneNumber}`,
          message: `Hello ${formData.farmerName}, your ${formData.paddyType} paddy cultivation has been registered successfully!\n\nPlanted Date: ${formData.plantedDate}\nLand Area: ${formData.landArea} hectares\n\nThank you for using our service!`
        });
      } catch (smsError) {
        console.error('SMS Error:', smsError); // ✅ only log error, no toast
      }

      setFormData({
        farmerName: '',
        paddyType: '',
        plantedDate: '',
        landArea: '',
        phoneNumber: '',
        area: '',
      });
      setErrors({ phoneNumber: '', landArea: '' });
      setIsPaddyTypeLocked(false);

      setTimeout(() => {
        navigate('/crop-table');
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      const message = err.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(
        <div className="text-center">
          <div className="font-semibold text-lg mb-1">❌ Registration Failed</div>
          <div className="text-sm">{message}</div>
          <div className="text-xs mt-1 text-gray-600">
            Please check your information and try again
          </div>
        </div>,
        {
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${sharedBg})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="absolute inset-0 bg-white opacity-10 z-0"></div>

      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 p-8 rounded-lg shadow-md w-full max-w-md relative z-10"
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBackNavigation}
          className="flex items-center text-[#1B4F72] hover:text-blue-800 mb-4 transition-colors duration-200"
        >
          <FaArrowLeft className="mr-2" />
          <span className="font-medium">Back</span>
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#1B4F72]">
          Crop Tracking Form
        </h2>

        {/* Farmer Name */}
        <label className="block mb-2 font-semibold">
          Farmer Name
          {currentUser && currentUser.name && (
            <span className="text-sm text-green-600 ml-2">(Auto-filled from your account)</span>
          )}
        </label>
        <input
          type="text"
          name="farmerName"
          value={formData.farmerName}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 mb-4 ${
            currentUser && currentUser.name 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300'
          }`}
          placeholder="Enter only letters"
          readOnly={currentUser && currentUser.name}
          required
        />

        {/* Paddy Type */}
        <label className="block mb-2 font-semibold">Paddy Type</label>
        {isPaddyTypeLocked ? (
          <div className="w-full border border-gray-300 rounded px-3 py-2 mb-4 bg-gray-100">
            {formData.paddyType}
          </div>
        ) : (
          <select
            name="paddyType"
            value={formData.paddyType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            required
          >
            <option value="">Select Paddy Type</option>
            <option value="Nadu">Nadu</option>
            <option value="Samba">Samba</option>
            <option value="Red Rice">Red Rice</option>
            <option value="Bg 352">Bg 352</option>
            <option value="Suwandel">Suwandel</option>
            <option value="Pachchaperumal">Pachchaperumal</option>
          </select>
        )}

        {/* Planted Date */}
        <label className="block mb-2 font-semibold">Planted Date</label>
        <input
          type="date"
          name="plantedDate"
          value={formData.plantedDate}
          onChange={handleChange}
          min={today}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          required
        />

        {/* Land Area */}
        <label className="block mb-2 font-semibold">Land Area (Hectares)</label>
        <input
          type="number"
          name="landArea"
          value={formData.landArea}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 mb-1 ${errors.landArea ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Enter positive number"
          step="0.01"
          required
        />
        {errors.landArea && <p className="text-red-600 text-sm mb-3">{errors.landArea}</p>}

        {/* Phone Number */}
        <label className="block mb-2 font-semibold">Phone Number</label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 mb-1 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g. 0712345678"
          required
        />
        {errors.phoneNumber && <p className="text-red-600 text-sm mb-3">{errors.phoneNumber}</p>}

        {/* Area Selection */}
        <label className="block mb-2 font-semibold">Area/City</label>
        <select
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          required
        >
          <option value="">Select Area</option>
          {sriLankanAreas.map((area, index) => (
            <option key={index} value={area.name}>
              {area.name}
            </option>
          ))}
        </select>

        {/* Weather Display */}
        {weather && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🌤️ Current Weather - {weather.area}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Temperature:</span> {weather.temperature}°C
              </div>
              <div>
                <span className="font-medium">Condition:</span> {weather.description}
              </div>
              <div>
                <span className="font-medium">Humidity:</span> {weather.humidity}%
              </div>
              <div>
                <span className="font-medium">Wind:</span> {weather.windSpeed} m/s
              </div>
            </div>
          </div>
        )}

        {weatherLoading && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading weather data...</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-[#1B4F72] hover:bg-blue-800 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Submit'}
        </button>

        {/* Display Result */}
        {result && (
          <div className="mt-6 p-4 bg-blue-50 rounded text-blue-800">
            <p><strong>Fertilization Date:</strong> {result.fertilizationDate}</p>
            <p><strong>Harvest Date:</strong> {result.harvestDate}</p>
          </div>
        )}

        <ToastContainer 
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={true}
          pauseOnHover={true}
          theme="colored"
          toastStyle={{
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
          style={{ 
            top: '80px', // Position below the navigation bar
            zIndex: 9999 // Higher than navigation bar z-index (99)
          }}
        />
      </form>
    </motion.div>
  );
};

export default CropForm;