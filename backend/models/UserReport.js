const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema({
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'resolved', 'archived'],
    default: 'pending'
  },
  resolution: {
    comment: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const UserReport = mongoose.model('UserReport', userReportSchema);
module.exports = UserReport;