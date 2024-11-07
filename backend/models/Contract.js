const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'expired'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    default: 1000 // Example contract fee
  },
  paymentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiry: {
    type: Date
  },
  orderReference: String,  // For card payments
  transactionId: String   // For mobile payments
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;