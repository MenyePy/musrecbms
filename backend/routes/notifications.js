const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/auth');
const Notification = require('../models/Notification');
const webpush = require('web-push');
const User = require('../models/User');
require('dotenv').config();

// Configure web-push
webpush.setVapidDetails(
  'mailto: menyeyt@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get the VAPID public key
router.get('/vapid-public-key', (req, res) => {
    res.send(process.env.VAPID_PUBLIC_KEY);
});
  
// Get all notifications for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
try {
    const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
    res.json(notifications);
} catch (error) {
    res.status(500).json({ message: 'Server error' });
}
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
try {
    const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { read: true },
    { new: true }
    );
    res.json(notification);
} catch (error) {
    res.status(500).json({ message: 'Server error' });
}
});

// Save push subscription
router.post('/subscribe', authMiddleware, async (req, res) => {
try {
    const user = await User.findByIdAndUpdate(
    req.user.id,
    { pushSubscription: req.body },
    { new: true }
    );
    res.json({ message: 'Subscription saved' });
} catch (error) {
    res.status(500).json({ message: 'Failed to save subscription' });
}
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authMiddleware, async (req, res) => {
try {
    const user = await User.findByIdAndUpdate(
    req.user.id,
    { $unset: { pushSubscription: "" } },
    { new: true }
    );
    res.json({ message: 'Unsubscribed successfully' });
} catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe' });
}
});
  
  module.exports = router;