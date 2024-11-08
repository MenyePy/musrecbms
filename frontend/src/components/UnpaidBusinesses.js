// frontend/src/components/business/UnpaidBusinesses.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UnpaidBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'contract', 'rent'

  useEffect(() => {
    fetchUnpaidBusinesses();
  }, []);

  const fetchUnpaidBusinesses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://musrecbmsapi.vercel.app/api/revenue/unpaid-businesses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(response.data);
    } catch (err) {
      setError('Failed to fetch unpaid businesses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    if (filter === 'contract') return business.paymentIssues.contractUnpaid;
    if (filter === 'rent') return business.paymentIssues.rentOverdue;
    return true;
  });

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
      <h2 className="text-2xl font-bold mb-6">Unpaid Businesses</h2>

      {/* Filter Controls */}
      <div className="mb-6">
        <select
          className="p-2 border rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Issues</option>
          <option value="contract">Contract Unpaid</option>
          <option value="rent">Rent Overdue</option>
        </select>
      </div>

      {/* Businesses List */}
      <div className="grid gap-6">
        {filteredBusinesses.map(business => (
          <div 
            key={business._id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{business.name}</h3>
                <p className="text-gray-600">Location: {business.location}</p>
                <p className="text-gray-600">Owner: {business.owner.username}</p>
              </div>
              <div className="flex gap-2">
                {business.paymentIssues.contractUnpaid && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    Contract Unpaid
                  </span>
                )}
                {business.paymentIssues.rentOverdue && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    Rent Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Payment Details</h4>
              {business.paymentIssues.contractUnpaid && (
                <p className="text-gray-700">
                  Contract Amount Due: MWK {business.paymentIssues.contractAmount?.toLocaleString() || 'N/A'}
                </p>
              )}
              {business.paymentIssues.rentOverdue && (
                <>
                  <p className="text-gray-700">
                    Rent Amount Due: MWK {business.paymentIssues.rentAmount?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    Due Date: {new Date(business.paymentIssues.lastRentDueDate).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No unpaid businesses found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnpaidBusinesses;