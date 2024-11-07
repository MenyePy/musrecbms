import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PaymentStatus = ({ businessId }) => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentPaymentType, setCurrentPaymentType] = useState(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const [paymentResponse, businessResponse] = await Promise.all([
        axios.get(
          `http://localhost:5000/api/payments/status/${businessId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        axios.get(
          `http://localhost:5000/api/business/my-application`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      ]);

      console.log("try");
      
      setPaymentStatus(paymentResponse.data);
      setBusinessData(businessResponse.data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Failed to fetch payment status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchStatus();
    }
  }, [fetchStatus, businessId]);

  const handleCardPayment = async (type) => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/payments/${type}/${businessId}`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Redirect to payment page
      console.log(response.data);
      window.location.href = response.data.paymentPageUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMobilePayment = async (type) => {
    try {
      if (!phoneNumber) {
        toast.error('Please enter a phone number');
        return;
      }

      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/payments/mobile/${type}/${businessId}`,
        { 
          paymentMethod: 'mobile',
          phoneNumber 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      console.log(response);
      if (response.data.success) {
        toast.success('Payment initiated. Please check your phone to complete the transaction.');
        // Poll for payment status
        setTimeout(startPollingPaymentStatus(response.data.transactionId), 10000);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
      setShowMobileInput(false);
    }
  };

  const startPollingPaymentStatus = async (orderRef) => {
    let errcount = 3; //allow three errors due to possible initial network issues
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/payments/check-status/mobile/${businessId}/${orderRef}`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        console.log(response);

        if (response.data.status === 'PURCHASED' || (response.data.status === "paid" && response.data.success)) {
          clearInterval(pollInterval);
          toast.success('Payment successful!');
          fetchStatus();
        } else if (response.transaction_status) {
          console.log(response.data.transaction_status);
          if (response.data.status === 'pending') {
            toast.warn(response.data.message);
          } else if (response.data.status === 'failed') {
            clearInterval(pollInterval);
            toast.error("Payment failed: " + response.data.message);
            fetchStatus();
          }
        }
      } catch (error) {
        if (errcount < 1) {clearInterval(pollInterval); toast.warning("Error in checking payment."); } else { errcount--; }
        console.error('Error polling payment status:', error);
      }
    }, 10000);

    // Stop polling after 5m
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 120000);
  };

  const PaymentButtons = ({ type, amount }) => (
    <div className="space-y-2">
      <button
        onClick={() => handleCardPayment(type)}
        disabled={processingPayment}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        Pay with Card ({formatCurrency(amount)})
      </button>
      <button
        onClick={() => {
          setCurrentPaymentType(type);
          setShowMobileInput(true);
        }}
        disabled={processingPayment}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        Pay with Airtel Money ({formatCurrency(amount)})
      </button>
    </div>
  );

  if (loading || !businessData) return <div>Loading payment status...</div>;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <h3 className="text-xl font-semibold mb-4">Payment Status</h3>

      {showMobileInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h4 className="font-medium mb-4">Enter Mobile Number</h4>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+265xxxxxxxxx"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleMobilePayment(currentPaymentType)}
                disabled={processingPayment}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => setShowMobileInput(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="border-b pb-4">
          <h4 className="font-medium mb-2">Contract Status</h4>
          <div className="flex justify-between items-center">
            <div>
              <span className={`px-2 py-1 rounded ${
                paymentStatus?.contract?.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paymentStatus?.contract?.status?.toUpperCase()}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Contract Fee: {formatCurrency(businessData.contractFee)}
              </p>
            </div>
            {paymentStatus?.contract?.status !== 'paid' && (
              <PaymentButtons type="contract" amount={businessData.contractFee} />
            )}
          </div>
          {paymentStatus?.contract?.paymentDate && (
            <p className="text-sm text-gray-600 mt-2">
              Paid on: {new Date(paymentStatus.contract.paymentDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2">Monthly Rent Status</h4>
          <div className="flex justify-between items-center">
            <div>
              <span className={`px-2 py-1 rounded ${
                paymentStatus?.rent?.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paymentStatus?.rent?.status?.toUpperCase()}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Monthly Rent: {formatCurrency(businessData.rentFee)}
              </p>
            </div>
            {paymentStatus?.contract?.status === 'paid' && 
             paymentStatus?.rent?.status !== 'paid' && (
              <PaymentButtons type="rent" amount={businessData.rentFee} />
            )}
          </div>
          {paymentStatus?.rent?.paymentDate && (
            <p className="text-sm text-gray-600 mt-2">
              Paid on: {new Date(paymentStatus.rent.paymentDate).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Next rent payment will be due on: {new Date(paymentStatus?.rentMonth).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;