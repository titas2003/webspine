const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocates', // Matches your model name
    required: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required']
  },
  caseType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, 
    required: true
  },
  status: {
    type: String,
    // Expanded to cover all 8 requirements
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled_By_Client', 'Cancelled_By_Advocate'],
    default: 'Pending'
  },
  meetingLink: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);