const mongoose = require('mongoose');

/**
 * @desc  AvailabilitySlot
 * Represents a single bookable time window set by an advocate.
 * Recurring slots are expanded into individual documents on creation.
 */
const availabilitySlotSchema = new mongoose.Schema({
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true,
    index: true
  },
  advId: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM (24hr) format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM (24hr) format']
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked'],
    default: 'available'
  },
  /**
   * Recurrence metadata (informational — slots are pre-expanded on creation)
   */
  recurrence: {
    type: String,
    enum: ['none', 'weekly', 'monthly'],
    default: 'none'
  },
  recurrenceGroupId: {
    type: String, // UUID shared by all slots generated from the same recurrence rule
    default: null
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, {
  timestamps: true,
  collection: 'AvailabilitySlots'
});

module.exports = mongoose.model('AvailabilitySlot', availabilitySlotSchema);
