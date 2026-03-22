const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const advocateSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Please add a full name'] 
  },
  barId: { 
    type: String, 
    required: [true, 'Bar Association ID is required'], 
    unique: true 
  },
  email: { 
    type: String, 
    required: [true, 'Please add an email'], 
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Don't return password by default in queries
  },
  role: { 
    type: String, 
    default: 'advocate' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Encryption hook
advocateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification
advocateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Advocates', advocateSchema, 'advocates');