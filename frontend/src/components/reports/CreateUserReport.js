import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

const CreateUserReport = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    reportedUserId: '',
    subject: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleError = (err) => toast.error(err, {position: "top-right"});
  const handleSuccess = (msg) => toast.success(msg, {position: "top-right"});

  // Fetch users to report
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        handleError('Failed to fetch users');
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const form = new FormData();
      form.append('reportedUserId', formData.reportedUserId);
      form.append('subject', formData.subject);
      form.append('description', formData.description);
      files.forEach(file => {
        form.append('attachments', file);
      });

      await axios.post(
        'http://localhost:5000/api/user-reports',
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      handleSuccess("User report successfully submitted");
      setTimeout(() => {navigate('/dashboard');}, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Report User</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Select User to Report</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.reportedUserId}
            onChange={(e) => setFormData({...formData, reportedUserId: e.target.value})}
            required
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Subject</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <textarea
            className="w-full p-2 border rounded h-32"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Attachments</label>
          <input
            type="file"
            className="w-full p-2 border rounded"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />
          <p className="text-sm text-gray-500 mt-1">
            Max 5 files. Allowed types: JPG, PNG, PDF, DOC, DOCX
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
    <ToastContainer />
    </>
  );
};

export default CreateUserReport;