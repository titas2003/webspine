const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @desc  Admin model
 * Each admin has a unique ADM ID and can log in via password or OTP.
 */
const adminSchema = new mongoose.Schema({
  admId: {
    type: String,
    unique: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true
  },
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
  },
  address: {
    type: String,
    required: [true, 'Full address is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  /**
   * OTP Login fields — never stored in plain text
   */
  otpHash: {
    type: String,
    default: null,
    select: false   // Never returned in queries by default
  },
  otpExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'Admins'
});

// Hash password before saving
adminSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Compare entered password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
