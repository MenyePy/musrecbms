// backend/routes/revenue.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth');
const Business = require('../models/Business');
const Contract = require('../models/Contract');
const Rent = require('../models/Rent');

// Get total revenue and breakdown
router.get('/total-revenue', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    // Get all contracts
    const contracts = await Contract.find({ status: 'paid' });
    const contractRevenue = contracts.reduce((sum, contract) => sum + contract.amount, 0);

    // Get rent payments from the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const rentPayments = await Rent.find({
      status: 'paid',
      paidAt: { $gte: lastMonth }
    });
    const rentRevenue = rentPayments.reduce((sum, rent) => sum + rent.amount, 0);

    // Get all-time rent revenue
    const allRentPayments = await Rent.find({ status: 'paid' });
    const totalRentRevenue = allRentPayments.reduce((sum, rent) => sum + rent.amount, 0);

    res.json({
      totalRevenue: contractRevenue + totalRentRevenue,
      breakdown: {
        contractRevenue,
        lastMonthRentRevenue: rentRevenue,
        totalRentRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unpaid businesses
router.get('/unpaid-businesses', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    // Get all approved businesses
    const businesses = await Business.find({ status: 'approved' })
      .populate('owner', 'username email')
      .lean();

    // For each business, check contract and rent status
    const unpaidBusinesses = [];
    
    for (const business of businesses) {
      const contract = await Contract.findOne({ business: business._id })
        .sort({ createdAt: -1 });
      
      const lastRent = await Rent.findOne({ business: business._id })
        .sort({ dueDate: -1 });

      const now = new Date();
      const isContractUnpaid = !contract || contract.status !== 'paid';
      const isRentOverdue = lastRent && 
        lastRent.status !== 'paid' && 
        new Date(lastRent.dueDate) < now;

      if (isContractUnpaid || isRentOverdue) {
        unpaidBusinesses.push({
          ...business,
          paymentIssues: {
            contractUnpaid: isContractUnpaid,
            rentOverdue: isRentOverdue,
            lastRentDueDate: lastRent?.dueDate,
            rentAmount: lastRent?.amount,
            contractAmount: contract?.amount
          }
        });
      }
    }

    res.json(unpaidBusinesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;