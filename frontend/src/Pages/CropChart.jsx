import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend,
  Cell, ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0A3D62', '#123B6D', '#1B4F72', '#21618C', '#2874A6', '#2E86C1'];

const CropChart = () => {
  const { currentUser } = useAuth();
  const [cropData, setCropData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [showMainExportDropdown, setShowMainExportDropdown] = useState(false);
  const [showBarChartExportDropdown, setShowBarChartExportDropdown] = useState(false);
  const [showPieChartExportDropdown, setShowPieChartExportDropdown] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchCrops();
    }
  }, [timeRange, currentUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.export-dropdown')) {
        setShowMainExportDropdown(false);
        setShowBarChartExportDropdown(false);
        setShowPieChartExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // For farmers, don't use scope=all to get only their crops
      // For admins, use scope=all to get all crops
      const isAdmin = currentUser && currentUser.role === 'admin';
      const scopeParam = isAdmin ? '&scope=all' : '';
      
      const response = await axios.get(`http://localhost:5000/crops?range=${timeRange}${scopeParam}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCropData(response.data.crops);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const processChartData = () => {
    const landAreaData = cropData.reduce((acc, crop) => {
      const existing = acc.find(item => item.paddyType === crop.paddyType);
      if (existing) {
        existing.landArea += parseFloat(crop.landArea);
      } else {
        acc.push({ 
          paddyType: crop.paddyType, 
          landArea: parseFloat(crop.landArea),
          count: 1
        });
      }
      return acc;
    }, []);

    const cropCountData = cropData.reduce((acc, crop) => {
      const existing = acc.find(item => item.paddyType === crop.paddyType);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ paddyType: crop.paddyType, count: 1 });
      }
      return acc;
    }, []);

    return { landAreaData, cropCountData };
  };

  const { landAreaData, cropCountData } = processChartData();

  const handleExport = (format) => {
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'excel') {
      exportToExcel();
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Paddy Type,Land Area (acres),Count\n";
    
    // Add data rows
    landAreaData.forEach(item => {
      csvContent += `${item.paddyType},${item.landArea},${item.count}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const isAdmin = currentUser && currentUser.role === 'admin';
    const filename = isAdmin ? "crop_analytics.csv" : `my_crop_analytics_${currentUser?.name || 'farmer'}.csv`;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(landAreaData);
    const workbook = XLSX.utils.book_new();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const sheetName = isAdmin ? "Crop Analytics" : "My Crop Analytics";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = isAdmin ? "crop_analytics.xlsx" : `my_crop_analytics_${currentUser?.name || 'farmer'}.xlsx`;
    saveAs(data, filename);
  };

  return (
    <motion.div
      className="min-h-screen p-6 flex flex-col items-center bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dashboard Header */}
      <div className="w-full max-w-7xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {currentUser && currentUser.role === 'admin' 
                ? 'Crop Analytics Dashboard' 
                : 'My Crop Analytics'
              }
            </h1>
            <p className="text-gray-600">
              {currentUser && currentUser.role === 'admin' 
                ? 'Visual insights into all agricultural operations' 
                : `Visual insights into ${currentUser?.name || 'your'} agricultural operations`
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
            
            <button 
              onClick={fetchCrops}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm hover:bg-gray-50 transition"
              disabled={loading}
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className="relative export-dropdown">
              <button 
                onClick={() => setShowMainExportDropdown(!showMainExportDropdown)}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm hover:bg-gray-50 transition"
              >
                <FiDownload size={16} />
                Export
              </button>
              {showMainExportDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      setShowMainExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    Export as CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('excel');
                      setShowMainExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  >
                    Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">
            {currentUser && currentUser.role === 'admin' ? 'Total Crop Types' : 'My Crop Types'}
          </h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {landAreaData.length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">
            {currentUser && currentUser.role === 'admin' ? 'Total Land Area' : 'My Total Land Area'}
          </h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {landAreaData.reduce((sum, item) => sum + item.landArea, 0).toFixed(2)} acres
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">
            {currentUser && currentUser.role === 'admin' ? 'Total Crops Tracked' : 'My Crops Tracked'}
          </h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {cropData.length}
          </p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full max-w-7xl space-y-8">
        {/* Bar Chart Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentUser && currentUser.role === 'admin' ? 'Land Area Distribution' : 'My Land Area Distribution'}
            </h2>
            <div className="relative export-dropdown">
              <button 
                onClick={() => setShowBarChartExportDropdown(!showBarChartExportDropdown)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              >
                <FiDownload size={14} />
                Export
              </button>
              {showBarChartExportDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      setShowBarChartExportDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('excel');
                      setShowBarChartExportDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-96">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading data...</div>
              </div>
            ) : landAreaData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-400">No data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={landAreaData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="paddyType"
                    angle={-30}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Area (acres)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fontSize: 12 
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} acres`, 'Land Area']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="landArea" 
                    name="Land Area (acres)"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="landArea" 
                      position="top" 
                      formatter={(value) => `${value} ac`}
                    />
                    {landAreaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentUser && currentUser.role === 'admin' ? 'Crop Type Distribution' : 'My Crop Type Distribution'}
            </h2>
            <div className="relative export-dropdown">
              <button 
                onClick={() => setShowPieChartExportDropdown(!showPieChartExportDropdown)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
              >
                <FiDownload size={14} />
                Export
              </button>
              {showPieChartExportDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      setShowPieChartExportDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('excel');
                      setShowPieChartExportDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-96">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading data...</div>
              </div>
            ) : cropCountData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-400">No data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropCountData}
                    dataKey="count"
                    nameKey="paddyType"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {cropCountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} crops (${(props.payload.percent * 100).toFixed(1)}%)`,
                      props.payload.payload.paddyType
                    ]}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CropChart;