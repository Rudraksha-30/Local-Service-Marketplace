const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    categories: { type: [String], default: [], index: true }, // e.g. ["plumbing", "electrical"]
    serviceArea: { type: String, trim: true, index: true }, // city / pincode for the MVP
    priceMin: { type: Number, min: 0 },
    priceMax: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true }, // FR-7: deactivate listing
    isVerified: { type: Boolean, default: false }, // FR-25: set by admin
    leaveStart: {
      type: Date,
      default: null,
    },
    leaveEnd: {
      type: Date,
      default: null,
    },

    // Denormalised trust score snapshot. It is recalculated by the trust score
    // service whenever a review/booking changes (FR-19) and stored here so that
    // listing/search pages can sort by it cheaply (NFR-2).
    trust: {
      score: { type: Number, default: 50 },
      isNewProvider: { type: Boolean, default: true },
      reviewCount: { type: Number, default: 0 },
      breakdown: { type: mongoose.Schema.Types.Mixed, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);
