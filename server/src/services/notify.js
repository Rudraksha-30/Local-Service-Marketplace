const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create in-app notifications (FR-12, FR-24).
 * A notification failing must never break the action that caused it (a booking
 * should still succeed if the notification write hiccups), so errors are logged, not thrown.
 */
async function notify(userIds, type, message, link = '') {
  try {
    const ids = [].concat(userIds).filter(Boolean);
    if (ids.length === 0) return;
    await Notification.insertMany(ids.map((user) => ({ user, type, message, link })));
  } catch (err) {
    console.error('notify failed:', err.message);
  }
}

async function adminIds() {
  const admins = await User.find({ role: 'admin' }).select('_id');
  return admins.map((a) => a._id);
}

module.exports = { notify, adminIds };
