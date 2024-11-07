const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  read: { type: Boolean, default: false },
  link: { type: String }, // Optional link to redirect when clicked
  createdAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed } // Optional additional data
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;