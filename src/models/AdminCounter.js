const mongoose = require('mongoose');

/**
 * @desc  AdminCounter
 * Single-document counter for generating sequential ADM IDs.
 * Format: ADM000001, ADM000002, ...
 */
const adminCounterSchema = new mongoose.Schema({
  _id: { type: String, default: 'adminCounter' },
  seq: { type: Number, default: 0 }
}, { collection: 'AdminCounter' });

module.exports = mongoose.model('AdminCounter', adminCounterSchema);
