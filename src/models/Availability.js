const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  advocateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate', required: true },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  },
  startTime: { type: String, required: true }, // e.g., "09:00"
  endTime: { type: String, required: true },   // e.g., "17:00"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);