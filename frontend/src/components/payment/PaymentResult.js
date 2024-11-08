import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get order reference and business ID from URL parameters
        const params = new URLSearchParams(location.search);
        const orderRef = params.get('order_reference');
        const businessId = params.get('business_id');

        if (!orderRef || !businessId) {
          toast.error('Invalid payment verification URL');
          navigate('/dashboard');
          return;
        }

        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://musrecbmsapi.vercel.app/api/payments/check-status/${businessId}/${orderRef}`,
          { headers: { Authorization: `Bearer ${token}` }}
        );

        if (response.data.status === 'PURCHASED') {
          setPaymentDetails(response.data);
          toast.success('Payment verified successfully!');
        } else {
          toast.error('Payment verification failed');
          navigate('/payment/failure');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Failed to verify payment');
        navigate('/payment/failure');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-gray-600">Thank you for your payment. Your transaction has been completed successfully.</p>
          
          <div className="mt-6 text-left bg-gray-50 rounded p-4">
            <h3 className="text-sm font-medium text-gray-900">Payment Details</h3>
            <dl className="mt-2 text-sm text-gray-500">
              <div className="mt-1 flex justify-between">
                <dt>Transaction ID:</dt>
                <dd className="font-medium text-gray-900">{paymentDetails?.transactionId || 'N/A'}</dd>
              </div>
              <div className="mt-1 flex justify-between">
                <dt>Date:</dt>
                <dd className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaymentFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract error message from URL if available
  const params = new URLSearchParams(location.search);
  const errorMessage = params.get('error') || 'Your payment could not be processed';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Payment Failed</h2>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
          
          <div className="mt-8 space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Return to Dashboard
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            If you continue to experience issues, please contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};