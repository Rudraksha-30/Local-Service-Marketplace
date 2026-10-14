const mongoose = require('mongoose');

// FR-23 / FR-26: either party can dispute a booking; an admin decides the outcome.
// Only a resolved "provider_at_fault" outcome counts against the provider's trust score.
const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    outcome: { type: String, enum: ['provider_at_fault', 'customer_at_fault', 'no_fault', null], default: null },
    adminNote: { type: String, trim: true, maxlength: 500 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
