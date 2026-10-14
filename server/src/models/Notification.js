const mongoose = require('mongoose');

// FR-12 / FR-24: in-app notifications. `link` is a client route such as /bookings/<id>.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // booking | message | review | dispute | verification
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
