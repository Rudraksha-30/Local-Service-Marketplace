/**
 * Database-facing half of the trust score feature.
 *
 * trustScore.js (pure maths)  <--  this file gathers the numbers from MongoDB
 *                                  and saves the result on the provider profile.
 *
 * Splitting it this way is what makes the formula unit-testable without a database.
 */

const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const ProviderProfile = require('../models/ProviderProfile');
const { STATUS } = require('./bookingStateMachine');
const { calculateTrustScore } = require('./trustScore');

/** Collect the raw numbers the formula needs for one provider (a User id). */
async function gatherStats(providerUserId) {
  const [completedCount, providerCancelledCount, respondedBookings, reviews, providerFaultDisputes] =
    await Promise.all([
      Booking.countDocuments({ provider: providerUserId, status: STATUS.COMPLETED }),
      Booking.countDocuments({
        provider: providerUserId,
        status: STATUS.CANCELLED,
        cancelledByRole: 'provider',
        respondedAt: { $ne: null }, // only cancellations AFTER they accepted count against them
      }),
      Booking.find({ provider: providerUserId, respondedAt: { $ne: null } }).select('createdAt respondedAt'),
      Review.find({ provider: providerUserId }).select('rating createdAt'),
      // FR-26: only disputes an admin resolved against the provider count
      Dispute.countDocuments({ against: providerUserId, status: 'resolved', outcome: 'provider_at_fault' }),
    ]);

  let avgResponseMinutes = null;
  if (respondedBookings.length > 0) {
    const totalMs = respondedBookings.reduce((sum, b) => sum + (b.respondedAt - b.createdAt), 0);
    avgResponseMinutes = totalMs / respondedBookings.length / 60000;
  }

  return {
    completedCount,
    providerCancelledCount,
    providerFaultDisputes,
    avgResponseMinutes,
    reviews: reviews.map((r) => ({ rating: r.rating, createdAt: r.createdAt })),
  };
}

/** Recalculate and persist. Called after a review is saved, a booking changes, or a dispute is resolved. */
async function recalculateForProvider(providerUserId) {
  const stats = await gatherStats(providerUserId);
  const result = calculateTrustScore(stats);

  await ProviderProfile.findOneAndUpdate(
    { user: providerUserId },
    {
      trust: {
        score: result.score,
        isNewProvider: result.isNewProvider,
        reviewCount: result.reviewCount,
        breakdown: result.breakdown,
        updatedAt: new Date(),
      },
    }
  );
  return result;
}

module.exports = { gatherStats, recalculateForProvider };
