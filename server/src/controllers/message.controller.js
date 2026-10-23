const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { notify } = require('../services/notify');

/** Chat is private to the two parties of a booking. */
async function loadBookingForParty(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found' });
    return null;
  }
  const uid = req.user._id.toString();
  if (![booking.customer, booking.provider].some((id) => id.toString() === uid)) {
    res.status(403).json({ message: 'This chat is only for the customer and provider of this booking' });
    return null;
  }
  return booking;
}

// FR-22
exports.list = async (req, res) => {
  const booking = await loadBookingForParty(req, res);
  if (!booking) return;

  const messages = await Message.find({
    booking: booking._id,
  })
    .sort({ createdAt: 1 })
    .limit(300)
    .populate('sender', 'name');

  res.json({ messages });
};

exports.send = async (req, res) => {
  const booking = await loadBookingForParty(req, res);
  if (!booking) return;

  const message = await Message.create({ booking: booking._id, sender: req.user._id, text: req.body.text });
  const populated = await message.populate('sender', 'name');

  // One unread "new message" notification per thread, so a busy chat doesn't flood the bell
  const recipient = booking.customer.toString() === req.user._id.toString() ? booking.provider : booking.customer;
  const link = `/bookings/${booking._id}`;
  const alreadyUnread = await Notification.exists({ user: recipient, type: 'message', link, read: false });
  if (!alreadyUnread) await notify(recipient, 'message', `New message from ${req.user.name}`, link);

  res.status(201).json({ message: populated });
};


exports.edit = async (req, res) => {
  const booking = await loadBookingForParty(req, res);
  if (!booking) return;

  const message = await Message.findOne({
    _id: req.params.messageId,
    booking: booking._id,
  });

  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You can only edit your own messages',
    });
  }

  const text = typeof req.body.text === 'string'
    ? req.body.text.trim()
    : '';

  if (!text || text.length > 1000) {
    return res.status(400).json({
      message: 'Message must be between 1 and 1000 characters',
    });
  }

  message.text = text;
  await message.save();
  await message.populate('sender', 'name');

  res.json({ message });
};

exports.remove = async (req, res) => {
  const booking = await loadBookingForParty(req, res);
  if (!booking) return;

  const message = await Message.findOne({
    _id: req.params.messageId,
    booking: booking._id,
  });

  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You can only delete your own messages',
    });
  }

  await message.deleteOne();

  res.json({ message: 'Message deleted successfully' });
};