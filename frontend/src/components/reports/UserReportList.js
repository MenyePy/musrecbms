import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

const UserReportList = ({ userRole }) => {
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [comments, setComments] = useState({});
  const handleError = (err) => toast.error(err, {position: "top-right"});
  const handleSuccess = (msg) => toast.success(msg, {position: "top-right"});

  useEffect(() => {
    fetchUserReports();
  }, [filter]);

  useEffect(() => {
    // Initialize comments state with existing resolution comments
    const initialComments = {};
    userReports.forEach(report => {
      initialComments[report._id] = report.resolution?.comment || '';
    });
    setComments(initialComments);
  }, [userReports]);

  const fetchUserReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = userRole === 'support' ? 
        `/api/user-reports/all${filter !== 'all' ? `?status=${filter}` : ''}` : 
        '/api/user-reports/my-reports';
      
      const response = await axios.get(
        `https://musrecbmsapi.vercel.app${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUserReports(response.data);
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to fetch user reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (reportId, comment) => {
    setComments(prev => ({
      ...prev,
      [reportId]: comment
    }));
  };

  const handleSaveComment = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://musrecbmsapi.vercel.app/api/user-reports/${reportId}/status`,
        { 
          status: userReports.find(r => r._id === reportId).status,
          comment: comments[reportId]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleSuccess("Comment saved successfully");
      fetchUserReports();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to save comment');
    }
  };

  const handleStatusUpdate = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://musrecbmsapi.vercel.app/api/user-reports/${reportId}/status`,
        { 
          status, 
          comment: comments[reportId]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchUserReports();
      handleSuccess("Report status updated successfully");
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to update report');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {userRole === 'support' ? 'User Reports' : 'My Reports'}
        </h2>
        {userRole === 'support' && (
          <select
            className="p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="under-review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        )}
      </div>
      <div className="grid gap-6">
        {userReports.map((report) => (
          <div key={report._id} className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{report.subject}</h3>
              <p className="text-gray-600">
                Status: <span className="font-semibold">{report.status}</span>
              </p>
              {userRole === 'support' && (
                <>
                  <p className="text-gray-600">
                    Reported User: {report.reportedUser.username} ({report.reportedUser.email})
                  </p>
                  <p className="text-gray-600">
                    Reported By: {report.reportedBy.username} ({report.reportedBy.email})
                  </p>
                </>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Description:</h4>
              <p className="bg-gray-50 p-3 rounded">{report.description}</p>
            </div>
            {report.attachments?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Attachments:</h4>
                <div className="flex flex-wrap gap-2">
                  {report.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={`http://localhost:5000/${attachment.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {attachment.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {userRole === 'support' && report.status !== 'archived' && (
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block mb-2">Resolution Comment:</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Add a comment..."
                    value={comments[report._id] || ''}
                    onChange={(e) => handleCommentChange(report._id, e.target.value)}
                  />
                  <button
                    onClick={() => handleSaveComment(report._id)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Save Comment
                  </button>
                </div>
                <div className="flex gap-2">
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(report._id, 'resolved')}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  {report.status === 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(report._id, 'archived')}
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {userReports.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No reports found.
        </div>
      )}
    </div>
    </>
  );
};

export default UserReportList;