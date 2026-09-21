// StockTable.jsx
import React, { useMemo, useState } from 'react';
import StockModal from './StockModal';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaEdit, FaTrash, FaFilePdf, FaFilter } from 'react-icons/fa';

// ⬇️ Get the logged-in user (id comes from your AuthProvider)
import { useAuth } from '../../contexts/AuthContext'; // <-- adjust path if needed

/** ---------------- axios instance that sends the JWT ---------------- */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** ---------------- PDF helpers (kept same styling) ---------------- */
const addHeader = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(26, 81, 46);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFillColor(245, 197, 66);
  doc.circle(20, 17, 8, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.circle(20, 17, 8, 'S');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('HE', 20, 20, { align: 'center' });

  doc.setFontSize(22);
  doc.text('HarvestEase', 35, 17);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Stock Inventory Report', 35, 25);

  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  doc.text(`Generated: ${today}`, pageWidth - 15, 20, { align: 'right' });
};

const addFooter = (doc, pageNumber, totalPages) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('HarvestEase Farm Management System', 15, pageHeight - 15);
  doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 15, pageHeight - 15, { align: 'right' });
};

const StockTable = ({ stocks = [], setStocks }) => {
  const { currentUser } = useAuth(); // <- comes from your AuthProvider
  const currentUserId = currentUser?._id || currentUser?.id || null;

  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('farmerName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [cropTypeFilter, setCropTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null });

  /** ---------------- ONLY show my records ----------------
   * Backend model uses `farmerId` (String) as the owner.
   * Some APIs may populate it to an object with _id; handle both.
   */
  const getOwnerId = (s) => {
    if (!s) return null;
    const v = s.farmerId;
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v._id) return v._id;
    return null;
  };

  const isMine = (s) => {
    if (!currentUserId) return false; // not logged in: show nothing
    const ownerId = getOwnerId(s);
    if (!ownerId) return false;
    return String(ownerId) === String(currentUserId);
  };

  /** ---------- Sort + Search applied on "my" records ---------- */
  const getFilteredAndSortedStocks = () => {
    // 1) only my stocks
    let result = stocks.filter(isMine);

    // 2) search & crop filter
    result = result.filter((stock) => {
      const matchesSearch =
        (stock.farmerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stock.cropType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stock.variety || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(stock.quantity ?? '').includes(searchQuery) ||
        String(stock.price ?? '').includes(searchQuery);

      const matchesCropType = cropTypeFilter === 'all' || stock.cropType === cropTypeFilter;
      return matchesSearch && matchesCropType;
    });

    // 3) sort
    result.sort((a, b) => {
      if (['quantity', 'price'].includes(sortField)) {
        return sortDirection === 'asc'
          ? (a[sortField] || 0) - (b[sortField] || 0)
          : (b[sortField] || 0) - (a[sortField] || 0);
      }
      const av = (a[sortField] || '').toString();
      const bv = (b[sortField] || '').toString();
      return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return result;
  };

  const filteredStocks = getFilteredAndSortedStocks();

  // Build crop type list from **my** stocks only
  const cropTypes = useMemo(
    () => ['all', ...new Set(stocks.filter(isMine).map(s => s.cropType).filter(Boolean))],
    [stocks, currentUserId]
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const initiateDelete = (id) => setDeleteConfirmation({ show: true, id });

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await api.delete(`/delete-stock/${deleteConfirmation.id}`);
      if (response.status === 200) {
        // re-fetch; when you add protect+scoping this will already be filtered server-side
        const updatedStocks = await api.get('/get-stocks');
        setStocks(updatedStocks.data);
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    } finally {
      setIsLoading(false);
      setDeleteConfirmation({ show: false, id: null });
    }
  };

  const cancelDelete = () => setDeleteConfirmation({ show: false, id: null });

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (stock) => {
    setSelectedStock(stock);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleStockUpdate = async (updatedStock) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/update-stock/${updatedStock._id}`, updatedStock);
      if (response.status === 200) {
        const refreshResponse = await api.get('/get-stocks');
        setStocks(refreshResponse.data);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /** ---------------- PDF: unchanged except uses filteredStocks ---------------- */
  const generatePDF = () => {
    setIsLoading(true);
    try {
      const data = filteredStocks;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      addHeader(doc);

      const addTableHeader = (doc, yPosition) => {
        doc.setFillColor(240, 246, 240);
        doc.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
        doc.setDrawColor(26, 81, 46);
        doc.setLineWidth(0.1);
        doc.rect(15, yPosition - 5, pageWidth - 30, 10, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 81, 46);
        doc.text('Farmer Name', 20, yPosition);
        doc.text('Crop Type', 75, yPosition);
        doc.text('Variety', 115, yPosition);
        doc.text('Quantity', 155, yPosition);
        doc.text('Price (Rs)', 182, yPosition);
      };

      const addSummary = (doc, rows) => {
        const yPos = 60;
        const totalItems = rows.length;
        const totalQuantity = rows.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const totalValue = rows.reduce((sum, s) => sum + ((s.price || 0) * (s.quantity || 0)), 0);
        const uniqueFarmers = new Set(rows.map(s => s.farmerName)).size;
        const uniqueVarieties = new Set(rows.map(s => s.variety)).size;

        doc.setFillColor(247, 250, 247);
        doc.setDrawColor(26, 81, 46);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, yPos - 10, pageWidth - 30, 30, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(26, 81, 46);
        doc.text('Inventory Summary', 20, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Total Items: ${totalItems}`, 20, yPos + 10);
        doc.text(`Total Quantity: ${totalQuantity} units`, 80, yPos + 10);
        doc.text(`Total Value: Rs. ${totalValue.toLocaleString()}`, 150, yPos + 10);
        doc.text(`Unique Farmers: ${uniqueFarmers}`, 20, yPos + 18);
        doc.text(`Unique Varieties: ${uniqueVarieties}`, 80, yPos + 18);
      };

      addSummary(doc, data);

      let yPosition = 100;
      let currentPage = 1;

      addTableHeader(doc, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      data.forEach((stock, index) => {
        if (yPosition > pageHeight - 35) {
          addFooter(doc, currentPage, Math.ceil(data.length / 25) + 1);
          doc.addPage();
          currentPage++;
          addHeader(doc);
          yPosition = 50;
          addTableHeader(doc, yPosition);
          yPosition += 10;
        }

        if (index % 2 === 1) {
          doc.setFillColor(247, 250, 247);
          doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        }

        doc.text((stock.farmerName || '').substring(0, 22), 20, yPosition);
        doc.text(stock.cropType || '', 75, yPosition);
        doc.text((stock.variety || '').substring(0, 15), 115, yPosition);
        doc.text(`${stock.quantity} ${stock.quantityUnit || ''}`, 155, yPosition);
        doc.text(`${(stock.price ?? 0).toLocaleString()}`, 182, yPosition);

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(15, yPosition + 3, pageWidth - 15, yPosition + 3);

        yPosition += 8;
      });

      addFooter(doc, currentPage, Math.ceil(data.length / 25) + 1);
      doc.save(`HarvestEase-Stock-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsLoading(false);
    }
  };

  const generateSingleStockPDF = (stock) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      addHeader(doc);
      const yPos = 50;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(26, 81, 46);
      doc.text('Stock Item Details', pageWidth / 2, yPos, { align: 'center' });

      doc.setFillColor(247, 250, 247);
      doc.setDrawColor(26, 81, 46);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPos + 10, pageWidth - 40, 120, 3, 3, 'FD');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 81, 46);
      doc.text(stock.variety || '', pageWidth / 2, yPos + 30, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Crop Type: ${stock.cropType || ''}`, pageWidth / 2, yPos + 40, { align: 'center' });

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(40, yPos + 50, pageWidth - 40, yPos + 50);

      const startY = yPos + 60;
      const leftX = 40;
      const rightX = pageWidth / 2 + 10;
      const lineHeight = 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Farmer Name:', leftX, startY);
      doc.text('Quantity:', leftX, startY + lineHeight * 1);
      doc.text('Price per Unit:', leftX, startY + lineHeight * 2);
      doc.text('Total Value:', leftX, startY + lineHeight * 3);
      doc.text('Added Date:', rightX, startY);
      doc.text('Location:', rightX, startY + lineHeight * 1);
      doc.text('Contact:', rightX, startY + lineHeight * 2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(stock.farmerName || '', leftX + 30, startY);
      doc.text(`${stock.quantity ?? 0} ${stock.quantityUnit || ''}`, leftX + 30, startY + lineHeight * 1);
      doc.text(`Rs. ${(stock.price ?? 0).toLocaleString()}`, leftX + 30, startY + lineHeight * 2);
      doc.text(`Rs. ${(((stock.price ?? 0) * (stock.quantity ?? 0)) || 0).toLocaleString()}`, leftX + 30, startY + lineHeight * 3);
      doc.text(new Date(stock.createdAt || new Date()).toLocaleDateString(), rightX + 30, startY);
      doc.text(stock.storageLocation || 'Not specified', rightX + 30, startY + lineHeight * 1);
      doc.text(stock.farmerEmail || 'Not available', rightX + 30, startY + lineHeight * 2);

      addFooter(doc, 1, 1);
      const tail = (stock._id || '').slice(-5);
      doc.save(`HarvestEase-Stock-${stock.variety || 'item'}-${tail}.pdf`);
    } catch (error) {
      console.error('Error generating single stock PDF:', error);
    }
  };

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <motion.div
      className="p-6 max-w-[1200px] mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Stock Inventory</h2>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-md">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my stocks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition duration-200"
            >
              <FaFilter className="text-green-600" />
              <span>Filter by Crop Type</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg">
                {cropTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCropTypeFilter(type);
                      setShowFilterDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                      cropTypeFilter === type ? 'bg-green-100 font-medium' : ''
                    }`}
                  >
                    {type === 'all' ? 'All Crops' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={generatePDF}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
          >
            <FaFilePdf />
            <span>{isLoading ? 'Generating...' : 'Export to PDF'}</span>
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <span className="font-medium">{filteredStocks.length}</span>
        <span className="text-gray-600"> of your stocks</span>
        {cropTypeFilter !== 'all' && (
          <span className="text-gray-600"> filtered by <span className="font-medium">{cropTypeFilter}</span></span>
        )}
        {searchQuery && (
          <span className="text-gray-600"> matching "<span className="font-medium">{searchQuery}</span>"</span>
        )}
        {!currentUserId && (
          <span className="ml-2 text-red-600"> (no logged-in user found)</span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th onClick={() => handleSort('farmerName')} className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:bg-green-600 transition duration-200">
                    <div className="flex items-center space-x-1">
                      <span>Farmer Name</span>
                      <span>{renderSortArrow('farmerName')}</span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('cropType')} className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:bg-green-600 transition duration-200">
                    <div className="flex items-center space-x-1">
                      <span>Crop Type</span>
                      <span>{renderSortArrow('cropType')}</span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('variety')} className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:bg-green-600 transition duration-200">
                    <div className="flex items-center space-x-1">
                      <span>Variety</span>
                      <span>{renderSortArrow('variety')}</span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('quantity')} className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:bg-green-600 transition duration-200">
                    <div className="flex items-center space-x-1">
                      <span>Quantity</span>
                      <span>{renderSortArrow('quantity')}</span>
                    </div>
                  </th>
                  <th onClick={() => handleSort('price')} className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:bg-green-600 transition duration-200">
                    <div className="flex items-center space-x-1">
                      <span>Price (Rs)</span>
                      <span>{renderSortArrow('price')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock, index) => (
                  <motion.tr
                    key={stock._id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.farmerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{stock.cropType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{stock.variety}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="font-medium">{stock.quantity}</span> {stock.quantityUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="font-medium">Rs. {stock.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 space-x-1">
                      <button
                        onClick={() => handleView(stock)}
                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200 inline-flex items-center"
                        title="View details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(stock)}
                        className="bg-amber-500 text-white p-2 rounded hover:bg-amber-600 transition duration-200 inline-flex items-center"
                        title="Edit stock"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => generateSingleStockPDF(stock)}
                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 inline-flex items-center"
                        title="Download PDF"
                      >
                        <FaFilePdf />
                      </button>
                      <button
                        onClick={() => initiateDelete(stock._id)}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition duration-200 inline-flex items-center"
                        title="Delete stock"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              {currentUserId ? 'No stocks found for your account' : 'Please log in to view your stocks'}
            </div>
            <div className="text-sm text-gray-500">
              {searchQuery || cropTypeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add some stocks to get started'}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <StockModal
            stock={selectedStock}
            isEditing={isEditing}
            setStocks={setStocks}
            closeModal={() => setShowModal(false)}
            onSave={handleStockUpdate}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmation.show && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this stock item? This action cannot be undone.</p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 flex items-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash size={14} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StockTable;
