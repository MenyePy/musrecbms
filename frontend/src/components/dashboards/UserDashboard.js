import axios from "axios";
import TicketList from '../tickets/TicketList';
import UserReportList from '../reports/UserReportList';
import PaymentStatus from '../business/PaymentStatus';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {ToastContainer, toast} from 'react-toastify';

const UserDashboard = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    justificationLetter: ''
  });
  
  const handleError = (err) => toast.error(err, {position: "top-right", });
  const handleSuccess = (msg) => toast.success(msg, {position: "top-right",});
  
  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/business/my-application',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setApplication(response.data);
      setEditForm({
        name: response.data.name,
        location: response.data.location,
        justificationLetter: response.data.justificationLetter
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/business/edit/${application._id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleSuccess("Business application updated successfully");
      setIsEditing(false);
      fetchApplication();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to update business application');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">User Dashboard</h2>
      {application ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Business Application Status</h3>
          {!isEditing ? (
            <>
              <p className="mb-2">Business Name: {application.name}</p>
              <p className="mb-2">Location: {application.location}</p>
              <p className="mb-2">Status: <span className="font-semibold">{application.status}</span></p>
              {application.adminFeedback && (
                <div className="mt-4">
                  <h4 className="font-semibold">Admin Feedback:</h4>
                  <p className="bg-gray-50 p-3 rounded mt-2">{application.adminFeedback}</p>
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Edit Application
              </button>
            </>
          ) : (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block mb-1">Business Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Justification Letter</label>
                <textarea
                  className="w-full p-2 border rounded h-32"
                  value={editForm.justificationLetter}
                  onChange={(e) => setEditForm({...editForm, justificationLetter: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <PaymentStatus />
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4">You haven't registered a business yet.</p>
          <Link
            to="/register-business"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Register Business
          </Link>
        </div>
      )}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">My Support Tickets</h3>
          <Link
            to="/create-ticket"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create New Ticket
          </Link>
        </div>
        <TicketList userRole="user" />
      </div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">My User Reports</h3>
          <Link
            to="/create-user-report"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create New Report
          </Link>
        </div>
        <UserReportList userRole="user" />
      </div>
    </div>
    <ToastContainer />
    </>
  );
};

export default UserDashboard;