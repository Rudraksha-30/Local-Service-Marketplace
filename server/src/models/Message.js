const mongoose = require('mongoose');

// FR-22: one chat thread per booking. Messages belong to a booking and are only visible to its two parties.
const messageSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
