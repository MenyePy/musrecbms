const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const EmailService = require('../services/EmailService');
const nodemailer = require('nodemailer');
const { authMiddleware, roleCheck, sendPasswordResetEmail, resetPassword } = require('../middleware/auth');
const crypto = require('crypto');
require('dotenv').config();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nationalId, dateOfBirth } = req.body;
    
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }, { nationalId }] 
    });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Parse the date string to a Date object
    const parsedDate = new Date(dateOfBirth);
    
    const user = await User.create({
      username,
      email,
      password,
      nationalId,
      dateOfBirth: parsedDate,
      role: 'user'
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    EmailService.sendEmail(email, EmailService.getUserEmailTemplate(username));

    res.status(201).json({ token });
  } catch (error) {
    console.error('Registration error:', error); // Add this for debugging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create support staff (admin only)
router.post(
  '/create-support',
  authMiddleware,
  roleCheck(['admin']),
  async (req, res) => {
    try {
      const { username, email, password, nationalId, dateOfBirth } = req.body;
      
      const userExists = await User.findOne({ 
        $or: [{ email }, { username }, { nationalId }] 
      });
      
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        username,
        email,
        password,
        nationalId,
        dateOfBirth,
        role: 'support'
      });

      res.status(201).json({ message: 'Support staff created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update username
router.put('/profile/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    
    // Check if username is already taken
    const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the password hashing middleware
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    // Exclude the requesting user and sensitive information
    const users = await User.find({ 
      _id: { $ne: req.user.id },
      role: { $nin: ['admin', 'staff'] } 
    }).select('username email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to request a password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `http://localhost:3000/reset-password/${token}`;

  // Send email logic (use nodemailer)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `Click the link to reset your password: ${resetLink}`,
  };

  await transporter.sendMail(mailOptions);
  res.status(200).json({ message: 'Password reset email sent' });
});

// Route to reset the password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    user.password = newPassword; // Make sure to hash the password before saving
    await user.save();
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Get all support users
router.get('/support-users', 
  authMiddleware, 
  roleCheck(['admin']), 
  async (req, res) => {
    try {
      const supportUsers = await User.find({ 
        role: 'support' 
      }).select('-password');
      
      res.json(supportUsers);
    } catch (error) {
      console.error('Error fetching support users:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

// Deactivate support user
router.post('/deactivate-support/:userId',
  authMiddleware,
  roleCheck(['admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user exists and is a support user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.role !== 'support') {
        return res.status(400).json({ message: 'User is not a support staff member' });
      }

      // Generate random password (effectively deactivating the account)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user.password = randomPassword;
      await user.save();

      res.json({ message: 'Support user deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating support user:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

// Reactivate support user
router.post('/reactivate-support/:userId',
  authMiddleware,
  roleCheck(['admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user exists and is a support user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.role !== 'support') {
        return res.status(400).json({ message: 'User is not a support staff member' });
      }

      // Generate new temporary password
      const temporaryPassword = generateTemporaryPassword();
      user.password = temporaryPassword;
      await user.save();

      // Send email with temporary password
      await EmailService.sendEmail(
        user.email,
        EmailService.getPasswordResetTemplate(user.username, temporaryPassword)
      );

      res.json({ 
        message: 'Support user reactivated successfully',
        temporaryPassword // Sending back for admin to communicate if email fails
      });
    } catch (error) {
      console.error('Error reactivating support user:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to generate temporary password
function generateTemporaryPassword() {
  // Generate a password with at least one uppercase, one lowercase, one number
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  
  let password = '';
  
  // Add at least one of each required character type
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];
  
  // Add 5 more random characters
  const allChars = uppercaseChars + lowercaseChars + numberChars;
  for (let i = 0; i < 5; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = router;