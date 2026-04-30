const mongoose = require('mongoose');

/**
 * @desc  FeePolicy
 * Admin-configurable fee brackets based on years of practice experience.
 * Each bracket defines a default fee (auto-assigned at signup) and a max cap (advocate cannot exceed).
 *
 * Bracket matching: minYears <= yearsOfExperience < maxYears  (maxYears null = no upper limit)
 */
const feePolicySchema = new mongoose.Schema({
  bracketKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['1-3', '3-6', '6-11', '11+'],
    index: true
  },
  minYears: {
    type: Number,
    required: true
  },
  maxYears: {
    type: Number,
    default: null   // null = no upper bound (11+ bracket)
  },
  defaultFee: {
    type: Number,
    required: true,
    min: [1, 'Default fee must be at least ₹1']
  },
  maxFee: {
    type: Number,
    required: true,
    min: [1, 'Max fee must be at least ₹1']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'FeePolicies'
});

module.exports = mongoose.model('FeePolicy', feePolicySchema);
