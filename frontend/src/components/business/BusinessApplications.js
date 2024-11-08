import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

const BusinessApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [rentFees, setRentFees] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [adminFeedbacks, setAdminFeedbacks] = useState({});  // New state for feedback
  
  const handleError = (err) => toast.error(err, {position: "top-right"});
  const handleSuccess = (msg) => toast.success(msg, {position: "top-right"});

  useEffect(() => {
    fetchApplications();
  }, [filter, sortBy]);

  // Initialize admin feedbacks when applications are loaded
  useEffect(() => {
    const initialFeedbacks = {};
    applications.forEach(app => {
      initialFeedbacks[app._id] = app.adminFeedback || '';
    });
    setAdminFeedbacks(initialFeedbacks);
  }, [applications]);

  //init rent fees in the same manner
  useEffect(() => {
    const initialRentFees = {};
    applications.forEach(app => {
      initialRentFees[app._id] = app.rentFee || '';
    });
    setRentFees(initialRentFees);
  }, [applications]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://musrecbmsapi.vercel.app/api/business/applications',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Filter out approved applications
      let filteredData = response.data.filter(app => app.status !== 'approved');
      
      if (filter !== 'all') {
        filteredData = filteredData.filter(app => app.status === filter);
      }

      if (searchTerm) {
        filteredData = filteredData.filter(app => 
          app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      filteredData.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'location':
            return a.location.localeCompare(b.location);
          default:
            return 0;
        }
      });

      setApplications(filteredData);
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleRentFeeChange = (applicationId, value) => {
    setRentFees({
      ...rentFees,
      [applicationId]: value
    });
  };

  // New function to handle feedback changes
  const handleFeedbackChange = (applicationId, value) => {
    setAdminFeedbacks({
      ...adminFeedbacks,
      [applicationId]: value
    });
  };

  // New function to save feedback
  const handleSaveFeedback = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://musrecbmsapi.vercel.app/api/business/applications/${applicationId}/status`,
        {
          status: applications.find(app => app._id === applicationId).status,
          adminFeedback: adminFeedbacks[applicationId]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleSuccess('Feedback saved successfully');
      fetchApplications();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to save feedback');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        status,
        adminFeedback: adminFeedbacks[id]
      };

      if (status === 'approved') {
        const rentFee = parseFloat(rentFees[id]);
        if (!rentFee || rentFee <= 0) {
          handleError('Please set a valid rent fee before approving');
          return;
        }
        payload.rentFee = rentFee;
      }

      await axios.put(
        `https://musrecbmsapi.vercel.app/api/business/applications/${id}/status`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleSuccess(`Application ${status} successfully`);
      fetchApplications();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold mb-4">Business Applications</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              className="w-full p-2 border rounded-md bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="more-info-requested">More Info Requested</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              className="w-full p-2 border rounded-md bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Business Name</option>
              <option value="location">Location</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, location, or owner..."
              className="w-full p-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No applications found matching your criteria</p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application._id} className="bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{application.name}</h3>
                  <p className="text-gray-600">Location: {application.location}</p>
                  <p className="text-gray-600">
                    Applicant: {application.owner.username} ({application.owner.email})
                  </p>
                  <p className="text-gray-600">
                    Status: <span className={`font-semibold ${
                      application.status === 'approved' ? 'text-green-600' :
                      application.status === 'rejected' ? 'text-red-600' :
                      application.status === 'pending' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>{application.status}</span>
                  </p>
                  <p className="text-gray-600">
                    Submitted: {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Justification Letter:</h4>
                  <p className="bg-gray-50 p-3 rounded text-sm">{application.justificationLetter}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Monthly Rent Fee (MWK):</h4>
                <input
                  type="number"
                  className="w-full md:w-64 p-2 border rounded"
                  value={rentFees[application._id] || ''}
                  onChange={(e) => handleRentFeeChange(application._id, e.target.value)}
                  placeholder="Enter monthly rent fee..."
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  *Required for approval. Set based on location and business type.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Admin Feedback:</h4>
                <div className="flex gap-2">
                  <textarea
                    className="w-full p-2 border rounded"
                    value={adminFeedbacks[application._id] || ''}
                    onChange={(e) => handleFeedbackChange(application._id, e.target.value)}
                    placeholder="Enter feedback for the applicant..."
                    rows="3"
                  />
                  <button
                    onClick={() => handleSaveFeedback(application._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition whitespace-nowrap h-fit"
                  >
                    Save Feedback
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusUpdate(application._id, 'approved')}
                  className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition ${
                    !rentFees[application._id] ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!rentFees[application._id]}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(application._id, 'rejected')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleStatusUpdate(application._id, 'more-info-requested')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
                >
                  Request More Info
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default BusinessApplications;