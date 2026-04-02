const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  clientId: {
    type: String,
    unique: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  panNumber: {
    type: String,
    unique: true,
    sparse: true, 
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
  },
  aadharNumber: {
    type: String,
    unique: true,
    sparse: true, 
    match: [/^[0-9]{12}$/, 'Invalid Aadhar format (must be 12 digits)']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false 
  }
}, { 
  timestamps: true,
  collection: 'Clients' 
});

// Using a standard function but returning early instead of calling next()
userSchema.pre('validate', function() {
  if (!this.panNumber && !this.aadharNumber) {
    this.invalidate('panNumber', 'Either PAN or Aadhar Number must be provided');
    this.invalidate('aadharNumber', 'Either PAN or Aadhar Number must be provided');
  }
  // Mongoose proceeds if no error is thrown/invalidated
});

// Using async/await - Mongoose detects the promise and waits automatically
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);