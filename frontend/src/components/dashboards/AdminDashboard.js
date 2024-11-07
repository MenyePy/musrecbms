import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';

const AdminDashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableLocations, setAvailableLocations] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableLocations();
  }, [sortBy]);

  const fetchAvailableLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/locations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableLocations(response.data.filter(location => location.available).length);
    } catch (error) {
      console.error('Failed to fetch available locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all required data in parallel
      const [businessesRes, ticketsRes, usersRes, revenueRes, unpaidRes] = await Promise.all([
        axios.get('http://localhost:5000/api/business/applications', { headers }),
        axios.get('http://localhost:5000/api/tickets/unanswered-count', { headers }),
        axios.get('http://localhost:5000/api/auth/support-users', { headers }),
        axios.get('http://localhost:5000/api/revenue/total-revenue', { headers }),
        axios.get('http://localhost:5000/api/revenue/unpaid-businesses', { headers })
      ]);

      // Set pending applications count
      const pendingBusinesses = businessesRes.data.filter(b => b.status === 'pending' || b.status === 'more-info-requested');
      setPendingCount(pendingBusinesses.length);

      // Set unanswered tickets count
      setTicketCount(ticketsRes.data.count);

      // Set support users count
      setSupportCount(usersRes.data.length);

      // Set total revenue
      setTotalRevenue(revenueRes.data.totalRevenue);

      // Set unpaid businesses count
      setUnpaidCount(unpaidRes.data.length);

      // Process approved businesses
      let filteredData = businessesRes.data.filter(business => business.status === 'approved');
      if (searchTerm) {
        filteredData = filteredData.filter(business => 
          business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
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
          case 'rentFee':
            return b.rentFee - a.rentFee;
          default:
            return 0;
        }
      });

      // Limit to 10 businesses
      setBusinesses(filteredData.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      
      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Applications Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Pending Applications</h3>
              <div className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm">
                {pendingCount} Pending
              </div>
            </div>
            <p className="text-gray-600 mb-4">Review and process new business applications</p>
            <Link 
              to="/business-applications" 
              className="mt-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition text-center"
            >
              View Applications
            </Link>
          </div>
        </div>

        {/* Support Tickets Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Support Tickets</h3>
              <div className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-sm">
                {ticketCount} Unanswered
              </div>
            </div>
            <p className="text-gray-600 mb-4">Create new support staff accounts to handle tickets</p>
            <Link 
              to="/create-support" 
              className="mt-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition text-center"
            >
              Create Support Account
            </Link>
          </div>
        </div>

        {/* Support Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Support Staff</h3>
              <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">
                {supportCount} Active
              </div>
            </div>
            <p className="text-gray-600 mb-4">Manage support staff accounts and access</p>
            <Link 
              to="/manage-support" 
              className="mt-auto bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition text-center"
            >
              Manage Support Users
            </Link>
          </div>
        </div>

       {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Revenue</h3>
              <div className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm">
                MWK {totalRevenue.toLocaleString()}
              </div>
            </div>
            <p className="text-gray-600 mb-4">Track revenue from contracts and monthly rent</p>
            <Link 
              to="/revenue-dashboard" 
              className="mt-auto bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded transition text-center"
            >
              View Revenue Details
            </Link>
          </div>
        </div>

        {/* Unpaid Businesses Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Payment Status</h3>
              <div className="bg-orange-100 text-orange-800 py-1 px-3 rounded-full text-sm">
                {unpaidCount} Unpaid
              </div>
            </div>
            <p className="text-gray-600 mb-4">Monitor businesses with pending payments</p>
            <Link 
              to="/unpaid-businesses" 
              className="mt-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition text-center"
            >
              View Unpaid Businesses
            </Link>
          </div>
        </div>

        {/* Location Management Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Location Management</h3>
              <div className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm">
                {loading ? 'Loading...' : `${availableLocations} vacancies`}
              </div>
            </div>
            <p className="text-gray-600 mb-4">Manage and track available business locations</p>
            <Link
              to="/locations"
              className="mt-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition text-center"
            >
              Manage Locations
            </Link>
          </div>
        </div>
      </div>

      {/* Approved Businesses Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Approved Businesses</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <option value="rentFee">Rent Fee (High to Low)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, location, or owner..."
              className="w-full p-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchDashboardData();
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No approved businesses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map(business => (
              <div key={business._id} className="border rounded-lg p-4 hover:shadow-lg transition">
                <h4 className="font-semibold text-lg mb-2">{business.name}</h4>
                <p className="text-gray-600">Location: {business.location}</p>
                <p className="text-gray-600">Owner: {business.owner.username}</p>
                <p className="text-gray-600">Monthly Rent: MWK {business.rentFee.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Approved on: {new Date(business.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;