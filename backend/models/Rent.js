const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
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
    amount: {
      type: Number,
      required: true,
      default: 500 // Example monthly rent
    },
    month: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentDate: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    orderReference: String,  // For card payments
  transactionId: String,   // For mobile payments
  paymentMethod: {
    type: String,
    enum: ['card', 'mobile'],
    required: false
  }
});
  
rentSchema.index({ business: 1, month: 1 }, { unique: true });

const Rent = mongoose.model('Rent', rentSchema);

module.exports = Rent;