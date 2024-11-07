const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Contract = require('../models/Contract');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// Register a new business
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { name, location, justificationLetter } = req.body;
    
    // Check if user already has a business application
    const existingBusiness = await Business.findOne({ owner: req.user.id });
    if (existingBusiness) {
      return res.status(400).json({ 
        message: 'You already have a business application' 
      });
    }

    const business = await Business.create({
      name,
      location,
      justificationLetter,
      owner: req.user.id
    });

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all business applications (admin only)
router.get(
  '/applications',
  authMiddleware,
  roleCheck(['admin']),
  async (req, res) => {
    try {
      const applications = await Business.find()
        .populate('owner', 'username email')
        .sort('-createdAt');
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get user's business application
router.get('/my-application', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.user.id });
    if (!business) {
      return res.status(404).json({ message: 'No business application found' });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/edit/:id', authMiddleware, async (req, res) => {
  try {
    const { name, location, justificationLetter } = req.body;
    const business = await Business.findOne({ 
      _id: req.params.id,
      owner: req.user.id 
    });

    if (!business) {
      return res.status(404).json({ message: 'Business application not found' });
    }

    // If the status was 'more-info-requested', reset it to 'pending'
    const newStatus = business.status === 'more-info-requested' || 'approved' ? 'pending' : business.status;
    
    // Reset admin feedback if status was 'more-info-requested'
    const newAdminFeedback = business.status === 'more-info-requested' || 'approved' ? '' : business.adminFeedback;

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        justificationLetter,
        status: newStatus,
        adminFeedback: newAdminFeedback,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json(updatedBusiness);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update business application status (admin only)
router.put('/applications/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, adminFeedback, rentFee } = req.body;
    
    // Validate rent fee when approving
    if (status === 'approved') {
      if (!rentFee || rentFee <= 0) {
        return res.status(400).json({ message: 'Valid rent fee is required for approval' });
      }
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    business.status = status;
    business.adminFeedback = adminFeedback;
    if (status === 'approved') {
      business.rentFee = rentFee;
    }

    if (await business.save()){
      await createNotification({
        recipientId: application.userId,
        title: 'Application Approved',
        message: 'Your business application has been approved!',
        type: 'success',
        link: '/dashboard',
        metadata: { applicationId: application._id }
      });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:businessId/contract', authMiddleware, async (req, res) => {
  try {
    const contract = await Contract.findOne({
      business: req.params.businessId,
      status: 'paid'
    }).sort({ createdAt: -1 });
    
    if (!contract) {
      return res.status(404).json({ message: 'No active contract found' });
    }
    
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;