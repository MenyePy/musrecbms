import React, { useState } from 'react';
import axios from 'axios';
import {ToastContainer, toast} from 'react-toastify';

const CreateSupport = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nationalId: '',
    dateOfBirth: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/create-support',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success("Support account created successfully");
      setFormData({
        username: '',
        email: '',
        password: '',
        nationalId: '',
        dateOfBirth: ''
      });
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to create support account');
    }
  };

  return (
    <>
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Support Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Username</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">E-mail</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">National ID</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Date of Birth</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Create Support Account
        </button>
      </form>
    </div>
    <ToastContainer />
    </>
  );
};

export default CreateSupport;