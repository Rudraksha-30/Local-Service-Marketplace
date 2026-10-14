const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const { notify, adminIds } = require('../services/notify');

const DISPUTABLE = ['accepted', 'in_progress', 'completed', 'cancelled'];

// FR-23: either party can dispute a booking
exports.create = async (req, res) => {
  const { bookingId, reason } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const uid = req.user._id.toString();
  const isCustomer = booking.customer.toString() === uid;
  const isProvider = booking.provider.toString() === uid;
  if (!isCustomer && !isProvider) {
    return res.status(403).json({ message: 'You can only dispute your own bookings' });
  }
  if (!DISPUTABLE.includes(booking.status)) {
    return res.status(409).json({ message: `A "${booking.status}" booking cannot be disputed` });
  }
  if (await Dispute.exists({ booking: booking._id, status: 'open' })) {
    return res.status(409).json({ message: 'This booking already has an open dispute' });
  }

  const against = isCustomer ? booking.provider : booking.customer;
  const dispute = await Dispute.create({ booking: booking._id, raisedBy: req.user._id, against, reason });

  // FR-24: notify admins and the other party
  await notify(await adminIds(), 'dispute', `${req.user.name} raised a dispute on a ${booking.category} booking`, '/admin');
  await notify(against, 'dispute', `${req.user.name} raised a dispute on your ${booking.category} booking`, `/bookings/${booking._id}`);

  res.status(201).json({ dispute });
};

// Disputes on one booking (both parties can see them)
exports.listForBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const uid = req.user._id.toString();
  const isParty = [booking.customer, booking.provider].some((id) => id.toString() === uid);
  if (!isParty && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to view these disputes' });
  }
  const disputes = await Dispute.find({ booking: booking._id })
    .sort({ createdAt: -1 })
    .populate('raisedBy', 'name');
  res.json({ disputes });
};
