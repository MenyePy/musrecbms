import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const handleError = (err) => toast.error(err, { position: "top-right" });
  const handleSuccess = (msg) => toast.success(msg, { position: "top-right" });
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.BACKEND_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      const profileRes = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      setUser(profileRes.data);
      setTimeout(() => { navigate('/dashboard'); }, 1000);
    } catch (error) {
      handleError(error.response?.data?.message || 'Login failed');
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt('Enter your email address for password reset:');
    if (email) {
      try {
        await axios.post(`${process.env.BACKEND_URL}/api/auth/forgot-password`, { email });
        toast.success('Password reset email sent');
      } catch (error) {
        handleError(error.response?.data?.message || 'Error sending password reset email');
      }
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-20 h-20" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={handleForgotPassword} className="text-blue-500 underline">
            Forgot Password?
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Login;