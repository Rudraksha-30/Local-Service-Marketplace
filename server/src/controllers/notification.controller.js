const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ notifications, unread });
};

// Cheap endpoint the navbar bell polls
exports.unreadCount = async (req, res) => {
  res.json({ unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
};

exports.markRead = async (req, res) => {
  // Filtering on user means nobody can mark someone else's notification
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { returnDocument: 'after' });
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  res.json({ notification: n });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ unread: 0 });
};
