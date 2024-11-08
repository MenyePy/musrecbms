import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageSupportUsers = () => {
  const [supportUsers, setSupportUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSupportUsers();
  }, []);

  const fetchSupportUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://musrecbmsapi.vercel.app/api/auth/support-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupportUsers(response.data);
    } catch (error) {
      setError('Failed to fetch support users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://musrecbmsapi.vercel.app/api/auth/deactivate-support/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchSupportUsers(); // Refresh the list
    } catch (error) {
      setError('Failed to deactivate user');
      console.error(error);
    }
  };

  const handleReactivate = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://musrecbmsapi.vercel.app/api/auth/reactivate-support/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert(`New temporary password: ${response.data.temporaryPassword}`);
      fetchSupportUsers(); // Refresh the list
    } catch (error) {
      setError('Failed to reactivate user');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Manage Support Users</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {supportUsers.map(user => (
            <div key={user._id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeactivate(user._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleReactivate(user._id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                >
                  Reactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageSupportUsers;