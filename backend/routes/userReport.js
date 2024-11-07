const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UserReport = require('../models/UserReport');
const User = require('../models/User');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// Configure multer for file upload (similar to ticket upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/user-reports/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Create new user report
router.post(
  '/',
  authMiddleware,
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const { reportedUserId, subject, description } = req.body;
      
      // Validate that the reported user exists
      const reportedUser = await User.findById(reportedUserId);
      if (!reportedUser) {
        return res.status(404).json({ message: 'Reported user not found' });
      }

      const attachments = req.files?.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      })) || [];

      const userReport = await UserReport.create({
        reportedUser: reportedUserId,
        reportedBy: req.user.id,
        subject,
        description,
        attachments
      });

      res.status(201).json(userReport);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get all user reports (support staff only)
router.get(
  '/all',
  authMiddleware,
  roleCheck(['support']),
  async (req, res) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      
      const userReports = await UserReport.find(query)
        .populate('reportedUser', 'username email')
        .populate('reportedBy', 'username email')
        .populate('resolution.resolvedBy', 'username')
        .sort('-createdAt');
      
      res.json(userReports);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get user's own reports
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const userReports = await UserReport.find({ reportedBy: req.user.id })
      .populate('reportedUser', 'username')
      .populate('resolution.resolvedBy', 'username')
      .sort('-createdAt');
    
    res.json(userReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user report status (support staff only)
router.put(
  '/:id/status',
  authMiddleware,
  roleCheck(['support']),
  async (req, res) => {
    try {
      const { status, comment } = req.body;
      const update = {
        status,
        updatedAt: Date.now()
      };

      if (status === 'resolved') {
        update.resolution = {
          comment,
          resolvedAt: Date.now(),
          resolvedBy: req.user.id
        };
      }

      const userReport = await UserReport.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).populate('reportedUser', 'username email')
       .populate('reportedBy', 'username email')
       .populate('resolution.resolvedBy', 'username');

      if (!userReport) {
        return res.status(404).json({ message: 'User report not found' });
      } else {
        if (status === 'resolved' || status === 'under-review'){
          await createNotification({
            recipientId: userReport.reportedBy,
            title: 'Feedback on user report',
            message: `New response on user report #${userReport._id}`,
            type: 'info',
            link: `/dashboard`,
            metadata: { updateId: userReport._id }
          });
        }
      }

      res.json(userReport);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;