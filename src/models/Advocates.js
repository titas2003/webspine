const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const advocateSchema = new mongoose.Schema({
  advId: { type: String, unique: true, uppercase: true, index: true },
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  state: { type: String, required: true, uppercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  vStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

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