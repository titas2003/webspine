const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const advocateSchema = new mongoose.Schema({
  advId: { type: String, unique: true, uppercase: true, index: true },
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  state: { type: String, required: true, uppercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  vStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },

  /**
   * Government Identity Numbers
   */
  panNumber: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
  },
  aadharNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^[0-9]{12}$/, 'Invalid Aadhar format (must be 12 digits)']
  },
  enrollmentNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  barId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },

  /**
   * Verification Document File Paths
   * Stores paths relative to uploads/advocates/{advId}/
   */
  photo: { type: String, default: null },
  verificationDocs: {
    panImage: { type: String, default: null },
    aadharImage: { type: String, default: null },
    enrollmentCertificate: { type: String, default: null },
    videoUrl: { type: String, default: null }
  }
}, { timestamps: true, collection: 'Advocates' });

// Hash password before saving - REMOVED 'next'
advocateSchema.pre('save', async function() {
  if (!this.isModified('password')) return; // Just return, don't call next()
  
  this.password = await bcrypt.hash(this.password, 10);
  // No next() needed here for async functions
});

// Match password method
advocateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Advocate', advocateSchema);