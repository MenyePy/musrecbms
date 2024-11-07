// frontend/src/components/revenue/RevenueDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/revenue/total-revenue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenueData(response.data);
    } catch (err) {
      setError('Failed to fetch revenue data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Revenue Dashboard</h2>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            MWK {revenueData.totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contract Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">
            MWK {revenueData.breakdown.contractRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Month Rent</h3>
          <p className="text-3xl font-bold text-purple-600">
            MWK {revenueData.breakdown.lastMonthRentRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Revenue Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Revenue Breakdown</h4>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Contracts</span>
                <span className="font-medium">
                  MWK {revenueData.breakdown.contractRevenue.toLocaleString()}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Total Rent</span>
                <span className="font-medium">
                  MWK {revenueData.breakdown.totalRentRevenue.toLocaleString()}
                </span>
              </li>
              <li className="flex justify-between border-t pt-2">
                <span className="font-medium">Total</span>
                <span className="font-bold text-green-600">
                  MWK {revenueData.totalRevenue.toLocaleString()}
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Last Month Performance</h4>
            <p className="text-gray-600">
              Rent Revenue: MWK {revenueData.breakdown.lastMonthRentRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;