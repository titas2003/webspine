const mongoose = require('mongoose');

/**
 * @desc  Document
 * Stores both uploaded files and text notes for advocates.
 * Can be linked to a specific client and/or appointment.
 */
const documentSchema = new mongoose.Schema({
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true,
    index: true
  },
  // --- Classification ---
  category: {
    type: String,
    enum: ['my_docs', 'client_docs', 'generic', 'note'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  // --- Linked Context (optional) ---
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },

  // --- Note content (only for category = 'note') ---
  content: {
    type: String,
    default: null
  },

  // --- File metadata (only for file uploads) ---
  filePath: {
    type: String,
    default: null
  },
  originalName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null   // bytes
  },
  mimeType: {
    type: String,
    default: null
  }

}, { timestamps: true, collection: 'Documents' });

documentSchema.index({ advocateId: 1, category: 1 });
documentSchema.index({ advocateId: 1, clientId: 1 });

module.exports = mongoose.model('Document', documentSchema);
