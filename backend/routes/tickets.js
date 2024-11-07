const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ticket = require('../models/Ticket');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');


// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
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

// Create new ticket
router.post(
  '/',
  authMiddleware,
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const { subject, body } = req.body;
      
      const attachments = req.files?.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      })) || [];

      const ticket = await Ticket.create({
        subject,
        body,
        attachments,
        user: req.user.id
      });

      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all tickets (support staff only)
router.get(
  '/all',
  authMiddleware,
  roleCheck(['support']),
  async (req, res) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      
      const tickets = await Ticket.find(query)
        .populate('user', 'username email')
        .populate('assignedTo', 'username')
        .populate('resolution.resolvedBy', 'username')
        .sort('-createdAt');
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get user's tickets
router.get('/my-tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate('assignedTo', 'username')
      .populate('resolution.resolvedBy', 'username')
      .sort('-createdAt');
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ticket status (support staff only)
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

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).populate('user', 'username email')
       .populate('assignedTo', 'username')
       .populate('resolution.resolvedBy', 'username');

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      } else {
        if (ticket.status === 'resolved' || ticket.status ==='in-progress'){
          await createNotification({
            recipientId: ticket.user._id,
            title: 'Ticket Updated',
            message: `Your ticket #${ticket._id} has been updated`,
            type: 'info',
            link: `/dashboard`,
            metadata: { ticketId: ticket._id }
          });
        }
      }

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Assign ticket (support staff only)
router.put(
  '/:id/assign',
  authMiddleware,
  roleCheck(['support']),
  async (req, res) => {
    try {
      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        {
          assignedTo: req.user.id,
          status: 'in-progress',
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('user', 'username email')
       .populate('assignedTo', 'username');

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/unanswered-count',
  authMiddleware,
  roleCheck(['admin', 'support']),
  async (req, res) => {
    try {
      const count = await Ticket.countDocuments({ 
        status: 'pending',
      });
      
      res.json({ count });
    } catch (error) {
      console.error('Error counting unanswered tickets:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;