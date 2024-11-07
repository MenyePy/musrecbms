// routes/payments.js
const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Rent = require('../models/Rent');
const Business = require('../models/Business');
const { authMiddleware } = require('../middleware/auth');

// Simulate payment processing
const processPayment = async (amount) => {
  // Simulate payment gateway processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, transactionId: Math.random().toString(36).substring(7) });
    }, 1000);
  });
};

// Pay contract fee
router.post('/contract/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id,
      status: 'approved'
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found or not approved' });
    }

    let contract = await Contract.findOne({ business: business._id });
    
    if (!contract) {
      contract = await Contract.create({
        business: business._id,
        owner: req.user.id
      });
    } else if (contract.status === 'paid') {
      return res.status(400).json({ message: 'Contract already paid' });
    }

    // Process payment
    const payment = await processPayment(contract.amount);
    
    if (payment.success) {
      contract.status = 'paid';
      contract.paymentDate = new Date();
      contract.expiry = contract.paymentDate.setFullYear(contract.paymentDate.getFullYear() + 1);
      await contract.save();
      res.json({ message: 'Contract payment successful', contract });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pay monthly rent
router.post('/rent/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id,
      status: 'approved'
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found or not approved' });
    }

    // Check if contract is paid
    const contract = await Contract.findOne({ 
      business: business._id,
      status: 'paid'
    });

    if (!contract) {
      return res.status(400).json({ message: 'Contract must be paid first' });
    }

    // Calculate current month's rent period
    const currentDate = new Date();
    const rentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const rentAmount = business.rentFee;

    let rent = await Rent.findOne({
      business: business._id,
      month: rentMonth
    });

    if (!rent) {
      let rent = await Rent.create({
        business: business._id,
        owner: req.user.id,
        month: rentMonth,
        amount: rentAmount // Use the custom rent fee
      });
    } else if (rent.status === 'paid') {
      return res.status(400).json({ message: 'Rent already paid for this month' });
    }

    // Process payment
    const payment = await processPayment(rent.amount);
    
    if (payment.success) {
      rent.status = 'paid';
      rent.paymentDate = new Date();
      await rent.save();
      res.json({ message: 'Rent payment successful', rent });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment status
router.get('/status/:businessId', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ 
      _id: req.params.businessId,
      owner: req.user.id
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const contract = await Contract.findOne({ business: business._id });
    const currentDate = new Date();
    const rentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const rent = await Rent.findOne({ 
      business: business._id,
      month: rentMonth
    });

    res.json({
      contract: contract || { status: 'pending' },
      rent: rent || { status: 'pending' },
      rentMonth: rentMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;