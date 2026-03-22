const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required']
  },
  caseType: {
    type: String, // e.g., "Civil", "Criminal", "Consultation"
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, // e.g., "10:30 AM"
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  meetingLink: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);