const Booking = require('../models/Booking');
const Review = require('../models/Review');
const ProviderProfile = require('../models/ProviderProfile');
const { STATUS } = require('../services/bookingStateMachine');
const { recalculateForProvider } = require('../services/trustScore.service');
const { notify } = require('../services/notify');

// FR-17, FR-18, FR-19
exports.createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only review your own bookings' });
  }
  if (booking.status !== STATUS.COMPLETED) {
    return res.status(409).json({ message: 'You can only review a completed booking' });
  }
  if (await Review.exists({ booking: booking._id })) {
    return res.status(409).json({ message: 'You have already reviewed this booking' });
  }

  // The unique index on Review.booking is the safety net if two requests race past the check above
  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    provider: booking.provider,
    rating,
    comment,
  });

  const trust = await recalculateForProvider(booking.provider);
  await notify(
    booking.provider,
    'review',
    `${req.user.name} left you a ${rating}-star review. Your trust score is now ${trust.score}.`,
    `/bookings/${booking._id}`
  );
  res.status(201).json({ review, trust });
};

// Reviews for one provider profile, newest first
exports.listForProvider = async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.profileId);
  if (!profile) return res.status(404).json({ message: 'Provider not found' });

  const reviews = await Review.find({ provider: profile.user })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('customer', 'name');
  res.json({ reviews });
};

// The review (if any) for one booking, visible to the booking's two parties
exports.getForBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const uid = req.user._id.toString();
  if (![booking.customer, booking.provider].some((id) => id.toString() === uid)) {
    return res.status(403).json({ message: 'You do not have permission to view this review' });
  }
  const review = await Review.findOne({ booking: booking._id });
  res.json({ review });
};

exports.updateReview = async (req, res) => {
  const { rating, comment } = req.body;

  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You can only edit reviews for your own bookings',
    });
  }

  if (booking.status !== STATUS.COMPLETED) {
    return res.status(409).json({
      message: 'You can only edit a review for a completed booking',
    });
  }

  const review = await Review.findOne({ booking: booking._id });

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  review.rating = rating;
  review.comment = comment || '';
  await review.save();

  const trust = await recalculateForProvider(booking.provider);

  res.json({ review, trust });
};