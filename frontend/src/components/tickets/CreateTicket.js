import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

const CreateTicket = () => {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleError = (err) => toast.error(err, {position: "top-right", });
  const handleSuccess = (msg) =>toast.success(msg, {position: "top-right",});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const form = new FormData();
      form.append('subject', formData.subject);
      form.append('body', formData.body);
      files.forEach(file => {
        form.append('attachments', file);
      });

      await axios.post(
        'https://musrecbmsapi.vercel.app/api/tickets',
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      handleSuccess("Ticket successfully submitted");
      // navigate('/my-tickets'); //update my-tickets endpoint
      setTimeout(() => {navigate('/dashboard');}, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Support Ticket</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
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
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
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
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
    <ToastContainer />
    </>
  );
};

export default CreateTicket;