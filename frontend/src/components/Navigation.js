import React from 'react';
import NotificationBell from './NotificationBell';
import { useAuth }  from '../context/AuthContext';
import { Link } from 'react-router-dom';

//{ user, handleLogout }
const Navigation = () => {
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <nav className="bg-green-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="MUSREC BMS Logo"
            className="h-8 w-auto"
          />
          <Link to="/dashboard" className="text-xl font-bold">
            MUSREC BMS
          </Link>
        </div>
        {user ? (
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <span>Welcome, {user.username}</span>
            <Link to="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link to="/register" className="hover:text-gray-300">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;