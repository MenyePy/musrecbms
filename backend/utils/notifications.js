const Notification = require('../models/Notification');
const User = require('../models/User');
const webpush = require('web-push');

const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'info',
  link = null,
  metadata = {}
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
      metadata
    });

    // Get user's push subscription
    const user = await User.findById(recipientId);
    if (user.pushSubscription) {
      // Send push notification
      const pushPayload = {
        title,
        body: message,
        icon: '/icon.png',
        badge: '/badge.png',
        data: {
          url: link,
          notificationId: notification._id.toString()
        }
      };

      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(pushPayload)
      );
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

module.exports = { createNotification };