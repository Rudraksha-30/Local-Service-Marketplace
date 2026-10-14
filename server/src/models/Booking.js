const mongoose = require('mongoose');
const { STATUS } = require('../services/bookingStateMachine');

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
    address: { type: String, trim: true, maxlength: 200 },

    scheduledStart: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 480 },
    scheduledEnd: { type: Date, required: true }, // derived: start + duration

    status: { type: String, enum: Object.values(STATUS), default: STATUS.REQUESTED, index: true },

    // Audit trail + data for the booking timeline UI
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _id: false,
      },
    ],

    // Used by the trust score engine
    respondedAt: { type: Date, default: null }, // when provider accepted/rejected
    cancelledByRole: { type: String, enum: ['customer', 'provider', null], default: null },
    cancelReason: { type: String, trim: true, maxlength: 300 }, // FR-16
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
