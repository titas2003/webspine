const mongoose = require('mongoose');

/**
 * @desc  Appointment
 * Links a client, an advocate, and a specific AvailabilitySlot.
 */
const appointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true,
    index: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AvailabilitySlot',
    required: true
  },
  /**
   * Denormalized for fast queries without populate
   */
  scheduledAt: {
    type: Date, // Computed from slot date + startTime at booking time
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  /**
   * Meeting details — filled by advocate after accepting
   */
  meetingType: {
    type: String,
    enum: ['online', 'in-person'],
    default: null
  },
  meetingLink: {
    type: String,
    trim: true,
    default: null
  },
  meetingAddress: {
    type: String,
    trim: true,
    default: null
  },
  /**
   * Rejection / cancellation reason
   */
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  collection: 'Appointments'
});

module.exports = mongoose.model('Appointment', appointmentSchema);
