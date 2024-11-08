import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

const BusinessRegistration = () => {
  const handleError = (err) => toast.error(err, { position: 'top-right' });
  const handleSuccess = (msg) => toast.success(msg, { position: 'top-right' });
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    justificationLetter: '',
    file: null
  });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('justificationLetter', formData.justificationLetter);
      formDataToSend.append('file', formData.file);

      await axios.post('https://musrecbmsapi.vercel.app/api/business/register', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      handleSuccess('Business registered successfully');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      handleError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  return (
    <>
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Register Business</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Business Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Business Location</label>
            {loading ? (
              <div className="flex justify-center items-center h-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <select
                className="w-full p-2 border rounded"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Letter of Justification</label>
            <textarea
              className="w-full p-2 border rounded h-32"
              value={formData.justificationLetter}
              onChange={(e) =>
                setFormData({ ...formData, justificationLetter: e.target.value })
              }
              required
              placeholder="Please explain why you want to register this business..."
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Business Documents</label>
            <input
              type="file"
              className="w-full p-2 border rounded"
              onChange={handleFileChange}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Submit Application
          </button>
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default BusinessRegistration;