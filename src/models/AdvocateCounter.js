const mongoose = require('mongoose');

const advocateCounterSchema = new mongoose.Schema({
  stateCode: { type: String, required: true, unique: true }, // e.g., "WB"
  currentLetter: { type: String, default: 'A' }, // The 3rd letter in the ID
  count: { type: Number, default: 0 } // Increments 0-9999
});

module.exports = mongoose.model('AdvocateCounter', advocateCounterSchema);