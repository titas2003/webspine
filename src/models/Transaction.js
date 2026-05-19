const mongoose = require('mongoose');

/**
 * @desc  Transaction
 * Acts as an immutable ledger for all financial movements across the platform.
 */
const transactionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // One transaction per completed appointment
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amountPaidByClient: {
    type: Number,
    required: true
  },
  platformFeeCollected: {
    type: Number,
    required: true
  },
  advocateEarnings: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'refunded'],
    default: 'success'
  }
}, {
  timestamps: true,
  collection: 'Transactions'
});

module.exports = mongoose.model('Transaction', transactionSchema);
