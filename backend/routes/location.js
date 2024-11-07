const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth');
const Location = require('../models/location');
const Business = require('../models/Business');

// Create a new location (admin only)
router.post('/new', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { name } = req.body;
    const location = await Location.create({ name });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({ available: true });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a location (admin only)
router.delete('/:id', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check if location is in use
    if (!location.available) {
      return res.status(400).json({ message: 'Cannot delete a location that is currently in use' });
    }
    
    await location.deleteOne();
    res.status(204).send();
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for a location (user)
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location || !location.available) {
      return res.status(404).json({ message: 'Location not available' });
    }

    // Update the business application with the selected location
    const business = await Business.findOneAndUpdate(
      { owner: req.user.id, status: 'approved' },
      { location: location.name },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ message: 'No pending business application found' });
    }

    // Mark the location as unavailable
    location.available = false;
    await location.save();

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;