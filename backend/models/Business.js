const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  justificationLetter: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'more-info-requested'],
    default: 'pending'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminFeedback: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  rentFee: {
    type: Number,
    required: true,
    default: 0 // Will be set by admin during approval
  },
  contractFee: {
    type: Number,
    required: true,
    default: 50 // Fixed contract fee
  }
});

const Business = mongoose.model('Business', businessSchema);
module.exports = Business;