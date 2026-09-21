import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CropTable from './CropTable';
import CropChart from './CropChart';

const AdminCrops = () => {
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
  };

  const handleBackToTable = () => {
    setShowAnalytics(false);
  };

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Crop Records
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Crop Analytics</h1>
            <p className="text-gray-600">Visual insights into crop distribution and land usage</p>
          </div>
          <CropChart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Crops</h1>
            <p className="text-gray-600">View all crop records and analytics</p>
          </div>
          <button
            onClick={handleViewAnalytics}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </button>
        </div>
        <CropTable hideAddButton={true} />
      </div>
    </div>
  );
};

export default AdminCrops;
