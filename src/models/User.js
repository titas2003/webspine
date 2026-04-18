const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  clientId: {
    type: String,
    unique: true,
    uppercase: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true, // Added unique constraint back to ensure data integrity
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false 
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, trim: true }
  },
  photo: {
    type: String,
    default: null 
  },
  vStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  /**
   * New Verification Assets
   * Stores URLs to Cloudinary, S3, or local storage paths
   */
  verificationDocs: {
    aadharImage: { 
      type: String, 
      default: null 
    },
    panImage: { 
      type: String, 
      default: null 
    },
    videoUrl: { 
      type: String, 
      default: null 
    }
  }
}, { 
  timestamps: true,
  collection: 'Clients' 
});

/**
 * Validation: Ensure at least one government ID is present
 */
userSchema.pre('validate', function() {
  if (!this.panNumber && !this.aadharNumber) {
    this.invalidate('panNumber', 'Either PAN or Aadhar Number must be provided');
    this.invalidate('aadharNumber', 'Either PAN or Aadhar Number must be provided');
  }
});

/**
 * Security: Hash password before saving
 */
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Method: Compare entered password with hashed password
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);